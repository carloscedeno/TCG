import React, { useEffect, useState } from 'react';
import PlayerCard from '../components/Profile/PlayerCard';
import { PortfolioStats } from '../components/Profile/PortfolioStats';
import { useAuth } from '../context/AuthContext';
import { CollectionService } from '../services/CollectionService';
import type { CollectionItem } from '../services/CollectionService';
import { Loader2 } from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { session } = useAuth();
    const [collection, setCollection] = useState<CollectionItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCollection = async () => {
            if (session?.access_token) {
                setLoading(true);
                try {
                    const data = await CollectionService.getUserCollection(session.access_token);
                    setCollection(data);
                } catch (error) {
                    console.error("Error fetching collection:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchCollection();
    }, [session]);

    // Datos de prueba basados en el manual de Geekorium (Static Context)
    const mockStats = [
        {
            name: "Magic: The Gathering",
            gameCode: "MTG",
            elo: 1420,
            tier: "DIAMOND",
            progress: 92,
            recentDeck: "Dimir Control",
            colorClass: "bg-geeko-red"
        },
        {
            name: "Pokémon TCG",
            gameCode: "POKEMON",
            elo: 1150,
            tier: "PLATINUM",
            progress: 68,
            recentDeck: "Mew VMAX Fusion",
            colorClass: "bg-geeko-blue"
        },
        {
            name: "One Piece TCG",
            gameCode: "ONEPIECE",
            elo: 1310,
            tier: "RUBY",
            progress: 75,
            recentDeck: "Trafalgar Law (R/G)",
            colorClass: "bg-geeko-orange"
        }
    ];

    const mockDndStats = {
        level: 14,
        xp: 8500,
        nextLevelXp: 10000,
        rank: "Master of Dungeons",
        achievements: ["Lorekeeper", "Slayer of Beasts", "World Traveler"]
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-purple-500/30 overflow-hidden">

            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[180px] animate-pulse" style={{ animationDuration: '15s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            <div className="relative z-10 py-12 px-4">
                <div className="max-w-6xl mx-auto space-y-12">
                    <header className="text-center space-y-4">
                        <h2 className="text-sm font-black text-geeko-gold uppercase tracking-[0.3em]">Comunidad Geekorium</h2>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">
                            Perfil de <span className="neon-text-cyan">Vanguardia</span>
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-geeko-red to-geeko-cyan mx-auto rounded-full"></div>
                    </header>

                    <section>
                        <PlayerCard
                            username={session?.user?.email?.split('@')[0] || "CYBER_WIZARD"}
                            title="Elite Member • Geekorium Vanguard"
                            stats={mockStats}
                            dndStats={mockDndStats}
                        />
                    </section>

                    {/* Portfolio Section */}
                    <section className="animate-in slide-in-from-bottom-8 duration-700">
                        <div className="flex items-center gap-4 mb-8">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                                Financial <span className="text-geeko-cyan">Intelligence</span>
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="w-12 h-12 text-geeko-cyan animate-spin" />
                            </div>
                        ) : (
                            <PortfolioStats collection={collection} />
                        )}
                    </section>

                    <footer className="pt-12 text-center text-slate-600 text-[10px] uppercase font-bold tracking-widest">
                        Geekorium TCG & RPG Ecosystem • 2026
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
