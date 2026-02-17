import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    X, ShoppingCart, RotateCw, ExternalLink, Loader2,
    ArrowLeft, CheckCircle2, AlertCircle
} from 'lucide-react';
import { fetchCardDetails, addToCart } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { UserMenu } from '../components/Navigation/UserMenu';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { AuthModal } from '../components/Auth/AuthModal';
import { ManaText } from '../components/Mana/ManaText';
import { Footer } from '../components/Navigation/Footer';

export const CardDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [details, setDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activePrintingId, setActivePrintingId] = useState<string | undefined>(id);
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            setActivePrintingId(id);
            loadDetails(id);
        }
    }, [id]);

    const loadDetails = async (printingId: string) => {
        setLoading(true);
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

    const handleVersionClick = (printingId: string) => {
        if (printingId !== activePrintingId) {
            navigate(`/card/${printingId}`);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            setIsAuthModalOpen(true);
            return;
        }
        if (!details) return;

        setIsAdding(true);
        try {
            await addToCart(details.card_id, 1);
            // Show success (maybe a toast or open cart)
            setIsCartOpen(true);
        } catch (err) {
            console.error('Error adding to cart:', err);
        } finally {
            setIsAdding(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const getLegalityIcon = (status: string) => {
        switch (status) {
            case 'legal': return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'not_legal': return <X size={16} className="text-neutral-700" />;
            case 'restricted': return <AlertCircle size={16} className="text-amber-500" />;
            case 'banned': return <AlertCircle size={16} className="text-red-500" />;
            default: return <X size={16} className="text-neutral-700" />;
        }
    };

    const relevantFormats = ['standard', 'pioneer', 'modern', 'legacy', 'commander', 'pauper'];

    const currentImage = (() => {
        if (details?.card_faces && details.card_faces.length > 0) {
            const face = details.card_faces[currentFaceIndex];
            if (face?.image_uris) {
                return face.image_uris.normal || face.image_uris.large || face.image_uris.png;
            }
        }
        return details?.image_url;
    })();

    const hasMultipleFaces = details?.card_faces && details.card_faces.length > 1;

    if (error) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle size={64} className="text-red-500 mb-6" />
                <h1 className="text-3xl font-black mb-4">Error loading card</h1>
                <p className="text-neutral-400 max-w-md mb-8">{error}</p>
                <Link to="/" className="px-8 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-500 transition-all flex items-center gap-2">
                    <ArrowLeft size={18} /> Back to Market
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="h-[70px] bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl flex items-center">
                <nav className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between w-full">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">T</div>
                            <h1 className="text-xl font-black tracking-tighter text-white">TCG HUB</h1>
                        </Link>
                        <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-neutral-400">
                            <Link to="/" className="hover:text-white transition-colors flex items-center gap-1">
                                <ArrowLeft size={14} /> Back to Market
                            </Link>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-8 hidden lg:block">
                        <form onSubmit={handleSearch}>
                            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search another card..." />
                        </form>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="relative p-2.5 bg-neutral-900 border border-white/5 rounded-xl hover:bg-neutral-800 transition-all text-neutral-400 hover:text-geeko-cyan group"
                            >
                                <ShoppingCart size={20} />
                                <div className="absolute top-0 right-0 w-2 h-2 bg-geeko-cyan rounded-full border-2 border-[#0a0a0a] group-hover:scale-150 transition-transform" />
                            </button>
                        )}
                        {user ? <UserMenu /> : (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-full shadow-lg shadow-blue-600/20 transition-all text-xs"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </nav>
            </header>

            <main className="relative z-10 max-w-[1600px] mx-auto p-6 lg:p-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-[60vh]">
                        <Loader2 size={48} className="text-geeko-cyan animate-spin mb-4" />
                        <p className="text-neutral-500 font-bold tracking-widest uppercase text-xs">Loading Card Data...</p>
                    </div>
                ) : details ? (
                    <div className="glass-panel rounded-[32px] border border-white/10 shadow-[0_0_100px_rgba(0,163,255,0.15)] flex flex-col md:flex-row overflow-hidden min-h-[80vh]">
                        {/* LEFT: IMAGE & VERSIONS LIST */}
                        <div className="w-full md:w-[520px] bg-[#0c0c0c] flex flex-col border-r border-white/5 overflow-hidden h-full">
                            <div className="flex-1 min-h-[450px] md:min-h-[600px] flex items-center justify-center p-6 sm:p-8 md:p-10 relative bg-gradient-to-b from-white/[0.04] to-transparent overflow-hidden">
                                <div className="relative group w-full h-full flex items-center justify-center">
                                    <div className="absolute inset-0 bg-geeko-cyan/25 blur-[120px] rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-700 animate-pulse pointer-events-none" />
                                    <img
                                        src={currentImage}
                                        alt={details.name}
                                        className="w-full h-full object-contain drop-shadow-[0_45px_100px_rgba(0,0,0,0.95)] z-10 hover:scale-[1.03] transition-all duration-700 foil-shimmer"
                                        style={{
                                            imageRendering: 'auto',
                                        }}
                                    />
                                </div>
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
                            <div className="h-[200px] md:h-[250px] border-t border-white/5 bg-[#080808] flex flex-col shrink-0">
                                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500">Edition / Printings</h3>
                                    <span className="text-[10px] text-neutral-600 font-bold">{details.all_versions?.length || 0} Versions</span>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {details.all_versions && details.all_versions.length > 0 ? (
                                        details.all_versions.map((v: any) => (
                                            <button
                                                key={v.printing_id}
                                                onClick={() => handleVersionClick(v.printing_id)}
                                                className={`w-full flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors border-b border-white/5 group ${activePrintingId === v.printing_id ? 'bg-geeko-cyan/10' : ''}`}
                                            >
                                                <div className="w-8 h-8 rounded bg-neutral-900 flex items-center justify-center text-[10px] font-black group-hover:text-geeko-cyan transition-colors">
                                                    {v.set_code.toUpperCase()}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className={`text-xs font-bold leading-tight ${activePrintingId === v.printing_id ? 'text-geeko-cyan' : 'text-neutral-300'}`}>
                                                        {v.set_name}
                                                    </div>
                                                    <div className="text-[10px] text-neutral-600 font-bold flex items-center gap-2">
                                                        <span>#{v.collector_number} • {v.rarity}</span>
                                                        {v.stock > 0 && (
                                                            <div className="flex items-center gap-1">
                                                                <div className={`w-2 h-2 rounded-full ${v.stock > 10 ? 'bg-green-500' :
                                                                    v.stock > 3 ? 'bg-yellow-500' :
                                                                        'bg-red-500'
                                                                    }`} />
                                                                <span className="text-[8px] font-black text-geeko-cyan uppercase">
                                                                    STOCK: {v.stock}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-xs font-mono font-bold text-neutral-400 group-hover:text-white">
                                                    ${v.price > 0 ? v.price.toFixed(2) : '--'}
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-6 py-8 text-center">
                                            <p className="text-sm text-neutral-500 font-bold">⚠️ No hay versiones disponibles en inventario</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: CARD TEXT & ACTIONS */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050505] p-10 lg:p-16 space-y-12">
                            <div className="space-y-6">
                                <a
                                    href={`card/${activePrintingId}`}
                                    onClick={(e) => {
                                        if (!e.ctrlKey && !e.metaKey) e.preventDefault();
                                    }}
                                    className="block group/title"
                                >
                                    <h2 className="text-6xl lg:text-8xl font-black tracking-tighter text-white group-hover/title:text-geeko-cyan transition-colors text-gradient-cyan">
                                        {details.name}
                                    </h2>
                                </a>
                                <div className="flex flex-wrap items-center gap-4 text-xl lg:text-2xl font-medium text-neutral-400">
                                    <span><ManaText text={details.mana_cost || ''} /></span>
                                    {details.mana_cost && <span>•</span>}
                                    <span>{details.type}</span>
                                    <span className="text-neutral-700">/</span>
                                    <span className="text-geeko-gold uppercase text-sm tracking-widest">{details.rarity}</span>
                                </div>
                            </div>

                            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-8 relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-geeko-cyan/5 rounded-full blur-[100px] group-hover:bg-geeko-cyan/10 transition-colors" />
                                <div className="text-xl lg:text-2xl leading-relaxed text-neutral-200 font-medium relative z-10">
                                    {details.oracle_text?.split('\n').map((line: string, i: number) => <p key={i} className="mb-4"><ManaText text={line} /></p>)}
                                </div>
                                {details.flavor_text && (
                                    <p className="text-lg italic text-neutral-500 font-serif border-t border-white/10 pt-8 relative z-10">
                                        "{details.flavor_text}"
                                    </p>
                                )}
                                <div className="pt-4 flex flex-wrap gap-8 text-sm font-bold text-neutral-400 uppercase tracking-widest">
                                    <div>Artist <span className="text-white ml-2">{details.artist}</span></div>
                                    <div>Set <span className="text-geeko-cyan ml-2">{details.set} ({details.set_code.toUpperCase()})</span></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Marketplace */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 pl-2">Trading Hub</h3>

                                    <div className="p-10 rounded-[40px] bg-gradient-to-br from-geeko-cyan/10 via-transparent to-transparent border border-white/10 group relative overflow-hidden hover:border-geeko-cyan/30 transition-colors">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-geeko-cyan/5 rounded-full blur-[50px]" />
                                        <div className="text-xs font-black uppercase text-geeko-cyan tracking-widest mb-2">Internal Store Price</div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-6xl font-black text-white font-mono tracking-tighter">
                                                ${details.price > 0 ? details.price.toFixed(2) : '---'}
                                            </div>
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={isAdding}
                                                className="h-16 px-10 rounded-2xl bg-geeko-cyan text-black font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_50px_rgba(0,229,255,0.6)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {isAdding ? <Loader2 size={24} className="animate-spin" /> : <ShoppingCart size={24} fill="currentColor" />}
                                                {isAdding ? 'Processing...' : 'Add to Inventory'}
                                            </button>
                                        </div>
                                    </div>

                                    <a
                                        href={details.valuation?.market_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-between p-8 rounded-[32px] bg-neutral-900/50 hover:bg-geeko-cyan/10 border border-white/5 hover:border-geeko-cyan transition-all group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase text-neutral-500 tracking-widest group-hover:text-geeko-cyan transition-colors mb-1">External Market</span>
                                            <span className="text-2xl font-bold">Standard Price @ CK</span>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <span className="text-3xl font-mono font-black text-white">$ {details.valuation?.market_price ? details.valuation?.market_price.toFixed(2) : '---'}</span>
                                            <div className="p-3 rounded-full bg-white/5 group-hover:bg-geeko-cyan group-hover:text-black transition-colors">
                                                <ExternalLink size={20} />
                                            </div>
                                        </div>
                                    </a>
                                </div>

                                {/* Legality */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-neutral-500 pl-2">Format Legality</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {relevantFormats.map(fmt => (
                                            <div key={fmt} className="flex items-center justify-between p-5 rounded-2xl bg-neutral-900/50 border border-white/5 hover:border-white/10 transition-colors">
                                                <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest">{fmt}</span>
                                                <div className="scale-125">
                                                    {getLegalityIcon(details.legalities?.[fmt] || 'not_legal')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            <Footer />

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default CardDetail;
