import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingCart, ExternalLink, RotateCw, Loader2, Maximize2, Copy, Check, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../../utils/api';
import { getTcgConfig, getExternalMarketplaceLink } from '../../config/tcgRegistry';
import { ManaText } from '../Mana/ManaText';
import { CardImage } from './CardImage';



interface CardModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardId: string | null;
    initialImage?: string;
    initialData?: any;
    onAddToCartSuccess?: () => void;
    onRequireAuth?: () => void;
    isArchive?: boolean;
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

interface Version {
    printing_id: string;
    set_name: string;
    set_code: string;
    collector_number: string;
    rarity: string;
    price: number;
    image_url: string;
    stock?: number;
    finish?: string;
    is_foil?: boolean;
}

interface CardDetails {
    printing_id: string;
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
    finish?: string;
    is_foil?: boolean;
    valuation?: {
        store_price: number;
        market_price: number;
        market_url?: string;
        valuation_avg: number;
    };
    legalities: Record<string, string>;
    colors: string[];
    total_stock: number;
    card_faces?: CardFace[];
    all_versions?: Version[];
    is_accessory?: boolean;
    game?: string;
    external_id?: string;
    tcgplayer_id?: string;
    tcg_specific_attributes?: Record<string, any>;
    power?: string;
    toughness?: string;
    loyalty?: string;
}


const MTG_FORMAT_COLUMNS = {
    left: [
        { key: 'standard', label: 'Standard' },
        { key: 'pioneer', label: 'Pioneer' },
        { key: 'historic', label: 'Historic' },
        { key: 'legacy', label: 'Legacy' },
        { key: 'vintage', label: 'Vintage' },
        { key: 'commander', label: 'Commander' },
        { key: 'brawl', label: 'Brawl' },
        { key: 'penny', label: 'Penny' },
        { key: 'gladiator', label: 'Gladiator' },
        { key: 'premodern', label: 'Premodern' },
        { key: 'predh', label: 'PreDH' },
    ],
    right: [
        { key: 'alchemy', label: 'Alchemy' },
        { key: 'explorer', label: 'Explorer' },
        { key: 'modern', label: 'Modern' },
        { key: 'timeless', label: 'Timeless' },
        { key: 'pauper', label: 'Pauper' },
        { key: 'oathbreaker', label: 'Oathbreaker' },
        { key: 'standardbrawl', label: 'Standard Brawl' },
        { key: 'duel', label: 'Duel' },
        { key: 'oldschool', label: 'Old School' },
        { key: 'paupercommander', label: 'Pauper EDH' },
        { key: 'future', label: 'Future' },
    ]
};

const getRarityColor = (rarity?: string) => {
    const r = (rarity || '').toLowerCase();
    if (r.includes('mythic')) return 'text-[#f59e0b]'; // gold/amber
    if (r.includes('rare')) return 'text-[#eab308]'; // yellow/gold
    if (r.includes('uncommon')) return 'text-[#38bdf8]'; // sky cyan/silver
    return 'text-[#9ca3af]'; // gray/common
};

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, cardId, initialImage, initialData, onAddToCartSuccess, isArchive }) => {
    const [details, setDetails] = useState<CardDetails | null>(initialData || null);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addedSuccess, setAddedSuccess] = useState(false);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [shared, setShared] = useState(false);
    const [isLegalitiesOpen, setIsLegalitiesOpen] = useState(true);

    const handleCopyName = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (details?.name) {
            navigator.clipboard.writeText(details.name);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const shareUrl = `${window.location.origin}/?card=${activePrintingId || details?.printing_id || details?.card_id}`;
        if (navigator.share) {
            navigator.share({
                title: details?.name,
                text: `Mira ${details?.name} en Geekorium`,
                url: shareUrl
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareUrl);
            setShared(true);
            setTimeout(() => setShared(false), 2000);
        }
    };

    const extractedKeywords = useMemo(() => {
        if (!details?.oracle_text && !details?.type) return [];
        const text = `${details.type || ''} ${details.oracle_text || ''}`.toLowerCase();
        const candidateKeywords = [
            'Flying', 'Trample', 'Haste', 'Vigilance', 'Lifelink', 'Deathtouch',
            'First strike', 'Double strike', 'Flash', 'Defender', 'Reach', 'Menace',
            'Hexproof', 'Indestructible', 'Ward', 'Token', 'Counter', 'Sacrifice',
            'Artifact', 'Creature', 'Instant', 'Sorcery', 'Enchantment', 'Planeswalker',
            'Legendary', 'Bird', 'Soldier', 'Dragon', 'Goblin', 'Elf', 'Zombie', 'Vampire', 'Wizard'
        ];
        return candidateKeywords.filter(kw => text.includes(kw.toLowerCase())).slice(0, 8);
    }, [details?.oracle_text, details?.type]);

    const [activePrintingId, setActivePrintingId] = useState<string | null>(null);
    const [selectedFinish, setSelectedFinish] = useState<'nonfoil' | 'foil' | 'etched'>('nonfoil');

    // ... useEffect ...

    useEffect(() => {
        if (isOpen && cardId) {
            if (initialData) {
                setDetails(initialData as CardDetails);
            } else {
                setDetails(null);
            }
            // Extract requested finish from ID suffix if present (e.g. uuid-foil)
            let initialFinish: 'nonfoil' | 'foil' | 'etched' = 'nonfoil';
            let basePrintingId = cardId;

            if (cardId.endsWith('-foil')) {
                initialFinish = 'foil';
                basePrintingId = cardId.replace('-foil', '');
            } else if (cardId.endsWith('-etched')) {
                initialFinish = 'etched';
                basePrintingId = cardId.replace('-etched', '');
            } else if (cardId.endsWith('-nonfoil')) {
                initialFinish = 'nonfoil';
                basePrintingId = cardId.replace('-nonfoil', '');
            }

            setSelectedFinish(initialFinish);
            setActivePrintingId(basePrintingId);
            loadCardDetails(basePrintingId, true, initialFinish); // skipAutoSwitch=true to preserve our extracted finish
            // Lock background scroll
            document.body.style.overflow = 'hidden';
        } else {
            setDetails(null);
            setActivePrintingId(null);
            // Unlock background scroll
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, cardId]);


    const [error, setError] = useState<string | null>(null);

    const loadCardDetails = async (id: string, skipAutoSwitch = false, forcedFinish?: 'nonfoil' | 'foil' | 'etched') => {
        console.log("CardModal: Start loading details for:", id);
        setLoading(true);
        setError(null);
        setCurrentFaceIndex(0);

        try {
            console.log("CardModal: Fetching details...");
            const data = await fetchCardDetails(id);
            console.log("CardModal: Data received:", data ? "yes" : "no");
            if (!data) throw new Error("No data found");

            // PRESERVE VERSIONS: If new data has no versions but old state had them for same oracle_id
            if ((!data.all_versions || data.all_versions.length <= 1) && details?.all_versions && details.all_versions.length > 1) {
                // If it's the same base card (oracle_id), keep the versions list
                const oldOracleId = details.card_id;
                const newOracleId = data.card_id || data.oracle_id;
                if (oldOracleId === newOracleId) {
                    data.all_versions = details.all_versions;
                }
            }

            // DEFAULT TO NORMAL: If we just loaded a specific version (like clicking from Versions list),
            // or if we didn't specify one (skipAutoSwitch = false), logic follows:

            if (!skipAutoSwitch) {
                const hasNonFoil = data.all_versions?.some((v: Version) =>
                    v.set_code === data.set_code &&
                    v.collector_number === data.collector_number &&
                    !v.is_foil
                );

                if (hasNonFoil) {
                    setSelectedFinish('nonfoil');
                } else if (data.finish === 'etched') {
                    setSelectedFinish('etched');
                } else if (data.is_foil || data.finish === 'foil') {
                    setSelectedFinish('foil');
                } else {
                    setSelectedFinish('nonfoil');
                }
            } else {
                // If skipAutoSwitch is true, we keep the forcedFinish we had or current state
                const currentReqFinish = forcedFinish || selectedFinish;

                // Ensure it's valid for this card or fallback safely
                const hasFinish = data.all_versions?.some((v: any) => (v.finish || (v.is_foil ? 'foil' : 'nonfoil')) === currentReqFinish);
                if (hasFinish) {
                    setSelectedFinish(currentReqFinish);
                } else {
                    // Safe fallback if the requested finish doesn't exist in the loaded card
                    if (data.is_foil || data.finish === 'foil') setSelectedFinish('foil');
                    else setSelectedFinish('nonfoil');
                }
            }

            // Aggressively filter all_versions to only include those with stock > 0
            if (data.all_versions) {
                data.all_versions = data.all_versions.filter((v: any) => (v.stock || 0) > 0);
            }

            setDetails(data);

            // PRESERVE SELECTED ID: If the requested `id` (e.g. uuid-foil) exists in the versions list, keep it!
            // Otherwise, fallback to the base printing_id from the database.
            let pId = id;
            if (!data.all_versions?.some((v: any) => v.printing_id === id)) {
                pId = data.printing_id || data.card_id || id;
            }

            setActivePrintingId(pId);
            console.log("CardModal: Details set with Printing ID:", pId);
        } catch (err: any) {
            console.error("CardModal: Failed to load details", err);
            setError(err.message || "Failed to load details");
        } finally {
            console.log("CardModal: Loading finished");
            setLoading(false);
        }
    };

    const handleVersionClick = (id: string, finish?: string, e?: React.MouseEvent) => {
        if (e && (e.ctrlKey || e.metaKey)) {
            return; // Allow native browser behavior for ctrl+click if it's a link
        }

        // If finish is explicitly provided (FOIL/NORMAL toggle buttons), only update
        // selectedFinish + activePrintingId — do NOT reload card details.
        // The activeVersion memo already picks the correct price from all_versions,
        // and a reload would overwrite that price with the nonfoil product price.
        if (finish) {
            setSelectedFinish(finish as any);
            if (activeGroup) {
                const targetVersion = finish === 'foil' ? activeGroup.foil : (finish === 'etched' ? activeGroup.etched : activeGroup.normal);
                if (targetVersion) {
                    setActivePrintingId(targetVersion.printing_id);
                }
            }
            return; // ← skip loadCardDetails entirely for finish toggle
        }

        // Clicking a different edition row → full reload
        if (id !== activePrintingId) {
            setActivePrintingId(id);
            loadCardDetails(id, true);
        }
    };


    const handleAddToCart = async () => {
        if (!activePrintingId) return;

        setIsAdding(true);
        try {
            // Use the real printing_id (strip any synthetic suffix before calling RPC)
            const baseId = activePrintingId.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
            const result = await addToCart(baseId, 1, selectedFinish);
            if (result && !result.success) {
                alert(result.message || result.error || 'No se pudo agregar al carrito');
                setIsAdding(false);
                return;
            }
            // Haptic feedback for mobile devices
            if (navigator.vibrate) navigator.vibrate(50);
            setAddedSuccess(true);
            setTimeout(() => setAddedSuccess(false), 1500);
            setTimeout(() => {
                onClose();
                if (onAddToCartSuccess) {
                    onAddToCartSuccess();
                }
            }, 500);
        } catch (err: any) {
            console.error("Cart error", err);
            alert(err.message || 'Error al agregar al carrito');
        } finally {
            setTimeout(() => setIsAdding(false), 800);
        }
    };

    const handleVersionAddToCart = async (v: any) => {
        try {
            // Strip synthetic suffix, pass finish explicitly
            const baseId = (v.printing_id || '').replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
            const vFinish = v.finish || (v.is_foil ? 'foil' : 'nonfoil');
            const result = await addToCart(baseId, 1, vFinish);
            if (result && !result.success) {
                // Show error message to user
                alert(result.message || result.error || 'No se pudo agregar al carrito');
                return;
            }
            if (onAddToCartSuccess) {
                onAddToCartSuccess();
            }
        } catch (err: any) {
            console.error("Cart error", err);
            alert(err.message || 'Error al agregar al carrito');
        }
    };




    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Removal of icon-based legality indicators in favor of color-coded boxes.

    const tcgConfig = useMemo(() => getTcgConfig(details?.game), [details?.game]);
    const relevantFormats = useMemo(() => tcgConfig.formats || [], [tcgConfig]);

    const versionGroups = useMemo(() => {
        if (!details?.all_versions) return [];

        const groups = (Array.isArray(details.all_versions) ? details.all_versions : []).reduce((acc: any, v: any) => {
            // ONLY include versions with stock > 0
            if ((v.stock || 0) <= 0) return acc;

            const key = `${v.set_code || 'unk'}-${v.collector_number || Math.random()}`;
            if (!acc[key]) {
                const isNormal = !(v.is_foil || v.finish === 'foil' || v.finish === 'etched');
                acc[key] = {
                    base: v, // will be normalized below
                    normal: isNormal ? v : null,
                    foil: (v.is_foil || v.finish === 'foil') ? v : null,
                    etched: v.finish === 'etched' ? v : null,
                };
            } else {
                if (!(v.is_foil || v.finish === 'foil' || v.finish === 'etched')) acc[key].normal = v;
                else if (v.finish === 'etched') acc[key].etched = v;
                else acc[key].foil = v;
            }
            return acc;
        }, {} as Record<string, any>);

        // Normalize: base should always be the normal version when available,
        // so activeGroup lookups by base.printing_id are consistent.
        Object.values(groups).forEach((g: any) => {
            g.base = g.normal || g.foil || g.etched || g.base;
        });

        return Object.values(groups).sort((a: any, b: any) => {
            const nameA = a.base?.set_name || '';
            const nameB = b.base?.set_name || '';
            return nameA.localeCompare(nameB);
        });
    }, [details?.all_versions]);

    const activeGroup = useMemo<any>(() => {
        return versionGroups.find((g: any) =>
            g.normal?.printing_id === activePrintingId ||
            g.foil?.printing_id === activePrintingId ||
            g.etched?.printing_id === activePrintingId ||
            g.base?.printing_id === activePrintingId
        );
    }, [versionGroups, activePrintingId]);

    const activeVersion = useMemo(() => {
        if (!activeGroup) return null;
        if (selectedFinish === 'foil' && activeGroup.foil) return activeGroup.foil;
        if (selectedFinish === 'etched' && activeGroup.etched) return activeGroup.etched;
        // Fallback to whichever is available in the group
        return activeGroup.normal || activeGroup.foil || activeGroup.etched || activeGroup.base;
    }, [activeGroup, selectedFinish]);

    // Detect DFC only if multiple faces actually exist in card data
    const hasMultipleFaces = !!(details?.card_faces && details.card_faces.length > 1);
    const currentFace = hasMultipleFaces ? (details?.card_faces?.[currentFaceIndex] || {}) : details;
    const currentImage = (currentFace as any)?.image_url || (currentFace as any)?.image_uris?.normal || (currentFace as any)?.image_uris?.large || (currentFace as any)?.image_uris?.png || details?.image_url || initialImage || (initialData as any)?.image_url;

    const externalMarket = useMemo(() => {
        if (!details || details.is_accessory) return null;
        const isFoil = activeVersion ? (activeVersion.is_foil || activeVersion.finish === 'foil') : !!(details.is_foil || details.finish === 'foil');
        const extId = (activeVersion as any)?.external_id || (details as any)?.external_id || (activeVersion as any)?.tcgplayer_id || (details as any)?.tcgplayer_id;
        return getExternalMarketplaceLink(details.game, {
            name: details.name,
            isFoil,
            externalId: extId,
            setCode: details.set_code,
            collectorNumber: activeVersion?.collector_number || details.collector_number
        });
    }, [details, activeVersion]);

    const marketPrice = useMemo(() => {
        if (!activeVersion || !details) return details?.valuation?.market_price || 0;
        const resolvedPrice = activeVersion.price || details?.valuation?.market_price || 0;
        console.log("CardModal Price Calc:", {
            activeVersionId: activeVersion.printing_id,
            activeVersionFinish: activeVersion.finish,
            activeVersionPrice: activeVersion.price,
            fallbackBasePrice: details?.valuation?.market_price,
            finalResolvedPrice: resolvedPrice
        });
        return resolvedPrice;
    }, [activeVersion, details]);

    // Cleanly parse oracle / rules text (handles <br>, <em>, <strong> from external TCGs without raw HTML)
    const renderOracleText = (rawText: string) => {
        if (!rawText) return null;
        const withNewlines = rawText.replace(/<br\s*\/?>/gi, '\n');
        const lines = withNewlines.split('\n');

        return (
            <div className="space-y-1.5 text-xs md:text-sm leading-relaxed text-neutral-300">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    const cleanLine = trimmed.replace(/<[^>]+>/g, '');
                    return (
                        <p key={idx} className="whitespace-pre-wrap">
                            <ManaText text={cleanLine} />
                        </p>
                    );
                })}
            </div>
        );
    };

        const renderVersionsContent = () => (
        <div className="flex flex-col h-full w-full">
            <div className="px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between border-b border-white/5 bg-[#0a0a0a]/50">
                <h3 className="text-[10px] font-web-titles font-normal uppercase tracking-widest text-neutral-500">Edición / Impresiones</h3>
                <span className="text-[10px] text-neutral-400 font-normal">
                    {loading && versionGroups.length === 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-geeko-cyan animate-pulse">
                            <Loader2 size={10} className="animate-spin" /> Cargando...
                        </span>
                    ) : (
                        `${versionGroups.length} ${versionGroups.length === 1 ? 'Versión' : 'Versiones'}`
                    )}
                </span>
            </div>
            <div
                data-testid="versions-list-container"
                className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col p-1 md:p-0 max-h-[260px] md:max-h-none"
            >
                {loading ? (
                    // Versions Skeleton
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-4 md:px-6 py-3 border-b border-white/5 animate-pulse">
                            <div className="w-8 h-8 rounded bg-white/5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-32 bg-white/5 rounded" />
                                <div className="h-2 w-16 bg-white/5 rounded" />
                            </div>
                        </div>
                    ))
                ) : (
                    <>
                        {versionGroups.map((group: any) => {
                            const isGroupActive = activePrintingId === group.base.printing_id;
                            const rowActiveVersion = (isGroupActive && selectedFinish === 'foil' && group.foil) ? group.foil : (group.normal || group.base);

                            return (
                                <div
                                    key={`${group.base.set_code}-${group.base.collector_number}`}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        const isCurrentlyFoil = !!(details?.is_foil || details?.finish === 'foil');
                                        const targetPrintingId = isCurrentlyFoil
                                            ? (group.foil?.printing_id || group.normal?.printing_id)
                                            : (group.normal?.printing_id || group.foil?.printing_id);
                                        if (targetPrintingId) handleVersionClick(targetPrintingId);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            const isCurrentlyFoil = !!(details?.is_foil || details?.finish === 'foil');
                                            const targetPrintingId = isCurrentlyFoil
                                                ? (group.foil?.printing_id || group.normal?.printing_id)
                                                : (group.normal?.printing_id || group.foil?.printing_id);
                                            if (targetPrintingId) handleVersionClick(targetPrintingId);
                                        }
                                    }}
                                    data-testid="edition-link"
                                    className={`flex items-center justify-between gap-3 px-4 md:px-6 py-3 hover:bg-white/10 transition-colors border-b border-white/5 group w-full text-left cursor-pointer outline-none focus-visible:bg-white/10 ${isGroupActive ? 'bg-geeko-cyan/10 border-geeko-cyan/20' : ''}`}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-xs font-web-titles group-hover:text-geeko-cyan transition-colors shrink-0">
                                            {group.base.set_code?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className={`text-xs font-semibold leading-tight truncate ${isGroupActive ? 'text-geeko-cyan' : 'text-neutral-300'}`}>
                                                {group.base.set_name}
                                            </div>
                                            <div className="text-[10px] text-neutral-500 font-normal truncate">#{group.base.collector_number} • {group.base.rarity}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="flex flex-col items-end gap-0.5">
                                            {group.normal && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Norm</span>
                                                    <span className={`text-[11px] font-black ${group.normal.stock > 0 ? 'text-white' : 'text-neutral-600'}`}>
                                                        ${group.normal.price.toFixed(2)}
                                                        {group.normal.stock <= 0 && <span className="ml-1 text-[8px] text-orange-500/80 italic font-medium">(P/E)</span>}
                                                    </span>
                                                </div>
                                            )}
                                            {group.foil && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                                                        <svg width="7" height="7" viewBox="0 0 10 12" fill="none">
                                                            <rect x="0.5" y="0.5" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
                                                            <path d="M2 3 L8 3" stroke="currentColor" strokeWidth="1" />
                                                        </svg>
                                                        Foil
                                                    </span>
                                                    <span className={`text-[11px] font-black ${group.foil.stock > 0 ? 'text-geeko-cyan' : 'text-neutral-600'}`}>
                                                        ${group.foil.price.toFixed(2)}
                                                        {group.foil.stock <= 0 && <span className="ml-1 text-[8px] text-orange-500/80 italic font-medium">(P/E)</span>}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {(rowActiveVersion?.stock ?? 0) > 0 ? (
                                                <span className="text-[8px] font-black text-geeko-green bg-geeko-green/10 px-1.5 py-0.5 rounded-full border border-geeko-green/20 uppercase tracking-tight whitespace-nowrap">
                                                    Stock
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-bold text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded-full border border-white/5 uppercase tracking-tight whitespace-nowrap">
                                                    P/E
                                                </span>
                                            )}
                                            {!isArchive && (
                                                <div
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (rowActiveVersion) handleVersionAddToCart(rowActiveVersion);
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-all shrink-0 ${!rowActiveVersion?.stock || rowActiveVersion.stock === 0
                                                        ? 'text-neutral-800 cursor-not-allowed'
                                                        : 'text-neutral-500 hover:text-geeko-cyan hover:bg-geeko-cyan/10'
                                                        }`}
                                                >
                                                    <ShoppingCart size={13} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div className="sticky bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#080808] to-transparent pointer-events-none hidden md:block" />
                    </>
                )}
            </div>
        </div>
    );

    if (!isOpen) return null;

    const modalNode = (
        <div
            className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-6 animate-in fade-in duration-200 overflow-hidden"
            onClick={handleBackdropClick}
        >
            {/* Modal Content */}
            <div
                data-testid="card-modal"
                role="dialog"
                aria-modal="true"
                className="glass-panel w-full max-w-5xl h-[94vh] md:h-[680px] max-h-[94vh] rounded-t-[28px] md:rounded-2xl border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative bg-[#121215]"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Swipe indicator handle for mobile */}
                <div className="w-full h-4 flex items-center justify-center md:hidden shrink-0 cursor-grab active:cursor-grabbing relative z-50">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Unified Window Top Header Bar (Mythic Tools Style) */}
                <div className="h-11 sm:h-12 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between bg-[#16161a] shrink-0 z-30">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-5 h-5 rounded-full bg-white/10 p-0.5 flex items-center justify-center border border-white/10 shrink-0">
                            <img
                                src={`/logos/tcg/${details?.game || initialData?.game || 'MTG'}.png`}
                                alt={details?.game || initialData?.game || 'TCG'}
                                className="w-3.5 h-3.5 object-contain"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                        </div>
                        <h2 className="text-xs sm:text-sm font-semibold text-white truncate font-sans">
                            {details?.name || 'Cargando...'}
                        </h2>
                        {details?.set && (
                            <span className="hidden sm:inline text-xs text-neutral-500 font-normal truncate max-w-[260px]">
                                — {details.set}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-white/10 active:scale-95 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Main Body (Split into Left and Right Panels) */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
                    {details?.is_accessory ? (
                        /* ────────────────────────────────────────
                           ACCESSORY LAYOUT — clean product view
                        ──────────────────────────────────────── */
                        <div className="flex flex-col md:flex-row w-full h-full">
                            {/* Image */}
                            <div className="w-full md:w-[380px] bg-[#0c0c0c] flex items-center justify-center p-8 border-r border-white/5 shrink-0 min-h-[300px] md:min-h-0">
                                {loading && !currentImage ? (
                                    <div className="w-48 h-48 rounded-2xl bg-white/5 animate-pulse" />
                                ) : (
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute inset-0 bg-geeko-cyan/10 blur-[80px] rounded-full pointer-events-none" />
                                        <CardImage
                                            src={currentImage}
                                            alt={details?.name || 'Card Image'}
                                            size="normal"
                                            objectFit="contain"
                                            fallbackIconSize={60}
                                            className="max-w-[280px] max-h-[280px] object-contain relative z-10 drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 bg-[#050505] p-6 md:p-10 flex flex-col justify-between gap-6 overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="space-y-6 animate-pulse">
                                        <div className="h-10 w-3/4 bg-white/5 rounded-xl" />
                                        <div className="h-4 w-1/3 bg-white/5 rounded" />
                                        <div className="h-32 bg-white/5 rounded-2xl" />
                                        <div className="h-14 bg-white/5 rounded-xl" />
                                    </div>
                                ) : details ? (
                                    <>
                                        {/* Name + Category */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-geeko-cyan/70">
                                                {details.set || 'Accesorio'}
                                            </span>
                                            <h2 className="text-2xl md:text-4xl font-web-titles font-normal tracking-tight text-white leading-tight capitalize">
                                                {details.name}
                                            </h2>
                                        </div>

                                        {/* Stock badge */}
                                        <div className="flex items-center gap-3">
                                            {(activeVersion?.stock ?? details.total_stock ?? 0) > 0 ? (
                                                <span className="text-xs font-black text-geeko-green bg-geeko-green/10 px-4 py-1.5 rounded-full border border-geeko-green/20 uppercase tracking-widest">
                                                    ✓ En Stock — {activeVersion?.stock ?? details.total_stock} disponibles
                                                </span>
                                            ) : (
                                                <span className="text-xs font-black text-orange-400 bg-orange-500/10 px-4 py-1.5 rounded-full border border-orange-500/20 uppercase tracking-widest">
                                                    Por Encargo
                                                </span>
                                            )}
                                        </div>

                                        {/* Oracle / Description */}
                                        {details.oracle_text && (
                                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-sm text-neutral-300 leading-relaxed">
                                                {details.oracle_text}
                                            </div>
                                        )}

                                        {/* Price + CTA */}
                                        <div className="space-y-3">
                                            <div className="p-5 rounded-2xl bg-gradient-to-br from-geeko-cyan/10 via-transparent to-transparent border border-white/10 flex items-center justify-between">
                                                <div>
                                                    <div className="text-[10px] font-semibold uppercase text-geeko-cyan tracking-widest mb-1">Precio</div>
                                                    <div className="text-4xl font-titles font-medium text-white tracking-tighter">
                                                        ${(activeVersion?.price || details.price || 0) > 0
                                                            ? (activeVersion?.price || details.price).toFixed(2)
                                                            : '---'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] text-neutral-600 uppercase tracking-widest">Unidad</div>
                                                    <div className="text-2xl text-neutral-500">×1</div>
                                                </div>
                                            </div>

                                            {!isArchive && (
                                                <button
                                                    onClick={handleAddToCart}
                                                    disabled={isAdding}
                                                    data-testid="add-to-cart-button"
                                                    className={`w-full h-14 rounded-xl font-web-titles font-normal text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 ${
                                                        addedSuccess
                                                            ? 'bg-geeko-green text-black shadow-[0_0_20px_rgba(0,255,133,0.4)]'
                                                            : 'bg-geeko-cyan text-black shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)]'
                                                    }`}
                                                >
                                                    {isAdding ? <Loader2 size={18} className="animate-spin" /> : addedSuccess ? '¡Añadido! ✓' : <ShoppingCart size={18} fill="currentColor" />}
                                                    {!isAdding && !addedSuccess && ((activeVersion?.stock || 0) > 0 ? 'Agregar al Carrito' : 'Pedir por Encargo')}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ) : (
                        /* ────────────────────────────────────────
                           CARD LAYOUT (Mythic Tools Style)
                        ──────────────────────────────────────── */
                        <>
                            {/* LEFT: IMAGE, ACTIONS & COMPARISON */}
                            <div className="w-full md:w-[340px] lg:w-[370px] bg-[#0e0e11] flex flex-col border-b md:border-b-0 md:border-r border-white/10 shrink-0 overflow-hidden h-auto md:h-full">
                                <div className="min-h-[220px] md:min-h-[280px] relative flex flex-col items-center justify-center p-4 bg-gradient-to-b from-white/[0.03] to-transparent shrink-0">
                                    {loading && !currentImage ? (
                                        <div className="w-[170px] xs:w-[190px] sm:w-[220px] md:w-[230px] aspect-[5/7] rounded-xl bg-white/5 border border-white/10 animate-pulse flex flex-col items-center justify-center gap-2.5 shadow-2xl">
                                            <Loader2 size={28} className="text-geeko-cyan animate-spin" />
                                            <span className="text-[10px] sm:text-xs font-black text-geeko-cyan uppercase tracking-widest animate-pulse">Cargando Información...</span>
                                        </div>
                                    ) : (
                                        <div className="relative w-[170px] xs:w-[190px] sm:w-[220px] md:w-[230px] aspect-[5/7] flex items-center justify-center group/card my-auto">
                                            <div className="absolute inset-0 bg-geeko-cyan/20 blur-[70px] rounded-full opacity-40 animate-pulse pointer-events-none" />
                                            <div
                                                onClick={() => setIsZoomed(true)}
                                                className={`relative w-full h-full flex items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] cursor-zoom-in ${selectedFinish === 'foil' ? 'holo-effect' : ''}`}
                                            >
                                                {selectedFinish === 'foil' && (
                                                    <div className="absolute inset-0 z-20 foil-shimmer opacity-30 mix-blend-overlay pointer-events-none rounded-[10%] scale-[0.95]" />
                                                )}
                                                <CardImage
                                                    src={currentImage}
                                                    alt={details?.name || 'Card Image'}
                                                    size="normal"
                                                    objectFit="contain"
                                                    fallbackIconSize={80}
                                                    className="w-full h-full object-contain rounded-xl relative z-10 transition-transform duration-300 hover:scale-[1.02]"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons Toolbar (Mythic Tools Style) */}
                                    <div className="flex items-center justify-center gap-2.5 pt-3 w-full border-t border-white/5 mt-3 shrink-0">
                                        <button
                                            onClick={() => setIsZoomed(true)}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-sm"
                                            title="Ampliar Arte"
                                        >
                                            <Maximize2 size={13} />
                                        </button>
                                        {externalMarket && (
                                            <a
                                                href={externalMarket.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-sm"
                                                title={`Ver en ${externalMarket.label}`}
                                            >
                                                <ExternalLink size={13} />
                                            </a>
                                        )}
                                        <button
                                            onClick={handleCopyName}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-sm"
                                            title="Copiar Nombre"
                                        >
                                            {copied ? <Check size={13} className="text-geeko-green" /> : <Copy size={13} />}
                                        </button>
                                        <button
                                            onClick={handleShare}
                                            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-sm"
                                            title="Compartir Carta"
                                        >
                                            {shared ? <Check size={13} className="text-geeko-green" /> : <Share2 size={13} />}
                                        </button>
                                        {hasMultipleFaces && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setCurrentFaceIndex(prev => (prev + 1) % 2); }}
                                                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all shadow-sm"
                                                title="Girar Carta DFC"
                                            >
                                                <RotateCw size={13} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Compact Marketplace Price Comparison Bar */}
                                    <div className="flex items-center justify-around w-full py-1.5 px-3 bg-[#0a0a0d] rounded-xl border border-white/5 mt-2 text-center shrink-0">
                                        <div>
                                            <div className="text-[8px] uppercase tracking-wider text-geeko-cyan font-semibold">Geekorium</div>
                                            <div className="text-xs font-bold text-white font-mono">
                                                ${(activeVersion?.price || details?.price || 0) > 0 ? ((activeVersion?.price || details?.price || 0)).toFixed(2) : '---'}
                                            </div>
                                        </div>
                                        {marketPrice > 0 && (
                                            <>
                                                <div className="h-5 w-px bg-white/10" />
                                                <div>
                                                    <div className="text-[8px] uppercase tracking-wider text-neutral-500 font-semibold truncate max-w-[90px]">
                                                        {externalMarket?.label?.replace('Comprar @ ', '').replace('Ver en ', '') || 'Mercado'}
                                                    </div>
                                                    <div className="text-xs font-bold text-neutral-300 font-mono">
                                                        ${Number(marketPrice).toFixed(2)}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Versions list (Desktop only) */}
                                <div className="hidden md:flex h-auto md:flex-1 md:min-h-0 border-t border-white/5 bg-[#09090c] flex-col shrink-0 overflow-hidden">
                                    {renderVersionsContent()}
                                </div>
                            </div> {/* end card left column */}

                            {/* RIGHT: CARD TEXT, P/T, LEGALITIES & ACTIONS */}
                            <div className="flex-1 h-auto md:h-full md:min-h-0 md:overflow-y-auto custom-scrollbar bg-[#121215] p-5 sm:p-7 space-y-4 flex flex-col">
                                {loading && !details ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[350px] space-y-4">
                                        <Loader2 size={36} className="text-geeko-cyan animate-spin" />
                                        <p className="text-sm font-black text-geeko-cyan uppercase tracking-widest animate-pulse">Cargando Información...</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 animate-in fade-in">
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                        </div>
                                        <h3 className="text-xl font-black text-red-500 uppercase tracking-widest">Error Loading Card</h3>
                                        <p className="text-sm text-neutral-400 font-medium max-w-xs mx-auto">{error}</p>
                                        <button
                                            onClick={() => activePrintingId && loadCardDetails(activePrintingId)}
                                            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white font-bold text-xs uppercase tracking-widest transition-all border border-white/5 hover:border-white/20 mt-4"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                ) : details ? (
                                    <>
                                        {/* 1. Header: Name + Mana Cost + Copy */}
                                        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/5 pb-2.5">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans truncate">
                                                    {details.name}
                                                </h1>
                                                <button
                                                    onClick={handleCopyName}
                                                    className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/5 transition-all shrink-0"
                                                    title="Copiar nombre"
                                                >
                                                    {copied ? <Check size={14} className="text-geeko-green" /> : <Copy size={14} />}
                                                </button>
                                            </div>
                                            {details.mana_cost && (
                                                <div className="text-base sm:text-lg shrink-0">
                                                    <ManaText text={details.mana_cost} />
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. Type line + Specific Attributes */}
                                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-neutral-400 font-medium -mt-1.5 flex-wrap">
                                            <span>{details.type}</span>
                                            {tcgConfig.specificAttributes && tcgConfig.specificAttributes.length > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    {tcgConfig.specificAttributes.map(attr => {
                                                        const attrsObj = (details as any).tcg_specific_attributes || {};
                                                        const val = attrsObj[attr.key] ?? (details as any)[attr.key];
                                                        if (val === undefined || val === null || val === '') return null;
                                                        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
                                                        return (
                                                            <span key={attr.key} className={`text-[10px] px-2 py-0.5 rounded border font-bold ${attr.badgeBg || 'bg-white/5 border-white/10'} ${attr.badgeTextColor || 'text-white'}`}>
                                                                {attr.label}: {displayVal}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. Commercial Buy Bar (Geekorium Price & Add to Cart) */}
                                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-white/[0.04] to-transparent border border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-wider text-geeko-cyan font-bold">Precio</div>
                                                    <div className="text-xl sm:text-2xl font-bold text-white font-mono leading-none">
                                                        ${(activeVersion?.price || details.price || 0) > 0 ? (activeVersion?.price || details.price).toFixed(2) : '---'}
                                                    </div>
                                                </div>
                                                {/* Finish Toggle */}
                                                {(activeGroup?.normal || activeGroup?.foil) && (
                                                    <div className="flex bg-black/50 p-0.5 rounded-lg border border-white/10 gap-1">
                                                        {activeGroup?.normal && (
                                                            <button
                                                                onClick={() => {
                                                                    const targetId = activeGroup?.normal?.printing_id;
                                                                    if (targetId) handleVersionClick(targetId, 'nonfoil');
                                                                }}
                                                                className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                                                                    selectedFinish === 'nonfoil'
                                                                        ? 'bg-white text-black shadow-sm'
                                                                        : 'text-neutral-400 hover:text-white'
                                                                }`}
                                                            >
                                                                Normal
                                                            </button>
                                                        )}
                                                        {activeGroup?.foil && (
                                                            <button
                                                                onClick={() => {
                                                                    const targetId = activeGroup?.foil?.printing_id;
                                                                    if (targetId) handleVersionClick(targetId, 'foil');
                                                                }}
                                                                className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                                                                    selectedFinish === 'foil'
                                                                        ? 'bg-gradient-to-r from-pink-500 to-cyan-500 text-white shadow-sm'
                                                                        : 'text-neutral-400 hover:text-white'
                                                                }`}
                                                            >
                                                                Foil
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="hidden sm:block">
                                                    {(activeVersion?.stock ?? details.total_stock ?? 0) > 0 ? (
                                                        <span className="text-[9px] font-black text-geeko-green bg-geeko-green/10 px-2 py-0.5 rounded-full border border-geeko-green/20 uppercase tracking-tight">
                                                            En Stock ({activeVersion?.stock ?? details.total_stock})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-bold text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded-full border border-white/5 uppercase tracking-tight">
                                                            Por Encargo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!isArchive && (
                                                <button
                                                    onClick={handleAddToCart}
                                                    disabled={isAdding}
                                                    data-testid="add-to-cart-button"
                                                    className={`px-5 h-9 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shrink-0 ${
                                                        addedSuccess
                                                            ? 'bg-geeko-green text-black shadow-[0_0_20px_rgba(0,255,133,0.4)]'
                                                            : 'bg-geeko-cyan text-black shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)]'
                                                    }`}
                                                >
                                                    {isAdding ? <Loader2 size={14} className="animate-spin" /> : addedSuccess ? '¡Añadido! ✓' : <ShoppingCart size={14} fill="currentColor" />}
                                                    {!isAdding && !addedSuccess && ((activeVersion?.stock || 0) > 0 ? 'Agregar al Carrito' : 'Por encargo')}
                                                </button>
                                            )}
                                        </div>

                                        {/* 4. Oracle / Rules Text */}
                                        {details.oracle_text && (
                                            <div className="p-3.5 sm:p-4 rounded-xl bg-black/25 border border-white/5 text-xs sm:text-sm text-neutral-200 leading-relaxed space-y-2">
                                                {renderOracleText(details.oracle_text)}
                                                {details.flavor_text && (
                                                    <p className="text-[11px] italic text-neutral-500 border-t border-white/5 pt-2">
                                                        "{details.flavor_text}"
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* 5. Power / Toughness (Prominent P/T display) */}
                                        {((details.power !== undefined && details.power !== null && details.power !== '') || (details.toughness !== undefined && details.toughness !== null && details.toughness !== '')) && (
                                            <div className="flex items-center justify-end">
                                                <div className="text-base sm:text-lg font-bold text-white font-mono px-3 py-0.5 rounded-lg bg-white/5 border border-white/10 tracking-wider">
                                                    {details.power ?? '?'}/{details.toughness ?? '?'}
                                                </div>
                                            </div>
                                        )}

                                        {/* 6. Set & Metadata Line */}
                                        <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
                                            {details.set_code && (
                                                <span className="font-mono text-white/70 uppercase font-bold">{details.set_code}</span>
                                            )}
                                            {details.set && (
                                                <span className="text-neutral-300 truncate">{details.set}</span>
                                            )}
                                            {details.collector_number && (
                                                <span className="text-neutral-500">#{details.collector_number}</span>
                                            )}
                                            {details.rarity && (
                                                <span className={`capitalize font-bold ${getRarityColor(details.rarity)}`}>
                                                    {details.rarity}
                                                </span>
                                            )}
                                        </div>

                                        {/* 7. Keyword Chips */}
                                        {extractedKeywords.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                {extractedKeywords.map(kw => (
                                                    <span
                                                        key={kw}
                                                        className="px-2.5 py-1 rounded-lg bg-[#18181c] border border-white/5 text-[11px] text-neutral-300 font-medium hover:border-white/20 transition-all cursor-default"
                                                    >
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* 8. LEGALITIES (Mythic Tools 2-Column Grid) */}
                                        {!details?.is_accessory && (
                                            <div className="space-y-2 pt-1">
                                                <button
                                                    onClick={() => setIsLegalitiesOpen(!isLegalitiesOpen)}
                                                    className="w-full flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
                                                >
                                                    <span>Legalities</span>
                                                    <span className="flex items-center gap-1 text-[10px] text-neutral-500 normal-case">
                                                        {isLegalitiesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </span>
                                                </button>
                                                {isLegalitiesOpen && (
                                                    details.game === 'MTG' ? (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 p-3 rounded-xl bg-black/25 border border-white/5">
                                                            <div className="space-y-1.5">
                                                                {MTG_FORMAT_COLUMNS.left.map(fmt => {
                                                                    const isLegal = details.legalities?.[fmt.key] === 'legal';
                                                                    return (
                                                                        <div key={fmt.key} className="flex items-center gap-2 py-0.5">
                                                                            <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0 min-w-[58px] text-center ${
                                                                                isLegal ? 'bg-[#00c853] text-black shadow-sm' : 'bg-[#252528] text-[#8e8e93]'
                                                                            }`}>
                                                                                {isLegal ? 'LEGAL' : 'NOT LEGAL'}
                                                                            </span>
                                                                            <span className="text-xs text-neutral-300 font-medium truncate">
                                                                                {fmt.label}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                {MTG_FORMAT_COLUMNS.right.map(fmt => {
                                                                    const isLegal = details.legalities?.[fmt.key] === 'legal';
                                                                    return (
                                                                        <div key={fmt.key} className="flex items-center gap-2 py-0.5">
                                                                            <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0 min-w-[58px] text-center ${
                                                                                isLegal ? 'bg-[#00c853] text-black shadow-sm' : 'bg-[#252528] text-[#8e8e93]'
                                                                            }`}>
                                                                                {isLegal ? 'LEGAL' : 'NOT LEGAL'}
                                                                            </span>
                                                                            <span className="text-xs text-neutral-300 font-medium truncate">
                                                                                {fmt.label}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ) : relevantFormats.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-black/25 border border-white/5">
                                                            {relevantFormats.map(fmt => {
                                                                const isLegal = details.legalities?.[fmt] === 'legal';
                                                                return (
                                                                    <div key={fmt} className="flex items-center gap-1.5">
                                                                        <span className={`text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shrink-0 ${
                                                                            isLegal ? 'bg-[#00c853] text-black shadow-sm' : 'bg-[#252528] text-[#8e8e93]'
                                                                        }`}>
                                                                            {isLegal ? 'LEGAL' : 'NOT LEGAL'}
                                                                        </span>
                                                                        <span className="text-xs text-neutral-300 font-medium capitalize">
                                                                            {fmt.replace('_', ' ')}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : null
                                                )}
                                            </div>
                                        )}

                                        {/* 9. VERSIONS LIST (MOBILE ONLY - AT BOTTOM OF FLOW) */}
                                        <div className="md:hidden border-t border-white/5 bg-[#09090c] -mx-5 -mb-5 pt-1 rounded-b-2xl overflow-hidden">
                                            {renderVersionsContent()}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Lightbox / Zoom Overlay */}
            {isZoomed && (
                <div
                    className="fixed inset-0 z-[350] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                    onClick={() => setIsZoomed(false)}
                >
                    <div className="relative max-w-sm sm:max-w-md w-full flex flex-col items-center">
                        <button
                            onClick={() => setIsZoomed(false)}
                            className="absolute -top-10 right-0 p-2 text-neutral-400 hover:text-white"
                            aria-label="Cerrar zoom"
                        >
                            <X size={22} />
                        </button>
                        <img
                            src={currentImage}
                            alt={details?.name || 'Card Image'}
                            className="max-h-[82vh] w-auto object-contain rounded-2xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
                        />
                    </div>
                </div>
            )}
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
