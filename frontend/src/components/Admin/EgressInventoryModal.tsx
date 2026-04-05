import React, { useState, useRef } from "react";
import { supabase } from "../../utils/supabaseClient";
import { X, ArrowDownFromLine, Upload, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

interface EgressInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EgressInventoryModal({ isOpen, onClose, onSuccess }: EgressInventoryModalProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Validate/Edit, 3: Success
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [stagedItems, setStagedItems] = useState<any[]>([]);
    const [reason, setReason] = useState("Venta Manual / Evento");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const processFile = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.csv')) {
            alert('Por favor, sube un archivo CSV.');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length <= 1) return;

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            const requiredHeaders = ['name', 'quantity'];
            const hasRequired = requiredHeaders.every(h => headers.includes(h) || headers.includes(h === 'quantity' ? 'qty' : ''));
            
            if (!hasRequired && !headers.includes('name')) {
                alert('El CSV debe contener al menos las columnas "name" y "quantity".');
                return;
            }

            const parsedRows = lines.slice(1).map(line => {
                const cells = line.split(',');
                const obj: any = {};
                headers.forEach((h, i) => {
                    let val = (cells[i] || '').trim();
                    // Basic mapping
                    let key = h;
                    if (h === 'qty') key = 'quantity';
                    if (h === 'set code') key = 'set_code';
                    if (h === 'collector number') key = 'collector_number';
                    obj[key] = val;
                });
                return obj;
            });

            setFile(selectedFile);
            setLoading(true);
            try {
                // Call RPC to preview
                const { data, error } = await supabase.rpc('preview_bulk_egress', {
                    p_items: parsedRows
                });

                if (error) throw error;
                
                if (data && Array.isArray(data)) {
                    setStagedItems(data);
                    setStep(2);
                } else {
                    alert("Error parseando resultados del servidor.");
                }
            } catch (err: any) {
                console.error(err);
                alert("Error de validación masiva: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(selectedFile);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const selectedFile = e.dataTransfer.files[0];
        if (selectedFile) processFile(selectedFile);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) processFile(selectedFile);
    };

    const handleQuantityChange = (index: number, newQty: string) => {
        const qty = parseInt(newQty);
        if (isNaN(qty) || qty < 0) return;
        
        setStagedItems(prev => prev.map((item, i) => {
            if (i === index) {
                const currentStock = item.current_stock || 0;
                let newStatus = item.status;
                if (item.printing_id) {
                    newStatus = currentStock < qty ? 'error_insufficient_stock' : 'ok';
                }
                return { ...item, requested_quantity: qty, status: newStatus };
            }
            return item;
        }));
    };

    const getErrorSummary = () => {
        const errors = stagedItems.filter(i => i.status !== 'ok');
        return errors.length;
    };

    const submitEgress = async () => {
        if (getErrorSummary() > 0) {
            alert("Resuelve los errores antes de confirmar el egreso.");
            return;
        }

        const itemsToSubmit = stagedItems.filter(i => i.requested_quantity > 0);
        if (itemsToSubmit.length === 0) {
            alert("No hay artículos con cantidad mayor a 0 para descargar.");
            return;
        }

        if (!reason) {
            alert("Debes proporcionar un motivo para el egreso (Ej. Merma, Venta Externa).");
            return;
        }

        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            
            const payload = itemsToSubmit.map(i => ({
                printing_id: i.printing_id,
                name: i.name,
                requested_quantity: i.requested_quantity,
                condition: i.condition,
                finish: i.finish,
                original_index: i.original_index
            }));

            const { data, error } = await supabase.rpc('bulk_egress_inventory', {
                p_items: payload,
                p_reason: reason,
                p_user_id: userData.user?.id
            });

            if (error) throw error;
            
            setResult(data);
            setStep(3);
        } catch (err: any) {
            console.error("Egress Error:", err);
            alert("Error al confirmar la descarga: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadTemplate = () => {
        const content = 'name,set_code,collector_number,condition,finish,quantity\nBlack Lotus,LEA,1,NM,nonfoil,1';
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Geekorium_Plantilla_Egreso.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#050505] border border-white/10 rounded-[2rem] w-full max-w-6xl shadow-[0_0_100px_rgba(244,63,94,0.1)] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                            <ArrowDownFromLine className="text-rose-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-rose-500 italic tracking-tighter uppercase">Descarga Masiva</h2>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Terminal de Egreso de Inventario</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="group p-4 bg-white/5 hover:bg-neutral-800 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300">
                        <X size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[url('/grid.svg')] bg-fixed bg-center bg-no-repeat bg-cover">
                    
                    {step === 1 && (
                        <div className="w-full max-w-4xl mx-auto space-y-6">
                            <GlassCard
                                className={`p-12 border-2 border-dashed transition-all duration-500 ${isDragging ? 'border-rose-500 bg-rose-500/5 scale-105' : 'border-white/10'} ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => !loading && fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv" />
                                <div className="flex flex-col items-center text-center space-y-6">
                                    <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
                                        <Upload className={loading ? "text-rose-500 w-10 h-10 animate-bounce" : "text-rose-500 w-10 h-10"} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
                                            {loading ? 'Validando Archivo...' : 'Subir CSV de Egreso'}
                                        </h2>
                                        <p className="text-slate-400 font-bold text-sm">
                                            Identificación obligatoria de cantidad a deducir del Stock.
                                        </p>
                                    </div>
                                </div>
                            </GlassCard>

                            <div className="flex flex-col items-center gap-4">
                                <button onClick={(e) => { e.stopPropagation(); downloadTemplate(); }} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                    Descargar Plantilla CSV
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <GlassCard className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 gap-4">
                                <div className="flex items-center gap-4">
                                    <FileText className="text-rose-500 w-8 h-8" />
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase">{file?.name}</h3>
                                        <p className="text-slate-500 text-xs font-bold">
                                            {stagedItems.length} filas parseadas
                                            {getErrorSummary() > 0 && <span className="text-red-500 ml-2">({getErrorSummary()} con inconsistencias)</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-2">Motivo:</span>
                                        <input 
                                            type="text" 
                                            value={reason} 
                                            onChange={e => setReason(e.target.value)}
                                            placeholder="Venta / Transporte / Merma"
                                            className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500/50"
                                        />
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-xs uppercase font-black tracking-widest hover:text-white text-slate-500 transition-colors">
                                        Cancelar
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col max-h-[50vh]">
                                <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-rose-500/20 scrollbar-track-transparent">
                                    <table className="w-full text-left text-[10px]">
                                        <thead className="bg-[#0c0c0c] sticky top-0 z-10 text-slate-400 font-bold uppercase tracking-wider shadow-sm">
                                            <tr>
                                                <th className="p-3 w-16">Fila</th>
                                                <th className="p-3">Identidad</th>
                                                <th className="p-3 text-center">Set/Finish</th>
                                                <th className="p-3 text-center">Estado Backend</th>
                                                <th className="p-3 bg-red-500/5 text-center border-l justify-center border-white/5 w-32">Stock Actual</th>
                                                <th className="p-3 bg-rose-500/10 text-center w-32">&gt; Descontar</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-300 divide-y divide-white/5">
                                            {stagedItems.map((row, i) => {
                                                const isErr = row.status !== 'ok';
                                                
                                                return (
                                                    <tr key={i} className={`transition-colors ${isErr ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-white/5'}`}>
                                                        <td className="p-3 text-white/50">#{row.original_index + 1}</td>
                                                        <td className="p-3">
                                                            <div className="font-bold text-white">{row.name}</div>
                                                        </td>
                                                        <td className="p-3 text-center w-24">
                                                            <div className="flex flex-col gap-1 items-center">
                                                                <span className="bg-white/10 px-2 py-0.5 rounded text-[9px]">{row.set_code}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${row.finish === 'foil' ? 'bg-amber-500/20 text-amber-500' : 'text-neutral-500'}`}>{row.finish}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {row.status === 'error_not_found' && <span className="text-red-500 font-black uppercase tracking-wider">No Encontrado</span>}
                                                            {row.status === 'error_insufficient_stock' && <span className="text-orange-500 font-black uppercase tracking-wider">Stock Insuficiente</span>}
                                                            {row.status === 'ok' && <span className="text-emerald-500 font-black uppercase tracking-wider">OK</span>}
                                                        </td>
                                                        <td className="p-3 text-center border-l border-white/5 text-xl font-mono font-black text-white/60">
                                                            {row.current_stock || 0}
                                                        </td>
                                                        <td className="p-3 text-center bg-rose-500/5">
                                                            <input 
                                                                type="number"
                                                                value={row.requested_quantity}
                                                                onChange={e => handleQuantityChange(i, e.target.value)}
                                                                className={`w-16 bg-black border rounded-lg px-2 py-1 text-center font-mono focus:outline-none ${isErr ? 'border-red-500/50 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-white/10 text-rose-400'}`}
                                                                min="0"
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <button
                                onClick={submitEgress}
                                disabled={loading || getErrorSummary() > 0}
                                className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? 'Procesando...' : (getErrorSummary() > 0 ? 'Resuelve Errores para Continuar' : 'Confirmar Egreso Irreversible')} <ArrowRight size={18} />
                            </button>
                        </GlassCard>
                    )}

                    {step === 3 && (
                        <GlassCard className="p-16 text-center space-y-8 animate-in zoom-in-95">
                            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 mx-auto">
                                <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">¡Inventario Descargado!</h2>
                                <p className="text-slate-400 font-bold">
                                    Se egresaron <span className="text-emerald-500">{result?.egress_count || 0}</span> nodos de cartas. 
                                </p>
                                <p className="text-xs text-slate-500 mt-2 font-mono uppercase tracking-widest">
                                    Identificador Operativo: EGRESS_LOGGED
                                </p>
                            </div>
                            <div className="flex justify-center gap-4 mt-8">
                                <button onClick={() => { onSuccess(); onClose(); }} className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                                    Volver al Inventario
                                </button>
                            </div>
                        </GlassCard>
                    )}

                </div>
            </div>
        </div>
    );
}

export default EgressInventoryModal;
