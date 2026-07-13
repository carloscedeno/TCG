import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChunkErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Check if the error is related to failing to fetch a chunk
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed');

    if (isChunkLoadError) {
      // Reload the page to get the new chunks from the server
      console.log('Chunk load error detected. Reloading page...');
      window.location.reload();
    }
  }

  public render() {
    if (this.state.hasError) {
      // Return a very simple fallback or nothing since the page will reload immediately
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

    return this.props.children;
  }
}
