import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Image as ImageIcon, 
  ChevronLeft, 
  Eye, 
  EyeOff,
  Link as LinkIcon,
  Search
} from 'lucide-react';
import { 
  adminFetchPresales, 
  adminSavePresale, 
  adminDeletePresale, 
  uploadAsset,
  fetchAccessoriesAdmin,
  fetchInventoryList
} from '../../utils/api';

interface Presale {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
}

export const PresalesPage: React.FC = () => {
  const navigate = useNavigate();
  const [presales, setPresales] = useState<Presale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPresale, setEditingPresale] = useState<Presale | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadPresales();
  }, []);

  const loadPresales = async () => {
    try {
      setLoading(true);
      const data = await adminFetchPresales();
      setPresales(data || []);
    } catch (error) {
      console.error('Error loading presales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPresale({
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '',
      is_active: true,
      display_order: presales.length
    });
    setSearchQuery('');
    setSearchResults([]);
    setIsModalOpen(true);
  };

  const handleEdit = (presale: Presale) => {
    setEditingPresale({ ...presale });
    setSearchQuery('');
    setSearchResults([]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta preventa?')) return;
    try {
      await adminDeletePresale(id);
      setPresales(presales.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting presale:', error);
      alert('Error al eliminar preventa');
    }
  };

  const handleSave = async () => {
    if (!editingPresale || !editingPresale.image_url) {
      alert('La imagen es obligatoria');
      return;
    }

    try {
      setSaving(true);
      const saved = await adminSavePresale(editingPresale);
      if (editingPresale.id) {
        setPresales(presales.map(b => b.id === saved.id ? saved : b));
      } else {
        setPresales([...presales, saved]);
      }
      setIsModalOpen(false);
      setEditingPresale(null);
    } catch (error) {
      console.error('Error saving presale:', error);
      alert('Error al guardar preventa');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadAsset(file, 'presales');
      if (editingPresale) {
        setEditingPresale({ ...editingPresale, image_url: url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (presale: Presale) => {
    try {
      const updated = { ...presale, is_active: !presale.is_active };
      await adminSavePresale(updated);
      setPresales(presales.map(b => b.id === presale.id ? updated : b));
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  const handleSearchProducts = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      // Search in both accessories and singles
      const [accRes, singlesRes] = await Promise.all([
        fetchAccessoriesAdmin({ search: searchQuery, limit: 10 }),
        fetchInventoryList(0, 10, searchQuery)
      ]);

      const results = [
        ...(accRes.data || []).map((p: any) => ({ ...p, type: 'accessory' })),
        ...(singlesRes.data || []).map((p: any) => ({ ...p, type: 'single', id: p.printing_id }))
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectProduct = (product: any) => {
    if (!editingPresale) return;
    const link = `/card/${product.id}`;
    setEditingPresale({
      ...editingPresale,
      link_url: link,
      title: product.name,
      subtitle: product.type === 'accessory' ? 'Nuevo Producto' : 'Carta Especial'
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-slate-500 hover:text-geeko-cyan transition-colors text-xs font-black uppercase tracking-widest group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Volver al Panel
            </button>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase">
              Gestión de <span className="text-geeko-cyan">Preventas</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Banners secundarios de anuncios</p>
          </div>
          
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center gap-3 bg-geeko-cyan text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]"
          >
            <Plus size={18} />
            Nueva Preventa
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-geeko-cyan/20 border-t-geeko-cyan rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Sincronizando Preventas...</p>
          </div>
        ) : presales.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <ImageIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 uppercase tracking-tighter">No hay preventas configuradas</h3>
            <p className="text-slate-400 text-xs mt-2 font-medium">Crea la primera preventa para mostrar debajo del banner principal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {presales.map((presale) => (
              <div 
                key={presale.id} 
                className="group relative bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden hover:border-geeko-cyan/30 transition-all flex flex-col"
              >
                {/* Preview Image */}
                <div className="aspect-[3.5/1] w-full relative overflow-hidden bg-black">
                  <img 
                    src={presale.image_url} 
                    alt={presale.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => toggleActive(presale)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg ${
                        presale.is_active 
                          ? 'bg-geeko-cyan text-black border-cyan-400 shadow-cyan-500/20' 
                          : 'bg-slate-800 text-slate-400 border-white/10 shadow-black'
                      }`}
                    >
                      {presale.is_active ? (
                        <span className="flex items-center gap-1"><Eye size={12} /> ON</span>
                      ) : (
                        <span className="flex items-center gap-1"><EyeOff size={12} /> OFF</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter mb-1 line-clamp-1">{presale.title || 'Sin Título'}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest line-clamp-2 mb-4">{presale.subtitle || 'Sin Subtítulo'}</p>
                    
                    {presale.link_url && (
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <LinkIcon size={12} className="text-geeko-cyan" />
                        <span className="truncate">{presale.link_url}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/5">
                    <button 
                      onClick={() => handleEdit(presale)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => presale.id && handleDelete(presale.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-3 rounded-xl text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit/Create Modal */}
        {isModalOpen && editingPresale && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingPresale.id ? 'Editar' : 'Nueva'} <span className="text-geeko-cyan">Preventa</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                
                {/* Image Upload Area */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Imagen de Preventa (800x230 aprox)</label>
                  <div className="relative aspect-[3.5/1] w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group">
                    {editingPresale.image_url ? (
                      <>
                        <img src={editingPresale.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer hover:scale-105 transition-all">
                            Cambiar Imagen
                            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        {uploading ? (
                          <div className="w-8 h-8 border-2 border-geeko-cyan/20 border-t-geeko-cyan rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <ImageIcon className="text-slate-700" size={40} />
                            <label className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer transition-all">
                              Subir Imagen
                              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                            </label>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Product Search Tool */}
                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Search size={14} className="text-geeko-cyan" />
                    <label className="text-[10px] font-black text-geeko-cyan uppercase tracking-widest">Vinculación Rápida con Producto</label>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchProducts()}
                      placeholder="Buscar producto o carta..."
                      className="flex-1 bg-black border border-white/10 p-3 rounded-xl text-xs font-bold focus:border-geeko-cyan transition-all"
                    />
                    <button 
                      onClick={handleSearchProducts}
                      disabled={searching}
                      className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all"
                    >
                      {searching ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Search size={18} />}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-2 mt-2 custom-scrollbar">
                      {searchResults.map((p, i) => (
                        <button 
                          key={i}
                          onClick={() => selectProduct(p)}
                          className="w-full flex items-center gap-3 p-3 bg-black hover:bg-geeko-cyan hover:text-black rounded-xl border border-white/5 transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                            <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-black uppercase truncate">{p.name}</div>
                            <div className="text-[8px] font-bold opacity-60 uppercase tracking-widest">{p.type === 'accessory' ? 'Producto/Accesorio' : 'Carta/Single'}</div>
                          </div>
                          <Plus size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título de Preventa</label>
                    <input 
                      type="text" 
                      value={editingPresale.title}
                      onChange={(e) => setEditingPresale({ ...editingPresale, title: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                      placeholder="Ej: NUEVO LANZAMIENTO"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Texto Secundario</label>
                    <input 
                      type="text" 
                      value={editingPresale.subtitle}
                      onChange={(e) => setEditingPresale({ ...editingPresale, subtitle: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                      placeholder="Ej: DISPONIBLE PRÓXIMAMENTE"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">URL de Destino (Link)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input 
                      type="text" 
                      value={editingPresale.link_url}
                      onChange={(e) => setEditingPresale({ ...editingPresale, link_url: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 pl-12 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                      placeholder="/card/abc-123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orden</label>
                    <input 
                      type="number" 
                      value={editingPresale.display_order}
                      onChange={(e) => setEditingPresale({ ...editingPresale, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                    <button 
                      onClick={() => setEditingPresale({ ...editingPresale, is_active: !editingPresale.is_active })}
                      className={`w-full p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-3 ${
                        editingPresale.is_active 
                          ? 'bg-geeko-cyan/10 border-geeko-cyan/20 text-emerald-400' 
                          : 'bg-slate-900/50 border-white/5 text-slate-500'
                      }`}
                    >
                      {editingPresale.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      {editingPresale.is_active ? 'Visible' : 'Oculto'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="flex items-center gap-3 bg-geeko-cyan text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
