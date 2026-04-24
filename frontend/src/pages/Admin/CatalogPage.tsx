import { useState, useEffect, useCallback } from "react";
import { 
    Search, Plus, Package, Trash2, Edit2, X, 
    ChevronLeft, ChevronRight, Check
} from "lucide-react";
import { fetchAccessoriesAdmin, updateAccessory, deleteAccessory, uploadAccessoryImage } from "../../utils/api";
import { AddAccessoryDrawer } from "../../components/Admin/AddAccessoryDrawer";

export default function CatalogPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempData, setTempData] = useState<any>({});
    const [lastSavedId, setLastSavedId] = useState<string | null>(null);

    const pageSize = 20;
    const categories = [
        'Accesorios',
        'Sealed Product',
        'Consumibles',
        'Magic',
        'Pokemon',
        'Digimon',
        'One Piece',
        'Yu-Gi-Oh',
        'Weiss Schwarz',
        'Dungeons and Dragons',
        'Concesión',
        'Other'
    ];

    const loadAccessories = useCallback(async () => {
        setLoading(true);
        try {
            const { data, count } = await fetchAccessoriesAdmin({
                search: searchQuery,
                limit: pageSize,
                offset: page * pageSize
            });
            setItems(data || []);
            setTotalCount(count || 0);
        } catch (err) {
            console.error("Error loading accessories:", err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, page]);

    useEffect(() => {
        const timer = setTimeout(loadAccessories, 300);
        return () => clearTimeout(timer);
    }, [loadAccessories]);

    const handleSave = async (id: string) => {
        try {
            const updates = {
                ...tempData,
                price: parseFloat(tempData.price) || 0,
                cost: parseFloat(tempData.cost) || 0,
                stock: parseInt(tempData.stock) || 0
            };
            await updateAccessory(id, updates);
            setEditingId(null);
            setLastSavedId(id);
            setTimeout(() => setLastSavedId(null), 2000);
            loadAccessories();
        } catch (err: any) {
            alert("Error al actualizar: " + err.message);
        }
    };

    const handleImageChange = async (file: File) => {
        try {
            const url = await uploadAccessoryImage(file);
            setTempData({ ...tempData, image_url: url });
        } catch (err: any) {
            alert("Error al subir imagen: " + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            await deleteAccessory(id);
            loadAccessories();
        } catch (err: any) {
            alert("Error al eliminar: " + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Package className="text-black" size={24} />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                                Catálogo de <span className="text-orange-500">Tienda</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] ml-1">
                            Administración de Productos v1.1 • {totalCount} Items Detectados
                        </p>
                    </div>

                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-orange-500 transition-all active:scale-95 shadow-2xl flex items-center gap-3"
                    >
                        <Plus size={18} />
                        Nuevo Producto
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-slate-900/50 border border-white/5 p-4 rounded-[2.5rem] backdrop-blur-xl">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o categoría..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/5 rounded-3xl pl-16 pr-6 py-5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-slate-700 font-bold"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black/40 border-b border-white/5">
                            <tr>
                                <th className="pl-8 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest">Producto / Item</th>
                                <th className="px-6 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-center">Categoría</th>
                                <th className="px-4 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-center">Idioma</th>
                                <th className="px-4 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-center">Venta</th>
                                <th className="px-4 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Costo</th>
                                <th className="px-6 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Precio</th>
                                <th className="px-6 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-center">Stock</th>
                                <th className="pr-8 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-32 text-center">
                                        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sincronizando Base de Datos...</span>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-32 text-center grayscale opacity-30">
                                        <Package size={48} className="mx-auto mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest">No se hallaron productos</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/[0.02] transition-all">
                                        <td className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group/img w-16 h-16 bg-black rounded-2xl overflow-hidden border border-white/10 shadow-xl group-hover:scale-105 transition-transform flex-shrink-0">
                                                    <img src={editingId === item.id ? (tempData.image_url || item.image_url) : (item.image_url || '/placeholder-accessory.png')} alt={item.name} className="w-full h-full object-cover" />
                                                    {editingId === item.id && (
                                                        <label className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                            <Plus size={20} className="text-white" />
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    {editingId === item.id ? (
                                                        <input
                                                            type="text"
                                                            value={tempData.name}
                                                            onChange={(e) => setTempData({...tempData, name: e.target.value})}
                                                            className="w-full bg-black border border-orange-500/50 rounded-xl px-3 py-2 text-xs font-black uppercase italic text-white"
                                                        />
                                                    ) : (
                                                        <>
                                                            <p className="text-sm font-black italic text-white uppercase">{item.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1 line-clamp-1 max-w-xs">{item.description || 'Sin descripción'}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {editingId === item.id ? (
                                                <select
                                                    value={tempData.category}
                                                    onChange={(e) => setTempData({...tempData, category: e.target.value})}
                                                    className="w-full bg-black border border-orange-500/50 rounded-xl px-2 py-2 text-center text-[10px] font-black uppercase text-white appearance-none"
                                                >
                                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            ) : (
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                                                    {item.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            {editingId === item.id ? (
                                                <select
                                                    value={tempData.language}
                                                    onChange={(e) => setTempData({...tempData, language: e.target.value})}
                                                    className="w-full bg-black border border-orange-500/50 rounded-xl px-2 py-2 text-center text-[10px] font-bold text-white"
                                                >
                                                    <option value="Español">ESP</option>
                                                    <option value="Inglés">ENG</option>
                                                    <option value="Japonés">JPN</option>
                                                    <option value="Otros">OTR</option>
                                                </select>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{item.language || 'N/A'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            {editingId === item.id ? (
                                                <select
                                                    value={tempData.unit_type}
                                                    onChange={(e) => setTempData({...tempData, unit_type: e.target.value})}
                                                    className="w-full bg-black border border-orange-500/50 rounded-xl px-2 py-2 text-center text-[10px] font-bold text-white"
                                                >
                                                    <option value="Unidad">Und</option>
                                                    <option value="Sellado">Sel</option>
                                                    <option value="Display">Dsp</option>
                                                    <option value="Kit">Kit</option>
                                                </select>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">{item.unit_type || 'Unidad'}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-6 text-right">
                                            {editingId === item.id ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={tempData.cost}
                                                    onChange={(e) => setTempData({...tempData, cost: e.target.value})}
                                                    className="w-20 bg-black border border-orange-500/50 rounded-xl px-2 py-2 text-right text-xs font-mono text-white"
                                                />
                                            ) : (
                                                <span className="text-xs font-mono text-slate-600">${item.cost?.toFixed(2) || '0.00'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            {editingId === item.id ? (
                                                <input
                                                    type="number"
                                                    value={tempData.price}
                                                    onChange={(e) => setTempData({...tempData, price: e.target.value})}
                                                    className="w-24 bg-black border border-orange-500/50 rounded-xl px-3 py-2 text-right text-xs font-mono text-white"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-lg font-black font-mono tracking-tighter">
                                                    ${item.price?.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {editingId === item.id ? (
                                                <input
                                                    type="number"
                                                    value={tempData.stock}
                                                    onChange={(e) => setTempData({...tempData, stock: e.target.value})}
                                                    className="w-16 bg-black border border-orange-500/50 rounded-xl px-2 py-2 text-center text-xs font-mono text-white"
                                                />
                                            ) : (
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-black ${item.stock > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                                                    {item.stock}
                                                </div>
                                            )}
                                        </td>
                                        <td className="pr-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {editingId === item.id ? (
                                                    <>
                                                        <button onClick={() => handleSave(item.id)} className="p-3 bg-emerald-500 text-black rounded-xl hover:scale-105 transition-all">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => {
                                                                setEditingId(item.id);
                                                                setTempData({ 
                                                                    name: item.name,
                                                                    category: item.category,
                                                                    language: item.language || 'Inglés',
                                                                    unit_type: item.unit_type || 'Unidad',
                                                                    cost: item.cost,
                                                                    price: item.price, 
                                                                    stock: item.stock,
                                                                    image_url: item.image_url
                                                                });
                                                            }}
                                                            className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-3 bg-red-500/10 text-red-500/70 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            {lastSavedId === item.id && <p className="text-[8px] font-black text-emerald-500 uppercase mt-1 animate-pulse">Guardado</p>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalCount > pageSize && (
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="p-4 bg-white/5 rounded-2xl disabled:opacity-20 hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Página {page + 1} de {Math.ceil(totalCount / pageSize)}
                        </span>
                        <button 
                            disabled={(page + 1) * pageSize >= totalCount}
                            onClick={() => setPage(p => p + 1)}
                            className="p-4 bg-white/5 rounded-2xl disabled:opacity-20 hover:bg-white/10 transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            <AddAccessoryDrawer 
                isOpen={isDrawerOpen} 
                onClose={() => setIsDrawerOpen(false)} 
                onSuccess={loadAccessories} 
            />
        </div>
    );
}
