import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import {
    X, ShoppingCart, RotateCw, ExternalLink, Loader2,
    ArrowLeft, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getCardKingdomUrl } from '../utils/urlUtils';
import { fetchCardDetails, addToCart } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Navigation/Header';
import { useCart } from '../context/CartContext';
import { ManaText } from '../components/Mana/ManaText';
import { Footer } from '../components/Navigation/Footer';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { CardImage } from '../components/Card/CardImage';

export const CardDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, openAuthModal } = useAuth();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const initialImage = location.state?.initialImage as string | undefined;
    const initialCard = location.state?.initialCard as any;
    const baseId = id ? id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '') : undefined;
    const urlSuffix = id ? (id.endsWith('-foil') ? 'foil' : id.endsWith('-etched') ? 'etched' : id.endsWith('-nonfoil') ? 'nonfoil' : null) : null;
    const activeFinish = searchParams.get('finish') || urlSuffix || 'nonfoil';

    // Build initial placeholder data from the Home page card data
    const getInitialDetails = () => {
        if (!initialCard) return null;
        return {
            printing_id: baseId || initialCard.card_id,
            card_id: baseId || initialCard.card_id,
            name: initialCard.name,
            set: initialCard.set,
            set_code: initialCard.set_code || '',
            image_url: initialCard.image_url || initialImage,
            price: initialCard.price,
            original_price: initialCard.original_price,
            discount_percentage: initialCard.discount_percentage,
            rarity: initialCard.rarity,
            type: initialCard.type,
            finish: initialCard.finish,
            is_foil: initialCard.is_foil,
            total_stock: initialCard.total_stock || initialCard.stock || 0,
            valuation: initialCard.valuation || { market_price: initialCard.price },
            all_versions: [] // Start empty, will be populated by fetchCardDetails
        };
    };

    const [details, setDetails] = useState<any>(getInitialDetails());
    const [loading, setLoading] = useState(!initialCard);
    const [error, setError] = useState<string | null>(null);
    const [activePrintingId, setActivePrintingId] = useState<string | undefined>(baseId);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [isAdding, setIsAdding] = useState(false);

    const { cartCount } = useCart();
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        if (id) {
            const cleanId = id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
            setActivePrintingId(cleanId);
            loadDetails(id);
        }
    }, [id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                navigate(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    const loadDetails = async (printingId: string) => {
        if (!details) setLoading(true);
        setError(null);
        try {
            const data = await fetchCardDetails(printingId);
            setDetails(data);
        } catch (err) {
            console.error('Error loading card details:', err);
            setError('Failed to load card details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVersionClick = (printingId: string, finish?: string) => {
        const params = new URLSearchParams();
        if (finish && finish !== 'nonfoil') {
            params.set('finish', finish);
        }
        const search = params.toString();
        navigate(`/card/${printingId}${search ? `?${search}` : ''}`);
    };

    const handleAddToCart = async () => {
        if (!user) {
            openAuthModal();
            return;
        }
        if (!activeVersion) return;

        setIsAdding(true);
        try {
            // Strip synthetic suffix from id, pass finish explicitly
            const baseId = activeVersion.printing_id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
            const result = await addToCart(baseId, 1, activeFinish, !!details?.is_accessory);

            if (result && !result.success) {
                console.error("ADD TO CART FAILED:", result);
                alert(`Error al agregar al carrito: ${result.message || result.error || JSON.stringify(result)}`);
                return;
            }

            // Show success
            setIsCartOpen(true);
        } catch (err: any) {
            console.error('Error adding to cart:', err);
            alert(err.message || 'Error al agregar al carrito');
        } finally {
            setIsAdding(false);
        }
    };


    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const getLegalityIcon = (status: string) => {
        switch (status) {
            case 'legal': return <CheckCircle2 size={16} className="text-geeko-cyan" />;
            case 'not_legal': return <X size={16} className="text-neutral-700" />;
            case 'restricted': return <AlertCircle size={16} className="text-amber-500" />;
            case 'banned': return <AlertCircle size={16} className="text-red-500" />;
            default: return <X size={16} className="text-neutral-700" />;
        }
    };

    const relevantFormats = ['standard', 'pioneer', 'modern', 'legacy', 'commander', 'pauper'];

    const allImages = useMemo(() => {
        const list: string[] = [];
        let mainImg = details?.image_url;
        if (details?.card_faces && details.card_faces.length > 0) {
            const face = details.card_faces[currentFaceIndex];
            if (face?.image_uris) {
                mainImg = face.image_uris.normal || face.image_uris.large || face.image_uris.png;
            }
        }
        if (mainImg) list.push(mainImg);

        if (details?.additional_images && details.additional_images.length > 0) {
            details.additional_images.forEach((img: string) => {
                if (img && !list.includes(img)) list.push(img);
            });
        }
        return list;
    }, [details?.card_faces, currentFaceIndex, details?.image_url, details?.additional_images]);

    const currentImage = allImages[currentImageIndex] || allImages[0] || '';

    const versionGroups = useMemo(() => {
        if (!details?.all_versions) return [];

        const groups = (Array.isArray(details.all_versions) ? details.all_versions : []).reduce((acc: any, v: any) => {
            const key = `${v.set_code}-${v.collector_number}`;
            if (!acc[key]) {
                acc[key] = {
                    base: v,
                    normal: !(v.is_foil || v.finish === 'foil') ? v : null,
                    foil: (v.is_foil || v.finish === 'foil') ? v : null,
                };
            } else {
                if (!(v.is_foil || v.finish === 'foil')) acc[key].normal = v;
                else acc[key].foil = v;
            }
            return acc;
        }, {} as Record<string, any>);

        return Object.values(groups).sort((a: any, b: any) => {
            return a.base.set_name.localeCompare(b.base.set_name);
        });
    }, [details?.all_versions]);

    const activeGroup = useMemo<any>(() => {
        return versionGroups.find((g: any) => g.normal?.printing_id === activePrintingId || g.foil?.printing_id === activePrintingId);
    }, [versionGroups, activePrintingId]);

    const activeVersion = useMemo(() => {
        if (!activeGroup) return null;
        // Use activeFinish from URL searchParams
        const reqFinish = activeFinish || 'nonfoil';
        if (reqFinish === 'foil' && activeGroup.foil) return activeGroup.foil;
        if (reqFinish === 'etched' && activeGroup.etched) return activeGroup.etched;
        // Fallback to whichever is available in the group
        return activeGroup.normal || activeGroup.foil || activeGroup.etched || activeGroup.base;
    }, [activeGroup, activeFinish]);

    const isFoil = activeVersion ? (activeVersion.is_foil || activeVersion.finish === 'foil') : !!(details?.is_foil || details?.finish === 'foil');

    const ckUrl = useMemo(() => {
        if (!details) return '#';
        return getCardKingdomUrl(details.name, isFoil);
    }, [details?.name, isFoil]);

    const hasMultipleFaces = details?.card_faces && details.card_faces.length > 1;

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-red-500 mb-6" />
                <h1 className="text-3xl font-black mb-4">Error loading card</h1>
                <p className="text-text-low max-w-md mb-8">{error}</p>
                <Link to="/" className="px-8 py-3 bg-geeko-cyan rounded-full font-black text-black hover:scale-105 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0, 209, 255, 0.3)]">
                    <ArrowLeft size={18} /> Back to Market
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#050505] text-white font-sans selection:bg-geeko-cyan/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-geeko-cyan/5 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />

            <main className="relative z-10 w-full max-w-[1600px] mx-auto p-4 lg:p-8 flex-1 flex flex-col items-center">
                {loading && !details ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        {initialImage ? (
                            <img src={initialImage} alt="Loading..." className="w-[300px] rounded-xl object-contain opacity-50 blur-sm animate-pulse mb-4" />
                        ) : (
                            <Loader2 size={48} className="text-geeko-cyan animate-spin mb-4" />
                        )}
                        <p className="text-text-low font-bold tracking-widest uppercase text-xs">Loading Card Data...</p>
                    </div>
                ) : details ? (
                    <div data-testid="card-modal" className="w-full glass-panel rounded-[32px] border border-white/10 shadow-[0_0_100px_rgba(0, 209, 255, 0.15)] flex flex-col lg:flex-row overflow-hidden lg:min-h-[calc(100vh-220px)] relative">
                        {/* LEFT: IMAGE & VERSIONS LIST */}
                        <div className="w-full lg:w-[340px] bg-[#0c0c0c] flex flex-col lg:border-r border-b lg:border-b-0 border-white/5 shrink-0 relative">
                            <div className="flex-1 min-h-[350px] lg:min-h-[250px] p-6 sm:p-8 md:p-10 relative bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden">
                                <div className={`absolute inset-6 sm:inset-8 md:inset-10 flex items-center justify-center ${isFoil ? 'holo-effect' : ''} group`}>
                                    <div className="absolute inset-0 bg-geeko-cyan/25 blur-[120px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-700 animate-pulse pointer-events-none" />
                                    {isFoil && (
                                        <div className="absolute inset-0 z-20 foil-shimmer opacity-30 mix-blend-overlay pointer-events-none rounded-[10%] scale-[0.95]" />
                                    )}
                                    <CardImage
                                        src={currentImage}
                                        alt={details.name}
                                        size="normal"
                                        objectFit="contain"
                                        placeholderSrc={initialImage}
                                        className="drop-shadow-[0_45px_100px_rgba(0,0,0,0.95)] z-10 hover:scale-[1.03] transition-all duration-700 !bg-transparent"
                                    />
                                </div>
                                
                                {/* Carousel Navigation */}
                                {!hasMultipleFaces && allImages.length > 1 && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 bg-black/60 px-4 py-2 rounded-full border border-white/10 shadow-xl backdrop-blur-md">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setCurrentImageIndex((prev) => prev === 0 ? allImages.length - 1 : prev - 1);
                                            }}
                                            className="text-white hover:text-geeko-cyan transition-colors"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        <div className="flex gap-2">
                                            {allImages.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentImageIndex(idx);
                                                    }}
                                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-geeko-cyan shadow-[0_0_8px_rgba(0,209,255,0.8)] scale-125' : 'bg-white/30 hover:bg-white/60'}`}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
                                            }}
                                            className="text-white hover:text-geeko-cyan transition-colors"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}

                                {hasMultipleFaces && (
                                    <button
                                        onClick={() => setCurrentFaceIndex(prev => (prev + 1) % 2)}
                                        className="absolute bottom-6 right-6 p-4 bg-black/80 hover:bg-geeko-cyan text-white hover:text-black rounded-full border border-white/20 transition-all z-20 group shadow-2xl backdrop-blur-md"
                                    >
                                        <RotateCw size={22} className="group-hover:rotate-180 transition-transform duration-500" />
                                    </button>
                                )}
                            </div>

                            {/* MOXFIELD-STYLE VERSIONS LIST */}
                            {!details?.is_accessory && (
                                <div className="min-h-[150px] max-h-[250px] border-t border-white/5 bg-[#080808] flex flex-col shrink-0 overflow-hidden rounded-bl-[32px]">
                                    <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-text-low">Edition / Printings</h3>
                                        <span className="text-[10px] text-text-low font-bold">{details.all_versions?.length || 0} Versions</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                                    {versionGroups.length > 0 ? (
                                        versionGroups.map((group: any) => {
                                            const isGroupActive = activePrintingId === group.base.printing_id;
                                            const rowActiveVersion = (activeFinish === 'foil' && group.foil) ? group.foil : (group.normal || group.base);

                                            return (
                                                <div
                                                    key={`${group.base.set_code}-${group.base.collector_number}`}
                                                    data-testid="edition-link"
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
                                                    className={`w-full flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 px-6 py-4 hover:bg-white/10 transition-colors border-b border-white/5 group text-left cursor-pointer outline-none focus-visible:bg-white/10 ${isGroupActive ? 'bg-geeko-cyan/10' : ''}`}
                                                >
                                                    <div className="flex items-center gap-3 md:gap-4 flex-1">
                                                        <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-[10px] font-black group-hover:text-geeko-cyan transition-colors shrink-0">
                                                            {group.base.set_code?.toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 text-left min-w-[120px]">
                                                            <div className={`text-xs font-bold font-web-titles tracking-tight leading-tight truncate ${isGroupActive ? 'text-geeko-cyan' : 'text-text-low'}`}>
                                                                {group.base.set_name}
                                                            </div>
                                                            <div className="text-[10px] text-text-low font-bold flex items-center gap-2">
                                                                <span>#{group.base.collector_number} • {group.base.rarity}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                                                        <div className="flex flex-col items-end gap-1">
                                                            {group.normal && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-text-low font-bold uppercase tracking-widest leading-none">Normal</span>
                                                                     <span className={`text-[11px] font-black ${group.normal.stock > 0 ? 'text-white' : 'text-neutral-600'}`}>
                                                                        {group.normal.discount_percentage > 0 && (
                                                                            <span className="text-[9px] text-text-low line-through mr-1.5 opacity-60">
                                                                                ${Number(group.normal.original_price).toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                        ${group.normal.price.toFixed(2)}
                                                                        {group.normal.discount_percentage > 0 && (
                                                                            <span className="ml-1.5 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-black rounded border border-purple-500/20">
                                                                                -{group.normal.discount_percentage}%
                                                                            </span>
                                                                        )}
                                                                        {group.normal.stock <= 0 && <span className="ml-1.5 text-[9px] text-orange-500/80 italic font-medium">(P/E)</span>}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {group.foil && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1 leading-none">
                                                                        <svg width="8" height="8" viewBox="0 0 10 12" fill="none">
                                                                            <rect x="0.5" y="0.5" width="9" height="11" rx="1.5" stroke="currentColor" strokeWidth="1" />
                                                                            <path d="M2 3 L8 3" stroke="currentColor" strokeWidth="1" />
                                                                        </svg>
                                                                        Foil
                                                                    </span>
                                                                    <span className={`text-[11px] font-black ${group.foil.stock > 0 ? 'text-geeko-cyan' : 'text-neutral-600'}`}>
                                                                        {group.foil.discount_percentage > 0 && (
                                                                            <span className="text-[9px] text-text-low line-through mr-1.5 opacity-60">
                                                                                ${Number(group.foil.original_price).toFixed(2)}
                                                                            </span>
                                                                        )}
                                                                        ${group.foil.price.toFixed(2)}
                                                                        {group.foil.discount_percentage > 0 && (
                                                                            <span className="ml-1.5 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-black rounded border border-purple-500/20">
                                                                                -{group.foil.discount_percentage}%
                                                                            </span>
                                                                        )}
                                                                        {group.foil.stock <= 0 && <span className="ml-1.5 text-[9px] text-orange-500/80 italic font-medium">(P/E)</span>}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-4">
                                                            {rowActiveVersion?.stock > 0 ? (
                                                                <span className="text-[9px] font-black text-geeko-cyan bg-geeko-cyan/10 px-2 py-0.5 rounded-full border border-geeko-cyan/20 uppercase tracking-tight">
                                                                    En Stock
                                                                </span>
                                                            ) : (
                                                                <span className="text-[9px] font-bold text-text-low bg-neutral-900 px-2 py-0.5 rounded-full border border-white/5 uppercase tracking-tight">
                                                                    Por Encargo
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="px-6 py-8 text-center">
                                            <p className="text-sm text-text-low font-bold">⚠️ No hay versiones disponibles en inventario</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            )}
                        </div>

                        {/* RIGHT: CARD TEXT & ACTIONS */}
                        <div className="flex-1 lg:overflow-y-auto lg:max-h-[calc(100vh-140px)] custom-scrollbar bg-[#050505] p-6 lg:p-12 space-y-8 lg:space-y-10 relative">
                            <button
                                onClick={() => navigate(-1)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-neutral-900/80 hover:bg-white/10 text-text-low hover:text-white transition-colors z-50 border border-white/10"
                                aria-label="Cerrar modal"
                            >
                                <X size={20} />
                            </button>
                            <div className="space-y-4">
                                <a
                                    href={`card/${activePrintingId}`}
                                    onClick={(e) => {
                                        if (!e.ctrlKey && !e.metaKey) e.preventDefault();
                                    }}
                                    className="block group/title"
                                >
                                    <div className="flex flex-col gap-2">
                                        {(details.name?.toLowerCase().includes('(preventa)') || details.is_presale) && (
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 bg-geeko-cyan/20 text-geeko-cyan text-[10px] font-black rounded-lg border border-geeko-cyan/30 shadow-[0_0_15px_rgba(0,209,255,0.2)] animate-pulse uppercase tracking-[0.2em]">
                                                    Preventa
                                                </div>
                                            </div>
                                        )}
                                        <h2 className="text-3xl lg:text-5xl font-web-titles font-normal tracking-tight text-white group-hover/title:text-geeko-cyan transition-colors text-gradient-cyan capitalize leading-tight">
                                            {details.name?.replace(/\(preventa\)/gi, '').trim()}
                                        </h2>
                                    </div>
                                </a>
                                <div className="flex flex-wrap items-center gap-3 text-base lg:text-lg font-medium text-text-low">
                                    <span><ManaText text={details.mana_cost || ''} /></span>
                                    {details.mana_cost && <span className="opacity-30">•</span>}
                                    <span className="text-white/80">{details.type}</span>
                                    <span className="text-neutral-700">/</span>
                                    <span className="text-geeko-gold uppercase text-[10px] font-black tracking-[0.2em]">{details.rarity}</span>
                                </div>
                            </div>

                            <div className="p-6 lg:p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-6 relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-geeko-cyan/5 rounded-full blur-[100px] group-hover:bg-geeko-cyan/10 transition-colors" />
                                
                                {details.description && (
                                    <div className="mb-6 p-4 bg-geeko-cyan/5 border border-geeko-cyan/20 rounded-2xl relative z-10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-geeko-cyan mb-2">Descripción del Producto</h4>
                                        <p className="text-sm text-neutral-300 leading-relaxed">
                                            {details.description}
                                        </p>
                                    </div>
                                )}

                                <div className="text-base lg:text-lg leading-relaxed text-neutral-200 font-medium relative z-10">
                                    {details.oracle_text?.split('\n').map((line: string, i: number) => <p key={i} className="mb-3"><ManaText text={line} /></p>)}
                                </div>
                                {details.flavor_text && (
                                    <p className="text-md italic text-text-low font-serif border-t border-white/10 pt-6 relative z-10">
                                        "{details.flavor_text}"
                                    </p>
                                )}
                                <div className="pt-2 flex flex-wrap gap-8 text-[10px] font-black text-text-low uppercase tracking-[0.2em]">
                                    <div>Artist <span className="text-white ml-2">{details.artist}</span></div>
                                    <div>Set <span className="text-geeko-cyan ml-2">{details.set} ({details.set_code?.toUpperCase()})</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                {/* Marketplace */}
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-low pl-2">Trading Hub</h3>

                                    <div className="p-6 lg:p-8 rounded-[32px] bg-gradient-to-br from-geeko-cyan/10 via-transparent to-transparent border border-white/10 group relative overflow-hidden hover:border-geeko-cyan/30 transition-colors">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-geeko-cyan/5 rounded-full blur-[50px]" />
                                        <div className="text-[9px] font-black uppercase text-geeko-cyan tracking-[0.2em] mb-4">Internal Store Price</div>
                                        <div className="flex flex-col gap-6">
                                            {/* Price + Variant Badge (horizontal layout matching CardModal) */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    {activeVersion?.discount_percentage > 0 && (
                                                        <span className="text-xs font-bold text-text-low line-through">
                                                            ${Number(activeVersion.original_price).toFixed(2)}
                                                        </span>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-4xl lg:text-5xl font-black text-white font-mono tracking-tighter leading-none">
                                                            ${(activeVersion?.price || details.price || 0) > 0 ? Number(activeVersion?.price || details.price).toFixed(2) : '---'}
                                                        </div>
                                                        {activeVersion?.discount_percentage > 0 && (
                                                            <div className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-black rounded-lg border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse">
                                                                -{activeVersion.discount_percentage}%
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`text-[9px] px-3 py-1 rounded-full font-black tracking-[0.2em] shadow-sm ${activeFinish === 'foil' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-white animate-pulse' : 'bg-white text-black'}`}>
                                                    {activeFinish === 'foil' ? 'FOIL' : 'NONFOIL'}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Finish Toggle */}
                                                <div className="flex bg-neutral-900/80 p-1 rounded-xl border border-white/5 w-fit">
                                                    {activeGroup?.normal && (
                                                        <button
                                                            onClick={() => {
                                                                const targetId = activeGroup?.normal?.printing_id;
                                                                if (targetId) handleVersionClick(targetId, 'nonfoil');
                                                            }}
                                                            className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeFinish !== 'foil'
                                                                ? 'bg-white text-black shadow-lg scale-[1.05]'
                                                                : (activeGroup.normal?.stock || 0) === 0
                                                                    ? 'text-text-low opacity-60'
                                                                    : 'text-text-low hover:text-white'
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
                                                            className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${activeFinish === 'foil'
                                                                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 border-transparent text-white shadow-[0_0_15px_rgba(236,72,153,0.3)] scale-[1.05]'
                                                                : (activeGroup.foil?.stock || 0) === 0
                                                                    ? 'text-text-low opacity-60'
                                                                    : 'text-text-low hover:text-white'
                                                                }`}
                                                        >
                                                            Foil
                                                        </button>
                                                    )}
                                                </div>

                                                <button
                                                    data-testid="add-to-cart-button"
                                                    onClick={handleAddToCart}
                                                    disabled={isAdding}
                                                    className="flex-1 h-12 rounded-xl bg-geeko-cyan text-black font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0, 209, 255, 0.3)] hover:shadow-[0_0_30px_rgba(0, 209, 255, 0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} fill="currentColor" />}
                                                    {isAdding ? '...' : ((activeVersion?.stock || 0) > 0 ? 'Agregar' : 'Encargo')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {!details?.is_accessory && (
                                        <a
                                            href={ckUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-between p-6 rounded-2xl bg-neutral-900/30 hover:bg-geeko-cyan/5 border border-white/5 hover:border-geeko-cyan/30 transition-all group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black uppercase text-text-low tracking-[0.2em] mb-1">Market Price</span>
                                                <span className="text-lg font-bold">Standard @ CK</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-mono font-black text-white">$ {details.valuation?.market_price ? Number(details.valuation?.market_price).toFixed(2) : '---'}</span>
                                                <div className="p-2 rounded-full bg-white/5 group-hover:bg-geeko-cyan group-hover:text-black transition-colors">
                                                    <ExternalLink size={14} />
                                                </div>
                                            </div>
                                        </a>
                                    )}
                                </div>

                                {/* Legality */}
                                {!details?.is_accessory && (
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-low pl-2">Format Legality</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {relevantFormats.map(fmt => (
                                                <div key={fmt} className="flex items-center justify-between p-4 rounded-xl bg-neutral-900/30 border border-white/5 hover:border-white/10 transition-colors">
                                                    <span className="text-[9px] font-black text-text-low uppercase tracking-widest">{fmt}</span>
                                                    <div className="scale-110">
                                                        {getLegalityIcon(details.legalities?.[fmt] || 'not_legal')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            <Footer />

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default CardDetail;
