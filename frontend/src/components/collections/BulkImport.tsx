import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface BulkImportProps {
    onImportComplete: (data: any) => void;
    importType: 'collection' | 'prices';
}

export const BulkImport: React.FC<BulkImportProps> = ({ onImportComplete, importType }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Mapping, 3: Success
    const [rows, setRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const processFile = (selectedFile: File) => {
        if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
            alert('Por favor, sube un archivo CSV o TXT.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const parsedRows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));

            if (parsedRows.length > 0) {
                setHeaders(parsedRows[0]);
                setRows(parsedRows.slice(1));
                setFile(selectedFile);
                setStep(2);
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

    const downloadTemplate = (tcg: string) => {
        const templates: Record<string, string> = {
            'MTG': 'Name,Set Code,Collector Number,Condition,Quantity,Price Paid\nBlack Lotus,LEA,1,NM,1,20000',
            'Pokemon': 'Name,Set,Rarity,Condition,Quantity\nCharizard,Base Set,Rare,LP,1',
            'Geekorium': 'Card Name,TCG,Set,Condition,Stock,Sale Price\nSol Ring,MTG,Commander Masters,NM,10,1.50'
        };

        const content = templates[tcg] || templates['Geekorium'];
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `Geekorium_Template_${tcg}.csv`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const [mapping, setMapping] = useState<Record<string, string>>({
        name: '',
        set: '',
        quantity: '',
        price: '',
        condition: '',
        tcg: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleImport = async () => {
        setLoading(true);
        try {
            const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
            const response = await fetch(`${API_BASE}/api/collections/import?import_type=${importType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
                },
                body: JSON.stringify({
                    data: rows.map(row => {
                        const obj: any = {};
                        headers.forEach((h, i) => obj[h] = row[i]);
                        return obj;
                    }),
                    mapping: mapping
                })
            });
            const data = await response.json();
            setResult(data);
            setStep(3);
        } catch (err) {
            alert('Error al importar datos');
        } finally {
            setLoading(false);
        }
    };

    const systemFields = [
        { id: 'name', label: 'Nombre de Carta' },
        { id: 'tcg', label: 'Juego (TCG)' },
        { id: 'set', label: 'Set/Código' },
        { id: 'quantity', label: 'Cantidad' },
        { id: 'price', label: 'Precio/Valor' },
        { id: 'condition', label: 'Condición' }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto">
            {step === 1 && (
                <div className="space-y-6">
                    <GlassCard
                        className={`p-12 border-2 border-dashed transition-all duration-500 ${isDragging ? 'border-geeko-cyan bg-geeko-cyan/5 scale-105' : 'border-white/10'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".csv,.txt"
                        />
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-geeko-cyan/10 rounded-3xl flex items-center justify-center border border-geeko-cyan/20 group-hover:scale-110 transition-transform">
                                <Upload className="text-geeko-cyan w-10 h-10 animate-bounce" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">
                                    Carga Masiva <span className="text-geeko-cyan">{importType === 'prices' ? 'PRECIOS' : 'COLECCIÓN'}</span>
                                </h2>
                                <p className="text-slate-400 font-bold text-sm">
                                    Arrastra tu archivo CSV o haz clic para buscar.
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="flex flex-col items-center gap-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">¿No tienes un formato? Descarga uno:</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {['MTG', 'Pokemon', 'Geekorium'].map(tcg => (
                                <button
                                    key={tcg}
                                    onClick={(e) => { e.stopPropagation(); downloadTemplate(tcg); }}
                                    className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-geeko-cyan hover:text-black transition-all"
                                >
                                    Template {tcg}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <GlassCard className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-6">
                        <div className="flex items-center gap-4">
                            <FileText className="text-geeko-cyan w-8 h-8" />
                            <div>
                                <h3 className="text-xl font-black italic uppercase">{file?.name}</h3>
                                <p className="text-slate-500 text-xs font-bold">{rows.length} filas detectadas</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="p-2 hover:bg-white/5 rounded-full text-slate-500"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-geeko-cyan">Mapeo de Columnas</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {systemFields.map((field) => (
                                <div key={field.id} className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-300">{field.label}</span>
                                    <select
                                        value={mapping[field.id]}
                                        onChange={(e) => setMapping(prev => ({ ...prev, [field.id]: e.target.value }))}
                                        className="bg-slate-900 border border-white/10 rounded-lg text-[10px] px-3 py-1.5 focus:border-geeko-cyan/50 outline-none"
                                    >
                                        <option value="">Seleccionar columna...</option>
                                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleImport}
                        disabled={loading}
                        className="w-full bg-geeko-cyan text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,229,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : 'Confirmar Importación'} <ArrowRight size={18} />
                    </button>
                </GlassCard>
            )}

            {step === 3 && (
                <GlassCard className="p-16 text-center space-y-8 animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 mx-auto">
                        <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">¡Sincronización Exitosa!</h2>
                        <p className="text-slate-400 font-bold">Hemos procesado {result?.imported_count || rows.length} cartas correctamente.</p>
                        {result?.errors?.length > 0 && (
                            <p className="text-yellow-500 text-[10px] mt-4 font-bold uppercase tracking-widest">
                                {result.errors.length} filas tuvieron inconsistencias.
                            </p>
                        )}
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                            Cargar otro
                        </button>
                        <button
                            onClick={() => onImportComplete(rows)}
                            className="px-8 py-3 bg-geeko-cyan text-black rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                        >
                            Ver Portafolio
                        </button>
                    </div>
                </GlassCard>
            )}
        </div>
    );
};
