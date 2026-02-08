
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { AddProductModal } from "../../components/Admin/AddProductModal";
import { Plus, Search, Trash2, Package, Save, X } from "lucide-react";

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
}

export function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<string>("");

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_inventory_list', {
                p_page: page,
                p_search: searchQuery || null,
                p_game: selectedGame || null,
                p_condition: selectedCondition || null
            });

            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            console.error("Error fetching inventory:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (productId: string) => {
        if (!confirm("Are you sure you want to remove this product from inventory?")) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;
            fetchInventory();
        } catch (err: any) {
            alert("Error deleting product: " + err.message);
        }
    };

    const handleUpdateStock = async (productId: string, currentStock: number, delta: number) => {
        const newStock = Math.max(0, currentStock + delta);
        try {
            const { error } = await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', productId);

            if (error) throw error;
            setItems(prev => prev.map(item =>
                item.product_id === productId ? { ...item, stock: newStock } : item
            ));
        } catch (err: any) {
            alert("Error updating stock: " + err.message);
        }
    };

    const handlePriceEdit = (item: InventoryItem) => {
        setEditingPriceId(item.product_id);
        setTempPrice(item.price.toString());
    };

    const handleSavePrice = async (productId: string) => {
        const newPrice = parseFloat(tempPrice);
        if (isNaN(newPrice) || newPrice <= 0) {
            alert("Please enter a valid price greater than 0");
            return;
        }

        try {
            const { error } = await supabase
                .from('products')
                .update({ price: newPrice })
                .eq('id', productId);

            if (error) throw error;
            setItems(prev => prev.map(item =>
                item.product_id === productId ? { ...item, price: newPrice } : item
            ));
            setEditingPriceId(null);
        } catch (err: any) {
            alert("Error updating price: " + err.message);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(fetchInventory, 300);
        return () => clearTimeout(debounce);
    }, [page, searchQuery, selectedCondition, selectedGame]);

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            Inventory Management
                        </h1>
                        <p className="text-gray-400 mt-1">Manage your store's stock, prices, and products.</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg shadow-white/5 active:scale-95"
                    >
                        <Plus size={20} />
                        Add Product
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by card name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <select
                        value={selectedGame || ""}
                        onChange={(e) => setSelectedGame(e.target.value || null)}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
                    >
                        <option value="">All Games</option>
                        <option value="Magic">Magic</option>
                        <option value="Pokemon">Pokemon</option>
                        <option value="One Piece">One Piece</option>
                    </select>

                    <select
                        value={selectedCondition || ""}
                        onChange={(e) => setSelectedCondition(e.target.value || null)}
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
                    >
                        <option value="">All Conditions</option>
                        <option value="NM">Near Mint (NM)</option>
                        <option value="LP">Lightly Played (LP)</option>
                        <option value="MP">Moderately Played (MP)</option>
                        <option value="HP">Heavily Played (HP)</option>
                        <option value="DMG">Damaged (DMG)</option>
                    </select>
                </div>

                {/* Inventory Table */}
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden min-h-[400px]">
                    {loading && items.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500 animate-pulse">
                            Loading inventory...
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
                            <Package size={48} className="opacity-20" />
                            <p>No products found in inventory.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-black/40 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Card</th>
                                    <th className="px-6 py-4 text-center">Condition</th>
                                    <th className="px-6 py-4 text-right">Price</th>
                                    <th className="px-6 py-4 text-center">Stock</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.map((item) => (
                                    <tr key={item.product_id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 flex items-center gap-4 text-sm">
                                            <div className="w-10 h-14 bg-gray-800 rounded overflow-hidden relative shadow-lg flex-shrink-0">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{item.name}</span>
                                                <span className="text-xs text-gray-500">{item.set_code} • {item.rarity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.condition === 'NM' ? 'bg-green-500/20 text-green-400' :
                                                item.condition === 'LP' ? 'bg-blue-500/20 text-blue-400' :
                                                    item.condition === 'MP' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        'bg-red-500/20 text-red-400'
                                                }`}>
                                                {item.condition}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-purple-300">
                                            {editingPriceId === item.product_id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={tempPrice}
                                                        onChange={(e) => setTempPrice(e.target.value)}
                                                        className="w-20 bg-black/60 border border-purple-500 rounded px-2 py-1 text-right text-sm focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleSavePrice(item.product_id)} className="text-green-400 hover:text-green-300">
                                                        <Save size={14} />
                                                    </button>
                                                    <button onClick={() => setEditingPriceId(null)} className="text-gray-500 hover:text-gray-400">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handlePriceEdit(item)}
                                                    className="hover:text-purple-100 transition-colors"
                                                >
                                                    ${item.price.toFixed(2)}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleUpdateStock(item.product_id, item.stock, -1)}
                                                    className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                                >
                                                    -
                                                </button>
                                                <span className={`min-w-[2ch] text-sm font-bold ${item.stock > 0 ? 'text-white' : 'text-red-500'}`}>
                                                    {item.stock}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateStock(item.product_id, item.stock, 1)}
                                                    className="w-6 h-6 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleDelete(item.product_id)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-red-500/70 hover:text-red-400 transition-colors"
                                                    title="Remove from inventory"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination (Simple) */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 bg-white/5 disabled:opacity-50 rounded-lg text-sm hover:bg-white/10"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-500 text-sm">Page {page + 1}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={items.length < 50}
                        className="px-4 py-2 bg-white/5 disabled:opacity-50 rounded-lg text-sm hover:bg-white/10"
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Modals */}
            <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => fetchInventory()}
            />
        </div>
    );
}

export default InventoryPage;
