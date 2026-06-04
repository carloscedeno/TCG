import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Package, Star, Trash2, Upload } from 'lucide-react';
import { updateAccessory, uploadAccessoryImage, fetchAccessoryCategories } from '../../utils/api';
import { supabase } from '../../utils/supabaseClient';

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product: any;
}

export const EditProductModal = ({ isOpen, onClose, onSuccess, product }: EditProductModalProps) => {
    const [loading, setLoading] = useState(false);
    const [imageItems, setImageItems] = useState<{file?: File, preview: string}[]>([]);
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
        category: '',
        game_id: '',
        unit_type: 'Unidad',
        language: 'Inglés',
        discount_percentage: '0',
        discount_until: ''
    });

    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: (product.original_price ?? product.price)?.toString() || '',
                cost: product.cost?.toString() || '',
                suggested_price: product.suggested_price?.toString() || '',
                stock: product.stock?.toString() || '0',
                category_code: product.category_code || '',
                category: product.category || '',
                game_id: product.game_id?.toString() || '',
                unit_type: product.unit_type || 'Unidad',
                language: product.language || 'Inglés',
                discount_percentage: product.discount_percentage?.toString() || '0',
                discount_until: product.discount_until ? product.discount_until.split('T')[0] : ''
            });

            // Handle images
            const images = [];
            if (product.image_url) {
                images.push({ preview: product.image_url });
            }
            if (product.additional_images && Array.isArray(product.additional_images)) {
                product.additional_images.forEach((url: string) => {
                    images.push({ preview: url });
                });
            }
            setImageItems(images);
            setMainImageIndex(0);
        }
    }, [product, isOpen]);

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
            const catName = categories.find(c => c.code === value)?.name || formData.category;
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
            // Upload new images if any
            const uploadedUrls = await Promise.all(
                imageItems.map(item => {
                    if (item.file) return uploadAccessoryImage(item.file);
                    return Promise.resolve(item.preview);
                })
            );

            const finalImageUrl = uploadedUrls[mainImageIndex] || '';
            const finalAdditionalImages = uploadedUrls.filter((_, idx) => idx !== mainImageIndex);

            await updateAccessory(product.id, {
                ...formData,
                category_code: formData.category_code || null,
                price: parseFloat(formData.price) || 0,
                cost: parseFloat(formData.cost) || 0,
                suggested_price: parseFloat(formData.suggested_price) || 0,
                stock: parseInt(formData.stock) || 0,
                discount_percentage: parseFloat(formData.discount_percentage) || 0,
                discount_until: formData.discount_until || null,
                game_id: formData.game_id ? parseInt(formData.game_id) : null,
                image_url: finalImageUrl,
                additional_images: finalAdditionalImages
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            alert("Error al actualizar producto: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-5xl bg-slate-950 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Package className="text-black" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Editar Producto</h2>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">ID: {product.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        
                        {/* LEFT COLUMN: Media & Identity */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Galería de Imágenes</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {imageItems.map((item, index) => (
                                        <div key={index} className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${index === mainImageIndex ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-white/5'}`}>
                                            <img src={item.preview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button type="button" onClick={() => setMainImageIndex(index)} className={`p-2 rounded-full ${index === mainImageIndex ? 'bg-orange-500 text-black' : 'bg-white/10 text-white hover:bg-orange-500 hover:text-black'}`}>
                                                    <Star size={14} fill={index === mainImageIndex ? "currentColor" : "none"} />
                                                </button>
                                                <button type="button" onClick={() => removeImage(index)} className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-500">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="relative aspect-square border-2 border-dashed border-white/10 rounded-2xl bg-white/5 hover:border-orange-500/30 transition-all flex flex-col items-center justify-center group cursor-pointer">
                                        <Upload className="text-slate-700 group-hover:text-orange-500 mb-2" size={24} />
                                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Nombre del Producto</label>
                                    <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-orange-500/50 outline-none transition-all font-bold" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Categoría</label>
                                        <select required name="category_code" value={formData.category_code} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none appearance-none focus:border-orange-500/50 transition-all">
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
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Juego</label>
                                        <select name="game_id" value={formData.game_id} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none appearance-none focus:border-orange-500/50 transition-all">
                                            <option value="">Genérico</option>
                                            {games.map(game => <option key={game.game_id} value={game.game_id}>{game.game_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Financials & Description */}
                        <div className="space-y-8">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Costo (USD)</label>
                                    <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:border-orange-500/50 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest block ml-1">Precio Venta</label>
                                    <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} className="w-full bg-orange-500/10 border border-orange-500/30 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:border-orange-500/50 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Stock</label>
                                    <input required type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:border-orange-500/50 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 p-6 bg-purple-500/5 border border-purple-500/20 rounded-3xl">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block ml-1">Descuento (%)</label>
                                    <input type="number" name="discount_percentage" value={formData.discount_percentage} onChange={handleChange} className="w-full bg-black/40 border border-purple-500/20 rounded-2xl px-5 py-4 text-sm font-mono text-white focus:border-purple-500/50 outline-none transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block ml-1">Válido Hasta</label>
                                    <input type="date" name="discount_until" value={formData.discount_until} onChange={handleChange} className="w-full bg-black/40 border border-purple-500/20 rounded-2xl px-5 py-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Descripción Detallada</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows={6} className="w-full bg-black/40 border border-white/10 rounded-3xl px-5 py-4 text-sm text-white focus:border-orange-500/50 outline-none transition-all resize-none custom-scrollbar" placeholder="Describe las características del producto..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Idioma</label>
                                    <select name="language" value={formData.language} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none appearance-none focus:border-orange-500/50 transition-all">
                                        <option value="Español">Español</option>
                                        <option value="Inglés">Inglés</option>
                                        <option value="Japonés">Japonés</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">Tipo de Unidad</label>
                                    <select name="unit_type" value={formData.unit_type} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none appearance-none focus:border-orange-500/50 transition-all">
                                        <option value="Unidad">Unidad</option>
                                        <option value="Sellado">Sellado</option>
                                        <option value="Display">Display</option>
                                        <option value="Kit">Kit</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-8 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-4">
                    <button type="button" onClick={onClose} className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:text-white transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-10 py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-3 active:scale-95">
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};
