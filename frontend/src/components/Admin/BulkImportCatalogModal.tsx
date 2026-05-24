import { X, PackagePlus } from "lucide-react";
import { BulkImport } from "../collections/BulkImport";

interface BulkImportCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkImportCatalogModal({ isOpen, onClose, onSuccess }: BulkImportCatalogModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#050505] border border-white/10 rounded-[2rem] w-full max-w-5xl shadow-[0_0_100px_rgba(249,115,22,0.1)] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                            <PackagePlus className="text-orange-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Importar Catálogo</h2>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Terminal de Carga Masiva de Accesorios y Productos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group p-4 bg-white/5 hover:bg-red-500/10 rounded-2xl border border-white/5 hover:border-red-500/50 transition-all duration-300"
                    >
                        <X size={20} className="text-neutral-500 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    <BulkImport
                        importType="catalog"
                        onImportComplete={() => {
                            onSuccess();
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
