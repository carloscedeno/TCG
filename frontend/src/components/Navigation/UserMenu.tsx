import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    User,
    LogOut,
    Shield,
    Upload,
    Home,
    ChevronDown
} from 'lucide-react';
import { QuickStockPanel } from './QuickStockPanel';

export const UserMenu: React.FC = () => {
    const { user, isAdmin, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
        setIsOpen(false);
    };

    const menuItems = [
        { icon: Home, label: 'Inicio', path: '/', show: true },
        { icon: User, label: 'Mi Perfil', path: '/profile', show: !!user },
        { icon: Upload, label: 'Importar Colección', path: '/import', show: !!user },
        { icon: Shield, label: 'Admin Dashboard', path: '/admin', show: isAdmin },
    ];

    if (!user) {
        return null;
    }

    const userEmail = user.email || 'Usuario';
    const userInitial = userEmail.charAt(0).toUpperCase();

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
            >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-geeko-cyan to-geeko-purple flex items-center justify-center text-white font-black text-sm">
                    {userInitial}
                </div>

                {/* User Info */}
                <div className="hidden md:block text-left">
                    <div className="text-xs font-bold text-white">
                        {userEmail.split('@')[0]}
                    </div>
                    {isAdmin && (
                        <div className="text-[10px] font-black uppercase tracking-wider text-geeko-gold">
                            Admin
                        </div>
                    )}
                </div>

                {/* Dropdown Icon */}
                <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-geeko-cyan to-geeko-purple flex items-center justify-center text-white font-black text-lg">
                                {userInitial}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">
                                    {userEmail.split('@')[0]}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    {userEmail}
                                </div>
                                {isAdmin && (
                                    <div className="text-[10px] font-black uppercase tracking-wider text-geeko-gold mt-1">
                                        ⭐ Administrator
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        {menuItems.filter(item => item.show).map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors group"
                            >
                                <item.icon size={18} className="text-slate-400 group-hover:text-geeko-cyan transition-colors" />
                                <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                    {item.label}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {/* Admin Quick Stock Section */}
                    {isAdmin && <QuickStockPanel />}

                    {/* Sign Out */}
                    <div className="border-t border-white/5 p-2">
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors group rounded-xl"
                        >
                            <LogOut size={18} className="text-slate-400 group-hover:text-red-400 transition-colors" />
                            <span className="text-sm font-bold text-slate-300 group-hover:text-red-400 transition-colors">
                                Cerrar Sesión
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
