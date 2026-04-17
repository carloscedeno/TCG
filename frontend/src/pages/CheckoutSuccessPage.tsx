import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, ShoppingBag, AlertCircle, FileDown } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Receipt HTML Generator
// Produces a standalone, print-ready HTML page opened in a new tab.
// No external libraries needed — pure HTML/CSS.
// ─────────────────────────────────────────────────────────────────────────────
function generateReceiptHTML({
    orderId,
    items,
    total,
    customerInfo,
}: {
    orderId: string;
    items: any[];
    total: number;
    customerInfo?: { full_name: string; whatsapp: string; email: string } | null;
}) {
    const itemRows = (items || [])
        .map((item: any) => {
            const setLabel = item.set ? ` <span style="color:#6b7280;">[${String(item.set).toUpperCase()}] #${item.collector_number || ''}</span>` : '';
            const finishBadge = item.foil
                ? `<span style="background:#7c3aed;color:#fff;font-size:9px;font-weight:900;padding:2px 5px;border-radius:3px;letter-spacing:1px;margin-left:6px;">FOIL</span>`
                : '';
            const demandBadge = item.is_on_demand
                ? `<span style="background:#d97706;color:#fff;font-size:9px;font-weight:900;padding:2px 5px;border-radius:3px;letter-spacing:1px;margin-left:4px;">ENCARGO</span>`
                : '';
            return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#374151;">
            <span style="font-family:monospace;color:#6b7280;margin-right:8px;">x${item.quantity}</span>
            <strong style="color:#111827;">${item.name}</strong>${setLabel}
            ${finishBadge}${demandBadge}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-family:monospace;font-weight:700;font-size:14px;color:#00AEB4;">
            $${(item.price * item.quantity).toFixed(2)}
          </td>
        </tr>`;
        })
        .join('');

    const customerBlock = customerInfo
        ? `<div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:28px;">
          <p style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:10px;">Datos del Cliente</p>
          <p style="font-size:14px;line-height:2;color:#374151;">
            <strong style="color:#111827;">Nombre:</strong> ${customerInfo.full_name}<br>
            <strong style="color:#111827;">WhatsApp:</strong> ${customerInfo.whatsapp}<br>
            <strong style="color:#111827;">Correo:</strong> ${customerInfo.email}
          </p>
        </div>`
        : '';

    const dateStr = new Date().toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante #${orderId || 'PENDIENTE'} — Geekorium</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6;
      padding: 40px 20px;
      color: #111827;
    }
    .page {
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      padding: 48px 44px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.08);
    }
    .header { text-align: center; margin-bottom: 32px; }
    .logo-text {
      font-size: 26px; font-weight: 900; letter-spacing: -1px; color: #111827;
    }
    .logo-sub { font-size: 12px; color: #9ca3af; margin-top: 2px; letter-spacing: 3px; text-transform: uppercase; }
    .cyan-bar { width: 48px; height: 4px; background: #00AEB4; border-radius: 2px; margin: 12px auto 0; }
    .order-box {
      background: #f0fdfd;
      border: 1px solid #99f6e4;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .order-box .label { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #0d9488; }
    .order-box .value { font-family: monospace; font-size: 13px; font-weight: 700; color: #111827; word-break: break-all; max-width: 340px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    thead th {
      font-size: 11px; font-weight: 900; text-transform: uppercase;
      letter-spacing: 1.5px; color: #9ca3af; border-bottom: 2px solid #e5e7eb;
      padding: 0 0 10px 0; text-align: left;
    }
    thead th:last-child { text-align: right; }
    .total-row td {
      border-top: 2px solid #111827;
      padding-top: 14px;
      font-size: 16px;
      font-weight: 900;
      color: #111827;
    }
    .total-row td:last-child { text-align: right; font-family: monospace; }
    .footer {
      text-align: center;
      margin-top: 36px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
      line-height: 1.9;
    }
    .status-pill {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fcd34d;
      border-radius: 20px;
      padding: 5px 14px;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 14px;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 32px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-text">Geekorium</div>
      <div class="logo-sub">Comprobante de Pedido</div>
      <div class="cyan-bar"></div>
    </div>

    <div class="order-box">
      <span class="label">Orden ID</span>
      <span class="value">${orderId || 'PENDIENTE'}</span>
    </div>

    ${customerBlock}

    <p style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;margin-bottom:12px;">Detalle del Pedido</p>
    <table>
      <thead>
        <tr>
          <th>Artículo</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tbody>
        <tr class="total-row">
          <td>Total Estimado</td>
          <td>$${Number(total || 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>Este comprobante confirma que tu pedido fue recibido.</p>
      <p>Un <strong style="color:#374151;">Geeko-Asesor</strong> coordinará el pago y entrega por WhatsApp.</p>
      <p style="margin-top:6px;">📧 info@geekorium.shop</p>
      <div class="status-pill">⏳ Pendiente de Confirmación</div>
      <p style="margin-top:18px;font-size:10px;color:#d1d5db;">Generado el ${dateStr}</p>
    </div>
  </div>

  <script>
    // Auto-open print dialog after fonts load
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 400);
    });
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
export const CheckoutSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderId, items, total, customerInfo } = location.state || {};

    // If we have an ID but it's not 'PENDIENTE', we can build a real URL
    const isRealOrder = orderId && orderId !== 'PENDIENTE';

    const handleDownloadPDF = () => {
        const html = generateReceiptHTML({ orderId, items, total, customerInfo });
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

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
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mb-6 text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-4">Resumen del Pedido</p>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto mb-4 pr-2 custom-scrollbar">
                            {items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex gap-3 items-center min-w-0">
                                        <span className="text-neutral-500 font-mono text-xs">x{item.quantity}</span>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-white font-bold truncate">{item.name}</span>
                                            {item.set && (
                                                <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">
                                                    {item.set} #{item.collector_number}
                                                </span>
                                            )}
                                        </div>
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

                {/* PDF Download Button */}
                {items && items.length > 0 && (
                    <button
                        onClick={handleDownloadPDF}
                        className="w-full py-3.5 mb-6 bg-[#00AEB4]/10 border border-[#00AEB4]/30 text-[#00AEB4] hover:bg-[#00AEB4]/20 hover:border-[#00AEB4]/60 rounded-xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <FileDown size={16} />
                        Descargar Comprobante (PDF)
                    </button>
                )}

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
