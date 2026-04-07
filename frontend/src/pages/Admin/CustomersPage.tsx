import React from 'react';
import { CartManager } from '../../components/Admin/CartManager';
import { Shield } from 'lucide-react';

const CustomersPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="text-geeko-cyan w-5 h-5" />
                            <span className="text-geeko-cyan font-black text-xs tracking-widest uppercase">Sistema de Atención</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter italic">GESTIÓN DE <span className="text-geeko-cyan">CLIENTES</span></h1>
                        <p className="text-slate-500 text-sm font-bold mt-2 uppercase tracking-widest">Multi-Cart Terminal v1.0</p>
                    </div>
                </div>

                <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl shadow-2xl">
                    <CartManager />
                </div>

                <div className="mt-12 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
                    Geekorium Point of Sale Ecosystem • 2026
                </div>
            </div>
        </div>
    );
};

export default CustomersPage;
