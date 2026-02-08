
import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { QuickStockItem } from './QuickStockItem';

interface InventoryItem {
    product_id: string;
    name: string;
    condition: string;
    price: number;
    stock: number;
    image_url: string;
    set_code: string;
}

export const QuickStockPanel: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchQuickStock = async (query: string) => {
        if (!query.trim()) {
            setItems([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_inventory_list', {
                p_page: 0,
                p_search: query,
                p_game: null,
                p_condition: null
            });

            if (error) throw error;
            // Limit to 5 results for the quick view
            setItems((data || []).slice(0, 5));
        } catch (err) {
            console.error('Error fetching quick stock:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuickStock(searchQuery);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    return (
        <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-geeko-gold">
                    Gestión Rápida de Stock
                </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar carta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    data-testid="quick-stock-search"
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-geeko-cyan/50 transition-colors"
                />
            </div>

            {/* Results */}
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar" data-testid="quick-stock-results">
                {loading ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 size={16} className="text-geeko-cyan animate-spin" />
                    </div>
                ) : items.length > 0 ? (
                    items.map((item) => (
                        <QuickStockItem key={item.product_id} item={item} />
                    ))
                ) : searchQuery.trim() ? (
                    <div className="text-center py-4 text-[10px] text-slate-500 uppercase font-bold">
                        No se encontraron resultados
                    </div>
                ) : (
                    <div className="text-center py-4 text-[10px] text-slate-500 uppercase font-bold">
                        Escribe para buscar stock
                    </div>
                )}
            </div>
        </div>
    );
};
