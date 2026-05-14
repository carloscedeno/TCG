import { useState, useEffect, useCallback } from "react";
import { 
    Search, Plus, Package, Trash2, Edit2, 
    ChevronLeft, ChevronRight
} from "lucide-react";
import { fetchAccessoriesAdmin, deleteAccessory, fetchAccessoryCategories, updateAccessory } from "../../utils/api";
import { EditProductModal } from "../../components/Admin/EditProductModal";
import { AddAccessoryDrawer } from "../../components/Admin/AddAccessoryDrawer";
import { BulkImportCatalogModal } from "../../components/Admin/BulkImportCatalogModal";
import { FileUp } from "lucide-react";

export default function CatalogPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [lastSavedId, setLastSavedId] = useState<string | null>(null);

    const pageSize = 20;

    useEffect(() => {
        fetchAccessoryCategories();
    }, []);

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
                            Administración de Productos v1.5 • {totalCount} Items Detectados
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-6 py-4 bg-black border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:border-orange-500/50 transition-all active:scale-95 flex items-center gap-3"
                        >
                            <FileUp size={18} className="text-slate-500" />
                            Carga Masiva
                        </button>
                        
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-orange-500 transition-all active:scale-95 shadow-2xl flex items-center gap-3"
                        >
                            <Plus size={18} />
                            Nuevo Producto
                        </button>
                    </div>
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
                                <th className="px-6 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Precio</th>
                                <th className="px-6 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-center">Stock</th>
                                <th className="px-6 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-center">Estado</th>
                                <th className="pr-8 py-6 font-black text-[10px] text-slate-500 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center">
                                        <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Sincronizando...</span>
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center grayscale opacity-30">
                                        <Package size={48} className="mx-auto mb-4" />
                                        <p className="text-sm font-black uppercase tracking-widest">No hay resultados</p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="group hover:bg-white/[0.02] transition-all">
                                        <td className="pl-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-black rounded-xl overflow-hidden border border-white/10 shrink-0">
                                                    <img src={item.image_url || '/placeholder-accessory.png'} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black italic text-white uppercase">{item.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1 line-clamp-1 max-w-xs">
                                                        {item.description || 'Sin descripción'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                {item.discount_percentage > 0 && (
                                                    <span className="text-[10px] line-through text-slate-600 font-mono">
                                                        ${item.price?.toFixed(2)}
                                                    </span>
                                                )}
                                                <span className="text-lg font-black font-mono tracking-tighter">
                                                    ${(item.discount_percentage > 0 
                                                        ? item.price * (1 - item.discount_percentage / 100) 
                                                        : item.price
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black font-mono border ${
                                                item.stock > 10 
                                                ? 'bg-white/10 text-white border-white/20' 
                                                : item.stock > 0 
                                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            }`}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <button 
                                                onClick={async () => {
                                                    await updateAccessory(item.id, { is_active: !item.is_active });
                                                    loadAccessories();
                                                }}
                                                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border transition-all ${
                                                    item.is_active 
                                                    ? 'bg-white/10 text-white border-white/20' 
                                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}
                                            >
                                                {item.is_active ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                        <td className="pr-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedProduct(item);
                                                        setIsEditModalOpen(true);
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
                                            </div>
                                            {lastSavedId === item.id && <p className="text-[8px] font-black text-white uppercase mt-1 animate-pulse">Guardado</p>}
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

            <BulkImportCatalogModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    loadAccessories();
                }}
            />

            <EditProductModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                }}
                onSuccess={() => {
                    if (selectedProduct) setLastSavedId(selectedProduct.id);
                    setTimeout(() => setLastSavedId(null), 3000);
                    loadAccessories();
                }}
                product={selectedProduct}
            />
        </div>
    );
}
