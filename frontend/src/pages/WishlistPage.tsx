import React, { useState } from 'react';
import { Header } from '../components/Navigation/Header';
import { Footer } from '../components/Navigation/Footer';
import { CartDrawer } from '../components/Navigation/CartDrawer';
import { Search, Sparkles, MessageCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { WISHLIST_DATA, type WishlistItem } from './wishlist_data';

export const WishlistPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGame, setSelectedGame] = useState<string>('ALL');
    const [isCartOpen, setIsCartOpen] = useState(false);
    const cartCount = 0;

    const filteredItems = WISHLIST_DATA.filter(item => {
        const matchesSearch = item.card_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (item.deck_category && item.deck_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (item.type && item.type.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesGame = selectedGame === 'ALL' || item.game_code === selectedGame;
        return matchesSearch && matchesGame;
    });

    const handleOfferClick = (item: WishlistItem) => {
        const phone = '584242507802';
        const text = encodeURIComponent(
            `¡Hola Geekorium! Vi en su lista "Geeko Buscamos" que están buscando: *${item.card_name}* (${item.game}) [Cant: ${item.quantity_needed}]. Tengo copias disponibles. ¿Podemos acordar la entrega/compra?`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-geeko-cyan selection:text-black">
            <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />

            {/* Hero Banner Header */}
            <div className="relative overflow-hidden bg-gradient-to-b from-purple-950/40 via-slate-950 to-slate-950 border-b border-white/10 py-12 md:py-16">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-widest mb-4">
                                <Sparkles size={14} className="text-purple-400" />
                                Lista Oficial de Compras de la Tienda
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                                Geeko <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-geeko-cyan">Buscamos</span>
                            </h1>
                            <p className="text-neutral-400 text-sm md:text-base mt-2 max-w-2xl font-medium leading-relaxed">
                                Estas son las cartas que Geekorium está buscando activamente para su inventario. ¡Trae tus cartas a la tienda o escríbenos para vendérnoslas o cambiarlas por crédito de tienda!
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex items-center gap-4 backdrop-blur-md">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 flex-shrink-0">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-white uppercase tracking-wider">¿Tienes alguna de estas cartas?</h3>
                                <p className="text-xs text-neutral-400 mt-0.5">Haz clic en "Tengo esta carta" para escribirnos directamente por WhatsApp.</p>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters Bar */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar por carta, edición o código..."
                                className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        {/* Game Filter */}
                        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                            {[
                                { code: 'ALL', label: 'Todas' },
                                { code: 'MTG', label: 'Magic' },
                                { code: 'PKM', label: 'Pokémon' },
                                { code: 'OPC', label: 'One Piece' },
                            ].map((g) => (
                                <button
                                    key={g.code}
                                    onClick={() => setSelectedGame(g.code)}
                                    className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                        selectedGame === g.code
                                            ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                                            : 'bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Grid Section */}
            <div className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
                        <AlertCircle className="mx-auto text-neutral-500 mb-3" size={40} />
                        <h3 className="text-lg font-bold text-white">No encontramos coincidencias</h3>
                        <p className="text-neutral-400 text-sm mt-1">Prueba buscando con otro término o seleccionando otro juego.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredItems.map((item) => (
                            <div
                                key={item.id}
                                className="group relative bg-[#0f1117] border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 flex flex-col justify-between hover:shadow-[0_10px_30px_rgba(147,51,234,0.15)]"
                            >
                                {/* Priority Badge */}
                                <div className="absolute top-3 left-3 z-10">
                                    {item.priority === 'HIGH' && (
                                        <span className="px-2.5 py-1 rounded-lg bg-red-500/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
                                            Alta Prioridad
                                        </span>
                                    )}
                                </div>

                                <div>
                                    {/* Card Image Container */}
                                    <div className="relative aspect-[3/4] overflow-hidden bg-black/40 p-4 flex items-center justify-center">
                                        <img
                                            src={item.image_url}
                                            alt={item.card_name}
                                            className="h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>

                                    {/* Card Info */}
                                    <div className="p-5 space-y-3">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                                                {item.game} {item.deck_category ? `• ${item.deck_category}` : ''}
                                            </div>
                                            <h3 className="text-base font-black text-white group-hover:text-purple-300 transition-colors line-clamp-1 mt-0.5">
                                                {item.card_name}
                                            </h3>
                                            <p className="text-xs text-neutral-400 font-medium line-clamp-1">
                                                {item.type || 'Carta'} {item.color ? `(${item.color})` : ''}
                                            </p>
                                        </div>

                                        {/* Requirements Pill */}
                                        <div className="bg-white/5 rounded-xl p-3 border border-white/5 space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-neutral-400 font-medium">Cantidad necesitada:</span>
                                                <span className="font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md text-xs">{item.quantity_needed} copias</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs pt-1 border-t border-white/5">
                                                <span className="text-neutral-400 font-medium">Estado requerido:</span>
                                                <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md text-[11px]">{item.condition_needed}</span>
                                            </div>
                                        </div>

                                        {item.notes && (
                                            <p className="text-[11px] text-neutral-500 italic">
                                                * {item.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="p-5 pt-0">
                                    <button
                                        onClick={() => handleOfferClick(item)}
                                        className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-950/40 transition-all transform active:scale-95 group/btn"
                                    >
                                        <MessageCircle size={16} />
                                        Tengo esta carta
                                        <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            <Footer />
        </div>
    );
};

export default WishlistPage;
