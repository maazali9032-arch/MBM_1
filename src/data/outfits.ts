/** Single merged hero background (~40s, H.264). Do not re-encode this asset. */
export const HERO_MASTER_VIDEO_SRC = '/videos/MASTER_Hero_bg_optimized.mp4';

/** Native frame rate of MASTER_Hero_bg_optimized.mp4 — used only for mobile scrub quantization. */
export const HERO_MASTER_VIDEO_FPS = 30;

export interface Outfit {
  id: string;
  title: string;
  description: string;
  posterSrc: string;
  positioning: {
    video: {
      desktop: string;
      tablet: string;
      mobile: string;
    };
    text: {
      desktop: string;
      tablet: string;
      mobile: string;
    };
  };
}

export const outfits: Outfit[] = [
  {
    id: 'SHW',
    title: 'SHERWANI',
    description:
      'THE ROYAL HERITAGE — A testament to hand-embroidered artistry, designed for the modern groom who honors legacy.',
    posterSrc: '/images/SHW1.webp',
    positioning: {
      video: {
        desktop: 'center center',
        tablet: 'center center',
        mobile: 'center top',
      },
      text: {
        desktop:
          'top-1/2 -translate-y-1/2 left-16 md:left-24 items-start text-left max-w-lg lg:max-w-xl',
        tablet: 'top-1/2 -translate-y-1/2 left-12 md:left-16 items-start text-left max-w-md',
        mobile: 'bottom-44 left-1/2 -translate-x-1/2 items-center text-center w-[90%]',
      },
    },
  },
  {
    id: 'SUT',
    title: 'CHARCOAL SUIT',
    description:
      'BESPOKE FORMALITY — Masterfully structured silhouettes, crafted from premium wool blends for the discerning gentleman.',
    posterSrc: '/images/SUT1.webp',
    positioning: {
      video: {
        desktop: 'center center',
        tablet: 'center center',
        mobile: 'center top',
      },
      text: {
        desktop:
          'top-1/2 -translate-y-1/2 left-16 md:left-24 items-start text-left max-w-lg lg:max-w-xl',
        tablet: 'top-1/2 -translate-y-1/2 left-12 md:left-16 items-start text-left max-w-md',
        mobile: 'bottom-44 left-1/2 -translate-x-1/2 items-center text-center w-[90%]',
      },
    },
  },
  {
    id: 'KP',
    title: 'KURTA PAJAMA',
    description:
      'LUXURY SIMPLICITY — Relaxed tailoring meeting fine linen and silk threads, celebrating daily grace and festive ease.',
    posterSrc: '/images/KP1.webp',
    positioning: {
      video: {
        desktop: 'center center',
        tablet: 'center center',
        mobile: 'center top',
      },
      text: {
        desktop:
          'top-1/2 -translate-y-1/2 left-16 md:left-24 items-start text-left max-w-lg lg:max-w-xl',
        tablet: 'top-1/2 -translate-y-1/2 left-12 md:left-16 items-start text-left max-w-md',
        mobile: 'bottom-44 left-1/2 -translate-x-1/2 items-center text-center w-[90%]',
      },
    },
  },
  {
    id: 'IW',
    title: 'INDO-WESTERN',
    description:
      'THE MODERN SYNTHESIS — Contemporary cuts fused with Indian draping, rewriting the vocabulary of occasion wear.',
    posterSrc: '/images/IW1.webp',
    positioning: {
      video: {
        desktop: 'center center',
        tablet: 'center center',
        mobile: 'center top',
      },
      text: {
        desktop:
          'top-1/2 -translate-y-1/2 left-16 md:left-24 items-start text-left max-w-lg lg:max-w-xl',
        tablet: 'top-1/2 -translate-y-1/2 left-12 md:left-16 items-start text-left max-w-md',
        mobile: 'bottom-44 left-1/2 -translate-x-1/2 items-center text-center w-[90%]',
      },
    },
  },
];
