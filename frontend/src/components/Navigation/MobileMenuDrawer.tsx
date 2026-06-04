import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MobileMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<any[]>([]);

    const tcgGames = [
        { name: 'Magic', code: 'MTG', icon: '/logos/tcg/MTG.png' },
        { name: 'Pokémon', code: 'PKM', icon: '/logos/tcg/PKM.png' },
        { name: 'Yu-Gi-Oh!', code: 'YGO', icon: '/logos/tcg/YGO.png' },
        { name: 'Riftbound', code: 'RFB', icon: '/logos/tcg/RFB.png' },
        { name: 'One Piece', code: 'OPC', icon: '/logos/tcg/OPC.png' },
        { name: 'Digimon', code: 'DGM', icon: '/logos/tcg/DGM.png' },
        { name: 'Gundam', code: 'GND', icon: '/logos/tcg/GND.png' },
        { name: 'Flesh and Blood', code: 'FAB', icon: '/logos/tcg/FAB.png' },
        { name: 'Otros', code: 'OTHERS', icon: '/logos/tcg/OTHERS.png' }
    ];

    useEffect(() => {
        if (!isOpen) return;
        const loadCategories = async () => {
            const { fetchAccessoryCategories } = await import('../../utils/api');
            const cats = await fetchAccessoryCategories('ACCESSORIES');
            setCategories(cats || []);
        };
        loadCategories();
    }, [isOpen]);

    const navigateToGame = (gameCode: string) => {
        const tab = gameCode === 'MTG' ? 'marketplace' : 'catalog';
        navigate(`/?game=${gameCode}&tab=${tab}`);
        onClose();
    };

    const navigateToCategory = (catCode: string) => {
        navigate(`/?tab=catalog&category=${catCode}`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] overflow-hidden lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="absolute bottom-0 left-0 w-full bg-[#0a0a0a] rounded-t-3xl border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col pb-safe">
                {/* Header */}
                <div className="px-6 py-4 flex flex-col items-center sticky top-0 bg-[#0a0a0a] rounded-t-3xl z-10 border-b border-white/5">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full mb-4" />
                    <div className="w-full flex items-center justify-between">
                        <h2 className="text-lg font-black tracking-tight uppercase">Menú</h2>
                        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-text-low">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar pb-10">
                    <div className="space-y-8">
                        {/* TCG Sections */}
                        <div>
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] mb-4">TCG Catalog</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {tcgGames.map(game => (
                                    <button 
                                        key={game.code}
                                        onClick={() => navigateToGame(game.code)}
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 text-left transition-all active:scale-95 hover:bg-white/10"
                                    >
                                        <img src={game.icon} alt={game.name} className="w-10 h-10 object-contain" />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{game.name}</span>
                                            <span className="text-[10px] text-text-low uppercase tracking-widest">
                                                {game.code === 'MTG' ? 'Ver Stock' : 'Ver Catálogo'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accessories */}
                        <div>
                            <h3 className="text-[10px] font-black text-text-low uppercase tracking-[0.2em] mb-4">Productos & Accesorios</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {categories.map(cat => (
                                    <button 
                                        key={cat.code} 
                                        onClick={() => navigateToCategory(cat.code)}
                                        className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <span className="text-2xl">{cat.icon}</span>
                                        <span className="text-[10px] font-bold text-white text-center uppercase tracking-tighter">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
