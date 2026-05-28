import React, { useState, useRef } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { matchAccessoryByName, uploadAccessoryImage, updateAccessory } from '../../utils/api';

interface BulkImageUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadItem {
  file: File;
  name: string; // The parsed product name from the file name
  status: 'pending' | 'uploading' | 'success' | 'not_found' | 'error';
  errorMessage?: string;
  matchedId?: string;
}

const BulkImageUploadModal: React.FC<BulkImageUploadModalProps> = ({ onClose, onSuccess }) => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[]) => {
    const newItems: UploadItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(file => {
        // Remove extension to get the product name
        const name = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        return {
          file,
          name,
          status: 'pending'
        };
      });

    setItems(prev => [...prev, ...newItems]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const startUpload = async () => {
    if (items.length === 0 || isUploading) return;
    
    setIsUploading(true);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'success') continue; // Skip already uploaded

      // Set to uploading
      setItems(prev => prev.map((p, idx) => idx === i ? { ...p, status: 'uploading' } : p));

      try {
        // 1. Match the product by exact name (ignoring case)
        const matchData = await matchAccessoryByName(item.name);
        
        if (!matchData) {
          setItems(prev => prev.map((p, idx) => idx === i ? { 
            ...p, 
            status: 'not_found', 
            errorMessage: 'No se encontró un producto con este nombre exacto.' 
          } : p));
          continue;
        }

        // 2. Upload the file to Supabase Storage (reuses natural upload flow)
        const imageUrl = await uploadAccessoryImage(item.file);

        // 3. Update the product record
        await updateAccessory(matchData.id, { image_url: imageUrl });

        setItems(prev => prev.map((p, idx) => idx === i ? { 
          ...p, 
          status: 'success',
          matchedId: matchData.id
        } : p));

      } catch (error: any) {
        console.error(`Error uploading ${item.name}:`, error);
        setItems(prev => prev.map((p, idx) => idx === i ? { 
          ...p, 
          status: 'error',
          errorMessage: error.message || 'Error en la subida.'
        } : p));
      }
    }

    setIsUploading(false);
    onSuccess(); // Refresh the list behind the scenes
  };

  const removePending = (index: number) => {
    if (isUploading) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Carga Masiva de Imágenes</h2>
            <p className="text-sm text-gray-400 mt-1">
              Asegúrate de que el nombre del archivo (sin extensión) sea <strong>exactamente igual</strong> al nombre del producto.
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Dropzone */}
        {!isUploading && (
          <div 
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="border-2 border-dashed border-gray-700 rounded-lg p-10 text-center flex flex-col items-center justify-center mb-6 hover:border-geeko-green/50 transition-colors cursor-pointer bg-gray-800/30"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={onFileSelect}
            />
            <UploadCloud size={48} className="text-gray-500 mb-4" />
            <p className="text-gray-300 font-medium">Haz clic aquí o arrastra imágenes</p>
            <p className="text-gray-500 text-sm mt-2">JPG, PNG o WEBP</p>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 min-h-[150px]">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No hay imágenes seleccionadas</div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="bg-gray-800 rounded p-3 flex items-center justify-between">
                <div className="flex flex-col truncate">
                  <span className="text-white text-sm font-medium truncate" title={item.file.name}>{item.file.name}</span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    Buscando match con: <strong className="text-gray-300">"{item.name}"</strong>
                  </span>
                </div>
                
                <div className="flex items-center ml-4 shrink-0">
                  {item.status === 'pending' && (
                    <button 
                      onClick={() => removePending(idx)}
                      disabled={isUploading}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={18} />
                    </button>
                  )}
                  {item.status === 'uploading' && <Loader size={18} className="text-geeko-cyan animate-spin" />}
                  {item.status === 'success' && <CheckCircle size={18} className="text-geeko-green" />}
                  {(item.status === 'not_found' || item.status === 'error') && (
                    <div className="flex items-center text-red-400" title={item.errorMessage}>
                      <span className="text-xs mr-2 max-w-[150px] truncate">{item.errorMessage}</span>
                      <AlertCircle size={18} />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            Total: {items.length} imágenes
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-800 text-white rounded font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              Cerrar
            </button>
            <button
              onClick={startUpload}
              disabled={items.length === 0 || isUploading}
              className="px-6 py-2 bg-geeko-green text-black rounded font-bold hover:bg-[#8EFFA1] disabled:opacity-50 disabled:bg-geeko-green/50 flex items-center gap-2"
            >
              {isUploading && <Loader size={16} className="animate-spin" />}
              {isUploading ? 'Procesando...' : 'Iniciar Subida Masiva'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BulkImageUploadModal;
