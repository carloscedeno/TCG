import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Image, Trash2, Copy, UploadCloud, ChevronLeft, RefreshCw, Folder } from 'lucide-react';

interface StorageFile {
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: {
        size: number;
        mimetype: string;
    };
    publicUrl: string;
}

export default function MediaPage() {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [folder, setFolder] = useState<'accessories' | 'banners'>('accessories');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from('public_assets')
                .list(folder, {
                    limit: 200, // Fetch up to 200 latest files
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                });

            if (error) throw error;

            // Map public URLs
            const mappedFiles = (data || []).filter(f => f.name !== '.emptyFolderPlaceholder').map(f => {
                const { data: urlData } = supabase.storage.from('public_assets').getPublicUrl(`${folder}/${f.name}`);
                return {
                    ...f,
                    publicUrl: urlData.publicUrl
                };
            });

            setFiles(mappedFiles as StorageFile[]);
        } catch (err: any) {
            console.error('Error fetching media:', err);
            alert('Error al cargar la galería: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [folder]);

    const handleDelete = async (fileName: string) => {
        if (!confirm(`⚠️ ALERTA: ¿Estás seguro de borrar "${fileName}"?\n\nSi algún producto en el catálogo está usando esta imagen, se romperá su enlace visual y se verá en blanco.`)) {
            return;
        }

        try {
            const { error } = await supabase.storage
                .from('public_assets')
                .remove([`${folder}/${fileName}`]);

            if (error) throw error;
            
            // Remove from state
            setFiles(prev => prev.filter(f => f.name !== fileName));
        } catch (err: any) {
            alert('Error al eliminar archivo: ' + err.message);
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error } = await supabase.storage
                .from('public_assets')
                .upload(filePath, file);

            if (error) throw error;

            loadFiles();
        } catch (err: any) {
            alert('Error al subir la imagen: ' + err.message);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#00D1FF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00D1FF]/20">
                                <Image className="text-black" size={24} />
                            </div>
                            <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                                Galería <span className="text-[#00D1FF]">Multimedia</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] ml-1">
                            Storage Explorer • {files.length} Archivos
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href="/admin"
                            className="px-6 py-4 bg-neutral-900 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-neutral-800 transition-all active:scale-95 flex items-center gap-2 mr-2"
                        >
                            <ChevronLeft size={18} />
                            Volver
                        </a>

                        <button
                            onClick={() => loadFiles()}
                            className="p-4 bg-slate-900 border border-white/10 rounded-2xl hover:bg-slate-800 transition-all text-slate-400 hover:text-white"
                        >
                            <RefreshCw size={20} />
                        </button>
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="px-8 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#00D1FF] transition-all active:scale-95 shadow-2xl flex items-center gap-3 disabled:opacity-50"
                        >
                            {isUploading ? <RefreshCw size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                            {isUploading ? 'Subiendo...' : 'Subir Archivo Raw'}
                        </button>
                    </div>
                </div>

                {/* Filters / Tabs */}
                <div className="flex gap-4 border-b border-white/10 pb-4">
                    <button 
                        onClick={() => setFolder('accessories')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                            folder === 'accessories' ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'bg-slate-900 text-slate-500 hover:text-white'
                        }`}
                    >
                        <Folder size={18} />
                        /accessories (Catálogo)
                    </button>
                    <button 
                        onClick={() => setFolder('banners')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                            folder === 'banners' ? 'bg-[#00D1FF]/20 text-[#00D1FF]' : 'bg-slate-900 text-slate-500 hover:text-white'
                        }`}
                    >
                        <Folder size={18} />
                        /banners (Promociones)
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-[#00D1FF]/30 border-t-[#00D1FF] rounded-full animate-spin mb-4" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Cargando Galería...</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center grayscale opacity-30">
                        <Image size={48} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest">No hay imágenes en esta carpeta</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {files.map((file) => (
                            <div key={file.id} className="group relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-[#00D1FF]/50 transition-all shadow-xl">
                                <div className="aspect-square bg-black p-2 flex items-center justify-center">
                                    <img 
                                        src={file.publicUrl} 
                                        alt={file.name} 
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="p-3 bg-slate-900/90 border-t border-white/10">
                                    <p className="text-[10px] font-mono text-slate-400 truncate" title={file.name}>
                                        {file.name}
                                    </p>
                                    <p className="text-[9px] text-slate-600 mt-1 uppercase font-bold">
                                        {file.metadata ? formatBytes(file.metadata.size) : 'Unknown Size'}
                                    </p>
                                </div>
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                    <button 
                                        onClick={() => handleCopyUrl(file.publicUrl)}
                                        className="p-3 bg-white/10 text-white rounded-full hover:bg-[#00D1FF] hover:text-black transition-all"
                                        title="Copiar URL"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(file.name)}
                                        className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all"
                                        title="Borrar Archivo"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
