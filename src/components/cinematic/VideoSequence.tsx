import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { outfits } from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import gsap from 'gsap';

export interface VideoSequenceRef {
  updateProgress: (progress: number) => void;
}

function primeVideoFrame(video: HTMLVideoElement) {
  const showFirstFrame = () => {
    if (video.readyState >= 1 && video.duration) {
      video.currentTime = 0;
    }
  };

  video.addEventListener('loadeddata', showFirstFrame, { once: true });
  if (video.readyState >= 1) {
    showFirstFrame();
  }
}

function loadVideoSource(video: HTMLVideoElement, src: string, objectPosition: string) {
  if (video.getAttribute('src') !== src) {
    video.src = src;
  }
  video.style.objectPosition = objectPosition;
  video.load();
  primeVideoFrame(video);
}

export const VideoSequence = forwardRef<VideoSequenceRef>((_, ref) => {
  const videoLayerA = useRef<HTMLVideoElement>(null);
  const videoLayerB = useRef<HTMLVideoElement>(null);
  const breakpointRef = useBreakpoint();

  const stateRef = useRef({
    activeIndex: -1,
    activeLayer: 'A' as 'A' | 'B',
  });
  const rafIdRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const lastAppliedTimeRef = useRef<number>(-1);
  const lastUpdateTimeRef = useRef<number>(0);

  // Eagerly load all hero videos as soon as the component mounts.
  useEffect(() => {
    const breakpoint = breakpointRef.current;

    outfits.forEach((outfit) => {
      const preloadVideo = document.createElement('video');
      preloadVideo.preload = 'auto';
      preloadVideo.muted = true;
      preloadVideo.playsInline = true;
      preloadVideo.src = outfit.videoSrc;
      preloadVideo.load();
    });

    if (videoLayerA.current) {
      loadVideoSource(
        videoLayerA.current,
        outfits[0].videoSrc,
        outfits[0].positioning.video[breakpoint]
      );
      gsap.set(videoLayerA.current, { opacity: 1 });
    }

    if (videoLayerB.current) {
      loadVideoSource(
        videoLayerB.current,
        outfits[1]?.videoSrc ?? outfits[0].videoSrc,
        (outfits[1] ?? outfits[0]).positioning.video[breakpoint]
      );
      gsap.set(videoLayerB.current, { opacity: 0 });
    }

    stateRef.current.activeIndex = 0;
  }, [breakpointRef]);

  useImperativeHandle(ref, () => ({
    updateProgress: (progress: number) => {
      const numGarments = outfits.length;
      const activeIndex = Math.min(Math.floor(progress * numGarments), numGarments - 1);

      const segmentStart = activeIndex / numGarments;
      const segmentEnd = (activeIndex + 1) / numGarments;
      const segmentDuration = segmentEnd - segmentStart;

      const normalizedSegmentProgress = Math.max(0, Math.min(1, (progress - segmentStart) / segmentDuration));

      const vA = videoLayerA.current;
      const vB = videoLayerB.current;
      if (!vA || !vB) return;

      const s = stateRef.current;
      const currentBreakpoint = breakpointRef.current;

      const activeVideoLayer = s.activeLayer === 'A' ? vA : vB;
      activeVideoLayer.style.objectPosition = outfits[activeIndex].positioning.video[currentBreakpoint];

      if (activeIndex !== s.activeIndex) {
        const nextLayer = s.activeLayer === 'A' ? 'B' : 'A';
        const nextVideo = nextLayer === 'A' ? vA : vB;
        const prevVideo = nextLayer === 'A' ? vB : vA;

        loadVideoSource(
          nextVideo,
          outfits[activeIndex].videoSrc,
          outfits[activeIndex].positioning.video[currentBreakpoint]
        );

        gsap.to(nextVideo, { opacity: 1, duration: 0.6, ease: 'power2.inOut', overwrite: 'auto' });
        gsap.to(prevVideo, {
          opacity: 0,
          duration: 0.6,
          ease: 'power2.inOut',
          overwrite: 'auto',
        });

        s.activeLayer = nextLayer;
        s.activeIndex = activeIndex;
      }

      if (activeVideoLayer.readyState >= 1 && activeVideoLayer.duration) {
        const rawTarget = normalizedSegmentProgress * activeVideoLayer.duration;
        if (currentBreakpoint === 'mobile') {
          const frameDur = 1 / 24;
          const quantized = Math.round(rawTarget / frameDur) * frameDur;
          targetTimeRef.current = quantized;
          if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(() => {
              const now = performance.now();
              if (now - lastUpdateTimeRef.current >= 41.666) {
                const vid = activeVideoLayer;
                const tt = targetTimeRef.current;
                if (Math.abs(tt - lastAppliedTimeRef.current) > 0.008) {
                  vid.currentTime = Math.min(tt, vid.duration - 0.01);
                  lastAppliedTimeRef.current = tt;
                  lastUpdateTimeRef.current = now;
                }
              }
              rafIdRef.current = null;
            });
          }
        } else {
          activeVideoLayer.currentTime = Math.min(rawTarget, activeVideoLayer.duration - 0.01);
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
      {/* Hidden eager preloaders — keeps all four videos buffering from first paint */}
      <div className="sr-only" aria-hidden="true">
        {outfits.map((outfit) => (
          <video
            key={outfit.id}
            src={outfit.videoSrc}
            preload="auto"
            muted
            playsInline
            tabIndex={-1}
          />
        ))}
      </div>

      <video
        ref={videoLayerA}
        className="absolute inset-0 w-full h-full object-cover"
        src={outfits[0].videoSrc}
        poster={outfits[0].posterSrc}
        playsInline
        muted
        preload="auto"
      />
      <video
        ref={videoLayerB}
        className="absolute inset-0 w-full h-full object-cover opacity-0"
        src={outfits[1]?.videoSrc}
        poster={outfits[1]?.posterSrc}
        playsInline
        muted
        preload="auto"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
});
