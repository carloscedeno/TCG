import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AuthModal } from './components/Auth/AuthModal';
import { AlertCircle } from 'lucide-react';
import ScrollToTop from './components/Navigation/ScrollToTop';
import { AdminRoute } from './components/Auth/AdminRoute';
import { WhatsAppWidget } from './components/Navigation/WhatsAppWidget';
import { WelcomeModal } from './components/Navigation/WelcomeModal';
import { PosSessionBanner } from './components/Admin/PosSessionBanner';
import { PwaReloadPrompt } from './components/Navigation/PwaReloadPrompt';
import { BottomNav } from './components/Navigation/BottomNav';

// Lazy loaded routes
const Profile = lazy(() => import('./pages/Profile'));
const TournamentHub = lazy(() => import('./pages/TournamentHub'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ImportCollection = lazy(() => import('./pages/ImportCollection'));
const InventoryPage = lazy(() => import('./pages/Admin/InventoryPage'));
const OrdersPage = lazy(() => import('./pages/Admin/OrdersPage'));
const CardDetail = lazy(() => import('./pages/CardDetail').then(m => ({ default: m.CardDetail })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = lazy(() => import('./pages/CheckoutSuccessPage').then(m => ({ default: m.CheckoutSuccessPage })));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then(m => ({ default: m.OrderTrackingPage })));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const LoginPage = lazy(() => import('./pages/Admin/LoginPage'));
const CustomersPage = lazy(() => import('./pages/Admin/CustomersPage'));
const CatalogPage = lazy(() => import('./pages/Admin/CatalogPage'));
const BannersPage = lazy(() => import('./pages/Admin/BannersPage').then(m => ({ default: m.BannersPage })));
const TcgBannersPage = lazy(() => import('./pages/Admin/TcgBannersPage').then(m => ({ default: m.TcgBannersPage })));
const EventsPage = lazy(() => import('./pages/Admin/EventsPage').then(m => ({ default: m.EventsPage })));
const PresalesPage = lazy(() => import('./pages/Admin/PresalesPage').then(m => ({ default: m.PresalesPage })));
const CategoriesPage = lazy(() => import('./pages/Admin/CategoriesPage'));
const MediaPage = lazy(() => import('./pages/Admin/MediaPage'));
const AdminRankingsPage = lazy(() => import('./pages/Admin/AdminRankingsPage'));
const RankingsPage = lazy(() => import('./pages/RankingsPage'));

const isSupabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

const GlobalAuthModal = () => {
    const { isAuthModalOpen, closeAuthModal } = useAuth();
    return <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />;
};

function App() {
    if (!isSupabaseConfigured) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
                <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertCircle className="text-red-500" size={32} />
                    </div>
                    <div className="flex justify-center mb-4">
                        <img src="/logo-emporio.png" alt="Geekorium El Emporio" className="h-8 object-contain" />
                    </div>
                    <p className="text-neutral-400 text-sm font-medium mb-8 leading-relaxed">
                        Supabase environment variables are missing. Please configure <code className="text-white bg-white/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="text-white bg-white/10 px-1.5 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in your deployment environment.
                    </p>
                    <div className="space-y-3">
                        <a
                            href="https://github.com/carloscedeno/TCG/settings/secrets/actions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-full hover:bg-white hover:text-white transition-all transform active:scale-95 shadow-xl"
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
            <GlobalAuthModal />
            <CartProvider>
                <Router basename="/">
                    <ScrollToTop />
                    <PosSessionBanner />
                    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="w-12 h-12 border-4 border-geeko-cyan/20 border-t-geeko-cyan rounded-full animate-spin"></div></div>}>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/card/:id" element={<CardDetail />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/import" element={<ImportCollection />} />
                            <Route path="/tournaments" element={<TournamentHub />} />
                            <Route path="/rankings" element={<RankingsPage />} />

                            <Route path="/help" element={<HelpPage />} />
                            <Route path="/legal" element={<LegalPage />} />
                            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                            <Route path="/admin/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
                            <Route path="/admin/catalog" element={<AdminRoute><CatalogPage /></AdminRoute>} />
                            <Route path="/admin/categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
                            <Route path="/admin/accessories" element={<Navigate to="/admin/catalog" replace />} />
                            <Route path="/admin/orders" element={<AdminRoute><OrdersPage /></AdminRoute>} />
                            <Route path="/admin/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
                            <Route path="/admin/banners" element={<AdminRoute><BannersPage /></AdminRoute>} />
                            <Route path="/admin/banners-tcg" element={<AdminRoute><TcgBannersPage /></AdminRoute>} />
                            <Route path="/admin/presales" element={<AdminRoute><PresalesPage /></AdminRoute>} />
                            <Route path="/admin/events" element={<AdminRoute><EventsPage /></AdminRoute>} />
                            <Route path="/admin/rankings" element={<AdminRoute><AdminRankingsPage /></AdminRoute>} />
                            <Route path="/admin/media" element={<AdminRoute><MediaPage /></AdminRoute>} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                            <Route path="/product/:id" element={<CardDetail />} />
                            <Route path="/order/:orderId" element={<OrderTrackingPage />} />

                            <Route path="/update-password" element={<UpdatePassword />} />
                            <Route path="/geeko-login" element={<LoginPage />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                    <WelcomeModal />
                    <WhatsAppWidget />
                    <PwaReloadPrompt />
                    <BottomNav />
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
