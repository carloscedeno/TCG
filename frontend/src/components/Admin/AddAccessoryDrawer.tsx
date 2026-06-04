import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Loader2, Package, Star, Trash2 } from 'lucide-react';
import { createAccessory, uploadAccessoryImage, fetchAccessoryCategories } from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';

interface AddAccessoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddAccessoryDrawer = ({ isOpen, onClose, onSuccess }: AddAccessoryDrawerProps) => {
    const [loading, setLoading] = useState(false);
    const [imageItems, setImageItems] = useState<{file: File, preview: string}[]>([]);
    const [mainImageIndex, setMainImageIndex] = useState<number>(0);
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
        category: 'Accesorios',
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
        const files = e.target.files;
        if (files && files.length > 0) {
            const newItems = Array.from(files).map(file => ({
                file,
                preview: URL.createObjectURL(file)
            }));
            setImageItems(prev => [...prev, ...newItems]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'category_code') {
            const catName = categories.find(c => c.code === value)?.name || 'Accesorios';
            setFormData(prev => ({ ...prev, [name]: value, category: catName }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const removeImage = (index: number) => {
        setImageItems(prev => {
            const filtered = prev.filter((_, i) => i !== index);
            if (mainImageIndex >= filtered.length && filtered.length > 0) {
                setMainImageIndex(filtered.length - 1);
            }
            return filtered;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = '';
            let additionalImages: string[] = [];

            if (imageItems.length > 0) {
                const uploadedUrls = [];
                for (const item of imageItems) {
                    uploadedUrls.push(await uploadAccessoryImage(item.file));
                }
                imageUrl = uploadedUrls[mainImageIndex];
                additionalImages = uploadedUrls.filter((_, idx) => idx !== mainImageIndex);
            }

            await createAccessory({
                ...formData,
                category_code: formData.category_code || null,
                price: parseFloat(formData.price) || 0,
                cost: parseFloat(formData.cost) || 0,
                suggested_price: parseFloat(formData.suggested_price) || 0,
                stock: parseInt(formData.stock) || 0,
                image_url: imageUrl,
                additional_images: additionalImages,
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
                category: 'Accesorios',
                game_id: '',
                unit_type: 'Unidad',
                language: 'Inglés'
            });
            setImageItems([]);
            setMainImageIndex(0);
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
                    {/* Image Upload & Gallery */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Galería de Imágenes</label>
                            <span className="text-[10px] font-bold text-orange-500/60 uppercase tracking-tighter">Primer imagen es la principal</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            {imageItems.map((item, index) => (
                                <div key={index} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${index === mainImageIndex ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-white/5'}`}>
                                    <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                                    
                                    {/* Overlay Controls */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setMainImageIndex(index)}
                                            className={`p-2 rounded-full transition-all ${index === mainImageIndex ? 'bg-orange-500 text-black' : 'bg-white/10 text-white hover:bg-orange-500 hover:text-black'}`}
                                            title="Establecer como principal"
                                        >
                                            <Star size={14} fill={index === mainImageIndex ? "currentColor" : "none"} />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-all"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {index === mainImageIndex && (
                                        <div className="absolute top-2 left-2 bg-orange-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg">
                                            Principal
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add More Button */}
                            <div className="relative aspect-square border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:border-orange-500/30 transition-all flex flex-col items-center justify-center group cursor-pointer">
                                <Upload className="text-slate-700 group-hover:text-orange-500 transition-colors mb-2" size={24} />
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center px-2">Subir Foto</span>
                                <input 
                                    type="file" 
                                    multiple
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        {imageItems.length === 0 && (
                            <div className="py-12 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-white/2">
                                <Package size={40} className="text-slate-800 mb-4" />
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">No hay imágenes</p>
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Nombre</label>
                            <input
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ej: Playmat Secrets of Strixhaven"
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Descripción</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
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
                                    name="cost"
                                    value={formData.cost}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">P. Sugerido</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="suggested_price"
                                    value={formData.suggested_price}
                                    onChange={handleChange}
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
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
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
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    placeholder="10"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-orange-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Idioma</label>
                                <select
                                    name="language"
                                    value={formData.language}
                                    onChange={handleChange}
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
                                    name="unit_type"
                                    value={formData.unit_type}
                                    onChange={handleChange}
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
                                    name="category_code"
                                    value={formData.category_code}
                                    onChange={handleChange}
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
                                name="game_id"
                                value={formData.game_id}
                                onChange={handleChange}
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
