import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import TournamentHub from './pages/TournamentHub';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import ImportCollection from './pages/ImportCollection';
import { CardDetail } from './pages/CardDetail';
import { AuthProvider } from './context/AuthContext';
import { AlertCircle } from 'lucide-react';

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

function App() {
    if (!isSupabaseConfigured) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
                <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4">
                        Configuration Error
                    </h1>
                    <p className="text-neutral-400 text-sm font-medium mb-8 leading-relaxed">
                        Supabase environment variables are missing. Please configure <code className="text-geeko-cyan bg-geeko-cyan/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="text-geeko-cyan bg-geeko-cyan/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in your deployment environment.
                    </p>
                    <div className="space-y-3">
                        <a
                            href="https://github.com/carloscedeno/TCG/settings/secrets/actions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-geeko-cyan hover:text-white transition-all transform active:scale-95 shadow-xl"
                        >
                            Configure GitHub Secrets
                        </a>
                        <button
                            onClick={() => window.location.reload()}
                            className="block w-full py-4 bg-transparent text-neutral-500 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-white transition-colors"
                        >
                            Check Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AuthProvider>
            <Router basename="/TCG">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/card/:id" element={<CardDetail />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/import" element={<ImportCollection />} />
                    <Route path="/tournaments" element={<TournamentHub />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
