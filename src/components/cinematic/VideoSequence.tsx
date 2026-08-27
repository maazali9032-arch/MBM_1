import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { outfits } from '../../data/outfits';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import gsap from 'gsap';

export interface VideoSequenceRef {
  updateProgress: (progress: number) => void;
}

export const VideoSequence = forwardRef<VideoSequenceRef>((_, ref) => {
  const videoLayerA = useRef<HTMLVideoElement>(null);
  const videoLayerB = useRef<HTMLVideoElement>(null);
  const breakpointRef = useBreakpoint();
  
  const stateRef = useRef({
    activeIndex: -1,
    activeLayer: 'A', // 'A' or 'B'
  });
  // Mobile rAF coalescing refs
  const rafIdRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const lastAppliedTimeRef = useRef<number>(-1);
  const lastUpdateTimeRef = useRef<number>(0);


  // Preload first video
  useEffect(() => {
    if (videoLayerA.current) {
      videoLayerA.current.src = outfits[0].videoSrc;
      videoLayerA.current.style.objectPosition = outfits[0].positioning.video[breakpointRef.current];
      videoLayerA.current.load();
      gsap.set(videoLayerA.current, { opacity: 1 });
    }
    if (videoLayerB.current) {
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
      
      // Explicit segment progress calculation normalized 0 to 1
      const normalizedSegmentProgress = Math.max(0, Math.min(1, (progress - segmentStart) / segmentDuration));

      const vA = videoLayerA.current;
      const vB = videoLayerB.current;
      if (!vA || !vB) return;

      const s = stateRef.current;
      const currentBreakpoint = breakpointRef.current;

      // Ensure the active video always has the correct responsive object-position
      const activeVideoLayer = s.activeLayer === 'A' ? vA : vB;
      activeVideoLayer.style.objectPosition = outfits[activeIndex].positioning.video[currentBreakpoint];

      // Handle layer switching at garment boundary
      if (activeIndex !== s.activeIndex) {
        const nextLayer = s.activeLayer === 'A' ? 'B' : 'A';
        const nextVideo = nextLayer === 'A' ? vA : vB;
        const prevVideo = nextLayer === 'A' ? vB : vA;

        // Ensure the incoming layer has the right video loaded and positioned
        if (nextVideo.getAttribute('src') !== outfits[activeIndex].videoSrc) {
            nextVideo.src = outfits[activeIndex].videoSrc;
            nextVideo.load();
        }
        nextVideo.style.objectPosition = outfits[activeIndex].positioning.video[currentBreakpoint];

        // Crossfade to avoid black frames and harsh transitions
        gsap.to(nextVideo, { opacity: 1, duration: 0.6, ease: 'power2.inOut', overwrite: 'auto' });
        gsap.to(prevVideo, { 
          opacity: 0, 
          duration: 0.6, 
          ease: 'power2.inOut', 
          overwrite: 'auto',
          onComplete: () => {
             // Mobile hardware decoder cleanup
             if (currentBreakpoint === 'mobile') {
               prevVideo.src = '';
               prevVideo.load();
             }
          }
        });

        s.activeLayer = nextLayer;
        s.activeIndex = activeIndex;
      }

      // Update native video currentTime using scrub, mobile-optimized with FPS gating
      if (activeVideoLayer.readyState >= 1 && activeVideoLayer.duration) {
        const rawTarget = normalizedSegmentProgress * activeVideoLayer.duration;
        if (currentBreakpoint === 'mobile') {
          // Quantize to 24 fps frame grid
          const frameDur = 1 / 24;
          const quantized = Math.round(rawTarget / frameDur) * frameDur;
          // Store latest target and schedule rAF if not already pending
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
          // Desktop/tablet direct assignment
          activeVideoLayer.currentTime = Math.min(rawTarget, activeVideoLayer.duration - 0.01);
        }
      }

      // Preload window logic (Desktop only to save mobile memory)
      if (currentBreakpoint !== 'mobile') {
        if (normalizedSegmentProgress > 0.85 && activeIndex < numGarments - 1) {
           const incomingIndex = activeIndex + 1;
           const idleLayer = s.activeLayer === 'A' ? vB : vA;
           if (idleLayer.getAttribute('src') !== outfits[incomingIndex].videoSrc) {
               idleLayer.src = outfits[incomingIndex].videoSrc;
               idleLayer.load();
           }
        } else if (normalizedSegmentProgress < 0.15 && activeIndex > 0) {
           const incomingIndex = activeIndex - 1;
           const idleLayer = s.activeLayer === 'A' ? vB : vA;
           if (idleLayer.getAttribute('src') !== outfits[incomingIndex].videoSrc) {
               idleLayer.src = outfits[incomingIndex].videoSrc;
               idleLayer.load();
           }
        }
      }
    }
  }));
  // Cleanup any pending rAF on unmount
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
        ref={videoLayerA}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        preload="auto"
      />
      <video
        ref={videoLayerB}
        className="absolute inset-0 w-full h-full object-cover opacity-0"
        playsInline
        muted
        preload="auto"
      />
      {/* Subtle luxury contrast treatment overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
    </div>
  );
});
