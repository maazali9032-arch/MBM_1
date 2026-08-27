import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import {
  outfits,
  HERO_MASTER_VIDEO_SRC,
  HERO_MASTER_VIDEO_FPS,
} from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export interface VideoSequenceRef {
  updateProgress: (progress: number) => void;
}

export const VideoSequence = forwardRef<VideoSequenceRef>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const breakpointRef = useBreakpoint();
  const activeIndexRef = useRef(-1);

  // Mobile scrub path only — desktop assigns currentTime directly.
  const rafIdRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const lastAppliedTimeRef = useRef<number>(-1);
  const lastUpdateTimeRef = useRef<number>(0);

  const frameDuration = 1 / HERO_MASTER_VIDEO_FPS;
  const minSeekIntervalMs = 1000 / HERO_MASTER_VIDEO_FPS;
  const seekEpsilon = frameDuration * 0.25;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const breakpoint = breakpointRef.current;
    video.style.objectPosition = outfits[0].positioning.video[breakpoint];

    const showFirstFrame = () => {
      if (video.readyState >= 1) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('loadeddata', showFirstFrame, { once: true });
    if (video.readyState >= 1) {
      showFirstFrame();
    }
  }, [breakpointRef]);

  useImperativeHandle(ref, () => ({
    updateProgress: (progress: number) => {
      const video = videoRef.current;
      if (!video) return;

      const clampedProgress = Math.max(0, Math.min(1, progress));
      const numGarments = outfits.length;
      const activeIndex = Math.min(
        Math.floor(clampedProgress * numGarments),
        numGarments - 1
      );
      const currentBreakpoint = breakpointRef.current;

      if (activeIndex !== activeIndexRef.current) {
        video.style.objectPosition =
          outfits[activeIndex].positioning.video[currentBreakpoint];
        activeIndexRef.current = activeIndex;
      }

      // Map scroll 0–1 across the full native duration (no fixed 10s clamp).
      if (!(video.readyState >= 1 && video.duration)) return;

      const rawTarget = clampedProgress * video.duration;
      const maxTime = Math.max(0, video.duration - 0.01);

      // ── Desktop / tablet: unchanged direct seek ──
      if (currentBreakpoint !== 'mobile') {
        video.currentTime = Math.min(rawTarget, maxTime);
        return;
      }

      // ── Mobile: rAF-coalesced, FPS-aware quantization + seek gating ──
      const quantized =
        Math.round(rawTarget / frameDuration) * frameDuration;
      targetTimeRef.current = Math.min(quantized, maxTime);

      if (rafIdRef.current !== null) return;

      const applyLatestTarget = () => {
        rafIdRef.current = null;
        const vid = videoRef.current;
        if (!vid || !(vid.readyState >= 1 && vid.duration)) return;

        const now = performance.now();
        const elapsed = now - lastUpdateTimeRef.current;

        // Rate-limit to ~one seek per native frame; keep latest target if too soon.
        if (elapsed < minSeekIntervalMs) {
          rafIdRef.current = requestAnimationFrame(applyLatestTarget);
          return;
        }

        const tt = targetTimeRef.current;
        if (Math.abs(tt - lastAppliedTimeRef.current) <= seekEpsilon) return;

        vid.currentTime = Math.min(tt, Math.max(0, vid.duration - 0.01));
        lastAppliedTimeRef.current = tt;
        lastUpdateTimeRef.current = now;
      };

      rafIdRef.current = requestAnimationFrame(applyLatestTarget);
    },
  }));

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-[var(--color-mahek-charcoal)] overflow-hidden pointer-events-none">
      {/* Single master layer — no dual-decoder mobile cost */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        src={HERO_MASTER_VIDEO_SRC}
        poster={outfits[0].posterSrc}
        playsInline
        muted
        preload="auto"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
});
