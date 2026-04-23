import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../utils/supabaseClient";
import { 
    Plus, Trash2, Layout, Save, X, 
    Image as ImageIcon, Loader2, Upload, ExternalLink,
    ArrowUp, ArrowDown, Eye, EyeOff
} from "lucide-react";
import { uploadAsset } from "../../utils/api";

interface Banner {
    id?: string;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    category: string;
    is_active: boolean;
    display_order: number;
}

export default function BannersManager() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Banner>({
        title: "",
        subtitle: "",
        image_url: "",
        link_url: "",
        category: "main_hero",
        is_active: true,
        display_order: 0
    });

    const loadBanners = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all banners for management (including inactive)
            const { data, error } = await supabase
                .from('hero_banners')
                .select('*')
                .order('display_order');
            if (error) throw error;
            setBanners(data || []);
        } catch (err) {
            console.error("Error loading banners:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBanners();
    }, [loadBanners]);

    const handleOpenModal = (banner?: Banner) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData(banner);
        } else {
            setEditingBanner(null);
            setFormData({
                title: "",
                subtitle: "",
                image_url: "",
                link_url: "",
                category: "main_hero",
                is_active: true,
                display_order: banners.length
            });
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadAsset(file, 'banners');
            setFormData(prev => ({ ...prev, image_url: url }));
        } catch (err) {
            console.error("Upload failed:", err);
            alert("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('hero_banners').upsert(formData);
            if (error) throw error;
            setIsModalOpen(false);
            loadBanners();
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este banner?")) return;
        try {
            const { error } = await supabase.from('hero_banners').delete().eq('id', id);
            if (error) throw error;
            loadBanners();
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };

    const toggleStatus = async (banner: Banner) => {
        try {
            const { error } = await supabase
                .from('hero_banners')
                .update({ is_active: !banner.is_active })
                .eq('id', banner.id);
            if (error) throw error;
            loadBanners();
        } catch (err: any) {
            alert("Error: " + err.message);
        }
    };

    const moveOrder = async (banner: Banner, direction: 'up' | 'down') => {
        const index = banners.findIndex(b => b.id === banner.id);
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === banners.length - 1)) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const targetBanner = banners[targetIndex];

        try {
            const { error } = await supabase.from('hero_banners').upsert([
                { ...banner, display_order: targetBanner.display_order },
                { ...targetBanner, display_order: banner.display_order }
            ]);
            if (error) throw error;
            loadBanners();
        } catch (err: any) {
            alert("Error al reordenar: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-pink-500/30">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                <Layout className="text-white" size={24} />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                                Gestión de <span className="text-cyan-500">Banners</span>
                            </h1>
                        </div>
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">
                            Marketing Visual • {banners.length} Slides de Héroe
                        </p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="group relative px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl overflow-hidden active:scale-95 transition-all w-full md:w-auto shadow-2xl shadow-white/5"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <Plus size={18} />
                            Nuevo Banner
                        </span>
                        <div className="absolute inset-0 bg-cyan-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                </div>

                {/* Banners List */}
                <div className="grid grid-cols-1 gap-6">
                    {loading && banners.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                            <span className="font-black text-xs uppercase tracking-[0.3em] text-neutral-500">Accediendo a la Bóveda Visual...</span>
                        </div>
                    ) : (
                        banners.map((banner, index) => (
                            <div 
                                key={banner.id} 
                                className={`group relative bg-[#0a0a0a] border ${banner.is_active ? 'border-white/5' : 'border-red-500/20 opacity-60'} rounded-[2rem] overflow-hidden hover:border-cyan-500/30 transition-all shadow-2xl`}
                            >
                                <div className="flex flex-col lg:flex-row">
                                    {/* Preview container */}
                                    <div className="lg:w-1/3 h-48 lg:h-auto relative overflow-hidden bg-neutral-900">
                                        <img 
                                            src={banner.image_url} 
                                            alt={banner.title} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
                                    </div>

                                    {/* Content Info */}
                                    <div className="flex-1 p-8 flex flex-col justify-center">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="px-2 py-0.5 bg-white/5 rounded text-[8px] font-black text-neutral-500 uppercase tracking-widest border border-white/5">
                                                ID: {index + 1}
                                            </span>
                                            {banner.is_active ? (
                                                <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                                    <div className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" /> Activo
                                                </span>
                                            ) : (
                                                <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Inactivo</span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">{banner.title || 'Sin Título'}</h3>
                                        <p className="text-neutral-500 text-sm font-medium mb-4 line-clamp-2">{banner.subtitle || 'Sin subtítulo configurado.'}</p>
                                        
                                        {banner.link_url && (
                                            <div className="flex items-center gap-2 text-cyan-500/50 text-[10px] font-black uppercase tracking-widest">
                                                <ExternalLink size={12} />
                                                {banner.link_url}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="p-8 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-row lg:flex-col items-center justify-center gap-3">
                                        <div className="flex flex-row lg:flex-col gap-2">
                                            <button 
                                                onClick={() => moveOrder(banner, 'up')}
                                                disabled={index === 0}
                                                className="p-3 bg-white/5 hover:bg-cyan-500 rounded-xl transition-all disabled:opacity-20"
                                            >
                                                <ArrowUp size={16} />
                                            </button>
                                            <button 
                                                onClick={() => moveOrder(banner, 'down')}
                                                disabled={index === banners.length - 1}
                                                className="p-3 bg-white/5 hover:bg-cyan-500 rounded-xl transition-all disabled:opacity-20"
                                            >
                                                <ArrowDown size={16} />
                                            </button>
                                        </div>

                                        <div className="h-px w-8 lg:w-px lg:h-8 bg-white/5" />

                                        <button 
                                            onClick={() => toggleStatus(banner)}
                                            className={`p-3 rounded-xl transition-all ${banner.is_active ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500' : 'bg-red-500/10 text-red-500 hover:bg-red-500'} hover:text-white`}
                                        >
                                            {banner.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                        
                                        <button 
                                            onClick={() => handleOpenModal(banner)}
                                            className="p-3 bg-white/5 hover:bg-white hover:text-black rounded-xl transition-all"
                                        >
                                            <Save size={18} />
                                        </button>

                                        <button 
                                            onClick={() => handleDelete(banner.id!)}
                                            className="p-3 bg-red-500/5 hover:bg-red-500 text-red-500/50 hover:text-white rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.1)]">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                                    {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Título Principal</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all placeholder:text-neutral-800"
                                            placeholder="Ej: NUEVA EXPANSIÓN OUTLAWS"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Subtítulo / Descripción</label>
                                        <textarea
                                            value={formData.subtitle}
                                            onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all min-h-[100px] placeholder:text-neutral-800"
                                            placeholder="Describe brevemente el anuncio..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Link de Acción</label>
                                            <input
                                                type="text"
                                                value={formData.link_url}
                                                onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all placeholder:text-neutral-800"
                                                placeholder="/marketplace?set=OTJ"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Categoría</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cyan-500/50 outline-none transition-all"
                                            >
                                                <option value="main_hero">Héroe Principal</option>
                                                <option value="promotional">Promocional</option>
                                                <option value="event">Evento Especial</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Arte del Banner (Recomendado: 1920x800)</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-24 h-24 bg-black rounded-2xl border border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                                                {formData.image_url ? (
                                                    <img src={formData.image_url} alt="Previsualización" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-neutral-700" />
                                                )}
                                            </div>
                                            <label className="flex-1 cursor-pointer group">
                                                <div className="h-24 w-full bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 group-hover:border-cyan-500/50 transition-all">
                                                    {isUploading ? (
                                                        <Loader2 className="animate-spin text-cyan-500" size={20} />
                                                    ) : (
                                                        <>
                                                            <Upload size={20} className="text-neutral-500 group-hover:text-cyan-500" />
                                                            <span className="text-[9px] font-black uppercase text-neutral-600">Subir Background</span>
                                                        </>
                                                    )}
                                                </div>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || isUploading}
                                    className="w-full py-5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Publicar en el Emporio'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
