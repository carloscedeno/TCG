import React from 'react';
import { GlassCard } from './GlassCard';

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    icon: React.ReactNode;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, className = "" }) => (
    <GlassCard className={`p-6 group ${className}`}>
        <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-geeko-cyan/10 transition-colors">
                {icon}
            </div>
            {change && (
                <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {change}
                </span>
            )}
        </div>
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-4xl font-black text-white italic tracking-tighter">{value}</p>
    </GlassCard>
);
