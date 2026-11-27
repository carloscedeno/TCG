import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { fetchCardDetails, addToCart } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Navigation/Header';
import { useCart } from '../context/CartContext';
import { Footer } from '../components/Navigation/Footer';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { CardDetailBlocks } from '../components/Card/CardDetailBlocks';
import { useSeoMeta, buildCardProductSeo } from '../hooks/useSeoMeta';

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
            set: initialCard.set_name || initialCard.set,
            set_code: initialCard.set_code || '',
            game_id: initialCard.game_id,
            game: initialCard.game || (() => {
                const gid = initialCard.game_id;
                const GAME_MAP: Record<number, string> = { 16: 'RFB', 17: 'GND', 18: 'DGM', 22: 'MTG', 23: 'PKM', 13: 'OPC', 25: 'FAB', 12: 'LOR', 26: 'YGO', 27: 'WXS' };
                return (gid && GAME_MAP[gid]) || undefined;
            })(),
            tcg_specific_attributes: initialCard.tcg_specific_attributes,
            external_id: initialCard.external_id || initialCard.tcgplayer_id,
            tcgplayer_id: initialCard.tcgplayer_id,
            image_url: initialCard.image_url || initialImage,
            price: initialCard.price,
            original_price: initialCard.original_price,
            discount_percentage: initialCard.discount_percentage,
            rarity: initialCard.rarity,
            type: initialCard.type || initialCard.type_line,
            finish: initialCard.finish,
            is_foil: initialCard.is_foil,
            total_stock: initialCard.total_stock || initialCard.stock || 0,
            valuation: initialCard.valuation || { market_price: initialCard.price },
            all_versions: [], // Start empty, will be populated by fetchCardDetails
            card_faces: initialCard.card_faces
        };
    };

    const [details, setDetails] = useState<any>(getInitialDetails());
    const [isDetailsLoaded, setIsDetailsLoaded] = useState(false);
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
        setIsDetailsLoaded(false);
        if (!details) setLoading(true);
        setError(null);
        try {
            const data = await fetchCardDetails(printingId);
            setDetails(data);
            setIsDetailsLoaded(true);
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

    const handleAddToCart = async (quantity: number = 1) => {
        if (!user) {
            openAuthModal();
            return;
        }
        if (!activeVersion) return;

        setIsAdding(true);
        try {
            // Strip synthetic suffix from id, pass finish explicitly
            const baseId = activeVersion.printing_id.replace(/-foil$/, '').replace(/-nonfoil$/, '').replace(/-etched$/, '');
            const result = await addToCart(baseId, Math.max(1, quantity), activeFinish, !!details?.is_accessory);

            if (result && !result.success) {
                console.error("ADD TO CART FAILED:", result);
                return;
            }

            // Show success
            setIsCartOpen(true);
        } catch (err: any) {
            console.error('Error adding to cart:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const isDFC = details?.name?.includes(' // ');
    const hasMultipleFaces = !!(details?.card_faces && details.card_faces.length > 1);

    const versionGroups = useMemo(() => {
        if (!details?.all_versions) return [];

        const inStockVersions = (Array.isArray(details.all_versions) ? details.all_versions : []).filter(
            (v: any) => details?.is_accessory || (v.stock || 0) > 0
        );

        const groups = inStockVersions.reduce((acc: any, rawV: any) => {
            const setCode = rawV.set_code || details?.set_code || '??';
            const setName = rawV.set_name || details?.set || 'Unknown Set';
            const v = {
                ...rawV,
                set_code: setCode,
                set_name: setName
            };
            const key = `${setCode}-${v.collector_number || v.printing_id}`;

            if (!acc[key]) {
                const isEtched = v.finish === 'etched';
                const isFoilVer = !isEtched && (v.is_foil || v.finish === 'foil');
                acc[key] = {
                    base: v,
                    normal: !isFoilVer && !isEtched ? v : null,
                    foil: isFoilVer ? v : null,
                    etched: isEtched ? v : null,
                    totalStock: 0,
                };
            } else {
                if (v.finish === 'etched') acc[key].etched = v;
                else if (v.is_foil || v.finish === 'foil') acc[key].foil = v;
                else acc[key].normal = v;
                if (acc[key].base.set_name === 'Unknown Set' && v.set_name !== 'Unknown Set') {
                    acc[key].base = v;
                }
            }
            return acc;
        }, {} as Record<string, any>);

        Object.values(groups).forEach((g: any) => {
            g.base = g.normal || g.foil || g.etched || g.base;
            g.totalStock = (g.normal?.stock || 0) + (g.foil?.stock || 0) + (g.etched?.stock || 0);
        });

        return Object.values(groups).sort((a: any, b: any) => {
            const bAvail = b.totalStock > 0 ? 1 : 0;
            const aAvail = a.totalStock > 0 ? 1 : 0;
            if (bAvail !== aAvail) return bAvail - aAvail;
            return (a.base?.set_name || '').localeCompare(b.base?.set_name || '');
        });
    }, [details?.all_versions, details?.set, details?.set_code, details?.is_accessory]);

    const activeGroup = useMemo<any>(() => {
        return versionGroups.find((g: any) => g.normal?.printing_id === activePrintingId || g.foil?.printing_id === activePrintingId || g.etched?.printing_id === activePrintingId);
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

    const allImages = useMemo(() => {
        const list: string[] = [];
        let mainImg = activeVersion?.image_url || details?.image_url;
        if (details?.card_faces && details.card_faces.length > 0) {
            const face = details.card_faces[currentFaceIndex];
            mainImg = face?.image_uris?.normal || face?.image_uris?.large || face?.image_uris?.png || face?.image_url || mainImg;
        } else if (isDFC && currentFaceIndex === 1 && mainImg) {
            if (mainImg.includes('/front/')) mainImg = mainImg.replace('/front/', '/back/');
            else if (mainImg.includes('.jpg')) mainImg = mainImg.replace('.jpg', '_back.jpg');
            else if (mainImg.includes('.png')) mainImg = mainImg.replace('.png', '_back.png');
        }

        if (mainImg) list.push(mainImg);

        if (details?.additional_images && details.additional_images.length > 0) {
            details.additional_images.forEach((img: string) => {
                if (img && !list.includes(img)) list.push(img);
            });
        }
        return list;
    }, [details?.card_faces, currentFaceIndex, activeVersion?.image_url, details?.image_url, details?.additional_images, isDFC]);

    const currentImage = allImages[0] || '';

    const isFoil = activeVersion ? (activeVersion.is_foil || activeVersion.finish === 'foil') : !!(details?.is_foil || details?.finish === 'foil');
    const currentStock = (activeVersion?.stock ?? details?.stock ?? details?.total_stock ?? 0);

    const cardSeoConfig = useMemo(() => {
        if (!details?.name) return null;
        return buildCardProductSeo({
            id: id || details.printing_id || details.card_id,
            name: details.name,
            setName: activeVersion?.set_name || details.set,
            setCode: activeVersion?.set_code || details.set_code,
            price: Number(activeVersion?.price ?? details.price ?? 0),
            stock: Number(currentStock) || 0,
            imageUrl: currentImage || details.image_url,
            finish: isFoil ? 'foil' : activeFinish,
            game: details.game,
            rarity: details.rarity,
            isAccessory: details.is_accessory,
        });
    }, [details, id, activeVersion, currentStock, currentImage, isFoil, activeFinish]);

    useSeoMeta(cardSeoConfig);

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-[#050505] text-black dark:text-white flex flex-col items-center justify-center p-6 text-center">
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
        <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-geeko-cyan/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-geeko-cyan/5 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />

            <main className="relative z-10 w-full max-w-[1600px] mx-auto p-4 lg:p-8 flex-1 flex flex-col items-center">
                {loading && !details ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                        {initialImage ? (
                            <img src={initialImage} alt="Cargando..." className="w-[260px] rounded-xl object-contain opacity-50 blur-sm animate-pulse mb-2" />
                        ) : null}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-geeko-cyan/15 border border-geeko-cyan/40 text-geeko-cyan text-sm font-black uppercase tracking-wider animate-pulse">
                            <Loader2 size={18} className="animate-spin text-geeko-cyan" />
                            <span>Cargando Información...</span>
                        </div>
                    </div>
                ) : details ? (
                    <div data-testid="card-modal" className="w-full max-w-[460px] md:max-w-5xl rounded-[24px] md:rounded-[28px] border border-white/15 shadow-[0_0_100px_rgba(0,0,0,0.45)] overflow-hidden h-auto relative bg-[#090c11]">
                        <CardDetailBlocks
                            details={details}
                            loading={loading}
                            error={error}
                            onRetry={() => id && loadDetails(id)}
                            onClose={() => navigate(-1)}
                            activePrintingId={activePrintingId}
                            selectedFinish={(activeFinish === 'foil' || activeFinish === 'etched' ? activeFinish : 'nonfoil') as 'nonfoil' | 'foil' | 'etched'}
                            activeGroup={activeGroup}
                            activeVersion={activeVersion}
                            versionGroups={versionGroups}
                            currentImage={currentImage}
                            allImages={allImages}
                            hasMultipleFaces={hasMultipleFaces}
                            onFlipFace={() => setCurrentFaceIndex(prev => (prev + 1) % 2)}
                            onSelectVersion={handleVersionClick}
                            onAddToCart={handleAddToCart}
                            isAdding={isAdding}
                            addedSuccess={false}
                            isDetailsLoaded={isDetailsLoaded}
                            showDesktopClose={true}
                        />
                    </div>
                ) : null}
            </main>

            <Footer />

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default CardDetail;
