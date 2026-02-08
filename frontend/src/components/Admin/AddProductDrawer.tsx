import { useState, useEffect, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";
import { X, AlertCircle, CheckCircle, Search, Trash2 } from "lucide-react";

interface AddProductDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    prefillCard?: any;
}

interface CardPrinting {
    id: string;
    image_url: string;
    card: {
        name: string;
    };
    set: {
        name: string;
        code: string;
    };
}

export function AddProductDrawer({ isOpen, onClose, onSuccess, prefillCard }: AddProductDrawerProps) {
    const [selectedCard, setSelectedCard] = useState<CardPrinting | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [price, setPrice] = useState<string>("");
    const [stock, setStock] = useState<number>(1);
    const [condition, setCondition] = useState<string>("NM");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (prefillCard) {
                // Pre-fill selection from external source
                setSelectedCard({
                    id: prefillCard.printing_id,
                    image_url: prefillCard.image_url,
                    card: { name: prefillCard.cards.card_name },
                    set: { name: prefillCard.sets.set_name, code: prefillCard.sets.set_code }
                });
                setSearchQuery(prefillCard.cards.card_name);
            } else {
                setSelectedCard(null);
                setSearchQuery("");
            }

            setSuggestions([]);
            setPrice("");
            setStock(1);
            setCondition("NM");
            setError(null);
            setSuccessMsg(null);
        }
    }, [isOpen, prefillCard]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isOpen) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    const handleSearch = async (cardName: string) => {
        setSearchQuery(cardName);
        if (cardName.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            const finalQuery = supabase
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
                `);

            // Check if it looks like a set code (3-4 chars uppercase/digits)
            const isSetCode = cardName.length <= 4 && /^[A-Z0-9]+$/i.test(cardName);

            let results;
            if (isSetCode) {
                const { data } = await finalQuery.eq('sets.set_code', cardName.toUpperCase()).limit(12);
                results = data;
            }

            // If no set code results or not a set code query, search by name
            if (!results || results.length === 0) {
                // We re-create the base query because the previous might have added filters
                const { data } = await supabase
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
                    .ilike('cards.card_name', `%${cardName}%`)
                    .limit(12);
                results = data;
            }

            setSuggestions(results || []);
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
        setSuggestions([]);
        setSearchQuery(printing.cards.card_name);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCard) {
            setError("Please select a card from the results.");
            return;
        }

        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            setError("Price must be 0 or greater.");
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

            setSuccessMsg(`Added ${selectedCard.card.name}!`);
            onSuccess();

            // Auto close after success? or stay open? 
            // PRD says "streamlined without losing context", so close is better.
            setTimeout(() => {
                onClose();
            }, 800);

        } catch (err: any) {
            setError(err.message || "Failed to add product");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                ref={drawerRef}
                className={`absolute right-0 top-0 h-full w-full max-w-md bg-neutral-900 border-l border-white/5 shadow-2xl transition-transform duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                        <div>
                            <h2 className="text-xl font-black text-white italic tracking-tighter uppercase">Add Product</h2>
                            <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">Catalog Entry</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-neutral-500 hover:text-white rounded-full hover:bg-white/10 transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Search Section */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Identify Card</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-neutral-700 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
                                />
                                {loading && !selectedCard && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {/* Suggestions */}
                                {suggestions.length > 0 && !selectedCard && (
                                    <div className="absolute z-30 w-full mt-2 bg-neutral-800 border border-white/5 rounded-2xl shadow-2xl overflow-hidden divide-y divide-white/5">
                                        {suggestions.map((s) => (
                                            <button
                                                key={s.printing_id}
                                                onClick={() => handleSelectPrinting(s)}
                                                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-all text-left group"
                                            >
                                                <div className="w-10 h-14 bg-black rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                                                    <img src={s.image_url} alt={s.cards.card_name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-black text-white group-hover:text-purple-400 truncate tracking-tight lowercase">
                                                        {s.cards.card_name}
                                                    </div>
                                                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                                                        {s.sets.set_code} • {s.sets.set_name}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Selection Preview */}
                            {selectedCard && (
                                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center gap-4 group">
                                    <div className="w-14 h-20 bg-black rounded-xl overflow-hidden shadow-xl border border-white/5">
                                        <img src={selectedCard.image_url} alt={selectedCard.card.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-white italic tracking-tight">{selectedCard.card.name}</div>
                                        <div className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-1">
                                            {selectedCard.set.code} • {selectedCard.set.name}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCard(null)}
                                        className="p-2 bg-black/40 rounded-full text-neutral-500 hover:text-white hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Inventory Details Form */}
                        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Market Price</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-black">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl pl-8 pr-4 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Quantity</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={stock}
                                        onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Item Condition</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {['NM', 'LP', 'MP', 'HP', 'DMG'].map((cond) => (
                                        <button
                                            key={cond}
                                            type="button"
                                            onClick={() => setCondition(cond)}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${condition === cond
                                                ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                                                : 'bg-black/20 border-white/5 text-neutral-600 hover:border-white/20'
                                                }`}
                                        >
                                            {cond}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Alerts */}
                            <div className="min-h-[48px]">
                                {error && (
                                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                                        <AlertCircle size={18} />
                                        {error}
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3 text-emerald-500 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                                        <CheckCircle size={18} />
                                        {successMsg}
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/5 bg-white/5">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedCard}
                            className="w-full py-5 bg-white text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-purple-500 hover:text-white transition-all transform active:scale-[0.98] disabled:opacity-30 disabled:grayscale shadow-xl shadow-black/40"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Synchronizing...
                                </div>
                            ) : 'Push to Inventory'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
