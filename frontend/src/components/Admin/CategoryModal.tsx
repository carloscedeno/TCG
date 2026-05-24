import { useState, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { X, Save, AlertCircle } from 'lucide-react';

export interface Category {
    code: string;
    name: string;
    parent_code: string | null;
    sort_order: number;
    icon: string | null;
    is_active: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    category?: Category;
    allCategories: Category[];
}

export const CategoryModal: FC<Props> = ({ isOpen, onClose, onSave, category, allCategories }) => {
    const [formData, setFormData] = useState<Partial<Category>>({
        code: '',
        name: '',
        parent_code: null,
        sort_order: 0,
        icon: '',
        is_active: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditMode = !!category;

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setFormData(category);
            } else {
                setFormData({
                    code: '',
                    name: '',
                    parent_code: null,
                    sort_order: 0,
                    icon: '',
                    is_active: true
                });
            }
            setError(null);
        }
    }, [isOpen, category]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        try {
            if (!formData.code || !formData.name) {
                throw new Error("El código y nombre son obligatorios.");
            }

            if (isEditMode) {
                // Update
                const { error: updateError } = await supabase
                    .from('accessory_categories')
                    .update({
                        name: formData.name,
                        parent_code: formData.parent_code || null,
                        sort_order: formData.sort_order,
                        icon: formData.icon,
                        is_active: formData.is_active
                    })
                    .eq('code', category.code);

                if (updateError) throw updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('accessory_categories')
                    .insert({
                        code: formData.code.toUpperCase().replace(/\s+/g, '_'),
                        name: formData.name,
                        parent_code: formData.parent_code || null,
                        sort_order: formData.sort_order,
                        icon: formData.icon,
                        is_active: formData.is_active
                    });

                if (insertError) throw insertError;
            }

            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar la categoría');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-black italic tracking-tighter text-white">
                        {isEditMode ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
                    </h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex gap-3">
                            <AlertCircle size={20} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Código / ID</label>
                        <input
                            type="text"
                            required
                            disabled={isEditMode}
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 outline-none disabled:opacity-50"
                            placeholder="Ej: BOOSTER_BOX"
                        />
                        {isEditMode && <p className="text-[10px] text-slate-500">El código no puede ser modificado una vez creado.</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre</label>
                        <input
                            type="text"
                            required
                            value={formData.name || ''}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 outline-none"
                            placeholder="Ej: Booster Box / Display"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoría Padre</label>
                        <select
                            value={formData.parent_code || ''}
                            onChange={(e) => setFormData({ ...formData, parent_code: e.target.value || null })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 outline-none"
                        >
                            <option value="">-- Ninguno (Categoría Principal) --</option>
                            {allCategories.filter(c => c.code !== category?.code).map(c => (
                                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Icono / Emoji</label>
                            <input
                                type="text"
                                value={formData.icon || ''}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 outline-none"
                                placeholder="Ej: 🗃️"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orden</label>
                            <input
                                type="number"
                                required
                                value={formData.sort_order ?? 0}
                                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-white/30 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-5 h-5 rounded border-white/10 bg-black/50"
                        />
                        <label htmlFor="isActive" className="text-sm font-bold text-white">Categoría Activa</label>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 text-white transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-[#00D1FF] text-black hover:bg-[#00D1FF]/80 transition-all flex items-center gap-2"
                        >
                            <Save size={16} />
                            {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
