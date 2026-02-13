
export const DiscoveryIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        <circle cx="50" cy="50" r="45" fill="url(#grad1)" className="animate-pulse" />
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.5" className="opacity-30 animate-[spin_10s_linear_infinite]" strokeDasharray="4 4" />

        {/* Telescope Body */}
        <path d="M30 70 L45 55 L75 25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" filter="url(#glow)" />
        <circle cx="75" cy="25" r="8" stroke="#00E5FF" strokeWidth="2" fill="rgba(0,0,0,0.5)" />
        <circle cx="75" cy="25" r="3" fill="#00E5FF" className="animate-ping" />

        {/* Base */}
        <path d="M25 75 L35 65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

        {/* Stars */}
        <path d="M75 18 L75 12 M70 25 L64 25 M81 25 L87 25" stroke="#FFC107" strokeWidth="2" className="animate-bounce" />
    </svg>
);

export const SelectionIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6D28D9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6D28D9" stopOpacity="0" />
            </linearGradient>
        </defs>

        <circle cx="50" cy="50" r="45" fill="url(#cardGrad)" className="animate-pulse" />

        {/* Card Hovering */}
        <g className="animate-[bounce_3s_infinite]">
            <rect x="35" y="30" width="30" height="42" rx="4" stroke="currentColor" strokeWidth="2" fill="rgba(255,255,255,0.05)" />
            <rect x="39" y="34" width="22" height="15" stroke="currentColor" strokeWidth="1" className="opacity-40" />
            <rect x="39" y="52" width="22" height="2" fill="currentColor" className="opacity-30" />
            <rect x="39" y="56" width="15" height="2" fill="currentColor" className="opacity-30" />
        </g>

        {/* Magician Hand */}
        <path d="M68 85 C68 85 75 75 65 65 C60 60 50 70 50 70 L45 80 L55 90 L68 85" stroke="#6D28D9" strokeWidth="3" strokeLinejoin="round" fill="rgba(109, 40, 217, 0.1)" />

        {/* Magic Particles */}
        <circle cx="50" cy="50" r="28" stroke="#00E5FF" strokeWidth="1" className="animate-ping opacity-30" />
        <circle cx="35" cy="30" r="1.5" fill="#FFC107" className="animate-pulse" />
        <circle cx="65" cy="30" r="1.5" fill="#FFC107" className="animate-pulse delay-75" />
    </svg>
);

export const PreparationIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFC107" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FFC107" stopOpacity="0" />
            </radialGradient>
        </defs>

        <circle cx="50" cy="50" r="45" fill="url(#goldGlow)" />

        {/* Chest Body */}
        <path d="M30 48 L70 48 L70 72 C70 76 66 80 60 80 L40 80 C34 80 30 76 30 72 Z" stroke="currentColor" strokeWidth="3" fill="rgba(0,0,0,0.1)" strokeLinejoin="round" />

        {/* Chest Lid (Curved) */}
        <path d="M30 48 C30 36 40 30 50 30 C60 30 70 36 70 48" stroke="currentColor" strokeWidth="3" fill="rgba(255,255,255,0.05)" />

        {/* Lock */}
        <circle cx="50" cy="56" r="5" stroke="#FFC107" strokeWidth="2" fill="#1a1a1a" />
        <path d="M50 54 L50 58" stroke="#FFC107" strokeWidth="2" />

        {/* Shining Light from Inside */}
        <path d="M35 48 L25 35" stroke="#FFC107" strokeWidth="1" className="opacity-0 animate-[pulse_2s_infinite]" />
        <path d="M65 48 L75 35" stroke="#FFC107" strokeWidth="1" className="opacity-0 animate-[pulse_2s_infinite_0.5s]" />
        <path d="M50 48 L50 32" stroke="#FFC107" strokeWidth="1" className="opacity-0 animate-[pulse_2s_infinite_1s]" />
    </svg>
);

export const PactIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="opacity-10" />

        {/* Wax Seal Shape */}
        <path d="M50 20 C35 20 20 35 20 50 C20 65 35 80 40 80 L35 90 L50 85 L65 90 L60 80 C75 80 80 65 80 50 C80 35 65 20 50 20"
            fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="2" />

        {/* Message Bubble/Rune */}
        <path d="M35 45 C35 38 42 32 50 32 C58 32 65 38 65 45 C65 52 58 58 50 58 C48 58 46 57 44 56 L38 58 L40 52 C37 50 35 48 35 45 Z"
            stroke="white" strokeWidth="3" fill="#22c55e" className="animate-[bounce_2s_infinite]" />

        {/* Checkmark inside */}
        <path d="M45 45 L48 48 L55 42" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Magic Sparkles */}
        <circle cx="70" cy="30" r="2" fill="#00E5FF" className="animate-ping" />
        <circle cx="30" cy="70" r="2" fill="#00E5FF" className="animate-ping delay-100" />
    </svg>
);

// Improved Premium Video Placeholder
export const VideoPlaceholder = () => (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden flex flex-col shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
        {/* Ancient Frame Effect */}
        <div className="absolute inset-0 border-[1px] border-[#FFC107]/20 pointer-events-none z-20 m-2 rounded-[2rem]" />
        <div className="absolute inset-0 border-[1px] border-[#00E5FF]/10 pointer-events-none z-20 m-4 rounded-[1.8rem]" />

        {/* Animated Background Mesh */}
        <div className="absolute inset-0 z-0">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(109,40,217,0.15),_transparent_70%)] animate-[spin_20s_linear_infinite]" />
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_rgba(0,229,255,0.1),_transparent_60%)] animate-[spin_15s_linear_infinite_reverse]" />
        </div>

        {/* Fake UI Header (More Pro) */}
        <div className="h-12 border-b border-white/5 flex items-center px-6 gap-3 z-10 bg-[#0a0a0a]/80 backdrop-blur-md">
            <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
            </div>
            <div className="ml-6 w-48 h-2.5 rounded-full bg-white/10" />
        </div>

        {/* Fake Content Area (Glassmorphism + Card Grid) */}
        <div className="flex-1 p-6 grid grid-cols-4 gap-4 opacity-40 scale-100 transition-transform duration-700 hover:scale-105 z-10">
            {/* Hero Section */}
            <div className="col-span-4 h-28 bg-gradient-to-r from-geeko-cyan/10 via-geeko-purple/10 to-transparent rounded-2xl border border-white/5 p-4 flex flex-col justify-center gap-2">
                <div className="w-32 h-3 bg-white/20 rounded-full" />
                <div className="w-48 h-2 bg-white/10 rounded-full" />
            </div>
            {/* Card Grid Mockups */}
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[2/3] bg-[#1a1a1a] rounded-xl border border-white/5 relative overflow-hidden group/card">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
                    <div className="absolute bottom-2 left-2 w-3/4 h-2 bg-white/20 rounded-full" />
                </div>
            ))}
        </div>

        {/* Overlay Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] z-10 pointer-events-none" />
    </div>
);
