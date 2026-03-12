import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShoppingBag, AlertCircle } from 'lucide-react';

export const CheckoutSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, items, total } = location.state || {};

    // If we have an ID but it's not 'PENDIENTE', we can build a real URL
    const isRealOrder = orderId && orderId !== 'PENDIENTE';


    return (
        <div className="min-h-[100dvh] bg-[#080808] flex items-center justify-center p-4 py-12">
            <div className="max-w-lg w-full bg-neutral-900 border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center animate-in zoom-in duration-500 shadow-2xl">
                <div className="w-20 h-20 bg-geeko-green/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <CheckCircle className="text-geeko-green" size={40} />
                </div>

                <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">¡Orden Recibida!</h1>
                <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                    Tu orden ha sido generada y el stock ha sido reservado temporalmente.
                    Un Geeko-Asesor confirmará la disponibilidad física de las cartas antes de pedirte el pago final.
                </p>

                {/* Order Summary */}
                {items && items.length > 0 && (
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-8 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-4">Resumen del Pedido</p>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
                            {items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex gap-3 items-center min-w-0">
                                        <span className="text-neutral-500 font-mono text-xs">x{item.quantity}</span>
                                        <span className="text-white font-bold truncate">{item.name}</span>
                                        {item.foil && <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-black uppercase">Foil</span>}
                                        {item.is_on_demand && <span className="text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-black uppercase italic">Por Encargo</span>}
                                    </div>
                                    <span className="text-geeko-cyan font-mono font-bold ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-white">Total</span>
                            <span className="text-xl font-black font-mono text-white">${total?.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Tracking button is preserved below in the primary actions section */}


                {!isRealOrder && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl mb-8 flex items-start gap-3 text-left">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                        <p className="text-[11px] text-amber-500/80 leading-relaxed font-medium">
                            No se generó un ID de seguimiento único. Puedes revisar tus pedidos en tu perfil o contactar a soporte si es necesario.
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                        Volver a la Tienda <ArrowRight size={18} />
                    </button>
                    {isRealOrder ? (
                        <Link
                            to={`/order/${orderId}`}
                            className="w-full py-4 bg-transparent border border-geeko-cyan/30 text-geeko-cyan font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:bg-geeko-cyan/10 transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={18} /> Rastrear Pedido
                        </Link>
                    ) : (
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full py-4 bg-transparent border border-white/10 text-neutral-400 font-black uppercase text-xs tracking-[0.2em] rounded-xl hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={18} /> Ver mis Pedidos
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
