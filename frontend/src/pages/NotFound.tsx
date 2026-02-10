import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <h1 className="text-6xl font-black italic text-geeko-cyan mb-4">404</h1>
            <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-neutral-400">Página no encontrada</h2>
            <Link
                to="/"
                className="px-8 py-3 bg-neutral-900 border border-white/10 rounded-full font-black text-xs uppercase tracking-widest hover:border-geeko-cyan hover:text-geeko-cyan transition-all"
            >
                Volver al Inicio
            </Link>
        </div>
    );
};

export default NotFound;
