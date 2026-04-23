import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../utils/supabaseClient";
import { 
    Plus, Search, Trash2, Package, Save, X, 
    Image as ImageIcon, Loader2, Upload
} from "lucide-react";
import { fetchAccessories, upsertAccessory, uploadAsset } from "../../utils/api";

interface Accessory {
    id?: string;
    name: string;
    description: string;
    category: string;
    brand: string;
    price: number;
    stock: number;
    image_url: string;
    sku: string;
    is_active: boolean;
}

export default function AccessoriesManager() {
    const [accessories, setAccessories] = useState<Accessory[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Accessory>({
        name: "",
        description: "",
        category: "sleeves",
        brand: "",
        price: 0,
        stock: 0,
        image_url: "",
        sku: "",
        is_active: true
    });

    const loadAccessories = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAccessories();
            setAccessories(data);
        } catch (err) {
            console.error("Error loading accessories:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccessories();
    }, [loadAccessories]);

    const handleOpenModal = (accessory?: Accessory) => {
        if (accessory) {
            setEditingAccessory(accessory);
            setFormData(accessory);
        } else {
            setEditingAccessory(null);
            setFormData({
                name: "",
                description: "",
                category: "sleeves",
                brand: "",
                price: 0,
                stock: 0,
                image_url: "",
                sku: "",
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadAsset(file, 'accessories');
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
            await upsertAccessory(formData);
            setIsModalOpen(false);
            loadAccessories();
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar este accesorio?")) return;
        try {
            const { error } = await supabase.from('accessories').delete().eq('id', id);
            if (error) throw error;
            loadAccessories();
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };

    const filteredAccessories = accessories.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Package className="text-white" size={24} />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                                Accesorios <span className="text-pink-500">Premium</span>
                            </h1>
                        </div>
                        <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] ml-1">
                            Gestión de Almacén No-TCG • {accessories.length} Entidades Activas
                        </p>
                    </div>

                    <button
                        onClick={() => handleOpenModal()}
                        className="group relative px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl overflow-hidden active:scale-95 transition-all w-full md:w-auto shadow-2xl shadow-white/5"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            <Plus size={18} />
                            Nuevo Accesorio
                        </span>
                        <div className="absolute inset-0 bg-pink-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    </button>
                </div>

                {/* Filters */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-pink-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-pink-500/50 transition-all placeholder:text-neutral-700 font-medium backdrop-blur-xl"
                    />
                </div>

                {/* Grid/Table */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    {loading && accessories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                            <span className="font-black text-xs uppercase tracking-[0.3em] text-neutral-500">Accediendo al Bóveda...</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#0f0f0f] border-b border-white/5">
                                    <tr>
                                        <th className="pl-8 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-center">Visual</th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest">Información del Producto</th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest">Categoría</th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-right">Precio</th>
                                        <th className="px-6 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-center">Stock</th>
                                        <th className="pr-8 py-6 font-black text-[10px] text-neutral-500 uppercase tracking-widest text-right">Ops</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredAccessories.map((acc) => (
                                        <tr key={acc.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="pl-8 py-4">
                                                <div className="mx-auto w-16 h-16 bg-neutral-900 rounded-xl overflow-hidden border border-white/5 shadow-2xl transition-transform group-hover:scale-110 group-hover:rotate-3">
                                                    {acc.image_url ? (
                                                        <img src={acc.image_url} alt={acc.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-700">
                                                            <ImageIcon size={24} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white italic tracking-tight lowercase truncate">
                                                        {acc.name}
                                                    </span>
                                                    <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-1">
                                                        SKU: {acc.sku || 'N/A'} • {acc.brand || 'Marca genérica'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-neutral-400 uppercase tracking-widest border border-white/5">
                                                    {acc.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-lg font-black font-mono tracking-tighter text-pink-400">
                                                    ${acc.price.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={`mx-auto w-10 py-1 rounded-lg text-[10px] font-black border ${
                                                    acc.stock > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                                                }`}>
                                                    {acc.stock}
                                                </div>
                                            </td>
                                            <td className="pr-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleOpenModal(acc)}
                                                        className="p-3 bg-white/5 hover:bg-pink-500 hover:text-white rounded-xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(acc.id!)}
                                                        className="p-3 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500/50 rounded-xl transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(236,72,153,0.1)]">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
                                    {editingAccessory ? 'Editar Accesorio' : 'Nuevo Accesorio'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Nombre del Producto</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/50 outline-none transition-all"
                                            placeholder="Ej: Dragon Shield Matte Blue"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Categoría</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/50 outline-none transition-all"
                                        >
                                            <option value="sleeves">Protectores (Sleeves)</option>
                                            <option value="deck_box">Cajas (Deck Boxes)</option>
                                            <option value="playmat">Playmats</option>
                                            <option value="sealed">Producto Sellado</option>
                                            <option value="other">Otros</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Marca</label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-pink-500/50 outline-none transition-all"
                                            placeholder="Ej: Dragon Shield"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Precio (USD)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-pink-500/50 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Stock Inicial</label>
                                        <input
                                            required
                                            type="number"
                                            value={formData.stock}
                                            onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                                            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-pink-500/50 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Imagen del Producto</label>
                                        <div className="flex items-center gap-4">
                                            <div className="w-20 h-20 bg-black rounded-2xl border border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                                                {formData.image_url ? (
                                                    <img src={formData.image_url} alt="Previsualización" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-neutral-700" />
                                                )}
                                            </div>
                                            <label className="flex-1 cursor-pointer group">
                                                <div className="h-20 w-full bg-white/5 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1 group-hover:border-pink-500/50 transition-all">
                                                    {isUploading ? (
                                                        <Loader2 className="animate-spin text-pink-500" size={20} />
                                                    ) : (
                                                        <>
                                                            <Upload size={20} className="text-neutral-500 group-hover:text-pink-500" />
                                                            <span className="text-[9px] font-black uppercase text-neutral-600">Subir Archivo</span>
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
                                    className="w-full py-5 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-pink-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Finalizar Registro'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
