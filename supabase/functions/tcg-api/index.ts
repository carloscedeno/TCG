import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from "npm:nodemailer";

// Logic synced with api/index.ts - 2026-03-12 21:30

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SmtpHost = Deno.env.get('SMTP_SERVER') || 'smtp.hostinger.com';
const SmtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
const SmtpUser = Deno.env.get('SMTP_USERNAME');
const SmtpPass = Deno.env.get('SMTP_PASSWORD');

const transporter = nodemailer.createTransport({
    host: SmtpHost,
    port: SmtpPort,
    secure: SmtpPort === 465, // true for 465, false for other ports
    auth: {
        user: SmtpUser,
        pass: SmtpPass,
    },
});

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing Supabase environment variables')
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const url = new URL(req.url)
        const path = url.pathname
        const method = req.method

        // El frontend a veces usa /tcg-api/... o /api/...
        // Limpiamos el prefijo para la lógica interna
        const functionPrefixes = ['/functions/v1/api', '/functions/v1/tcg-api', '/tcg-api', '/api'];
        let internalPath = path;
        for (const prefix of functionPrefixes) {
            if (internalPath.startsWith(prefix)) {
                internalPath = internalPath.substring(prefix.length);
                break;
            }
        }

        let body = {}
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
            try {
                body = await req.json()
            } catch {
                body = {}
            }
        }

        // Routing
        if (internalPath === '/notifications/checkout' && method === 'POST') {
            const result = await handleNotificationsEndpoint(body)
            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Default response for other endpoints
        return new Response(
            JSON.stringify({ error: 'Endpoint not found or method not allowed', path: internalPath }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})

async function handleNotificationsEndpoint(body: any) {
    const { order_id, user_email, admin_email, order_total, items, current_user_id } = body;

    try {
        console.log(`[Email Notification] Request for order ${order_id}. SMTP_USERNAME configured: ${!!SmtpUser}`);
        if (!order_id) throw new Error("order_id is required");

        // Formatear items para el correo
        const itemsArray = Array.isArray(items) ? items : [];
        const items_html = itemsArray.map((item: any) => {
            const name = item?.products?.name || item?.name || 'Unknown Item';
            const finish = item?.products?.finish || item?.finish;
            const onDemand = item?.products?.is_on_demand || item?.is_on_demand;

            let variantLabel = '';
            if (finish === 'foil' || finish === 'etched') {
                variantLabel += ` [${finish.toUpperCase()}]`;
            }
            if (onDemand) {
                variantLabel += ` [POR ENCARGO]`;
            }

            return `<li style="margin-bottom: 8px;">
        <strong>${item?.quantity || 1}x ${name}${variantLabel}</strong> - $${(item?.products?.price || item?.price || 0).toFixed(2)}
      </li>`;
        }).join('');

        const trackingLink = `https://www.geekorium.shop/order/${order_id}`;

        const customerEmailPromise = user_email ? transporter.sendMail({
            from: `"Geekorium Shop" <${SmtpUser}>`,
            to: user_email,
            subject: `Confirmación de Pedido ${order_id} - Geekorium Shop`,
            html: `
        <html>
            <body>
                <h2>¡Gracias por tu compra en Geekorium Shop!</h2>
                <p>Tu pedido <strong>${order_id}</strong> ha sido confirmado.</p>
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Resumen de la compra:</h3>
                    <ul style="padding-left: 20px;">
                        ${items_html}
                    </ul>
                    <h3 style="margin-bottom: 0;">Total: $${Number(order_total).toFixed(2)}</h3>
                </div>
                
                <div style="margin: 30px 0; text-align: center;">
                    <a href="${trackingLink}" style="background-color: #00AEB4; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                        Rastrear mi Pedido
                    </a>
                </div>

                <p style="color: #666; font-size: 12px;">Si el botón no funciona, copia y pega este enlace: <br> ${trackingLink}</p>
                <p>Nos pondremos en contacto pronto para coordinar la entrega o pago final.</p>

            </body>
        </html>
      `,
        }) : Promise.resolve();

        const adminEmailOverride = admin_email || "geekorium.tcg@gmail.com";
        const adminEmailPromise = transporter.sendMail({
            from: `"System Notifications" <${SmtpUser}>`,
            to: adminEmailOverride,
            subject: `¡Nueva Venta! Pedido ${order_id}`,
            html: `
        <html>
            <body>
                <h2>¡Nueva Venta en Geekorium Shop!</h2>
                <p>Se ha registrado un nuevo pedido con el ID: <strong>${order_id}</strong>.</p>
                <p>ID del Usuario: ${current_user_id || 'Guest'}</p>
                <h3>Artículos comprados:</h3>
                <ul style="padding-left: 20px;">
                    ${items_html}
                </ul>
                <h3>Total: $${Number(order_total).toFixed(2)}</h3>

                <p>Por favor revisa el panel de administración para más detalles.</p>
            </body>
        </html>
      `,
        });

        await Promise.all([customerEmailPromise, adminEmailPromise]);
        return { success: true, message: "Emails sent successfully" };
    } catch (error: any) {
        console.error("Failed to send emails:", error);
        return { success: false, error: `Failed to send emails: ${error.message}` };
    }
}
