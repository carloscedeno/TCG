
export const DiscoveryIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="opacity-20" />
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="1" className="opacity-40" strokeDasharray="4 4" />
        {/* Telescope */}
        <path d="M30 70 L45 55 L75 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="75" cy="25" r="8" stroke="currentColor" strokeWidth="3" />
        <path d="M25 75 L35 65" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        {/* Sparkles */}
        <path d="M75 20 L75 15 M70 25 L65 25 M80 25 L85 25" stroke="currentColor" strokeWidth="2" className="animate-pulse" />
    </svg>
);

export const SelectionIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="opacity-20" />
        {/* Card */}
        <rect x="35" y="30" width="30" height="40" rx="4" stroke="currentColor" strokeWidth="2" className="opacity-60" />
        <rect x="40" y="35" width="20" height="15" stroke="currentColor" strokeWidth="1" className="opacity-40" />
        {/* Hand */}
        <path d="M65 80 C65 80 70 70 60 60 C55 55 45 65 45 65 L40 75 L50 85 L65 80" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        {/* Magic Aura */}
        <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="1" className="animate-ping opacity-20" />
    </svg>
);

export const PreparationIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="opacity-20" />
        {/* Chest */}
        <path d="M30 45 L70 45 L70 70 C70 75 65 80 60 80 L40 80 C35 80 30 75 30 70 Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M30 45 C30 35 40 30 50 30 C60 30 70 35 70 45" stroke="currentColor" strokeWidth="3" />
        <circle cx="50" cy="55" r="4" fill="currentColor" />
        <path d="M25 50 L75 50" stroke="currentColor" strokeWidth="1" className="opacity-50" />
    </svg>
);

export const PactIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="opacity-20" />
        {/* Seal shape */}
        <path d="M50 20 C35 20 20 35 20 50 C20 65 35 80 40 80 L35 90 L50 85 L65 90 L60 80 C75 80 80 65 80 50 C80 35 65 20 50 20" stroke="currentColor" strokeWidth="3" />
        {/* Checkmark/Rune */}
        <path d="M35 50 L45 60 L65 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const VideoPlaceholder = () => (
    <div className="w-full h-full bg-[#121212] relative overflow-hidden flex flex-col">
        {/* Fake UI Header */}
        <div className="h-8 border-b border-white/10 flex items-center px-4 gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
            <div className="w-2 h-2 rounded-full bg-green-500/50" />
            <div className="ml-4 w-32 h-2 rounded-full bg-white/10" />
        </div>
        {/* Fake Content (Blurred) */}
        <div className="flex-1 p-4 grid grid-cols-3 gap-4 opacity-30 blur-sm scale-105">
            <div className="col-span-3 h-20 bg-gradient-to-r from-geeko-cyan/20 to-geeko-purple/20 rounded-xl" />
            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
            <div className="h-32 bg-white/5 rounded-xl border border-white/10" />
        </div>
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent" />
    </div>
);
