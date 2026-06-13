import React, { useEffect, useState } from 'react';
import PlayerCard from '../components/Profile/PlayerCard';
import { useAuth } from '../context/AuthContext';
import { Settings } from 'lucide-react';

import OrdersList from '../components/Profile/OrdersList';
import { CreditHistoryList } from '../components/Profile/CreditHistoryList';
import { ProfileSettingsModal } from '../components/Profile/ProfileSettingsModal';
import { AddressBook } from '../components/Profile/AddressBook';
import { PlayerRankingsList } from '../components/Profile/PlayerRankingsList';
import { supabase } from '../utils/supabaseClient';
import { useCart } from '../context/CartContext';
import { Header } from '../components/Navigation/Header';
import { CartDrawer } from '../components/Navigation/CartDrawer';

const ProfilePage: React.FC = () => {
    const { session, user } = useAuth();
    const { cartCount } = useCart();
    const [profileData, setProfileData] = useState<any>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const loadProfileData = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (!error && data) {
            setProfileData(data);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, [user]);



    // Stats will be derived from backend in the future
    const userStats: any[] = [];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-purple-500/30 overflow-hidden">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[180px] animate-pulse" style={{ animationDuration: '15s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            {/* Header */}
            <Header onCartOpen={() => setIsCartOpen(true)} cartCount={cartCount} />

            <div className="relative z-10 py-12 px-4">
                <div className="max-w-6xl mx-auto space-y-12">
                    <header className="text-center space-y-4">
                        <h2 className="text-sm font-black text-geeko-gold uppercase tracking-[0.3em]">Comunidad Geekorium</h2>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">
                            Perfil de <span className="text-white">Vanguardia</span>
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-geeko-red to-white mx-auto rounded-full"></div>
                    </header>

                    <section className="relative group">
                        <PlayerCard
                            username={profileData?.username || session?.user?.email?.split('@')[0] || "CYBER_WIZARD"}
                            fullName={profileData?.first_name ? `${profileData.first_name} ${profileData?.last_name || ''}`.trim() : undefined}
                            title="Elite Member • Geekorium Vanguard"
                            avatarUrl={profileData?.avatar_url}
                            stats={userStats}
                        />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => setIsSettingsOpen(true)}
                                className="px-4 py-2 bg-neutral-900 border border-geeko-cyan/30 rounded-xl text-xs font-bold text-geeko-cyan hover:bg-geeko-cyan/10 hover:border-geeko-cyan/50 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(0,209,255,0.15)]"
                            >
                                <Settings size={14} />
                                <span className="uppercase tracking-widest hidden md:inline">Ajustes de Perfil</span>
                            </button>
                        </div>
                    </section>

                    {/* Player IDs Grid */}
                    {(profileData?.wizards_email || profileData?.pokemon_id || profileData?.bandai_id) && (
                        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-bottom-8 duration-700">
                            {profileData?.wizards_email && (
                                <div className="p-4 bg-neutral-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Wizards Account Email</p>
                                        <p className="text-xs font-black text-white truncate max-w-[180px]">{profileData.wizards_email}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black uppercase tracking-widest">MTG</span>
                                </div>
                            )}
                            {profileData?.pokemon_id && (
                                <div className="p-4 bg-neutral-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Play! Pokémon ID</p>
                                        <p className="text-xs font-black text-white">{profileData.pokemon_id}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black uppercase tracking-widest">POKÉMON</span>
                                </div>
                            )}
                            {profileData?.bandai_id && (
                                <div className="p-4 bg-neutral-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Bandai TCG+ ID</p>
                                        <p className="text-xs font-black text-white">{profileData.bandai_id}</p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black uppercase tracking-widest">BANDAI</span>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Military Rankings Section */}
                    <section className="animate-in slide-in-from-bottom-8 duration-700 delay-50">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                                Expediente <span className="text-[#4B6EEB]">Militar</span>
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-[#4B6EEB]/50 to-transparent"></div>
                        </div>
                        <PlayerRankingsList userId={user?.id || ''} username={profileData?.username || ''} />
                    </section>

                    {/* Geek Credits Section */}
                    <section className="animate-in slide-in-from-bottom-8 duration-700 delay-75">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                                Créditos <span className="text-geeko-gold">Geek</span>
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-geeko-gold/50 to-transparent"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <div className="bg-gradient-to-br from-geeko-gold/20 to-orange-600/10 border border-geeko-gold/30 rounded-[2rem] p-8 text-center backdrop-blur-md shadow-[0_0_30px_rgba(255,184,0,0.15)] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-geeko-gold/5 opacity-20 mix-blend-overlay"></div>
                                    <h3 className="text-geeko-gold text-xs font-black uppercase tracking-[0.3em] mb-2 relative z-10">Saldo Actual</h3>
                                    <div className="text-6xl font-black text-white italic tracking-tighter relative z-10">
                                        {profileData?.geek_credits || 0} <span className="text-geeko-gold text-3xl">CG</span>
                                    </div>
                                    <p className="text-slate-400 text-xs mt-4 uppercase tracking-widest font-bold relative z-10">Disponibles</p>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-6 backdrop-blur-md h-full">
                                    <h3 className="text-white text-sm font-black uppercase tracking-[0.2em] mb-6">Historial de Movimientos</h3>
                                    <CreditHistoryList />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Address Book Section */}
                    <section className="animate-in slide-in-from-bottom-8 duration-700 delay-75">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                                Libreta de <span className="text-geeko-gold">Direcciones</span>
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-geeko-gold/50 to-transparent"></div>
                        </div>
                        <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-8 backdrop-blur-md">
                            <AddressBook />
                        </div>
                    </section>

                    {/* Orders Section */}
                    <section className="animate-in slide-in-from-bottom-8 duration-700 delay-100">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                                Mis <span className="text-geeko-gold">Pedidos</span>
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </div>

                        <OrdersList />
                    </section>



                    <footer className="pt-12 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                        Geekorium TCG & RPG Ecosystem • 2026
                    </footer>
                </div>
            </div>

            <ProfileSettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
                currentProfile={profileData}
                onProfileUpdated={loadProfileData}
            />

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </div>
    );
};

export default ProfilePage;
