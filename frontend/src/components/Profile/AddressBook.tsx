import React, { useEffect, useState } from 'react';
import { fetchUserAddresses, saveUserAddress, updateUserAddress, deleteUserAddress } from '../../utils/api';
import { MapPin, Plus, Trash2, Edit2, Check, Star, AlertCircle, Loader2, Home, Briefcase, X } from 'lucide-react';

interface Address {
    id: string;
    name: string;
    full_name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code?: string;
    country: string;
    is_default: boolean;
    is_billing: boolean;
}

export const AddressBook: React.FC = () => {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        full_name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: 'Caracas',
        state: 'Distrito Capital',
        zip_code: '',
        country: 'Venezuela',
        is_default: false,
        is_billing: false,
    });

    const loadAddresses = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchUserAddresses();
            setAddresses(data);
        } catch (err: any) {
            console.error('Error fetching addresses:', err);
            setError('Error al cargar la libreta de direcciones.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAddresses();
    }, []);

    const openAddModal = () => {
        setEditingAddress(null);
        setForm({
            name: '',
            full_name: '',
            phone: '',
            address_line1: '',
            address_line2: '',
            city: 'Caracas',
            state: 'Distrito Capital',
            zip_code: '',
            country: 'Venezuela',
            is_default: addresses.length === 0, // default if first
            is_billing: addresses.length === 0, // default if first
        });
        setIsModalOpen(true);
    };

    const openEditModal = (addr: Address) => {
        setEditingAddress(addr);
        setForm({
            name: addr.name,
            full_name: addr.full_name,
            phone: addr.phone,
            address_line1: addr.address_line1,
            address_line2: addr.address_line2 || '',
            city: addr.city,
            state: addr.state,
            zip_code: addr.zip_code || '',
            country: addr.country,
            is_default: addr.is_default,
            is_billing: addr.is_billing,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta dirección?')) return;
        try {
            await deleteUserAddress(id);
            loadAddresses();
        } catch (err: any) {
            console.error('Error deleting address:', err);
            alert('Error al eliminar la dirección.');
        }
    };

    const handleSetDefault = async (addr: Address, type: 'shipping' | 'billing') => {
        try {
            const updates = {
                ...addr,
                is_default: type === 'shipping' ? true : addr.is_default,
                is_billing: type === 'billing' ? true : addr.is_billing,
            };
            await updateUserAddress(addr.id, updates);
            loadAddresses();
        } catch (err: any) {
            console.error('Error updating default status:', err);
            alert('Error al actualizar dirección predeterminada.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (editingAddress) {
                await updateUserAddress(editingAddress.id, form);
            } else {
                await saveUserAddress(form);
            }
            setIsModalOpen(false);
            loadAddresses();
        } catch (err: any) {
            console.error('Error saving address:', err);
            setError(err.message || 'Error al guardar la dirección.');
        } finally {
            setSaving(false);
        }
    };

    const getAddressIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('casa') || lower.includes('home') || lower.includes('apto') || lower.includes('resid')) return <Home size={18} />;
        if (lower.includes('trabajo') || lower.includes('oficina') || lower.includes('work') || lower.includes('tienda')) return <Briefcase size={18} />;
        return <MapPin size={18} />;
    };

    if (loading && addresses.length === 0) {
        return (
            <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-geeko-cyan animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Cargando libreta de direcciones...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-white text-sm font-black uppercase tracking-[0.2em]">Mis Direcciones Guardadas</h3>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-1.5 px-4 py-2 bg-geeko-cyan text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,209,255,0.25)]"
                >
                    <Plus size={14} /> Nueva Dirección
                </button>
            </div>

            {addresses.length === 0 ? (
                <div className="p-12 text-center bg-[#0a0a0a]/50 border border-dashed border-white/10 rounded-3xl">
                    <MapPin className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">
                        Aún no tienes direcciones en tu libreta
                    </p>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                        Guarda tus direcciones de casa, oficina o sucursal de envío para acelerar tus futuras compras.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                        <div
                            key={addr.id}
                            className={`p-6 rounded-[2rem] bg-neutral-900/40 border transition-all flex flex-col justify-between group relative overflow-hidden ${
                                addr.is_default
                                    ? 'border-geeko-cyan/40 shadow-[0_0_20px_rgba(0,209,255,0.05)]'
                                    : 'border-white/5 hover:border-white/10'
                            }`}
                        >
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`p-2 rounded-xl border border-white/5 bg-white/5 text-geeko-cyan`}>
                                            {getAddressIcon(addr.name)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black uppercase text-white tracking-wide">{addr.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold">{addr.full_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEditModal(addr)}
                                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(addr.id)}
                                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-300 space-y-1 font-medium pl-1 leading-relaxed">
                                    <p>{addr.address_line1}</p>
                                    {addr.address_line2 && <p className="text-slate-400 text-[11px]">{addr.address_line2}</p>}
                                    <p className="text-slate-400">{addr.city}, {addr.state}, {addr.country}</p>
                                    <p className="text-slate-500 font-mono text-[10px]">{addr.phone}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-5 pt-4 border-t border-white/5 relative z-10">
                                <button
                                    onClick={() => handleSetDefault(addr, 'shipping')}
                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all border ${
                                        addr.is_default
                                            ? 'bg-geeko-cyan/10 border-geeko-cyan/30 text-geeko-cyan'
                                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    <Star size={10} fill={addr.is_default ? 'currentColor' : 'none'} />
                                    Envío {addr.is_default ? 'Predet.' : 'Fijar'}
                                </button>
                                <button
                                    onClick={() => handleSetDefault(addr, 'billing')}
                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all border ${
                                        addr.is_billing
                                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                                >
                                    <Check size={10} />
                                    Facturac. {addr.is_billing ? 'Predet.' : 'Fijar'}
                                </button>
                            </div>

                            {/* Accent Glow */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-geeko-cyan/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-base font-black italic uppercase tracking-tighter text-white">
                                {editingAddress ? 'Editar' : 'Añadir'} <span className="text-geeko-cyan">Dirección</span>
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {error && (
                                <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre de Dirección</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ej. Casa, Oficina, Casillero"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Recibidor</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Persona de contacto"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                        value={form.full_name}
                                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Número Telefónico</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. 04141234567"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección Línea 1</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Avenida, calle, urbanización, edificio..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    value={form.address_line1}
                                    onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dirección Línea 2 (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Piso, apartamento, local, punto de referencia"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                    value={form.address_line2}
                                    onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ciudad</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                        value={form.city}
                                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado / Provincia</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                        value={form.state}
                                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Código Postal (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                        value={form.zip_code}
                                        onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">País</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-geeko-cyan transition-all"
                                        value={form.country}
                                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/10 bg-white/5 text-geeko-cyan focus:ring-0 focus:ring-offset-0"
                                        checked={form.is_default}
                                        onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                                    />
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Establecer Envío Predeterminado</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-white/10 bg-white/5 text-purple-500 focus:ring-0 focus:ring-offset-0"
                                        checked={form.is_billing}
                                        onChange={(e) => setForm({ ...form, is_billing: e.target.checked })}
                                    />
                                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Establecer Facturac. Predeterminada</span>
                                </label>
                            </div>

                            {/* Form Footer */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-white/5 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-1.5 px-6 py-2 bg-geeko-cyan text-black rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,209,255,0.4)] disabled:opacity-50"
                                >
                                    {saving ? 'Guardando...' : editingAddress ? 'Guardar Cambios' : 'Añadir Dirección'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
