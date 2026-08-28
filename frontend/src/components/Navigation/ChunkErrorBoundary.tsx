import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isChunkError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const isChunkError = 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');
      
    return { hasError: true, error, isChunkError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    if (this.state.isChunkError) {
      // Reload the page to get the new chunks from the server
      console.log('Chunk load error detected. Reloading page...');
      // Simple loop prevention logic using sessionStorage
      const reloads = parseInt(sessionStorage.getItem('chunk_error_reloads') || '0', 10);
      if (reloads < 3) {
        sessionStorage.setItem('chunk_error_reloads', (reloads + 1).toString());
        window.location.reload();
      } else {
        console.error('Too many chunk error reloads. Giving up.');
      }
    }
  }

  handleHardReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white">
            <div className="text-center animate-pulse flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#00D1FF]/20 border-t-[#00D1FF] rounded-full animate-spin"></div>
              <div>
                <h2 className="text-xl font-bold mb-2 uppercase tracking-wider">Actualizando...</h2>
                <p className="text-white/50 text-sm">Cargando la nueva versión, un momento por favor.</p>
              </div>
            </div>
          </div>
        );
      }
      
      // Real error fallback
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white p-6">
          <div className="max-w-md w-full bg-[#111] p-8 rounded-xl border border-red-500/20 text-center flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-wider text-red-400">Oops, algo salió mal</h2>
              <p className="text-white/60 text-sm mb-4">
                Ha ocurrido un error inesperado. Hemos registrado este incidente.
              </p>
              <div className="bg-black/50 p-3 rounded text-left text-xs text-red-300/70 overflow-x-auto max-w-full font-mono break-all mb-4">
                {this.state.error?.message || 'Error desconocido'}
              </div>
            </div>
            
            <button 
              onClick={this.handleHardReset}
              className="w-full py-3 bg-[#00D1FF] hover:bg-[#00D1FF]/80 text-black font-bold uppercase tracking-wider rounded transition-colors"
            >
              Solucionar Problema
            </button>
            <a 
              href="https://wa.me/584149124523" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold uppercase tracking-wider rounded transition-colors block text-center"
            >
              Contactar Soporte (WhatsApp)
            </a>
            <p className="text-xs text-white/40">
              El primer botón limpiará el caché temporal de la página e intentará recargar desde cero.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
