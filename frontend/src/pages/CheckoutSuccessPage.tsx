import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShoppingBag, ExternalLink } from 'lucide-react';

export const CheckoutSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const orderId = location.state?.orderId;
    const trackingUrl = orderId ? `${window.location.origin}/order/${orderId}` : null;

    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-neutral-900 border border-white/10 rounded-2xl p-12 text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-geeko-green/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <CheckCircle className="text-geeko-green" size={48} />
                </div>

                <h1 className="text-3xl font-black text-white mb-4">¡Orden Confirmada!</h1>
                <p className="text-neutral-400 mb-6">
                    Gracias por tu compra. Hemos recibido tu pedido y estamos procesándolo. Recibirás un correo de confirmación pronto.
                </p>

                {trackingUrl && (
                    <div className="bg-black/50 border border-[#00AEB4]/30 rounded-xl p-4 mb-8">
                        <p className="text-xs font-black uppercase tracking-widest text-[#00AEB4] mb-2">URL de Seguimiento</p>
                        <p className="text-xs text-neutral-300 mb-3">Guarda este enlace único para ver el estado de tu pedido y subir tu comprobante de pago:</p>
                        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-lg p-3">
                            <input
                                readOnly
                                value={trackingUrl}
                                className="bg-transparent border-none text-white text-xs font-mono w-full outline-none"
                            />
                            <button
                                onClick={() => navigator.clipboard.writeText(trackingUrl)}
                                className="text-[#00AEB4] hover:text-white transition-colors"
                                title="Copiar al portapapeles"
                            >
                                <ExternalLink size={16} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white text-black font-black uppercase rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Volver a la Tienda <ArrowRight size={20} />
                    </button>
                    {orderId ? (
                        <Link
                            to={`/order/${orderId}`}
                            className="w-full py-4 bg-transparent border border-[#00AEB4]/30 text-[#00AEB4] font-bold uppercase rounded-xl hover:bg-[#00AEB4]/10 transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={20} /> Rastrear Pedido
                        </Link>
                    ) : (
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-full py-4 bg-transparent border border-white/10 text-neutral-400 font-bold uppercase rounded-xl hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={20} /> Ver mis Pedidos
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
