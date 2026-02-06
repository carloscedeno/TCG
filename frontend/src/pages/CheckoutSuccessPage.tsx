import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShoppingBag } from 'lucide-react';

export const CheckoutSuccessPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-neutral-900 border border-white/10 rounded-2xl p-12 text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-geeko-green/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                    <CheckCircle className="text-geeko-green" size={48} />
                </div>

                <h1 className="text-3xl font-black text-white mb-4">¡Orden Confirmada!</h1>
                <p className="text-neutral-400 mb-8">
                    Gracias por tu compra. Hemos recibido tu pedido y estamos procesándolo. Recibirás un correo de confirmación pronto.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-4 bg-white text-black font-black uppercase rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Volver a la Tienda <ArrowRight size={20} />
                    </button>
                    { /* TODO: Link to /orders when ready */}
                    <button
                        onClick={() => navigate('/profile')} // Assuming profile will have orders
                        className="w-full py-4 bg-transparent border border-white/10 text-neutral-400 font-bold uppercase rounded-xl hover:border-white/30 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={20} /> Ver mis Pedidos
                    </button>
                </div>
            </div>
        </div>
    );
};
