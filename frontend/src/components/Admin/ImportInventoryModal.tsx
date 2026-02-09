import { X, PackagePlus } from "lucide-react";
import { BulkImport } from "../collections/BulkImport";

interface ImportInventoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ImportInventoryModal({ isOpen, onClose, onSuccess }: ImportInventoryModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#050505] border border-white/10 rounded-[2rem] w-full max-w-5xl shadow-[0_0_100px_rgba(168,85,247,0.1)] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                            <PackagePlus className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Sync Warehouse</h2>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em] mt-1">Bulk Import Operations Terminal</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="group p-4 bg-white/5 hover:bg-red-500/10 rounded-2xl border border-white/5 hover:border-red-500/50 transition-all duration-300"
                    >
                        <X size={20} className="text-neutral-500 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[url('/grid.svg')] bg-fixed bg-center bg-no-repeat bg-cover">
                    <BulkImport
                        importType="inventory"
                        onImportComplete={() => {
                            onSuccess();
                            // Optional: Close handled by BulkImport's step flow or user interaction,
                            // but usually user wants to see the success message.
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
