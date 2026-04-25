import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2, Package } from 'lucide-react';
import { createAccessory, uploadAccessoryImage, fetchAccessoryCategories } from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';

interface AddAccessoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddAccessoryDrawer = ({ isOpen, onClose, onSuccess }: AddAccessoryDrawerProps) => {
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [games, setGames] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        cost: '',
        suggested_price: '',
        stock: '0',
        category_code: '',
        game_id: '',
        unit_type: 'Unidad',
        language: 'Inglés'
    });

    useEffect(() => {
        const fetchData = async () => {
            const [gamesData, catsData] = await Promise.all([
                supabase.from('games').select('game_id, game_name').eq('is_active', true),
                fetchAccessoryCategories()
            ]);
            setGames(gamesData.data || []);
            setCategories(catsData || []);
        };
        fetchData();
    }, []);



    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadAccessoryImage(imageFile);
            }

            await createAccessory({
                ...formData,
                price: parseFloat(formData.price) || 0,
                cost: parseFloat(formData.cost) || 0,
                suggested_price: parseFloat(formData.suggested_price) || 0,
                stock: parseInt(formData.stock) || 0,
                image_url: imageUrl,
                game_id: formData.game_id ? parseInt(formData.game_id) : null
            });

            onSuccess();
            onClose();
            // Reset form
            setFormData({
                name: '',
                description: '',
                price: '',
                cost: '',
                suggested_price: '',
                stock: '0',
                category_code: '',
                game_id: '',
                unit_type: 'Unidad',
                language: 'Inglés'
            });
            setImageFile(null);
            setImagePreview(null);
        } catch (err: any) {
            alert("Error al crear accesorio: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-xl bg-slate-950 border-l border-white/10 h-full overflow-y-auto animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                            <Package className="text-orange-400" size={20} />
                        </div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Nuevo Producto</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Image Upload */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Imagen del Producto</label>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem] p-12 bg-white/5 hover:border-orange-500/30 transition-all group relative overflow-hidden">
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-contain rounded-xl mb-4" />
                                    <button 
                                        type="button" 
                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                        className="absolute top-4 right-4 p-2 bg-red-500 rounded-full text-white shadow-xl"
                                    >
                                        <X size={16} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Upload className="text-slate-700 group-hover:text-orange-500 transition-colors mb-4" size={48} />
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center">
                                        Arrastra o haz click para subir
                                    </p>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Nombre</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Ej: Playmat Secrets of Strixhaven"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Detalles del accesorio..."
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Costo (USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">P. Sugerido</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.suggested_price}
                                    onChange={(e) => setFormData({...formData, suggested_price: e.target.value})}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest block ml-1">Precio Geek</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    placeholder="0.00"
                                    className="w-full bg-orange-500/10 border border-orange-500/30 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Stock Inicial</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                    placeholder="10"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Idioma</label>
                                <select
                                    value={formData.language}
                                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                                >
                                    <option value="Español">Español</option>
                                    <option value="Inglés">Inglés</option>
                                    <option value="Japonés">Japonés</option>
                                    <option value="Otros">Otros</option>
                                    <option value="N/A">N/A</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Tipo de Venta</label>
                                <select
                                    value={formData.unit_type}
                                    onChange={(e) => setFormData({...formData, unit_type: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                                >
                                    <option value="Unidad">Unidad (Sencillo)</option>
                                    <option value="Sellado">Sellado (Box/Pack)</option>
                                    <option value="Display">Display</option>
                                    <option value="Kit">Kit / Bundle</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Categoría</label>
                                <select
                                    required
                                    value={formData.category_code}
                                    onChange={(e) => setFormData({...formData, category_code: e.target.value})}
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                                >
                                    <option value="">Seleccionar Categoría...</option>
                                    <optgroup label="📦 Sellado / TCG">
                                        {categories.filter(c => c.parent_code === 'SEALED').map(cat => (
                                            <option key={cat.code} value={cat.code}>{cat.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="🛡️ Accesorios / Insumos">
                                        {categories.filter(c => c.parent_code === 'ACCESSORIES').map(cat => (
                                            <option key={cat.code} value={cat.code}>{cat.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Otros">
                                        {categories.filter(c => !['SEALED', 'ACCESSORIES'].includes(c.parent_code)).map(cat => (
                                            <option key={cat.code} value={cat.code}>{cat.name}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Juego Asociado</label>
                            <select
                                value={formData.game_id}
                                onChange={(e) => setFormData({...formData, game_id: e.target.value})}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                            >
                                <option value="">Ninguno / Genérico</option>
                                {games.map(game => <option key={game.game_id} value={game.game_id}>{game.game_name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="pt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black text-sm uppercase tracking-[0.3em] rounded-[2rem] transition-all transform active:scale-95 shadow-[0_20px_40px_rgba(249,115,22,0.2)] flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Guardar Producto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
