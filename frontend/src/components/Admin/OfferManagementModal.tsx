import { useState } from 'react';
import { X, Save, Percent, Calendar } from 'lucide-react';
import { manageProductOffer } from '../../utils/api';

interface OfferManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    currentPrice: number;
    initialDiscountPercentage?: number;
    initialDiscountEndDate?: string;
    onSuccess: () => void;
}

export function OfferManagementModal({
    isOpen,
    onClose,
    productId,
    productName,
    currentPrice,
    initialDiscountPercentage = 0,
    initialDiscountEndDate,
    onSuccess
}: OfferManagementModalProps) {
    const [percentage, setPercentage] = useState<string>(initialDiscountPercentage.toString());
    const [endDate, setEndDate] = useState<string>(
        initialDiscountEndDate ? new Date(initialDiscountEndDate).toISOString().split('T')[0] : ''
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const parsedPercentage = parseFloat(percentage) || 0;
    const finalPrice = parsedPercentage > 0 ? currentPrice * (1 - parsedPercentage / 100) : currentPrice;

    const handleSave = async () => {
        if (parsedPercentage > 0 && !endDate) {
            setError("Debes seleccionar una fecha de caducidad para la oferta.");
            return;
        }

        setLoading(true);
        setError(null);

        // Append time to the end of the selected day
        const fullEndDate = endDate ? `${endDate}T23:59:59.999Z` : new Date().toISOString();

        const res = await manageProductOffer(productId, parsedPercentage, fullEndDate);
        
        setLoading(false);

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError(res.message || "Ocurrió un error al guardar la oferta.");
        }
    };

    const handleClear = async () => {
        setLoading(true);
        setError(null);
        
        const res = await manageProductOffer(productId, 0, new Date().toISOString());
        
        setLoading(false);

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError(res.message || "Ocurrió un error al eliminar la oferta.");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Gestionar Oferta</h2>
                        <p className="text-xs text-neutral-500 uppercase tracking-widest mt-1 truncate max-w-[280px]">
                            {productName}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                                <Percent size={14} />
                                Porcentaje de Descuento
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                value={percentage}
                                onChange={(e) => setPercentage(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors"
                                placeholder="Ej: 20"
                            />
                        </div>

                        {parsedPercentage > 0 && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                                    <Calendar size={14} />
                                    Fecha de Caducidad
                                </label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none transition-colors [color-scheme:dark]"
                                />
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/70">Precio Original</p>
                            <p className="text-sm font-bold text-neutral-500 line-through">${currentPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70">Precio Final</p>
                            <p className="text-2xl font-black italic text-emerald-400">${finalPrice.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-black/50 flex items-center gap-3">
                    {initialDiscountPercentage > 0 && (
                        <button 
                            onClick={handleClear}
                            disabled={loading}
                            className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50"
                        >
                            Quitar Oferta
                        </button>
                    )}
                    <div className="flex-1"></div>
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={loading || (parsedPercentage > 0 && !endDate)}
                        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={16} />
                        {loading ? 'Guardando...' : 'Aplicar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
