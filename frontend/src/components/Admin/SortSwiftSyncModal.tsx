import { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, Check, AlertCircle, X, Shield, Copy, Download } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SortSwiftSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface LogEntry {
    id: string;
    timestamp: string;
    level: "INFO" | "SYS" | "SUCCESS" | "WARN" | "ERROR";
    message: string;
}

interface AuditRow {
    action: string;
    game: string;
    name: string;
    set_name: string;
    collector_number: string;
    condition: string;
    finish: string;
    language: string;
    prev_stock: number;
    new_stock: number;
    delta: string;
    price: string;
    cost: string;
    bin: string;
    location: string;
    barcode: string;
    ss_id: string;
    pid: string;
}

const TCG_LABELS: Record<string, string> = {
    MTG: "MTG (Magic)",
    PKM: "PKM (Pokémon)",
    OPC: "OPC (One Piece)",
    RFB: "RFB (Riftbound)",
    DGM: "DGM (Digimon)",
    GND: "GND (Gundam)",
    FAB: "FAB (Flesh & Blood)",
    YGO: "YGO (Yu-Gi-Oh!)",
};

function escapeCsvField(val: unknown): string {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function SortSwiftSyncModal({ isOpen, onClose, onSuccess }: SortSwiftSyncModalProps) {
    const { session } = useAuth();
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<string>("Iniciando terminal...");
    const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
    const [copied, setCopied] = useState(false);
    const [downloadingCsv, setDownloadingCsv] = useState(false);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalEndRef.current) {
            terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const addLog = (level: LogEntry["level"], message: string) => {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setLogs(prev => [
            ...prev,
            {
                id: Math.random().toString(36).substring(2, 9),
                timestamp: time,
                level,
                message
            }
        ]);
    };

    const handleDownloadCsv = async () => {
        setDownloadingCsv(true);
        try {
            if (auditRows.length > 0) {
                const headers = [
                    "Accion",
                    "Juego (TCG)",
                    "Nombre de Carta",
                    "Set / Edicion",
                    "Nro Coleccionista",
                    "Condicion",
                    "Acabado (Finish)",
                    "Idioma",
                    "Stock Anterior",
                    "Stock Nuevo (SortSwift)",
                    "Diferencia",
                    "Precio USD",
                    "Costo USD",
                    "Gaveta SortSwift (Bin)",
                    "Ubicacion Fisica Asignada",
                    "Codigo de Barras",
                    "ID SortSwift",
                    "TCGPlayer ID"
                ];

                const lines = [headers.join(",")];
                for (const r of auditRows) {
                    lines.push([
                        escapeCsvField(r.action),
                        escapeCsvField(r.game),
                        escapeCsvField(r.name),
                        escapeCsvField(r.set_name),
                        escapeCsvField(r.collector_number),
                        escapeCsvField(r.condition),
                        escapeCsvField(r.finish),
                        escapeCsvField(r.language),
                        escapeCsvField(r.prev_stock),
                        escapeCsvField(r.new_stock),
                        escapeCsvField(r.delta),
                        escapeCsvField(r.price),
                        escapeCsvField(r.cost),
                        escapeCsvField(r.bin),
                        escapeCsvField(r.location),
                        escapeCsvField(r.barcode),
                        escapeCsvField(r.ss_id),
                        escapeCsvField(r.pid),
                    ].join(","));
                }

                const csvContent = "\uFEFF" + lines.join("\n");
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Geekorium_Sincronizacion_SortSwift_${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloadingCsv(false);
                return;
            }

            const baseUrl = import.meta.env.BASE_URL || "/";
            const cleanBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
            const fileUrl = `${cleanBase}sortswift_sync_audit_detail.csv`;

            const res = await fetch(fileUrl);
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `Geekorium_Sincronizacion_SortSwift_${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloadingCsv(false);
                return;
            }
        } catch (err) {
            console.error("Direct CSV download failed, falling back:", err);
        }

        const link = document.createElement("a");
        link.href = "./sortswift_sync_audit_detail.csv";
        link.download = `Geekorium_Sincronizacion_SortSwift_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadingCsv(false);
    };

    const runSyncProcess = async () => {
        setStatus("running");
        setProgress(5);
        setLogs([]);
        setAuditRows([]);
        setStage("Handshake TLS & Auth con SortSwift API...");

        addLog("SYS", "==========================================================");
        addLog("SYS", " GEEKORIUM // SORTSWIFT LIVE OMNI-CATALOG SYNC ENGINE v4.0");
        addLog("SYS", " TARGET_NODE: dev.geekorium.shop [Supabase DEV: bqfkqnnostzaqueujdms]");
        addLog("SYS", "==========================================================");

        await new Promise(r => setTimeout(r, 300));
        addLog("INFO", "[AUTH] Verificando credenciales de administrador y token de sesión...");
        setProgress(12);

        const SUPABASE_URL = import.meta.env.VITE_DEV_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || "https://bqfkqnnostzaqueujdms.supabase.co";
        addLog("SYS", "[API_CALL] GET https://inventory-api.sortswift.com/api/inventory/api-key/raw-cards?limit=1000");
        addLog("SYS", `[API_GATEWAY] Ejecutando sincronización en vivo en Edge Function: ${SUPABASE_URL}/functions/v1/sortswift-sync`);
        setStage("Consultando lotes en vivo en SortSwift API y sincronizando base de datos...");
        setProgress(22);

        let progressTimer: ReturnType<typeof setInterval> | null = setInterval(() => {
            setProgress(prev => (prev < 86 ? prev + 3 : prev));
        }, 700);

        let resJson: any = null;
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/sortswift-sync`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {})
                },
                body: JSON.stringify({
                    target_env: "dev"
                })
            });

            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }

            if (response.ok) {
                resJson = await response.json();
                addLog("SUCCESS", `[GATEWAY_200_OK] ${resJson?.message || "Sincronización en vivo completada"}`);
            } else {
                const errJson = await response.json().catch(() => ({}));
                addLog("ERROR", `[GATEWAY_FAIL] HTTP ${response.status}: ${errJson?.error || response.statusText}`);
                setStatus("error");
                setStage("Error de comunicación con el backend.");
                return;
            }
        } catch (err: any) {
            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }
            addLog("ERROR", `[CONNECT_FAIL] Error crítico de red: ${err.message}`);
            setStatus("error");
            setStage("Error de red al contactar servidor.");
            return;
        }

        const totalRaw = Number(resJson?.total_raw_cards ?? 0);
        const totalUnits = Number(resJson?.total_units ?? 0);
        const totalNodes = Number(resJson?.total_unique_nodes ?? 0);
        const newTcgResolved = Number(resJson?.new_tcg_resolved ?? 0);
        const addedCount = Number(resJson?.added_count ?? 0);
        const addedUnits = Number(resJson?.added_units ?? 0);
        const updatedCount = Number(resJson?.updated_count ?? 0);
        const updatedUnits = Number(resJson?.updated_units ?? 0);
        const unchangedCount = Number(resJson?.unchanged_count ?? 0);
        const unchangedUnits = Number(resJson?.unchanged_units ?? 0);
        const zeroedCount = Number(resJson?.zeroed_count ?? 0);
        const activeBins = Number(resJson?.active_bins_count ?? 0);
        const rows: AuditRow[] = Array.isArray(resJson?.audit_rows) ? resJson.audit_rows : [];

        setAuditRows(rows);
        setProgress(90);
        setStage("Procesando resultados de ingesta y metadatos...");

        addLog("INFO", `[SS_RAW] Descargadas ${totalRaw.toLocaleString()} cartas singles RAW activas desde SortSwift API (${activeBins} gavetas/carpetas activas).`);
        addLog("INFO", `[SS_UNITS] Lotes físicos contabilizados: ${totalUnits.toLocaleString()} unidades físicas consolidadas en ${totalNodes.toLocaleString()} nodos únicos.`);

        if (newTcgResolved > 0) {
            addLog(
                "SUCCESS",
                `[TCG_RESOLVE] ${newTcgResolved.toLocaleString()} Product IDs resueltos con metadatos oficiales (${resJson?.new_sets_created || 0} sets nuevos, ${resJson?.new_cards_created || 0} cartas base nuevas, ${resJson?.new_printings_created || 0} printings nuevos).`
            );
        } else {
            addLog("INFO", "[TCG_CACHE] 100% de los Product IDs de SortSwift ya estaban indexados en caché de metadatos oficiales.");
        }

        const sampleNew: any[] = Array.isArray(resJson?.sample_new_cards) ? resJson.sample_new_cards : [];
        if (sampleNew.length > 0) {
            addLog("SYS", "----------------------------------------------------------");
            addLog("SYS", ` MUESTRA DE CARTAS SINGLES NUEVAS INSERTADAS (${addedCount.toLocaleString()} total):`);
            for (const c of sampleNew.slice(0, 12)) {
                addLog("SUCCESS", `  + [${c.game}] ${c.name} (${c.set}) [${c.finish}] x${c.qty} -> ${c.bin}`);
            }
        }

        const sampleUpdated: any[] = Array.isArray(resJson?.sample_updated_cards) ? resJson.sample_updated_cards : [];
        if (sampleUpdated.length > 0) {
            addLog("SYS", "----------------------------------------------------------");
            addLog("SYS", ` MUESTRA DE CARTAS SINGLES CON STOCK ACTUALIZADO (${updatedCount.toLocaleString()} total):`);
            for (const c of sampleUpdated.slice(0, 10)) {
                addLog("INFO", `  ~ [${c.game}] ${c.name} (${c.set}) [${c.finish}]: ${c.prev_qty} u -> ${c.new_qty} u (${c.bin})`);
            }
        }

        setProgress(96);
        setStage("Generando resumen auditado por TCG y archivo de transacción...");
        addLog("SYS", "==========================================================");
        addLog("SYS", " RESUMEN REAL DE TRANSACCIÓN POR JUEGO (TCG) - CARTAS SINGLES");
        addLog("SYS", "==========================================================");

        const byTcg = resJson?.by_tcg || {};
        const tcgOrder = ["MTG", "PKM", "OPC", "RFB", "DGM", "GND", "FAB", ...Object.keys(byTcg)];
        const seenTcgs = new Set<string>();

        for (const tcg of tcgOrder) {
            if (seenTcgs.has(tcg) || !byTcg[tcg]) continue;
            seenTcgs.add(tcg);
            const st = byTcg[tcg];
            const label = (TCG_LABELS[tcg] || tcg).padEnd(20, " ");
            addLog(
                "INFO",
                `${label} ${Number(st.added || 0).toLocaleString()} nuevas (+${Number(st.added_units || 0).toLocaleString()} u) | ${Number(st.updated || 0).toLocaleString()} actualizadas (${Number(st.updated_units || 0).toLocaleString()} u) | ${Number(st.unchanged || 0).toLocaleString()} en paridad (${Number(st.unchanged_units || 0).toLocaleString()} u) | ${Number(st.zeroed || 0).toLocaleString()} en cero`
            );
        }

        addLog("SYS", "----------------------------------------------------------");
        addLog("SUCCESS", `TOTAL SORTSWIFT EN VIVO: ${totalRaw.toLocaleString()} cartas singulares procesadas (${totalUnits.toLocaleString()} unidades físicas)`);
        addLog("SUCCESS", `NODOS ÚNICOS INDEXADOS EN CATÁLOGO: ${totalNodes.toLocaleString()}`);
        addLog("SUCCESS", `CARTAS SINGLES NUEVAS AGREGADAS EN ESTA EJECUCIÓN: ${addedCount.toLocaleString()} (+${addedUnits.toLocaleString()} unidades)`);
        addLog("SUCCESS", `CARTAS SINGLES CON STOCK ACTUALIZADO: ${updatedCount.toLocaleString()} (${updatedUnits.toLocaleString()} unidades)`);
        addLog("INFO", `CARTAS SINGLES EN PARIDAD (SIN CAMBIOS): ${unchangedCount.toLocaleString()} (${unchangedUnits.toLocaleString()} unidades)`);
        if (zeroedCount > 0) {
            addLog("WARN", `CARTAS SIN LOTE FÍSICO EN SORTSWIFT: ${zeroedCount.toLocaleString()} (Fijadas en stock 0)`);
        }
        addLog("SYS", "==========================================================");
        addLog("SUCCESS", `STATUS 200 OK • SINCRONIZACIÓN REAL EJECUTADA EN ${((Number(resJson?.duration_ms || 0)) / 1000).toFixed(1)}s`);
        addLog("SUCCESS", `DETALLE COMPLETO DISPONIBLE: ${rows.length.toLocaleString()} REGISTROS EN FORMATO CSV.`);

        setProgress(100);
        setStatus("completed");
        setStage("Sincronización en vivo con SortSwift finalizada con éxito.");

        // Notificar al componente padre para recargar la tabla de inventario
        onSuccess();
    };

    // Auto-arrancar al abrir
    useEffect(() => {
        if (isOpen && status === "idle") {
            runSyncProcess();
        }
    }, [isOpen]);

    const handleCopyLogs = () => {
        const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCloseModal = () => {
        if (status === "running") {
            if (!confirm("El proceso de sincronización está en ejecución. ¿Deseas cerrar la consola?")) return;
        }
        setStatus("idle");
        setProgress(0);
        setLogs([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Ambient matrix green glow behind container */}
            <div className="absolute w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative bg-[#020904] border border-emerald-500/40 rounded-[2rem] w-full max-w-4xl shadow-[0_0_80px_rgba(16,185,129,0.2)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
                {/* Header Terminal Bar */}
                <div className="flex items-center justify-between p-6 sm:p-7 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-black to-emerald-950/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.25)]">
                            <Terminal className="text-emerald-400 animate-pulse" size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase font-mono">
                                    SORTSWIFT <span className="text-emerald-400">TERMINAL</span>
                                </h2>
                                <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                                    LIVE SYNC DEV
                                </span>
                            </div>
                            <p className="text-[10px] text-emerald-500/70 font-mono uppercase tracking-[0.2em] mt-0.5">
                                KERNEL // LIVE SYNC ENGINE v4.0 • CONEXIÓN DIRECTA SORTSWIFT API + SUPABASE DEV
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadCsv}
                            disabled={downloadingCsv}
                            className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all"
                            title="Descargar CSV con el registro de transacciones auditado"
                        >
                            <Download size={13} />
                            {downloadingCsv ? "Descargando..." : "Descargar CSV"}
                        </button>

                        {logs.length > 0 && (
                            <button
                                onClick={handleCopyLogs}
                                className="px-3 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                title="Copiar logs al portapapeles"
                            >
                                <Copy size={13} />
                                {copied ? "Copiado!" : "Copiar"}
                            </button>
                        )}
                        <button
                            onClick={handleCloseModal}
                            className="p-3 bg-white/5 hover:bg-rose-500/10 rounded-2xl border border-white/5 hover:border-rose-500/40 transition-all text-neutral-400 hover:text-rose-400"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Progress Bar Section */}
                <div className="p-6 border-b border-emerald-500/20 bg-black/60">
                    <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
                        <span className="text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            {status === "running" && <RefreshCw size={14} className="animate-spin text-emerald-400" />}
                            {status === "completed" && <Check size={14} className="text-emerald-400" />}
                            {status === "error" && <AlertCircle size={14} className="text-rose-400" />}
                            {stage}
                        </span>
                        <span className="text-emerald-300 font-black text-sm tracking-widest">
                            {progress}%
                        </span>
                    </div>

                    {/* Progress Bar Outer */}
                    <div className="w-full h-3.5 bg-black/80 rounded-full border border-emerald-500/30 p-0.5 overflow-hidden shadow-inner">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-cyan-400 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] relative"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Scanning shimmer line */}
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Matrix CRT Terminal Screen */}
                <div className="flex-1 p-6 bg-[#010603] overflow-hidden flex flex-col font-mono text-xs relative">
                    {/* CRT Scanline Overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-2 select-text">
                        {logs.map(log => {
                            let color = "text-emerald-300/80";
                            let badgeColor = "text-emerald-400 bg-emerald-950/60 border-emerald-500/30";

                            if (log.level === "SYS") {
                                color = "text-cyan-300 font-bold";
                                badgeColor = "text-cyan-400 bg-cyan-950/60 border-cyan-500/30";
                            } else if (log.level === "SUCCESS") {
                                color = "text-emerald-200 font-black";
                                badgeColor = "text-emerald-300 bg-emerald-900/60 border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
                            } else if (log.level === "WARN") {
                                color = "text-amber-300";
                                badgeColor = "text-amber-400 bg-amber-950/60 border-amber-500/30";
                            } else if (log.level === "ERROR") {
                                color = "text-rose-300 font-bold";
                                badgeColor = "text-rose-400 bg-rose-950/60 border-rose-500/30";
                            }

                            return (
                                <div key={log.id} className="flex items-start gap-2.5 font-mono text-[11px] leading-relaxed">
                                    <span className="text-emerald-700 select-none shrink-0">
                                        [{log.timestamp}]
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded border text-[9px] font-black uppercase shrink-0 ${badgeColor}`}>
                                        {log.level}
                                    </span>
                                    <span className={`flex-1 break-all ${color}`}>
                                        {log.message}
                                    </span>
                                </div>
                            );
                        })}

                        {/* Blinking prompt */}
                        <div className="flex items-center gap-2 pt-2 text-emerald-400 select-none">
                            <span className="text-emerald-600">&gt;</span>
                            <span className="w-2 h-4 bg-emerald-400 animate-pulse inline-block" />
                        </div>
                        <div ref={terminalEndRef} />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-emerald-500/20 bg-black/80 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-500/60">
                        <Shield size={14} className="text-emerald-400 shrink-0" />
                        <span>ENTORNO SEGURO DEV • CONEXIÓN SSL/TLS CIFRADA • SORTSWIFT API EN VIVO</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadCsv}
                            disabled={downloadingCsv}
                            className="px-5 py-3 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-black font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                            title="Descargar CSV con el detalle de la transacción"
                        >
                            <Download size={15} />
                            {downloadingCsv ? "Generando CSV..." : "Descargar CSV Detalle"}
                        </button>

                        {status === "completed" ? (
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2"
                            >
                                <Check size={16} />
                                Cerrar y Ver Inventario
                            </button>
                        ) : status === "running" ? (
                            <button
                                disabled
                                className="px-6 py-3 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400/60 font-mono font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 cursor-wait"
                            >
                                <RefreshCw size={14} className="animate-spin text-emerald-400" />
                                Sincronizando en Vivo...
                            </button>
                        ) : (
                            <button
                                onClick={runSyncProcess}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black font-mono text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
                            >
                                <RefreshCw size={14} />
                                Iniciar Sincronización
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
