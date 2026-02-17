import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-neutral-800 bg-[#121212] py-20 mt-20">
            <div className="max-w-[1600px] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 items-center gap-12 text-center md:text-left">
                <div className="flex flex-col gap-6 justify-center md:justify-start">
                    <Link to="/" className="flex items-center gap-4 justify-center md:justify-start group cursor-pointer text-white no-underline">
                        <img src="/branding/Logo.jpg" alt="Logo" className="w-12 h-12 rounded-full border border-white/10 group-hover:scale-110 transition-transform" />
                        <span className="text-2xl font-black tracking-tighter uppercase italic text-white"><span className="text-geeko-cyan">Geekorium</span> El Emporio</span>
                    </Link>
                    <div className="flex flex-col gap-3 text-sm font-medium text-neutral-400">
                        <a href="https://wa.me/584128042832" target="_blank" rel="noopener noreferrer" className="hover:text-geeko-cyan transition-colors">WhatsApp Principal: +58 412-8042832</a>
                        <a href="https://wa.me/584242507802" target="_blank" rel="noopener noreferrer" className="hover:text-geeko-cyan transition-colors">WhatsApp Singles: +58 424-2507802</a>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-6">
                        <a href="https://instagram.com/geekorium/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-geeko-cyan hover:text-black transition-all shadow-lg hover:shadow-geeko-cyan/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                        </a>
                        <a href="https://www.tiktok.com/@geekorium" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-geeko-cyan hover:text-black transition-all shadow-lg hover:shadow-geeko-cyan/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V18.77a6.738 6.738 0 01-1.45 4.15c-1.29 1.41-3.14 2.21-5.04 2.1c-1.95.05-3.89-.72-5.18-2.18-1.34-1.52-1.92-3.66-1.58-5.64.3-1.84 1.64-3.47 3.44-4.04 1.02-.34 2.13-.39 3.19-.15V17c-.89-.28-1.93-.11-2.69.49-.66.52-1 1.34-1.02 2.17.02 1.35 1.45 2.18 2.63 1.8 1.07-.32 1.83-1.4 1.81-2.5V3.81c0-1.27-.01-2.53-.01-3.79h-.02z" />
                            </svg>
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61573984506104" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-geeko-cyan hover:text-black transition-all shadow-lg hover:shadow-geeko-cyan/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                        </a>
                        <a href="https://discord.gg/wmYhWw5Q" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-geeko-cyan hover:text-black transition-all shadow-lg hover:shadow-geeko-cyan/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 12c-2 0-3.5 1.5-3.5 3.5v2.5h16v-2.5c0-2-1.5-3.5-3.5-3.5h-9z" /><circle cx="9" cy="9" r="2" /><circle cx="15" cy="9" r="2" /></svg>
                        </a>
                        <a href="https://www.youtube.com/@Geekorium" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-geeko-cyan hover:text-black transition-all shadow-lg hover:shadow-geeko-cyan/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 2-2 10 10 0 0 1 15 0 2 2 0 0 1 2 2 24.12 24.12 0 0 1 0 10 2 2 0 0 1-2 2 10 10 0 0 1-15 0 2 2 0 0 1-2-2Z" /><path d="m10 15 5-3-5-3z" /></svg>
                        </a>
                        <a href="https://www.twitch.tv/geekorium" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-geeko-cyan hover:text-black transition-all shadow-lg hover:shadow-geeko-cyan/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2H3v16h5v4l4-4h5l4-4V2zm-10 9V7m5 4V7" /></svg>
                        </a>
                        <a href="mailto:geekorium@gmail.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 hover:bg-geeko-cyan hover:text-black transition-all shadow-lg hover:shadow-geeko-cyan/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        </a>
                    </div>
                </div>
                <div className="text-neutral-500 text-xs font-medium text-center">
                    © 2025 Geekorium El Emporio. Plataforma Avanzada de TCG.
                </div>
                <div className="flex gap-8 text-neutral-500 text-xs font-bold uppercase tracking-widest justify-center md:justify-end">
                    <Link to="/legal" className="hover:text-geeko-cyan transition-colors">Aviso Legal</Link>
                    <Link to="/help" className="hover:text-geeko-cyan transition-colors">¿Cómo Comprar?</Link>
                </div>
            </div>
        </footer>
    );
};
