import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../utils/supabaseClient";
import { AddProductDrawer } from "../../components/Admin/AddProductDrawer";
import {
    Plus, Search, Trash2, Package, Save, X,
    ChevronUp, ChevronDown, Check,
    ArrowUpDown, AlertTriangle,
    ShieldAlert, FileUp
} from "lucide-react";
import { ImportInventoryModal } from "../../components/Admin/ImportInventoryModal";

interface InventoryItem {
    product_id: string;
    printing_id: string;
    name: string;
    game: string;
    set_code: string;
    condition: string;
    price: number;
    stock: number;
    image_url: string;
    rarity: string;
    total_count: number;
}

type SortField = 'name' | 'price' | 'stock';
type SortOrder = 'asc' | 'desc';

export function InventoryPage() {
    // Core State
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Filtering & Sorting
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // NEW: Catalog Suggestions State
    const [catalogResults, setCatalogResults] = useState<any[]>([]);
    const [prefillCard, setPrefillCard] = useState<any>(null);

    // UI State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<string>("");
    const [totalItems, setTotalItems] = useState(0);
    const [lastSavedId, setLastSavedId] = useState<string | null>(null);

    const pageSize = 50;

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_inventory_list', {
                p_page: page,
                p_page_size: pageSize,
                p_search: searchQuery || null,
                p_game: selectedGame || null,
                p_condition: selectedCondition || null,
                p_sort_by: sortBy,
                p_sort_order: sortOrder
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setItems(data);
                setTotalItems(Number(data[0].total_count));
            } else {
                setItems([]);
                setTotalItems(0);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
        } finally {
            setLoading(false);
        }

        // Fetch Catalog Recommendations if query exists and local results are few
        if (searchQuery && searchQuery.length >= 3) {
            try {
                const { data: catData } = await supabase
                    .from('card_printings')
                    .select(`
                        printing_id,
                        image_url,
                        cards!inner (
                            card_name
                        ),
                        sets!inner (
                            set_name,
                            set_code
                        )
                    `)
                    .ilike('cards.card_name', `%${searchQuery}%`)
                    .limit(4);
                setCatalogResults(catData || []);
            } catch (e) {
                console.error("Catalog fetch error:", e);
            }
        } else {
            setCatalogResults([]);
        }
    }, [page, searchQuery, selectedGame, selectedCondition, sortBy, sortOrder]);

    useEffect(() => {
        const debounce = setTimeout(fetchInventory, 300);
        return () => clearTimeout(debounce);
    }, [fetchInventory]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Focus search with CMD/CTRL + K
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector<HTMLInputElement>('input[placeholder*="Identify"]')?.focus();
            }
            // Close editing with Escape
            if (e.key === 'Escape') {
                setEditingPriceId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(i => i.product_id)));
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleUpdateStock = async (productId: string, currentStock: number, delta: number) => {
        const newStock = Math.max(0, currentStock + delta);

        // Optimistic Update
        setItems(prev => prev.map(item =>
            item.product_id === productId ? { ...item, stock: newStock } : item
        ));

        try {
            const { error } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', productId);

            if (error) throw error;

            setLastSavedId(productId);
            setTimeout(() => setLastSavedId(null), 2000);
        } catch (err: any) {
            alert("Error updating stock: " + err.message);
            fetchInventory(); // Revert
        }
    };

    const handleSavePrice = async (productId: string) => {
        const newPrice = parseFloat(tempPrice);
        if (isNaN(newPrice) || newPrice < 0) return;

        // Optimistic Update
        setItems(prev => prev.map(item =>
            item.product_id === productId ? { ...item, price: newPrice } : item
        ));
        setEditingPriceId(null);

        try {
            const { error } = await supabase
                .from('products')
                .update({ price: newPrice })
                .eq('id', productId);

            if (error) throw error;

            setLastSavedId(productId);
            setTimeout(() => setLastSavedId(null), 2000);
        } catch (err: any) {
            alert("Error updating price: " + err.message);
            fetchInventory(); // Revert
        }
    };

    const handleBatchDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} items?`)) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .in('id', Array.from(selectedIds));

            if (error) throw error;
            setSelectedIds(new Set());
            fetchInventory();
        } catch (err: any) {
            alert("Batch delete failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBatchPriceUpdate = async (percentage: number) => {
        if (!confirm(`Apply ${percentage}% price change to ${selectedIds.size} items?`)) return;

        setLoading(true);
        try {
            const selectedItems = items.filter(i => selectedIds.has(i.product_id));

            for (const item of selectedItems) {
                const newPrice = item.price * (1 + percentage / 100);
                await supabase.from('products').update({ price: newPrice }).eq('id', item.product_id);
            }

            setSelectedIds(new Set());
            fetchInventory();
        } catch (err: any) {
            alert("Batch update failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
        setPage(0);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Package className="text-white" size={24} />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                                Global <span className="text-purple-500">Inventory</span>
                            </h1>
                        </div>
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">
                            System Terminal v2.1 • {totalItems} Unique Nodes Indexed
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="group relative px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl overflow-hidden active:scale-95 transition-all w-full md:w-auto shadow-2xl shadow-white/5"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <Plus size={18} />
                                Push New Product
                            </span>
                            <div className="absolute inset-0 bg-purple-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>

                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="group relative px-6 py-4 bg-black border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl overflow-hidden active:scale-95 transition-all w-full md:w-auto hover:border-purple-500/50"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                <FileUp size={18} className="text-neutral-500 group-hover:text-purple-400 transition-colors" />
                                Bulk Import
                            </span>
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-neutral-900/50 border border-white/5 p-4 rounded-[2rem] backdrop-blur-xl">
                    <div className="lg:col-span-5 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-purple-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Identify Card by Name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-neutral-700 font-medium"
                        />
                    </div>

                    <div className="lg:col-span-7 flex flex-wrap items-center gap-3">
                        <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                            {['Magic', 'Pokemon', 'One Piece'].map(game => (
                                <button
                                    key={game}
                                    onClick={() => setSelectedGame(selectedGame === game ? null : game)}
                                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedGame === game
                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    {game}
                                </button>
                            ))}
                        </div>

                        <select
                            value={selectedCondition || ""}
                            onChange={(e) => setSelectedCondition(e.target.value || null)}
                            className="flex-1 lg:flex-none bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 focus:outline-none focus:border-purple-500/50"
                        >
                            <option value="">Status: All Conditions</option>
                            <option value="NM">Mint/NM</option>
                            <option value="LP">Lightly Played</option>
                            <option value="MP">Moderately Played</option>
                            <option value="HP">Heavily Played</option>
                            <option value="DMG">Damaged</option>
                        </select>

                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedGame(null);
                                setSelectedCondition(null);
                                setPage(0);
                            }}
                            className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-neutral-500 hover:text-white transition-all border border-white/5"
                            title="Reset Filters"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Batch Actions Bar (Sticky) */}
                {selectedIds.size > 0 && (
                    <div className="sticky top-4 z-40 animate-in slide-in-from-top-4 duration-500">
                        <div className="bg-purple-600 rounded-3xl p-4 flex items-center justify-between shadow-[0_20px_40px_rgba(147,51,234,0.3)]">
                            <div className="flex items-center gap-6 ml-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Selected Nodes</span>
                                    <span className="text-lg font-black italic">{selectedIds.size} Items</span>
                                </div>
                                <div className="h-8 w-px bg-white/20" />
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleBatchPriceUpdate(10)}
                                        className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        +10% Price
                                    </button>
                                    <button
                                        onClick={() => handleBatchPriceUpdate(-10)}
                                        className="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        -10% Price
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBatchDelete}
                                    className="bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Kill Selection
                                </button>
                                <button
                                    onClick={() => setSelectedIds(new Set())}
                                    className="p-3 text-white/60 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Table Content */}
                <div className="relative bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    {loading && items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
                            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                            <span className="font-black text-xs uppercase tracking-[0.3em] text-neutral-500">Scanning Database...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center min-h-[500px] p-8 space-y-12">
                            <div className="flex flex-col items-center justify-center grayscale opacity-30 gap-6">
                                <Package size={80} />
                                <div className="text-center space-y-2">
                                    <p className="text-xl font-black italic uppercase tracking-tighter">Inventory Node Empty</p>
                                    <p className="text-xs uppercase tracking-widest font-bold">Query: "{searchQuery}" not found in local warehouse</p>
                                </div>
                            </div>

                            {/* Catalog Suggestions */}
                            {catalogResults.length > 0 && (
                                <div className="w-full max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center gap-4">
                                        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                                        <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Found in Global Catalog</h3>
                                        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {catalogResults.map((cat) => (
                                            <div key={cat.printing_id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-4 group hover:border-purple-500/30 transition-all">
                                                <div className="relative w-20 h-28 bg-black rounded-xl overflow-hidden shadow-2xl transition-transform group-hover:scale-105">
                                                    <img src={cat.image_url} alt={cat.cards.card_name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="text-center min-w-0 w-full">
                                                    <div className="text-xs font-black text-white italic truncate tracking-tight lowercase">{cat.cards.card_name}</div>
                                                    <div className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mt-1">{cat.sets.set_code}</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPrefillCard(cat);
                                                        setIsDrawerOpen(true);
                                                    }}
                                                    className="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-purple-500/20"
                                                >
                                                    Push to Stock
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0f0f0f] border-b border-white/5">
                                    <tr>
                                        <th className="pl-8 py-6 w-12">
                                            <button
                                                onClick={toggleSelectAll}
                                                className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${selectedIds.size === items.length && items.length > 0
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'bg-black border-white/10 hover:border-purple-500/50'
                                                    }`}
                                            >
                                                {selectedIds.size === items.length && <Check size={14} />}
                                            </button>
                                        </th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest">
                                            <button onClick={() => toggleSort('name')} className="flex items-center gap-2 hover:text-white transition-colors">
                                                Entity Identification <ArrowUpDown size={12} className={sortBy === 'name' ? 'text-purple-500' : ''} />
                                            </button>
                                        </th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-center">Quality</th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-right">
                                            <button onClick={() => toggleSort('price')} className="flex items-center gap-2 justify-end float-right hover:text-white transition-colors">
                                                Valuation <ArrowUpDown size={12} className={sortBy === 'price' ? 'text-purple-500' : ''} />
                                            </button>
                                        </th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-center">
                                            <button onClick={() => toggleSort('stock')} className="flex items-center gap-2 justify-center mx-auto hover:text-white transition-colors">
                                                Stock Nodes <ArrowUpDown size={12} className={sortBy === 'stock' ? 'text-purple-500' : ''} />
                                            </button>
                                        </th>
                                        <th className="pr-8 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-right">Ops</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-[#080808]/50">
                                    {items.map((item) => (
                                        <tr key={item.product_id} className={`group hover:bg-white/[0.02] transition-colors relative ${selectedIds.has(item.product_id) ? 'bg-purple-500/5' : ''}`}>
                                            <td className="pl-8 py-4">
                                                <button
                                                    onClick={() => toggleSelect(item.product_id)}
                                                    className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${selectedIds.has(item.product_id)
                                                        ? 'bg-purple-500 border-purple-500'
                                                        : 'bg-black border-white/10 hover:border-purple-500/50'
                                                        }`}
                                                >
                                                    {selectedIds.has(item.product_id) && <Check size={14} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-16 bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 transition-transform group-hover:scale-105 group-hover:-rotate-3">
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 max-w-[200px] md:max-w-md">
                                                        <span className="text-sm font-black text-white italic tracking-tight lowercase truncate">
                                                            {item.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-md">
                                                                {item.set_code}
                                                            </span>
                                                            <span className="text-[9px] font-black text-neutral-700 uppercase tracking-widest">
                                                                {item.rarity}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`mx-auto w-12 py-1 rounded-lg text-[10px] font-black border tracking-tighter ${item.condition === 'NM' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    item.condition === 'LP' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                                                        item.condition === 'MP' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                                            'bg-red-500/10 border-red-500/20 text-red-500'
                                                    }`}>
                                                    {item.condition}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {editingPriceId === item.product_id ? (
                                                    <div className="flex items-center justify-end gap-2 animate-in fade-in zoom-in duration-200">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={tempPrice}
                                                            onChange={(e) => setTempPrice(e.target.value)}
                                                            className="w-24 bg-black border border-purple-500/50 rounded-xl px-3 py-2 text-right text-xs font-mono focus:outline-none shadow-xl shadow-purple-500/10"
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleSavePrice(item.product_id);
                                                                if (e.key === 'Escape') setEditingPriceId(null);
                                                            }}
                                                        />
                                                        <button onClick={() => handleSavePrice(item.product_id)} className="p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500 hover:text-white transition-all">
                                                            <Save size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-end">
                                                        <button
                                                            onClick={() => {
                                                                setEditingPriceId(item.product_id);
                                                                setTempPrice(item.price.toString());
                                                            }}
                                                            className={`text-lg font-black font-mono tracking-tighter hover:text-purple-400 transition-colors ${item.price === 0 ? 'text-purple-400' : 'text-white'}`}
                                                        >
                                                            {item.price === 0 ? 'AUTO [CK]' : `$${item.price.toFixed(2)}`}
                                                        </button>
                                                        {lastSavedId === item.product_id && (
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">SAVED</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center justify-center gap-1.5 p-1 bg-black/60 rounded-xl border border-white/5">
                                                        <button
                                                            onClick={() => handleUpdateStock(item.product_id, item.stock, -1)}
                                                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all active:scale-90"
                                                        >
                                                            -
                                                        </button>
                                                        <div className="min-w-[3ch] text-sm font-black font-mono text-center">
                                                            {item.stock}
                                                        </div>
                                                        <button
                                                            onClick={() => handleUpdateStock(item.product_id, item.stock, 1)}
                                                            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all active:scale-90"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    {item.stock === 0 ? (
                                                        <span className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full">
                                                            <ShieldAlert size={8} /> Depleted
                                                        </span>
                                                    ) : item.stock < 10 ? (
                                                        <span className="flex items-center gap-1 text-[8px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded-full">
                                                            <AlertTriangle size={8} /> Low Node
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="pr-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            if (confirm("Delete this node?")) {
                                                                supabase.from('products').delete().eq('id', item.product_id).then(() => fetchInventory());
                                                            }
                                                        }}
                                                        className="p-3 bg-red-500/10 text-red-500/70 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                        title="Delete Item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer / Pagination */}
                    <div className="p-8 bg-[#0f0f0f] border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                            Showing {items.length} of {totalItems} items • Page {page + 1}
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0 || loading}
                                className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all flex items-center gap-2 group"
                            >
                                <ChevronUp size={16} className="-rotate-90 group-hover:-translate-x-1 transition-transform" /> Prev
                            </button>

                            <div className="flex gap-2">
                                {[...Array(Math.min(5, Math.ceil(totalItems / pageSize)))].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i)}
                                        className={`w-10 h-10 rounded-xl text-[10px] font-black border transition-all ${page === i
                                            ? 'bg-purple-500 border-purple-500 text-white'
                                            : 'bg-black border-white/5 text-neutral-500 hover:border-white/20'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={items.length < pageSize || loading}
                                className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-20 transition-all flex items-center gap-2 group"
                            >
                                Next <ChevronDown size={16} className="-rotate-90 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Side Drawer */}
            <AddProductDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setPrefillCard(null);
                }}
                prefillCard={prefillCard}
                onSuccess={() => fetchInventory()}
            />

            <ImportInventoryModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    fetchInventory();
                    // Keep modal open or let it handle its own state? 
                    // The modal has its own success step, so we just refresh data here.
                }}
            />
        </div>
    );
}

export default InventoryPage;
