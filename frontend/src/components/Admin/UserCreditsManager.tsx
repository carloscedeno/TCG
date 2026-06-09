import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Search, Coins, RefreshCw, History, Users } from 'lucide-react';
import { ManageCreditsModal } from './ManageCreditsModal';

export const UserCreditsManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
    const [users, setUsers] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        if (activeTab === 'users') {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('geek_credits', { ascending: false })
                .limit(50);
            
            if (error) console.error("Error fetching users:", error);
            if (data) setUsers(data);
        } else {
            const { data, error } = await supabase
                .from('credit_history')
                .select(`
                    id,
                    amount,
                    reason,
                    created_at,
                    user:profiles!credit_history_user_id_fkey ( username, first_name, last_name ),
                    admin:profiles!credit_history_admin_id_fkey ( username, first_name, last_name )
                `)
                .order('created_at', { ascending: false })
                .limit(100);
                
            if (error) console.error("Error fetching audit logs:", error);
            if (data) setAuditLogs(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const filteredUsers = users.filter(u => 
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.first_name && u.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.last_name && u.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleManage = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    return (
        <div className="bg-slate-900/80 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl shadow-2xl transition-all duration-300">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-geeko-gold/20 to-orange-600/20 rounded-2xl border border-geeko-gold/30">
                        <Coins size={28} className="text-geeko-gold" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black italic text-white tracking-tighter">GEEKO CREDITS</h3>
                        <p className="text-[10px] text-geeko-gold font-black uppercase tracking-[0.2em]">
                            Sistema de Fidelidad
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Users size={14} /> Usuarios
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <History size={14} /> Auditoría
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <>
                    <div className="flex items-center justify-end gap-3 mb-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={14} className="text-slate-500" />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Buscar usuario..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-geeko-gold focus:ring-1 focus:ring-geeko-gold/50 transition-all w-72 placeholder:text-slate-600"
                            />
                        </div>
                        <button 
                            onClick={fetchData}
                            className="p-3 bg-black/40 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white rounded-2xl transition-all"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="text-[10px] uppercase bg-black/40 text-slate-500 font-black tracking-[0.2em]">
                                <tr>
                                    <th className="px-6 py-5 rounded-tl-2xl">Usuario</th>
                                    <th className="px-6 py-5">Nombre Real</th>
                                    <th className="px-6 py-5 text-right">Créditos Geek</th>
                                    <th className="px-6 py-5 text-right rounded-tr-2xl">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold tracking-widest text-[10px]">CARGANDO USUARIOS...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold tracking-widest text-[10px]">NO SE ENCONTRARON USUARIOS.</td></tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-white">
                                                {u.username || <span className="text-slate-600 italic">Sin username</span>}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : <span className="text-slate-600 italic">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`font-black px-3 py-1.5 rounded-lg text-xs ${u.geek_credits > 0 ? 'bg-geeko-gold/10 text-geeko-gold border border-geeko-gold/20' : 'text-slate-500 bg-white/5 border border-white/5'}`}>
                                                    {u.geek_credits || 0} CG
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleManage(u)}
                                                    className="px-4 py-2 bg-white/5 text-slate-300 hover:bg-geeko-gold hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all opacity-50 group-hover:opacity-100 border border-white/5"
                                                >
                                                    Ajustar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/20">
                    <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40">
                        <div>
                            <h4 className="text-white font-bold text-sm">Registro de Auditoría Global</h4>
                            <p className="text-slate-500 text-xs mt-1">Últimos movimientos de créditos en el sistema.</p>
                        </div>
                        <button 
                            onClick={fetchData}
                            className="p-2.5 bg-white/5 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white rounded-xl transition-all"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-[10px] uppercase bg-black/20 text-slate-500 font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Administrador</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                                <th className="px-6 py-4">Motivo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold tracking-widest text-[10px]">CARGANDO AUDITORÍA...</td></tr>
                            ) : auditLogs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold tracking-widest text-[10px]">NO HAY REGISTROS DE AUDITORÍA.</td></tr>
                            ) : (
                                auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white font-bold">{log.user?.username || 'Desconocido'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-400">{log.admin?.username || 'Sistema'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`font-black text-xs px-2 py-1 rounded-md border ${log.amount > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                {log.amount > 0 ? '+' : ''}{log.amount} CG
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 italic text-xs max-w-xs">
                                            {log.reason}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ManageCreditsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userProfile={selectedUser}
                onSuccess={fetchData}
            />
        </div>
    );
};
