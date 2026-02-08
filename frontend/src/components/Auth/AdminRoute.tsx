import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

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
                <div className="max-w-md w-full bg-neutral-900 border border-red-500/20 rounded-[2.5rem] p-12 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                        <Shield className="text-red-500" size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">
                        Access <span className="text-red-500">Denied</span>
                    </h2>
                    <p className="text-neutral-400 text-sm font-medium mb-8 leading-relaxed">
                        This section requires administrator privileges. Your attempt has been logged.
                    </p>
                    <Navigate to="/" state={{ from: location }} replace />
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
