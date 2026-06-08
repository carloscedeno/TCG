import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Search, Coins, RefreshCw } from 'lucide-react';
import { ManageCreditsModal } from './ManageCreditsModal';

export const UserCreditsManager: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('geek_credits', { ascending: false })
            .limit(50); // Just fetch top 50 or recent for now, could implement pagination later
        
        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

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
        <div className="bg-opacity-10 bg-white backdrop-blur-md rounded-2xl p-6 border border-white border-opacity-20 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-geeko-gold to-orange-600 rounded-lg shadow-lg">
                        <Coins size={20} className="text-black" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Gestión de Créditos Geek</h3>
                        <p className="text-[10px] text-geeko-gold font-black uppercase tracking-widest">
                            Asignación y Deducción Manual
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-slate-500" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar usuario..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 bg-opacity-50 border border-slate-700 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-geeko-gold transition-all w-64"
                        />
                    </div>
                    <button 
                        onClick={fetchUsers}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="text-xs uppercase bg-slate-900/50 text-slate-400 font-black tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Nombre Real</th>
                            <th className="px-6 py-4 text-right">Créditos Geek</th>
                            <th className="px-6 py-4 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 bg-slate-950/30">
                        {loading ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Cargando...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No se encontraron usuarios.</td></tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">
                                        {u.username || <span className="text-slate-600 italic">Sin username</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : <span className="text-slate-600 italic">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-black ${u.geek_credits > 0 ? 'text-geeko-gold' : 'text-slate-400'}`}>
                                            {u.geek_credits || 0} CG
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleManage(u)}
                                            className="px-3 py-1.5 bg-geeko-gold/10 text-geeko-gold hover:bg-geeko-gold hover:text-black rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
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

            <ManageCreditsModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userProfile={selectedUser}
                onSuccess={fetchUsers}
            />
        </div>
    );
};
