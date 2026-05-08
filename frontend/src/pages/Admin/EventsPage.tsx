import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Calendar, 
  ChevronLeft, 
  Eye, 
  EyeOff,
  Trophy,
  Users,
  Clock,
  DollarSign,
  ClipboardList,
  ChevronDown
} from 'lucide-react';
import { adminFetchEvents, adminSaveEvent, adminDeleteEvent, uploadAsset } from '../../utils/api';
import { RegistrationsModal } from '../../components/Modals/RegistrationsModal';

interface Event {
  id?: string;
  name: string;
  game_code: string;
  event_date: string;
  format: string;
  entry_fee: string;
  registered: number;
  capacity: number;
  image_url: string;
  description: string;
  is_active: boolean;
}

const GAME_OPTIONS = [
  { code: 'MTG', name: 'Magic: The Gathering' },
  { code: 'PKM', name: 'Pokémon TCG' },
  { code: 'OPC', name: 'One Piece CG' },
  { code: 'DGM', name: 'Digimon CG' },
  { code: 'YGO', name: 'Yu-Gi-Oh!' },
  { code: 'FAB', name: 'Flesh & Blood' },
  { code: 'RFB', name: 'Riftbound' }
];

export const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedEventForReg, setSelectedEventForReg] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await adminFetchEvents();
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEvent({
      name: '',
      game_code: 'MTG',
      event_date: new Date().toISOString().slice(0, 16),
      format: 'Standard',
      entry_fee: '$10',
      registered: 0,
      capacity: 32,
      image_url: '',
      description: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    // Format date for datetime-local input
    const formattedDate = new Date(event.event_date).toISOString().slice(0, 16);
    setEditingEvent({ ...event, event_date: formattedDate });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;
    try {
      await adminDeleteEvent(id);
      setEvents(events.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error al eliminar evento');
    }
  };

  const handleSave = async () => {
    if (!editingEvent) return;
    
    // Strict validation
    if (!editingEvent.name.trim()) {
      alert('El nombre del evento es obligatorio');
      return;
    }
    if (!editingEvent.game_code) {
      alert('Debes seleccionar un juego (TCG)');
      return;
    }
    if (!editingEvent.event_date) {
      alert('La fecha y hora son obligatorias');
      return;
    }
    if (!editingEvent.entry_fee.trim()) {
      alert('El costo de entrada es obligatorio (puedes poner "Gratis")');
      return;
    }

    try {
      setSaving(true);
      
      // Auto-assign default image if none provided
      let finalEvent = { ...editingEvent };
      if (!finalEvent.image_url) {
        // Here we could have a map of default images per game
        const defaultImages: Record<string, string> = {
          'MTG': 'https://media.magic.wizards.com/image_legacy_migration/images/magic/tcg/products/stx/banner.jpg',
          'PKM': 'https://images.pokemontcg.io/swsh1/logo.png',
          'OPC': 'https://en.onepiece-cardgame.com/images/top/main_visual_01_sp.jpg',
          'YGO': 'https://www.yugioh-card.com/en/wp-content/uploads/2020/09/YGO_Logo_Standard.png'
        };
        finalEvent.image_url = defaultImages[finalEvent.game_code] || '';
      }

      const saved = await adminSaveEvent(finalEvent);
      if (editingEvent.id) {
        setEvents(events.map(e => e.id === saved.id ? saved : e));
      } else {
        setEvents([...events, saved]);
      }
      setIsModalOpen(false);
      setEditingEvent(null);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error al guardar evento');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadAsset(file, 'events');
      if (editingEvent) {
        setEditingEvent({ ...editingEvent, image_url: url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (event: Event) => {
    try {
      const updated = { ...event, is_active: !event.is_active };
      await adminSaveEvent(updated);
      setEvents(events.map(e => e.id === event.id ? updated : e));
    } catch (error) {
      console.error('Error toggling active:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
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
              Arena <span className="text-rose-500">Manager</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Calendario de Torneos y Eventos Especiales</p>
          </div>
          
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center gap-3 bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)]"
          >
            <Plus size={18} />
            Crear Evento
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest animate-pulse">Sincronizando Calendario...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
            <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-500 uppercase tracking-tighter">No hay eventos programados</h3>
            <p className="text-slate-400 text-xs mt-2 font-medium">Registra torneos oficiales para atraer a más jugadores a la tienda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 hover:bg-white/5 transition-all flex flex-col md:flex-row items-center gap-6"
              >
                {/* Event Thumbnail */}
                <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-rose-500/10">
                      <Trophy className="text-rose-500/40" size={32} />
                    </div>
                  )}
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0 text-center md:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest">
                      <img src={`/logos/tcg/black/${event.game_code}.png`} alt="" className="w-3 h-3 object-contain brightness-200" />
                      {event.game_code}
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                      {event.format}
                    </span>
                    <button 
                      onClick={() => toggleActive(event)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all shadow-lg ${
                        event.is_active 
                          ? 'bg-geeko-cyan text-black border-emerald-400 shadow-emerald-500/20' 
                          : 'bg-slate-800 text-slate-400 border-white/10 shadow-black'
                      }`}
                    >
                      {event.is_active ? 'Publicado (ON)' : 'Borrador (OFF)'}
                    </button>
                  </div>
                  
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter truncate">{event.name}</h3>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-rose-500" /> {new Date(event.event_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-rose-500" /> {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1.5"><Users size={14} className="text-rose-500" /> {event.registered} / {event.capacity} Jugadores</span>
                    <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-rose-500" /> {event.entry_fee}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleEdit(event)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => setSelectedEventForReg(event)}
                    className="bg-geeko-cyan-neon/10 hover:bg-geeko-cyan-neon/20 border border-geeko-cyan-neon/20 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-geeko-cyan-neon transition-all flex items-center gap-2"
                  >
                    <ClipboardList size={14} />
                    Registrados
                  </button>
                  <button 
                    onClick={() => event.id && handleDelete(event.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-3 rounded-xl text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit/Create Modal */}
        {isModalOpen && editingEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingEvent.id ? 'Configurar' : 'Programar'} <span className="text-rose-500">Evento</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                
                {/* Image & Game Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Image Upload */}
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Imagen Representativa</label>
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group">
                      {editingEvent.image_url ? (
                        <>
                          <img src={editingEvent.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <label className="bg-white text-black px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest cursor-pointer">
                              Cambiar
                              <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                            </label>
                          </div>
                        </>
                      ) : (
                        <>
                          {uploading ? (
                            <div className="w-8 h-8 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Trophy className="text-slate-700" size={32} />
                              <label className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg font-black text-[9px] uppercase tracking-widest cursor-pointer transition-all">
                                Subir
                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                              </label>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Main Details */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del Evento</label>
                      <input 
                        type="text" 
                        value={editingEvent.name}
                        onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all"
                        placeholder="Ej: FNM: Standard Showdown"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Juego</label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center pointer-events-none">
                            <img src={`/logos/tcg/black/${editingEvent.game_code}.png`} alt="" className="w-5 h-5 object-contain brightness-200" />
                          </div>
                          <select 
                            value={editingEvent.game_code}
                            onChange={(e) => setEditingEvent({ ...editingEvent, game_code: e.target.value })}
                            className="w-full bg-slate-900/50 border border-white/5 p-4 pl-12 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all appearance-none"
                          >
                            {GAME_OPTIONS.map(game => (
                              <option key={game.code} value={game.code}>{game.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Formato</label>
                        <input 
                          type="text" 
                          value={editingEvent.format}
                          onChange={(e) => setEditingEvent({ ...editingEvent, format: e.target.value })}
                          className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all"
                          placeholder="Ej: Standard, Commander, Draft"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha y Hora</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input 
                        type="datetime-local" 
                        value={editingEvent.event_date}
                        onChange={(e) => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/5 p-4 pl-12 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Costo de Entrada</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input 
                        type="text" 
                        value={editingEvent.entry_fee}
                        onChange={(e) => setEditingEvent({ ...editingEvent, entry_fee: e.target.value })}
                        className="w-full bg-slate-900/50 border border-white/5 p-4 pl-12 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all"
                        placeholder="Ej: $10, Gratis"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capacidad Máxima</label>
                    <input 
                      type="number" 
                      value={editingEvent.capacity}
                      onChange={(e) => setEditingEvent({ ...editingEvent, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrados</label>
                    <input 
                      type="number" 
                      value={editingEvent.registered}
                      onChange={(e) => setEditingEvent({ ...editingEvent, registered: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Visibilidad</label>
                    <button 
                      onClick={() => setEditingEvent({ ...editingEvent, is_active: !editingEvent.is_active })}
                      className={`w-full p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-3 ${
                        editingEvent.is_active 
                          ? 'bg-geeko-cyan/10 border-geeko-cyan/20 text-geeko-cyan' 
                          : 'bg-slate-900/50 border-white/5 text-slate-500'
                      }`}
                    >
                      {editingEvent.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      {editingEvent.is_active ? 'Publicado' : 'Borrador'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Descripción del Evento</label>
                  <textarea 
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    rows={4}
                    className="w-full bg-slate-900/50 border border-white/5 p-4 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50 transition-all resize-none"
                    placeholder="Detalles del torneo, premios, requisitos..."
                  />
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
                  className="flex items-center gap-3 bg-rose-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar Evento
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <RegistrationsModal 
          isOpen={selectedEventForReg !== null}
          onClose={() => setSelectedEventForReg(null)}
          event={selectedEventForReg}
        />
      </div>
    </div>
  );
};
