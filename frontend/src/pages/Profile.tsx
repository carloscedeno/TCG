import React, { useEffect, useState } from 'react';
import PlayerCard from '../components/Profile/PlayerCard';
import { useAuth } from '../context/AuthContext';
import { Settings } from 'lucide-react';

import OrdersList from '../components/Profile/OrdersList';
import { ProfileSettingsModal } from '../components/Profile/ProfileSettingsModal';
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
