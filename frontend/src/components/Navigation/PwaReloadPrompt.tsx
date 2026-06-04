import React from 'react';
// @ts-ignore - plugin-pwa type definitions might not be instantly available
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const PwaReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: any) {
      // eslint-disable-next-line prefer-template
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error)
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-neutral-900 border border-geeko-cyan/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,209,255,0.2)] animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-white font-bold mb-1 flex items-center gap-2">
            <RefreshCw size={16} className="text-geeko-cyan animate-spin-slow" />
            Actualización Disponible
          </h3>
          <p className="text-neutral-400 text-sm mb-4">
            Hay una nueva versión de la aplicación con mejoras y correcciones.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 bg-geeko-cyan text-black font-bold py-2 px-4 rounded-xl text-sm hover:bg-cyan-400 transition-colors"
            >
              Actualizar Ahora
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-4 py-2 bg-white/5 text-white font-bold rounded-xl text-sm hover:bg-white/10 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-neutral-500 hover:text-white transition-colors p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
