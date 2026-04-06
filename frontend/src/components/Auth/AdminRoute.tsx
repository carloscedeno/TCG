import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <span className="font-black text-xs uppercase tracking-widest text-purple-400">Verifying Identity...</span>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <div className="max-w-md w-full bg-neutral-900 border border-red-500/10 rounded-[2rem] p-10 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/20" />
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <Shield className="text-red-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-4">
                        Acceso <span className="text-red-500">Restringido</span>
                    </h2>
                    <p className="text-neutral-500 text-xs font-bold mb-8 leading-relaxed uppercase tracking-widest">
                        Esta sección es exclusiva para el equipo de Geekorium.
                    </p>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => window.location.href = '/geeko-login'}
                            className="block w-full py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-geeko-cyan hover:text-white transition-all transform active:scale-95 shadow-xl"
                        >
                            Ingresar al Sistema
                        </button>
                        <button 
                            onClick={() => window.location.href = '/'}
                            className="block w-full py-4 bg-transparent text-neutral-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-colors"
                        >
                            Volver a la Tienda
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
