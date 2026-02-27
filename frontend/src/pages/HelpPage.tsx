import React from 'react';
import {
    Phone
} from 'lucide-react';
import { HelpSection } from '../components/Help/HelpSection';
import { Footer } from '../components/Navigation/Footer';

const HelpPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0a]">
            {/* Header / Nav Placeholder (Reuse standard nav or simplified back button) */}
            <div className="bg-[#121212] border-b border-white/10 p-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 group">
                        <img src="/branding/Logo.jpg" alt="Logo" className="w-10 h-10 rounded-full border border-white/10" />
                        <span className="text-xl font-black italic tracking-tighter text-white uppercase group-hover:text-geeko-cyan transition-colors">
                            Volver al Emporio
                        </span>
                    </a>
                </div>
            </div>

            <HelpSection />

            {/* Contact Footer */}
            <div className="bg-[#373266] py-12 border-t border-white/10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h3 className="text-3xl font-web-titles font-black text-white uppercase tracking-tighter mb-6">¿Aún tienes dudas?</h3>
                    <div className="flex justify-center gap-4">
                        <a href="https://wa.me/584128042832" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-3 bg-geeko-cyan hover:bg-[#009297] text-white font-bold rounded-full transition-colors shadow-lg">
                            <Phone size={18} /> Contactar Soporte
                        </a>
                    </div>
                </div>
            </div>


            <Footer />
        </div >
    );
};

export default HelpPage;
