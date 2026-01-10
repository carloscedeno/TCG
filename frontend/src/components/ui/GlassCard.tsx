import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent) => void;
    hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = "",
    onClick,
    onDragOver,
    onDragLeave,
    onDrop,
    hoverEffect = true
}) => {
    const baseStyles = "glass-card rounded-[2rem] border border-white/5 bg-slate-900/50 transition-all duration-300";
    const hoverStyles = hoverEffect ? "hover:border-geeko-cyan/30 hover:scale-[1.02]" : "";

    return (
        <div
            onClick={onClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`${baseStyles} ${hoverStyles} ${className} ${onClick ? 'cursor-pointer' : ''}`}
        >
            {children}
        </div>
    );
};
