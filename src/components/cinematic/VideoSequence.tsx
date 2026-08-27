import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { outfits, HERO_MASTER_VIDEO_SRC } from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export interface VideoSequenceRef {
  updateProgress: (progress: number) => void;
}

export const VideoSequence = forwardRef<VideoSequenceRef>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const breakpointRef = useBreakpoint();
  const activeIndexRef = useRef(-1);
  const rafIdRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const lastAppliedTimeRef = useRef<number>(-1);
  const lastUpdateTimeRef = useRef<number>(0);

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
      const activeIndex = Math.min(Math.floor(clampedProgress * numGarments), numGarments - 1);
      const currentBreakpoint = breakpointRef.current;

      if (activeIndex !== activeIndexRef.current) {
        video.style.objectPosition = outfits[activeIndex].positioning.video[currentBreakpoint];
        activeIndexRef.current = activeIndex;
      }

      if (video.readyState >= 1 && video.duration) {
        const rawTarget = clampedProgress * video.duration;

        if (currentBreakpoint === 'mobile') {
          const frameDur = 1 / 24;
          const quantized = Math.round(rawTarget / frameDur) * frameDur;
          targetTimeRef.current = quantized;

          if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(() => {
              const now = performance.now();
              if (now - lastUpdateTimeRef.current >= 41.666) {
                const tt = targetTimeRef.current;
                if (Math.abs(tt - lastAppliedTimeRef.current) > 0.008) {
                  video.currentTime = Math.min(tt, video.duration - 0.01);
                  lastAppliedTimeRef.current = tt;
                  lastUpdateTimeRef.current = now;
                }
              }
              rafIdRef.current = null;
            });
          }
        } else {
          video.currentTime = Math.min(rawTarget, video.duration - 0.01);
        }
      }
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
