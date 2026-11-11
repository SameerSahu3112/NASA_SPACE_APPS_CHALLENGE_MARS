import React from 'react';

// Header Robot Face Icon matching MIRA AI Copilot
export const MiraHeaderBotIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Antenna */}
    <line x1="12" y1="2" x2="12" y2="5" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" />
    <circle cx="12" cy="2" r="1.5" fill="#38bdf8" />
    
    {/* Head Outline */}
    <rect x="4.5" y="5.5" width="15" height="13" rx="4" stroke="#38bdf8" strokeWidth="1.75" fill="#0c1628" />
    
    {/* Side Ears */}
    <rect x="2" y="9.5" width="2" height="5" rx="1" fill="#38bdf8" />
    <rect x="20" y="9.5" width="2" height="5" rx="1" fill="#38bdf8" />
    
    {/* Eyes */}
    <ellipse cx="9" cy="11.5" rx="1.5" ry="2" fill="#38bdf8" />
    <ellipse cx="15" cy="11.5" rx="1.5" ry="2" fill="#38bdf8" />
    
    {/* Smile */}
    <path d="M8.5 15 C10 16.5, 14 16.5, 15.5 15" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
);

// Glowing 4-point AI Sparkles matching MIRA AI Copilot
export const AiSparklesIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M10 2L12 7.5L17.5 9.5L12 11.5L10 17L8 11.5L2.5 9.5L8 7.5L10 2Z" 
      fill="url(#sparkleGrad)"
    />
    <path 
      d="M17 14L18.2 17.5L21.5 18.5L18.2 19.5L17 23L15.8 19.5L12.5 18.5L15.8 17.5L17 14Z" 
      fill="url(#sparkleGrad2)"
    />
    <defs>
      <linearGradient id="sparkleGrad" x1="2.5" y1="2" x2="17.5" y2="17" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="sparkleGrad2" x1="12.5" y1="14" x2="21.5" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7dd3fc" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

// Holographic Cybernetic Robot Avatar matching MIRA AI Copilot
export const MiraRobotAvatar: React.FC<{ className?: string }> = ({ className = "w-24 h-24" }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cyberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
      </linearGradient>
      <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0c1a2e" />
        <stop offset="100%" stopColor="#050a14" />
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Subtle holographic ambient ring */}
    <circle cx="60" cy="60" r="56" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />

    {/* Shoulders & Torso */}
    <path 
      d="M20 115 C20 95 38 88 50 86 L50 94 L70 94 L70 86 C82 88 100 95 100 115 Z" 
      fill="url(#bodyGrad)" 
      stroke="#0ea5e9" 
      strokeWidth="1.5"
    />
    
    {/* Chest Emblem: MIRA */}
    <rect x="42" y="96" width="36" height="12" rx="3" fill="#031525" stroke="#38bdf8" strokeWidth="1" />
    <text x="60" y="105" textAnchor="middle" fill="#38bdf8" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.2">
      MIRA
    </text>

    {/* Neck Struts */}
    <rect x="52" y="72" width="16" height="16" rx="2" fill="#081426" stroke="#0284c7" strokeWidth="1" />
    <line x1="56" y1="74" x2="56" y2="86" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
    <line x1="64" y1="74" x2="64" y2="86" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />

    {/* Head Shell / Helmet */}
    <path 
      d="M36 46 C36 24 45 16 60 16 C75 16 84 24 84 46 C84 65 74 72 60 72 C46 72 36 65 36 46 Z" 
      fill="url(#bodyGrad)" 
      stroke="#38bdf8" 
      strokeWidth="2"
      filter="url(#neonGlow)"
    />

    {/* Ear Nodes */}
    <rect x="30" y="38" width="6" height="18" rx="2" fill="#0c1c30" stroke="#0ea5e9" strokeWidth="1.5" />
    <rect x="84" y="38" width="6" height="18" rx="2" fill="#0c1c30" stroke="#0ea5e9" strokeWidth="1.5" />

    {/* Cyber Visor / Face Shield */}
    <path 
      d="M42 36 C44 32 50 30 60 30 C70 30 76 32 78 36 C80 44 80 50 78 54 C74 58 68 60 60 60 C52 60 46 58 42 54 C40 50 40 44 42 36 Z" 
      fill="#020914" 
      stroke="#0284c7" 
      strokeWidth="1.5"
    />

    {/* Glowing Visor Line / Optics */}
    <rect x="47" y="42" width="26" height="6" rx="3" fill="#38bdf8" opacity="0.85" filter="url(#neonGlow)" />
    <circle cx="53" cy="45" r="2" fill="#ffffff" />
    <circle cx="67" cy="45" r="2" fill="#ffffff" />

    {/* Forehead Hologram Icon */}
    <polygon points="60,20 63,25 57,25" fill="#38bdf8" />
  </svg>
);

// Jezero Crater (Golden Mountain / Stratified Cone with Radiant Light)
export const JezeroCraterThumb: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldPeak" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="30%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
      <linearGradient id="goldLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="goldRight" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="goldCenter" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    {/* Base shadow ellipse */}
    <ellipse cx="32" cy="52" rx="24" ry="7" fill="#000000" opacity="0.6" />
    
    {/* Mountain Flanks with sharp geological facets */}
    {/* Left Flank */}
    <polygon points="32,18 10,48 22,50" fill="url(#goldLeft)" />
    {/* Far Left Wing */}
    <polygon points="32,18 22,50 27,51" fill="#b45309" />
    {/* Central Ridge Left */}
    <polygon points="32,18 27,51 32,52" fill="url(#goldCenter)" />
    {/* Central Ridge Right */}
    <polygon points="32,18 32,52 38,51" fill="#d97706" />
    {/* Far Right Wing */}
    <polygon points="32,18 38,51 44,50" fill="#92400e" />
    {/* Right Flank */}
    <polygon points="32,18 44,50 54,48" fill="url(#goldRight)" />

    {/* Glowing Golden Radiant Summit Peak */}
    <polygon points="32,13 29,19 35,19" fill="url(#goldPeak)" filter="url(#goldGlow)" />
    <circle cx="32" cy="15" r="2.5" fill="#ffffff" filter="url(#goldGlow)" />
  </svg>
);

// Olympus Mons (Three Sharp Snowy Mountain Peaks matching reference)
export const OlympusMonsThumb: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="snowPeak" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="rockShadow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="60%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#291205" />
      </linearGradient>
      <linearGradient id="rockLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>
    {/* Base shadow */}
    <ellipse cx="32" cy="50" rx="26" ry="6" fill="#000000" opacity="0.55" />

    {/* Peak 1 (Left background peak) */}
    <polygon points="18,24 6,48 20,49" fill="url(#rockLight)" />
    <polygon points="18,24 20,49 26,48" fill="url(#rockShadow)" />
    <polygon points="18,24 13,34 22,34" fill="url(#snowPeak)" />

    {/* Peak 3 (Right background peak) */}
    <polygon points="46,24 38,48 46,49" fill="url(#rockLight)" />
    <polygon points="46,24 46,49 58,48" fill="url(#rockShadow)" />
    <polygon points="46,24 42,34 50,34" fill="url(#snowPeak)" />

    {/* Peak 2 (Center tall majestic peak) */}
    <polygon points="32,16 16,50 32,52" fill="url(#rockLight)" />
    <polygon points="32,16 32,52 48,50" fill="url(#rockShadow)" />
    <polygon points="32,16 26,28 38,28" fill="url(#snowPeak)" />
  </svg>
);

// Valles Marineris (Twin Grand Canyon Cliffs matching reference)
export const VallesMarinerisThumb: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="canyonLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="40%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="canyonDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="70%" stopColor="#451a03" />
        <stop offset="100%" stopColor="#1a0a02" />
      </linearGradient>
    </defs>
    {/* Base shadow */}
    <ellipse cx="32" cy="52" rx="26" ry="6" fill="#000000" opacity="0.6" />

    {/* Left Canyon Wall Formation */}
    <polygon points="8,26 24,24 26,50 8,50" fill="url(#canyonLight)" />
    <polygon points="24,24 27,27 28,49 26,50" fill="url(#canyonDark)" />
    <path d="M9 34 L25 32 M9 42 L25 40" stroke="#78350f" strokeWidth="1" opacity="0.6" />

    {/* Central Chasm Shadow / Abyss */}
    <polygon points="26,30 38,30 36,51 28,51" fill="#090503" />

    {/* Right Canyon Wall Formation */}
    <polygon points="38,27 40,24 56,26 56,50 36,50" fill="url(#canyonDark)" />
    <polygon points="38,27 54,25 54,34 38,36" fill="url(#canyonLight)" opacity="0.8" />
    <path d="M39 35 L55 33 M37 43 L55 41" stroke="#92400e" strokeWidth="1" opacity="0.6" />
  </svg>
);

// Gale Crater (Circular Impact Crater Rim matching reference)
export const GaleCraterThumb: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="craterRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="50%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="craterWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#301205" />
      </linearGradient>
    </defs>
    {/* Base shadow */}
    <ellipse cx="32" cy="51" rx="22" ry="6" fill="#000000" opacity="0.6" />

    {/* Outer Crater Flanks */}
    <path d="M12 36 C12 28 52 28 52 36 L50 48 C50 54 14 54 14 48 Z" fill="url(#craterWall)" />
    
    {/* Terraced fluting lines */}
    <path d="M15 42 Q 32 46 49 42" stroke="#92400e" strokeWidth="1" fill="none" />
    <path d="M17 46 Q 32 50 47 46" stroke="#92400e" strokeWidth="1" fill="none" />

    {/* Upper Rim Ellipse */}
    <ellipse cx="32" cy="35" rx="20" ry="8" fill="url(#craterRim)" stroke="#fcd34d" strokeWidth="1" />
    
    {/* Inner Deep Crater Basin */}
    <ellipse cx="32" cy="36" rx="14" ry="5.5" fill="#0c0502" />
    
    {/* Central Peak / Sediment Mound */}
    <ellipse cx="32" cy="36" rx="3.5" ry="2" fill="#d97706" />
  </svg>
);

// Phobos Moon Circular Thumbnail
export const PhobosThumb: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="phobosLight" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#d1d5db" />
        <stop offset="50%" stopColor="#6b7280" />
        <stop offset="100%" stopColor="#1f2937" />
      </radialGradient>
    </defs>
    {/* Irregular Triaxial Asteroid Body */}
    <path 
      d="M30 8 C44 8, 54 18, 52 32 C50 46, 42 52, 28 52 C14 52, 8 42, 9 28 C10 14, 18 8, 30 8 Z" 
      fill="url(#phobosLight)" 
      stroke="#9ca3af" 
      strokeWidth="0.75" 
    />
    {/* Stickney Giant Crater */}
    <ellipse cx="23" cy="26" rx="8" ry="7" fill="#374151" stroke="#9ca3af" strokeWidth="1" />
    <ellipse cx="22" cy="25" rx="5" ry="4" fill="#111827" />
    {/* Secondary impact craters */}
    <circle cx="38" cy="20" r="3" fill="#374151" />
    <circle cx="41" cy="36" r="2.5" fill="#374151" />
    <circle cx="28" cy="42" r="3" fill="#374151" />
  </svg>
);

// Deimos Moon Circular Thumbnail
export const DeimosThumb: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="deimosLight" cx="40%" cy="30%" r="60%">
        <stop offset="0%" stopColor="#e5e7eb" />
        <stop offset="60%" stopColor="#9ca3af" />
        <stop offset="100%" stopColor="#374151" />
      </radialGradient>
    </defs>
    {/* Smoother, regolith-blanketed body */}
    <ellipse cx="30" cy="30" rx="20" ry="18" fill="url(#deimosLight)" stroke="#9ca3af" strokeWidth="0.75" />
    {/* Swift & Voltaire craters filled with dust */}
    <ellipse cx="26" cy="24" rx="4" ry="3.5" fill="#4b5563" opacity="0.8" />
    <ellipse cx="36" cy="34" rx="3.5" ry="3" fill="#4b5563" opacity="0.8" />
  </svg>
);

// North Polar Cap (Planum Boreum) Spiral Chasmata Thumbnail
export const NorthPolarCapThumb: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="60" rx="8" fill="#0f172a" />
    <circle cx="30" cy="30" r="22" fill="#1e293b" />
    {/* Brilliant White Water-Ice / CO2 Cap */}
    <circle cx="30" cy="30" r="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
    {/* Spiral Troughs (Chasma Boreale) */}
    <path d="M30 14 C36 18, 44 26, 42 34 C40 42, 32 46, 26 44" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    <path d="M22 20 C26 24, 34 28, 36 34" stroke="#64748b" strokeWidth="1.2" fill="none" />
    <circle cx="30" cy="30" r="4" fill="#e2e8f0" />
  </svg>
);

// South Polar Cap (Planum Australe) Thumbnail
export const SouthPolarCapThumb: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="60" height="60" rx="8" fill="#0f172a" />
    <circle cx="30" cy="30" r="22" fill="#1e293b" />
    {/* Persistent CO2 Ice Cap */}
    <ellipse cx="30" cy="30" rx="16" ry="15" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
    {/* Swiss Cheese Terrains & Chasmata */}
    <ellipse cx="26" cy="27" rx="3" ry="2.5" fill="#94a3b8" />
    <ellipse cx="34" cy="33" rx="3.5" ry="2" fill="#94a3b8" />
    <path d="M20 32 Q 28 36, 36 30" stroke="#64748b" strokeWidth="1.2" fill="none" />
  </svg>
);

