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
  Link as LinkIcon
} from 'lucide-react';
import { adminFetchBanners, adminSaveBanner, adminDeleteBanner, uploadAsset } from '../../utils/api';

interface Banner {
  id?: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  category: string;
}

export const BannersPage: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await adminFetchBanners();
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (banners.length >= 5) {
      alert('Se ha alcanzado el límite máximo de 5 banners. Debes eliminar uno antes de crear otro.');
      return;
    }
    setEditingBanner({
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '',
      is_active: true,
      display_order: banners.length,
      category: 'main_hero'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner({ ...banner });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este banner?')) return;
    try {
      await adminDeleteBanner(id);
      setBanners(banners.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Error al eliminar banner');
    }
  };

  const handleSave = async () => {
    if (!editingBanner || !editingBanner.image_url) {
      alert('La imagen es obligatoria');
      return;
    }

    try {
      setSaving(true);
      const saved = await adminSaveBanner(editingBanner);
      if (editingBanner.id) {
        setBanners(banners.map(b => b.id === saved.id ? saved : b));
      } else {
        setBanners([...banners, saved]);
      }
      setIsModalOpen(false);
      setEditingBanner(null);
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('Error al guardar banner');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadAsset(file, 'banners');
      if (editingBanner) {
        setEditingBanner({ ...editingBanner, image_url: url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const updated = { ...banner, is_active: !banner.is_active };
      await adminSaveBanner(updated);
      setBanners(banners.map(b => b.id === banner.id ? updated : b));
    } catch (error) {
      console.error('Error toggling active:', error);
    }
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
              Gestión de <span className="text-geeko-cyan">Banners</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Carrusel Promocional ({banners.length}/5)</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-3 h-1.5 rounded-full transition-colors ${i < banners.length ? 'bg-geeko-cyan' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center gap-3 bg-geeko-cyan text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]"
          >
            <Plus size={18} />
            Nuevo Banner
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-geeko-cyan/20 border-t-geeko-cyan rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Sincronizando Banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <ImageIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 uppercase tracking-tighter">No hay banners configurados</h3>
            <p className="text-slate-600 text-xs mt-2">Crea el primer banner para empezar a promocionar tus productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div 
                key={banner.id} 
                className="group relative bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden hover:border-geeko-cyan/30 transition-all flex flex-col"
              >
                {/* Preview Image */}
                <div className="aspect-video w-full relative overflow-hidden bg-black">
                  <img 
                    src={banner.image_url} 
                    alt={banner.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => toggleActive(banner)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg ${
                        banner.is_active 
                          ? 'bg-geeko-cyan text-black border-cyan-400 shadow-cyan-500/20' 
                          : 'bg-slate-800 text-slate-400 border-white/10 shadow-black'
                      }`}
                    >
                      {banner.is_active ? (
                        <span className="flex items-center gap-1"><Eye size={12} /> ON</span>
                      ) : (
                        <span className="flex items-center gap-1"><EyeOff size={12} /> OFF</span>
                      )}
                    </button>
                  </div>

                  {/* Order Controls */}
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-[10px] font-black text-geeko-cyan">
                      # {banner.display_order}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black italic uppercase tracking-tighter mb-1 line-clamp-1">{banner.title || 'Sin Título'}</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest line-clamp-2 mb-4">{banner.subtitle || 'Sin Subtítulo'}</p>
                    
                    {banner.link_url && (
                      <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <LinkIcon size={12} className="text-geeko-cyan" />
                        <span className="truncate">{banner.link_url}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/5">
                    <button 
                      onClick={() => handleEdit(banner)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => banner.id && handleDelete(banner.id)}
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
        {isModalOpen && editingBanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingBanner.id ? 'Editar' : 'Nuevo'} <span className="text-geeko-cyan">Banner</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar">
                
                {/* Image Upload Area */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Imagen del Banner (1600x600 recomendado)</label>
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group">
                    {editingBanner.image_url ? (
                      <>
                        <img src={editingBanner.image_url} alt="Preview" className="w-full h-full object-cover" />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título Principal</label>
                    <input 
                      type="text" 
                      value={editingBanner.title}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                      placeholder="Ej: SECRETS OF STRIXHAVEN"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtítulo / Estado</label>
                    <input 
                      type="text" 
                      value={editingBanner.subtitle}
                      onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                      placeholder="Ej: YA DISPONIBLE"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">URL de Destino (Link)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input 
                      type="text" 
                      value={editingBanner.link_url}
                      onChange={(e) => setEditingBanner({ ...editingBanner, link_url: e.target.value })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 pl-12 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                      placeholder="https://geekorium.shop/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Orden de Visualización</label>
                    <input 
                      type="number" 
                      value={editingBanner.display_order}
                      onChange={(e) => setEditingBanner({ ...editingBanner, display_order: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-geeko-cyan/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                    <button 
                      onClick={() => setEditingBanner({ ...editingBanner, is_active: !editingBanner.is_active })}
                      className={`w-full p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-3 ${
                        editingBanner.is_active 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-slate-900/50 border-white/5 text-slate-500'
                      }`}
                    >
                      {editingBanner.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      {editingBanner.is_active ? 'Banner Visible' : 'Banner Oculto'}
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
