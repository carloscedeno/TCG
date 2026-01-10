import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, ShoppingCart, ExternalLink, Shield, RotateCw, Info } from 'lucide-react';
import { fetchCardDetails } from '../../utils/api';

interface CardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string | null;
}

interface CardFace {
    image_url?: string;
    image_uris?: {
        small?: string;
        normal?: string;
        large?: string;
        png?: string;
        border_crop?: string;
    };
    name: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
}

interface CardDetails {
    card_id: string;
    name: string;
    mana_cost: string;
    type: string;
    oracle_text: string;
    flavor_text: string;
    artist: string;
    rarity: string;
    set: string;
    set_code: string;
    collector_number: string;
    image_url: string;
    price: number;
    valuation?: {
        store_price: number;
        market_price: number;
        valuation_avg: number;
    };
    legalities: Record<string, string>;
    colors: string[];
    card_faces?: CardFace[];
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, cardId }) => {
    const [details, setDetails] = useState<CardDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);

    useEffect(() => {
        if (isOpen && cardId) {
            loadCardDetails(cardId);
        } else {
            setDetails(null);
        }
    }, [isOpen, cardId]);

    const loadCardDetails = async (id: string) => {
        setLoading(true);
        setCurrentFaceIndex(0);

        try {
            const data = await fetchCardDetails(id);
            if (!data) throw new Error("No data found");

            setDetails(data);
        } catch (err) {
            console.error("Failed to load details from Local API", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getLegalityIcon = (status: string) => {
        if (status === 'legal') return <CheckCircle size={14} className="text-geeko-green" />;
        return <XCircle size={14} className="text-neutral-600" />;
    };

    const formatLegalityLabel = (key: string) => {
        return key.charAt(0).toUpperCase() + key.slice(1);
    };

    const relevantFormats = ['standard', 'pioneer', 'modern', 'legacy', 'commander', 'pauper'];

    // Determine which image to show
    const currentImage = (() => {
        if (details?.card_faces && details.card_faces.length > 0) {
            const face = details.card_faces[currentFaceIndex];
            // Try to get image from face's image_uris object
            if (face?.image_uris) {
                return face.image_uris.normal || face.image_uris.large || face.image_uris.png || face.image_uris.border_crop;
            }
        }
        // Fallback to main image_url
        return details?.image_url;
    })();

    const hasMultipleFaces = details?.card_faces && details.card_faces.length > 1;

    const toggleFace = () => {
        if (hasMultipleFaces) {
            setCurrentFaceIndex((prev) => (prev + 1) % (details?.card_faces?.length || 1));
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[90vh] glass-card rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-black/50 rounded-full text-white md:hidden"
                >
                    <X size={24} />
                </button>

                {/* LEFT COLUMN: IMAGE */}
                <div className="w-full md:w-[400px] bg-[#121212] flex items-center justify-center p-8 border-r border-white/5 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-geeko-red/5 to-geeko-blue/5 opacity-50" />

                    {/* Flip Button for Double-Faced Cards */}
                    {hasMultipleFaces && !loading && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFace();
                            }}
                            className="absolute top-4 left-4 z-20 p-3 bg-geeko-cyan/20 hover:bg-geeko-cyan/30 rounded-full border border-geeko-cyan/50 transition-all group"
                            title="Flip card"
                        >
                            <RotateCw size={20} className="text-geeko-cyan group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    )}

                    {loading ? (
                        <div className="w-64 h-96 rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-t-geeko-cyan border-white/10 rounded-full animate-spin" />
                        </div>
                    ) : currentImage ? (
                        <img
                            src={currentImage}
                            alt={details?.name || 'Card'}
                            className="w-full max-w-sm rounded-[18px] shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-64 h-96 rounded-xl bg-white/5 flex flex-col items-center justify-center text-neutral-500 gap-4">
                            <Shield size={48} className="opacity-20" />
                            <span>No Image Available</span>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: DETAILS */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]/95 text-white">
                    {loading ? (
                        <div className="p-10 space-y-6">
                            <div className="h-10 w-3/4 bg-white/5 rounded-lg animate-pulse" />
                            <div className="h-6 w-1/2 bg-white/5 rounded-lg animate-pulse" />
                            <div className="h-32 w-full bg-white/5 rounded-lg animate-pulse" />
                        </div>
                    ) : details ? (
                        <div className="p-8 md:p-10 space-y-8">

                            {/* Header */}
                            <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-4xl font-black tracking-tight text-white leading-none">
                                        {hasMultipleFaces && details.card_faces?.[currentFaceIndex]?.name
                                            ? details.card_faces[currentFaceIndex].name
                                            : details.name}
                                    </h2>
                                    <button onClick={onClose} className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors">
                                        <X size={24} className="text-neutral-400" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 text-lg font-medium text-neutral-400">
                                    {(() => {
                                        const currentFace = hasMultipleFaces ? details.card_faces?.[currentFaceIndex] : null;
                                        const mana = currentFace?.mana_cost || details.mana_cost;
                                        const type = currentFace?.type_line || details.type;

                                        return (
                                            <>
                                                {mana && <span>{mana}</span>}
                                                {mana && type && <span>•</span>}
                                                {type && <span>{type}</span>}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Oracle Text */}
                            {(() => {
                                const currentFace = hasMultipleFaces ? details.card_faces?.[currentFaceIndex] : null;
                                const oracleText = currentFace?.oracle_text || details.oracle_text;

                                if (!oracleText) return null;

                                return (
                                    <div className="space-y-4 p-6 rounded-2xl bg-white/5 border border-white/5">
                                        {oracleText.split('\n').map((line, i) => (
                                            <p key={i} className="text-sm leading-relaxed text-neutral-200">
                                                {line}
                                            </p>
                                        ))}
                                        {details.flavor_text && (
                                            <p className="text-xs italic text-neutral-500 pt-4 border-t border-white/5 font-serif">
                                                "{details.flavor_text}"
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Meta Info */}
                            <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
                                {details.set && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-geeko-cyan">Set:</span> {details.set} {details.set_code && `(${details.set_code.toUpperCase()})`}
                                    </div>
                                )}
                                {details.collector_number && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-geeko-cyan">Collector:</span> #{details.collector_number}
                                    </div>
                                )}
                                {details.rarity && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-geeko-cyan">Rarity:</span> {details.rarity}
                                    </div>
                                )}
                            </div>

                            <div className="h-px w-full bg-white/10" />

                            {/* MARKETPLACE SECTION */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Legalities */}
                                {details.legalities && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Format Legality</h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {relevantFormats.map(fmt => (
                                                <div key={fmt} className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-white/5">
                                                    <span className="text-xs font-bold text-neutral-400">{formatLegalityLabel(fmt)}</span>
                                                    {getLegalityIcon(details.legalities[fmt] || 'not_legal')}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Prices & Actions */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Marketplace Options</h3>

                                    {/* Geekorium Price */}
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-geeko-gold/10 to-transparent border border-geeko-gold/30 flex items-center justify-between group cursor-pointer hover:bg-geeko-gold/20 transition-all">
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-geeko-gold tracking-widest mb-1">Geekorium Price</div>
                                            <div className="text-3xl font-black text-white font-mono group-hover:scale-105 transition-transform">
                                                ${details.price ? details.price.toFixed(2) : '---'}
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-geeko-gold text-black flex items-center justify-center shadow-[0_0_15px_rgba(255,193,7,0.4)]">
                                            <ShoppingCart size={20} />
                                        </div>
                                    </div>

                                    {/* Marketplace Links */}
                                    <div className="space-y-4">
                                        <div className="space-y-3">
                                            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-all border border-white/5 group">
                                                <div className="text-left">
                                                    <div className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">External Market</div>
                                                    <span className="flex items-center gap-2 text-sm font-bold text-neutral-200">
                                                        Buy @ CardKingdom
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-geeko-cyan font-mono font-bold">
                                                        ${details.valuation?.market_price ? details.valuation.market_price.toFixed(2) : '---'}
                                                    </span>
                                                    <ExternalLink size={14} className="text-neutral-500 group-hover:text-white transition-colors" />
                                                </div>
                                            </button>

                                            {/* Valuation Average Display */}
                                            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-geeko-cyan/5 border border-geeko-cyan/20">
                                                <div className="flex items-center gap-2">
                                                    <Info size={14} className="text-geeko-cyan" />
                                                    <span className="text-[10px] font-black text-geeko-cyan/80 uppercase tracking-widest">
                                                        Valuation Average
                                                    </span>
                                                </div>
                                                <span className="text-sm font-black text-geeko-cyan font-mono">
                                                    ${details.valuation?.valuation_avg ? details.valuation.valuation_avg.toFixed(2) : '---'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-neutral-500">
                            Failed to load card data.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
