import React from 'react';

export function PortalBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Subtle atmospheric medical crimson & cool slate radial washes */}
      <div className="absolute -top-40 -right-32 w-[38rem] h-[38rem] rounded-full bg-red-500/[0.045] blur-3xl" />
      <div className="absolute top-1/3 -left-40 w-[34rem] h-[34rem] rounded-full bg-rose-500/[0.035] blur-3xl" />
      <div className="absolute -bottom-48 right-1/4 w-[36rem] h-[36rem] rounded-full bg-slate-400/[0.05] blur-3xl" />

      {/* Precision clinical crosshair & capillary dot matrix */}
      <svg
        className="absolute inset-0 w-full h-full text-slate-400/[0.18]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="clinical-grid-pattern"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="24" cy="24" r="0.9" fill="currentColor" />
            <path
              d="M48 0v4M46 2h4"
              stroke="currentColor"
              strokeWidth="0.75"
              strokeLinecap="round"
              opacity="0.55"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#clinical-grid-pattern)" />
      </svg>

      {/* Delicate ECG heartbeat pulse waveform across mid-canvas */}
      <svg
        viewBox="0 0 1440 220"
        fill="none"
        preserveAspectRatio="none"
        className="absolute top-44 inset-x-0 w-full h-56 text-red-600/[0.07]"
      >
        <path
          d="M0 120H290L318 120L334 96L349 144L368 42L388 182L404 106L418 120H780L804 120L818 102L832 138L848 56L866 172L881 110L895 120H1440"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Stylized geometric blood drop + circulation rings (right margin) */}
      <svg
        viewBox="0 0 360 360"
        fill="none"
        className="hidden lg:block absolute top-28 -right-20 w-[26rem] h-[26rem] text-red-600/[0.055]"
      >
        <circle cx="180" cy="180" r="158" stroke="currentColor" strokeWidth="1" strokeDasharray="5 7" />
        <circle cx="180" cy="180" r="118" stroke="currentColor" strokeWidth="1" />
        <path
          d="M180 86C180 86 126 150 126 196C126 226.928 150.177 252 180 252C209.823 252 234 226.928 234 196C234 150 180 86 180 86Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="currentColor"
          fillOpacity="0.18"
        />
        <path
          d="M161 198C161 211 169 221 180 224"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Stylized blood donor shield & droplet motif (bottom-left margin) */}
      <svg
        viewBox="0 0 320 320"
        fill="none"
        className="hidden md:block absolute -bottom-16 -left-16 w-[22rem] h-[22rem] text-red-600/[0.05]"
      >
        <circle cx="160" cy="160" r="136" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="160" cy="160" r="96" stroke="currentColor" strokeWidth="1" />
        <path
          d="M160 96V224M96 160H224"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M160 116C160 116 128 154 128 180C128 197.673 142.327 212 160 212C177.673 212 192 197.673 192 180C192 154 160 116 160 116Z"
          stroke="currentColor"
          strokeWidth="1.75"
          fill="currentColor"
          fillOpacity="0.15"
        />
      </svg>
    </div>
  );
}

export function HeroMedicalBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none"
    >
      {/* Soft top-left & right-center crimson ambient glow */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-red-500/[0.055] blur-3xl" />
      <div className="absolute bottom-0 right-10 w-[28rem] h-72 rounded-full bg-rose-400/[0.06] blur-3xl" />

      {/* Subtle clinical dot grid inside the hero */}
      <svg className="absolute inset-0 w-full h-full text-red-900/[0.05]">
        <defs>
          <pattern
            id="hero-hematology-dots"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-hematology-dots)" />
      </svg>

      {/* Subtle ECG heartbeat trace & droplet accent behind hero */}
      <svg
        viewBox="0 0 1200 280"
        fill="none"
        preserveAspectRatio="none"
        className="absolute bottom-14 inset-x-0 w-full h-44 text-red-600/[0.08]"
      >
        <path
          d="M0 165H210L234 165L246 144L259 186L275 88L293 224L308 152L320 165H610L630 165L642 148L654 182L669 102L685 212L699 156L712 165H1200"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
