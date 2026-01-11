import React from 'react';
import type { CollectionItem } from '../../services/CollectionService';
import { DollarSign, TrendingUp, Store, Globe } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface PortfolioStatsProps {
    collection: CollectionItem[];
}

export const PortfolioStats: React.FC<PortfolioStatsProps> = ({ collection }) => {
    // Calculations
    const totalItems = collection.reduce((acc, item) => acc + item.quantity, 0);
    const storeValue = collection.reduce((acc, item) => acc + (item.quantity * (item.valuation.store_price || 0)), 0);
    const marketValue = collection.reduce((acc, item) => acc + (item.quantity * (item.valuation.market_price || 0)), 0);
    const globalValue = collection.reduce((acc, item) => acc + (item.quantity * (item.valuation.valuation_avg || 0)), 0);

    // Top Gainers (Using Price - Purchase Price)
    // Filter items with purchase_price > 0 for meaningful stats
    const gainers = [...collection]
        .filter(item => item.purchase_price > 0 && item.valuation.valuation_avg > 0)
        .map(item => ({
            ...item,
            gain: (item.valuation.valuation_avg - item.purchase_price) * item.quantity,
            gainPercent: ((item.valuation.valuation_avg - item.purchase_price) / item.purchase_price) * 100
        }))
        .sort((a, b) => b.gain - a.gain)
        .slice(0, 5);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8">
            {/* Value Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 border-geeko-cyan/30 bg-geeko-cyan/5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-geeko-cyan/10">
                            <TrendingUp className="text-geeko-cyan w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-geeko-cyan">Portfolio Value</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-4xl font-black italic tracking-tighter text-white">
                            {formatCurrency(globalValue)}
                        </h3>
                        <p className="text-xs font-bold text-slate-400">Total Estimated Value</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10">
                            <Store className="text-purple-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Store Value</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black italic tracking-tighter text-white">
                            {formatCurrency(storeValue)}
                        </h3>
                        <p className="text-xs font-bold text-slate-400">Geekorium Benchmark</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                            <Globe className="text-emerald-400 w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Market Value</span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black italic tracking-tighter text-white">
                            {formatCurrency(marketValue)}
                        </h3>
                        <p className="text-xs font-bold text-slate-400">External Market Avg</p>
                    </div>
                </GlassCard>
            </div>

            {/* Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="p-8">
                    <h3 className="text-xl font-black italic uppercase mb-6 flex items-center gap-2">
                        <DollarSign className="text-geeko-gold" /> Top Gainers
                    </h3>
                    <div className="space-y-4">
                        {gainers.length === 0 ? (
                            <p className="text-slate-500 text-sm">No data available for gainers yet.</p>
                        ) : (
                            gainers.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded overflow-hidden bg-black">
                                            {item.card_printings.image_url && (
                                                <img src={item.card_printings.image_url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.card_printings.cards.card_name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.card_printings.sets.set_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-black font-mono">
                                            +{formatCurrency(item.gain)}
                                        </div>
                                        <div className="text-[10px] text-emerald-500/80 font-bold">
                                            {item.gainPercent.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </GlassCard>

                <GlassCard className="p-8">
                    <h3 className="text-xl font-black italic uppercase mb-6 text-slate-400">Collection Stats</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-sm font-bold text-slate-300">Total Cards</span>
                            <span className="text-xl font-black text-white">{totalItems}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                            <span className="text-sm font-bold text-slate-300">Unique Printings</span>
                            <span className="text-xl font-black text-white">{collection.length}</span>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
