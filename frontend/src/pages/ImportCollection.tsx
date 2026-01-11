import React from 'react';
import { BulkImport } from '../components/collections/BulkImport';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { UserMenu } from '../components/Navigation/UserMenu';
import { useAuth } from '../context/AuthContext';

const ImportCollection: React.FC = () => {
    const { user } = useAuth();
    const handleImportComplete = (data: any) => {
        console.log('Import data:', data);
        // Here we would call the backend service
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans relative selection:bg-cyan-500/30 overflow-hidden">
            {/* Ambient Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-geeko-cyan/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-900/10 rounded-full blur-[150px]" />
            </div>

            {/* Header */}
            <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50 shadow-2xl shadow-black/50 relative">
                <nav className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl italic shadow-lg shadow-blue-600/20">T</div>
                            <h1 className="text-xl font-black tracking-tighter text-white">TCG HUB</h1>
                        </Link>
                        <div className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-neutral-400">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link>
                            <Link to="/tournaments" className="hover:text-white transition-colors">Tournaments</Link>
                            <Link to="/profile" className="hover:text-white transition-colors">My Profile</Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {user && <UserMenu />}
                    </div>
                </nav>
            </header>

            <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-12">
                <div className="flex items-center justify-between mb-16">
                    <Link to="/profile" className="flex items-center gap-2 text-slate-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver al Perfil
                    </Link>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                        <Shield size={14} className="text-geeko-cyan" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Secure Import Terminal</span>
                    </div>
                </div>

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-6xl font-black italic tracking-tighter uppercase">
                        Sincronizar <span className="text-geeko-cyan">Inventario</span>
                    </h1>
                    <p className="text-slate-500 font-bold max-w-xl mx-auto">
                        Carga tus listas de precios de <span className="text-white">Geekorium</span> o tus colecciones personales desde archivos CSV estructurados.
                    </p>
                </div>

                <BulkImport
                    importType="collection"
                    onImportComplete={handleImportComplete}
                />

                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                        <h4 className="text-geeko-cyan font-black text-xs uppercase tracking-widest mb-4">Formatos Soportados</h4>
                        <p className="text-slate-500 text-xs leading-relaxed font-bold">Aceptamos exports estándar de TCGPlayer, Cardmarket y listas personalizadas en .csv y .txt.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                        <h4 className="text-geeko-cyan font-black text-xs uppercase tracking-widest mb-4">Mapeo Inteligente</h4>
                        <p className="text-slate-500 text-xs leading-relaxed font-bold">Nuestro sistema detecta automáticamente los nombres de las cartas y busca la versión más reciente en el mercado.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                        <h4 className="text-geeko-cyan font-black text-xs uppercase tracking-widest mb-4">Seguridad de Datos</h4>
                        <p className="text-slate-500 text-xs leading-relaxed font-bold">Tus datos están protegidos y solo se sincronizan con tu perfil verificado de Geekorium.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportCollection;
