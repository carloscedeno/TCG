import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../ui/GlassCard';

interface BulkImportProps {
    onImportComplete: (data: any) => void;
    importType: 'collection' | 'prices' | 'inventory';
}

export const BulkImport: React.FC<BulkImportProps> = ({ onImportComplete, importType }) => {
    const { session } = useAuth();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Mapping, 3: Success
    const [rows, setRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [isAutoMapped, setIsAutoMapped] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const TXT_FORMAT_REGEX = /^(\d+)\s+(.+?)\s+\((.+?)\)\s+(\d+)(?:\s+\*F\*)?$/;

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

            // Detect special .txt format: "1 Agatha's Soul Cauldron (WOE) 242"
            const isSpecialTxt = selectedFile.name.endsWith('.txt') && lines.length > 0 && TXT_FORMAT_REGEX.test(lines[0]);

            if (isSpecialTxt) {
                const parsedRows = lines.map(line => {
                    const match = line.match(TXT_FORMAT_REGEX);
                    if (match) {
                        return [match[1], match[2], match[3], match[4]];
                    }
                    return null;
                }).filter(row => row !== null) as string[][];

                if (parsedRows.length > 0) {
                    setHeaders(['quantity', 'name', 'set', 'collector_number']);
                    setMapping({
                        quantity: 'quantity',
                        name: 'name',
                        set: 'set',
                        collector_number: 'collector_number',
                        condition: '',
                        price: '',
                        tcg: ''
                    });
                    setRows(parsedRows);
                    setFile(selectedFile);
                    setIsAutoMapped(true);
                    setStep(2);
                }
            } else {
                const parsedRows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
                if (parsedRows.length > 0) {
                    setHeaders(parsedRows[0]);
                    setRows(parsedRows.slice(1));
                    setFile(selectedFile);
                    setIsAutoMapped(false);
                    setStep(2);
                }
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
            'MTG': 'Name,Set Code,Collector Number,Condition,Quantity,Price Paid\nBlack Lotus,LEA,1,NM,1,20000'
        };

        const content = templates[tcg] || templates['MTG'];
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

    const downloadFailedRows = () => {
        if (!result?.failed_indices || result.failed_indices.length === 0) return;

        const failedRows = rows.filter((_, index) => result.failed_indices.includes(index));

        // Reconstruct content based on original format estimation
        // For simplicity, we'll try to keep the original structure if possible, 
        // or just dump the values we have.
        // If it was the special TXT format:
        let content = "";

        // Check if we are in special TXT mode by checking headers
        const isSpecialTxt = headers.includes('collector_number') && headers.includes('set') && headers.length === 4;

        if (isSpecialTxt) {
            // Reconstruct: "Quantity Name (Set) CollectorNumber"
            content = failedRows.map(row => {
                const qty = row[headers.indexOf('quantity')] || '1';
                const name = row[headers.indexOf('name')] || '';
                const set = row[headers.indexOf('set')] || '';
                const num = row[headers.indexOf('collector_number')] || '';
                return `${qty} ${name} (${set}) ${num}`;
            }).join('\n');
        } else {
            // CSV fallback
            content = [headers.join(',')].concat(failedRows.map(r => r.join(','))).join('\n');
        }

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `failed_import_rows_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const [mapping, setMapping] = useState<Record<string, string>>({
        name: '',
        set: '',
        collector_number: '',
        quantity: '',
        price: '',
        condition: '',
        tcg: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, items: 0 });

    const handleImport = async () => {
        if (!session) {
            alert('Por favor, inicia sesión para importar tu colección.');
            return;
        }
        setLoading(true);
        try {
            const SUPABASE_PROJECT_ID = 'sxuotvogwvmxuvwbsscv';
            const API_BASE = import.meta.env.VITE_API_BASE || `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/tcg-api`;

            const importData = rows.map(row => {
                const obj: any = {};
                headers.forEach((h, i) => obj[h] = row[i]);
                return obj;
            });

            // Chunks of 50 for max safety. 150s is the limit, let's play it safe.
            const CHUNK_SIZE = 50;
            const chunks = [];
            for (let i = 0; i < importData.length; i += CHUNK_SIZE) {
                chunks.push(importData.slice(i, i + CHUNK_SIZE));
            }

            setProgress({ current: 0, total: chunks.length, items: 0 });

            let totalImported = 0;
            let allErrors: string[] = [];
            let allFailedIndices: number[] = [];

            for (let i = 0; i < chunks.length; i++) {
                const response = await fetch(`${API_BASE}/api/collections/import?import_type=${importType}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify({
                        data: chunks[i],
                        mapping: mapping
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                    throw new Error(`Error en lote ${i + 1}: ${errorData.detail || errorData.error || response.statusText}`);
                }

                const chunkResult = await response.json();
                totalImported += chunkResult.imported_count || 0;
                if (chunkResult.errors) {
                    allErrors = [...allErrors, ...chunkResult.errors];
                }
                if (chunkResult.failed_indices) {
                    // Offset the indices by the current chunk start
                    const offset = i * CHUNK_SIZE;
                    allFailedIndices = [...allFailedIndices, ...chunkResult.failed_indices.map((idx: number) => idx + offset)];
                }

                setProgress(prev => ({ ...prev, current: i + 1, items: totalImported }));

                // Add a small delay between batches to prevent DB saturation
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            setResult({
                imported_count: totalImported,
                total_rows: importData.length,
                errors: allErrors,
                failed_indices: allFailedIndices
            });
            setStep(3);
        } catch (err: any) {
            console.error("Import error:", err);
            alert(`Error al importar datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const systemFields = [
        { id: 'name', label: 'Nombre de Carta' },
        { id: 'tcg', label: 'Juego (TCG)' },
        { id: 'set', label: 'Set/Código' },
        { id: 'collector_number', label: 'Num. Coleccionista' },
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
                                    Carga Masiva <span className="text-geeko-cyan">{importType === 'prices' ? 'PRECIOS' : importType === 'inventory' ? 'INVENTARIO' : 'COLECCIÓN'}</span>
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
                            {['MTG'].map(tcg => (
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
                        {isAutoMapped ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-geeko-cyan">
                                    <CheckCircle2 size={16} />
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Formato Detectado Automáticamente</h4>
                                </div>
                                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden flex flex-col max-h-[400px]">
                                    <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-geeko-cyan/20 scrollbar-track-transparent">
                                        <table className="w-full text-left text-[10px]">
                                            <thead className="bg-[#0c0c0c] sticky top-0 z-10 text-slate-400 font-bold uppercase tracking-wider shadow-sm">
                                                <tr>
                                                    <th className="p-3">Cantidad</th>
                                                    <th className="p-3">Nombre</th>
                                                    <th className="p-3">Set</th>
                                                    <th className="p-3">#</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-slate-300 divide-y divide-white/5">
                                                {rows.map((row, i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="p-3 w-20">{row[0]}</td>
                                                        <td className="p-3 font-bold text-white">{row[1]}</td>
                                                        <td className="p-3 w-24">{row[2]}</td>
                                                        <td className="p-3 w-24">{row[3]}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    {loading ? (
                        <div className="w-full space-y-6 p-8 bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                            {/* Background glow decoration */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-geeko-cyan/10 blur-[100px] rounded-full" />

                            <div className="flex justify-between items-end relative z-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-3 h-3 bg-geeko-cyan rounded-full animate-ping absolute inset-0" />
                                            <div className="w-3 h-3 bg-geeko-cyan rounded-full relative shadow-[0_0_10px_#00E5FF]" />
                                        </div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-geeko-cyan neon-text-cyan">
                                            Procesando Bloque {progress.current} de {progress.total}
                                        </h4>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        Importando <span className="text-white font-black">{progress.items.toLocaleString()}</span> de <span className="text-white/60">{rows.length.toLocaleString()}</span> ítems...
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-4xl font-black italic text-white tracking-tighter leading-none block">
                                        {Math.round((progress.current / progress.total) * 100)}%
                                    </span>
                                </div>
                            </div>

                            <div className="relative">
                                {/* Track */}
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[3px] backdrop-blur-md">
                                    {/* Fill */}
                                    <div
                                        className="h-full bg-geeko-cyan rounded-full shadow-[0_0_25px_rgba(0,229,255,0.7)] transition-all duration-700 ease-out relative overflow-hidden"
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    >
                                        {/* Shimmer effect */}
                                        <div className="absolute inset-0 shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg]" />

                                        {/* Inner glow pulse */}
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                    </div>
                                </div>

                                {/* Glow under the bar */}
                                <div
                                    className="absolute -bottom-4 h-8 bg-geeko-cyan/20 blur-2xl transition-all duration-700 rounded-full"
                                    style={{
                                        width: `${(progress.current / progress.total) * 100}%`,
                                        left: 0
                                    }}
                                />
                            </div>

                            <div className="flex justify-between items-center relative z-10">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    Arquitectura Geekorium v2.0 <span className="mx-2">|</span> Optimización Activa
                                </p>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => (
                                        <div
                                            key={i}
                                            className="w-1 h-1 bg-geeko-cyan rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.2}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="w-full bg-geeko-cyan text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,229,255,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Confirmar Importación <ArrowRight size={18} />
                        </button>
                    )}
                </GlassCard>
            )}

            {step === 3 && (
                <GlassCard className="p-16 text-center space-y-8 animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 mx-auto">
                        <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">¡Sincronización Finalizada!</h2>
                        <p className="text-slate-400 font-bold">
                            Hemos importado <span className="text-geeko-cyan">{result?.imported_count || 0}</span> de <span className="text-white">{rows.length}</span> cartas detectadas.
                        </p>
                        {result?.errors?.length > 0 && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-left max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-2 sticky top-0 bg-[#0c0c0c]/90 backdrop-blur p-1">
                                    Inconsistencias ({result.errors.length}):
                                </p>
                                <ul className="text-[10px] text-slate-400 font-medium space-y-1">
                                    {result.errors.map((err: string, i: number) => (
                                        <li key={i}>• {err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {result?.failed_indices?.length > 0 && (
                            <button
                                onClick={downloadFailedRows}
                                className="mt-2 text-[10px] font-black uppercase tracking-widest text-geeko-cyan hover:underline hover:text-white transition-colors"
                            >
                                Descargar {result.failed_indices.length} filas fallidas (.txt)
                            </button>
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
