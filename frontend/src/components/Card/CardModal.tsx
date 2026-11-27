import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../../utils/api';
import { CardDetailBlocks } from './CardDetailBlocks';
import { useSeoMeta, buildCardProductSeo } from '../../hooks/useSeoMeta';



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
}

export const CardModal: React.FC<CardModalProps> = ({ isOpen, onClose, cardId, initialImage, initialData, onAddToCartSuccess, isArchive }) => {
    const [details, setDetails] = useState<CardDetails | null>(initialData || null);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [addedSuccess, setAddedSuccess] = useState(false);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
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

    const handleSelectVersion = (id: string, finish?: 'nonfoil' | 'foil' | 'etched') => {
        const cleanId = id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
        const existsInLoaded = versionGroups.some((g: any) =>
            [g.normal, g.foil, g.etched, g.base].some(
                (v: any) => v && (v.printing_id === id || v.printing_id?.replace(/-(foil|nonfoil|etched)$/, '') === cleanId)
            )
        );

        if (existsInLoaded) {
            setActivePrintingId(id);
            if (finish) {
                setSelectedFinish(finish);
            }
            setCurrentFaceIndex(0);
            return;
        }

        // Fallback reload only if target printing isn't in loaded versions
        setActivePrintingId(id);
        if (finish) setSelectedFinish(finish);
        loadCardDetails(id, true, finish);
    };

    const handleAddToCart = async (quantity: number = 1) => {
        if (!activePrintingId) return;

        setIsAdding(true);
        try {
            // Use the real printing_id (strip any synthetic suffix before calling RPC)
            const baseId = activePrintingId.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
            const result = await addToCart(baseId, Math.max(1, quantity), selectedFinish, !!details?.is_accessory);
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

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const versionGroups = useMemo(() => {
        if (!details?.all_versions) return [];

        const groups = (Array.isArray(details.all_versions) ? details.all_versions : []).reduce((acc: any, v: any) => {
            const key = `${v.set_code || 'unk'}-${v.collector_number || Math.random()}`;
            if (!acc[key]) {
                const isNormal = !(v.is_foil || v.finish === 'foil' || v.finish === 'etched');
                acc[key] = {
                    base: v,
                    normal: isNormal ? v : null,
                    foil: (v.is_foil || v.finish === 'foil') ? v : null,
                    etched: v.finish === 'etched' ? v : null,
                    totalStock: 0,
                };
            } else {
                if (!(v.is_foil || v.finish === 'foil' || v.finish === 'etched')) acc[key].normal = v;
                else if (v.finish === 'etched') acc[key].etched = v;
                else acc[key].foil = v;
            }
            return acc;
        }, {} as Record<string, any>);

        Object.values(groups).forEach((g: any) => {
            g.base = g.normal || g.foil || g.etched || g.base;
            g.totalStock = (g.normal?.stock || 0) + (g.foil?.stock || 0) + (g.etched?.stock || 0);
        });

        return Object.values(groups).sort((a: any, b: any) => {
            const aAvail = a.totalStock > 0 ? 1 : 0;
            const bAvail = b.totalStock > 0 ? 1 : 0;
            if (bAvail !== aAvail) return bAvail - aAvail;
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
    const currentImage = hasMultipleFaces
        ? ((currentFace as any)?.image_url || (currentFace as any)?.image_uris?.normal || (currentFace as any)?.image_uris?.large || (currentFace as any)?.image_uris?.png || details?.image_url || initialImage || (initialData as any)?.image_url || '')
        : (activeVersion?.image_url || details?.image_url || initialImage || (initialData as any)?.image_url || '');

    const modalSeoConfig = useMemo(() => {
        if (!isOpen || !details?.name) return null;
        const modalPrice = Number(activeVersion?.price ?? details.price ?? 0);
        const modalStock = Number(activeVersion?.stock ?? details.total_stock ?? 0);
        const modalId = activePrintingId
            ? `${activePrintingId}-${selectedFinish}`
            : (cardId || details.card_id);
        return buildCardProductSeo({
            id: modalId,
            name: details.name,
            setName: activeVersion?.set_name || details.set,
            setCode: activeVersion?.set_code || details.set_code,
            price: modalPrice,
            stock: modalStock,
            imageUrl: currentImage,
            finish: selectedFinish,
            game: details.game,
            rarity: details.rarity,
            isAccessory: details.is_accessory,
        });
    }, [isOpen, details, activeVersion, activePrintingId, selectedFinish, cardId, currentImage]);

    useSeoMeta(modalSeoConfig);

    if (!isOpen) return null;

    const modalNode = (
        <div
            className="fixed inset-0 z-[300] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-6 animate-in fade-in duration-200 overflow-hidden"
            onClick={handleBackdropClick}
        >
            {/* Modal Content — 3 Equal-Size Blocks */}
            <div
                data-testid="card-modal"
                role="dialog"
                aria-modal="true"
                className="w-full max-w-6xl h-[94vh] md:h-[620px] max-h-[94vh] rounded-t-[28px] md:rounded-[28px] border border-white/15 shadow-[0_0_100px_rgba(0,0,0,0.85)] flex flex-col overflow-y-auto md:overflow-hidden relative bg-[#090c11]"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Sticky Header for mobile */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#090c11]/95 backdrop-blur-md sticky top-0 z-50 md:hidden shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-3">
                        <div className="w-5 h-5 rounded-full bg-white/10 p-0.5 flex items-center justify-center border border-white/10 shrink-0">
                            <img
                                src={`/logos/tcg/${details?.game || initialData?.game || 'MTG'}.png`}
                                alt={details?.game || initialData?.game || 'TCG'}
                                className="w-3.5 h-3.5 object-contain"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                        </div>
                        <h2 className="text-sm font-black italic text-white truncate">{details?.name || 'Cargando...'}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 rounded-lg transition-all text-red-400"
                        aria-label="Cerrar"
                    >
                        <X size={18} />
                    </button>
                </div>

                <CardDetailBlocks
                    details={details}
                    loading={loading}
                    error={error}
                    onRetry={() => activePrintingId && loadCardDetails(activePrintingId)}
                    onClose={onClose}
                    activePrintingId={activePrintingId}
                    selectedFinish={selectedFinish}
                    activeGroup={activeGroup}
                    activeVersion={activeVersion}
                    versionGroups={versionGroups}
                    currentImage={currentImage}
                    hasMultipleFaces={hasMultipleFaces}
                    onFlipFace={() => setCurrentFaceIndex(prev => (prev + 1) % 2)}
                    onSelectVersion={handleSelectVersion}
                    onAddToCart={handleAddToCart}
                    isAdding={isAdding}
                    addedSuccess={addedSuccess}
                    isArchive={isArchive}
                    isDetailsLoaded={!loading}
                />
            </div>
        </div>
    );

    return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
