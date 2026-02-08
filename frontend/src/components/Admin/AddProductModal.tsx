import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabaseClient";
import { X, Save, AlertCircle, CheckCircle, Search } from "lucide-react";

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface CardPrinting {
    id: string;
    card_id?: string;
    set_id?: string;
    image_url: string;
    rarity?: string;
    card: {
        name: string;
    };
    set: {
        name: string;
        code: string;
    };
}

export function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
    const [selectedCard, setSelectedCard] = useState<CardPrinting | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [price, setPrice] = useState<string>("");
    const [stock, setStock] = useState<number>(1);
    const [condition, setCondition] = useState<string>("NM");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state on open
            setSelectedCard(null);
            setSearchQuery("");
            setSuggestions([]);
            setPrice("");
            setStock(1);
            setCondition("NM");
            setError(null);
            setSuccessMsg(null);
        }
    }, [isOpen]);

    const handleSearch = async (cardName: string) => {
        setSearchQuery(cardName);
        if (cardName.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('card_printings')
                .select(`
                    printing_id,
                    image_url,
                    cards!inner (
                        card_name,
                        game_id
                    ),
                    sets!inner (
                        set_name,
                        set_code
                    )
                `)
                .ilike('cards.card_name', `%${cardName}%`)
                .eq('cards.game_id', 22)
                .limit(5);

            if (error) throw error;
            setSuggestions(data || []);
        } catch (err: any) {
            console.error("Search error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPrinting = (printing: any) => {
        setSelectedCard({
            id: printing.printing_id,
            image_url: printing.image_url,
            card: { name: printing.cards.card_name },
            set: { name: printing.sets.set_name, code: printing.sets.set_code }
        });
        setSuggestions([]); // Close suggestions
        setSearchQuery(printing.cards.card_name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCard) {
            setError("Please select a card from the results.");
            return;
        }

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            setError("Price must be greater than 0.");
            return;
        }

        if (stock < 0) {
            setError("Stock cannot be negative.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: rpcError } = await supabase.rpc('upsert_product_inventory', {
                p_printing_id: selectedCard.id,
                p_price: numericPrice,
                p_stock: stock,
                p_condition: condition
            });

            if (rpcError) throw rpcError;

            setSuccessMsg(`Successfully added ${selectedCard.card.name} to inventory!`);

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);

        } catch (err: any) {
            setError(err.message || "Failed to add product to inventory");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-purple-400">+</span> Add to Inventory
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Step 1: Search */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Search Card</label>
                        <div className="relative z-20">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for a card name..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                                {loading && !selectedCard && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
                            </div>

                            {/* Suggestions List */}
                            {suggestions.length > 0 && !selectedCard && (
                                <div className="absolute z-30 w-full mt-1 bg-gray-800 border border-white/10 rounded-lg shadow-2xl divide-y divide-white/5 max-h-60 overflow-y-auto">
                                    {suggestions.map((s) => (
                                        <button
                                            key={s.printing_id}
                                            type="button"
                                            onClick={() => handleSelectPrinting(s)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left group"
                                        >
                                            <div className="w-10 h-14 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                                                <img src={s.image_url} alt={s.cards.card_name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white group-hover:text-purple-400 truncate">
                                                    {s.cards.card_name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {s.sets.set_name} ({s.sets.set_code})
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected Card Preview */}
                            {selectedCard && (
                                <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl flex items-center gap-4 relative">
                                    <div className="w-12 h-16 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                                        <img src={selectedCard.image_url} alt={selectedCard.card.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">{selectedCard.card.name}</div>
                                        <div className="text-xs text-purple-300 font-medium">{selectedCard.set.name} • {selectedCard.set.code}</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCard(null);
                                            setSuggestions([]);
                                        }}
                                        className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error / Success Messages */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle size={16} />
                            {successMsg}
                        </div>
                    )}

                    {/* Form Fields (Only enabled if card selected - mocked true for UI dev) */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold">Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 uppercase font-bold">Stock</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={stock}
                                    onChange={(e) => setStock(parseInt(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 uppercase font-bold">Condition</label>
                            <div className="grid grid-cols-5 gap-2">
                                {['NM', 'LP', 'MP', 'HP', 'DMG'].map((cond) => (
                                    <button
                                        key={cond}
                                        type="button"
                                        onClick={() => setCondition(cond)}
                                        className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${condition === cond
                                            ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                                            : 'bg-black/40 border-white/10 text-gray-500 hover:border-white/30'
                                            }`}
                                    >
                                        {cond}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? 'Saving...' : (
                                    <>
                                        <Save size={16} />
                                        Save Product
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
}
