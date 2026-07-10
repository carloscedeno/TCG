import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-odoo-token',
};

const EXPECTED_TOKEN = Deno.env.get('ODOO_WEBHOOK_SECRET') || 'geekorium_secret_2026';

// Helper for Odoo RPC
async function odooJsonRpc(url: string, method: string, params: any) {
  const payload = {
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: Math.floor(Math.random() * 1000000)
  };

  const response = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const json = await response.json();
  if (json.error) {
    throw new Error(`Odoo RPC Error: ${json.error.data?.message || json.error.message}`);
  }
  return json.result;
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Security Check
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization') || req.headers.get('X-Odoo-Token');
    const token = authHeader?.replace('Bearer ', '')?.trim() || url.searchParams.get('token');

    if (token !== EXPECTED_TOKEN) {
      console.error("Unauthorized webhook attempt");
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse Payload
    const body = await req.json();
    console.log("[Odoo Webhook] Received payload:", JSON.stringify(body));

    const records = Array.isArray(body) ? body : (body.records || body.data || [body]);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Odoo credentials for call-back
    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');

    const results = [];
    let odooUid: number | null = null;

    // Helper to authenticate to Odoo if needed
    const getOdooUid = async () => {
      if (odooUid) return odooUid;
      if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
        throw new Error("Missing Odoo credentials for callback.");
      }
      odooUid = await odooJsonRpc(odooUrl, 'call', {
        service: 'common',
        method: 'authenticate',
        args: [odooDb, odooUsername, odooApiKey, {}]
      });
      return odooUid;
    };

    // 3. Process Updates
    for (const record of records) {
      // DEBUG LOGGING
      try {
        await supabase.from('accessories').insert({
          id: crypto.randomUUID(),
          name: JSON.stringify(record).substring(0, 200),
          category: 'Accesorios',
          is_active: false,
          language: 'Spanish',
          unit_type: 'Unidad'
        });
      } catch (e) {}

      // 1. Is it a Sales Order confirmation?
      if (record.client_order_ref && record.state === 'sale') {
        const odooOrderName = record.name;
        const webOrderId = record.client_order_ref;
        
        console.log(`[Odoo Webhook] Sales Order Confirmed: ${odooOrderName} for Web Order ${webOrderId}`);
        
        // Update web order
        const { error: orderErr } = await supabase
          .from('orders')
          .update({ status: 'paid', odoo_order_id: odooOrderName })
          .eq('id', webOrderId);
          
        if (orderErr) {
          console.error("Failed to update web order:", orderErr);
          results.push({ id: webOrderId, status: 'error', reason: orderErr.message });
        } else {
          results.push({ id: webOrderId, status: 'confirmed_via_odoo' });
        }
        continue;
      }

      const defaultCode = record.default_code || record.product?.default_code;
      const price = record.list_price ?? record.product?.list_price;
      const stock = record.qty_available ?? record.product?.qty_available;
      const name = record.name ?? record.display_name ?? record.product?.name ?? record.product?.display_name ?? "Nuevo Producto desde Odoo";
      const odooId = record.id ?? record.product?.id ?? record._id;

      if (!defaultCode) {
        // --- CREATE OR UPDATE VIA ODOO ID FLOW ---
        if (!odooId) {
           results.push({ status: 'ignored', reason: 'No default_code and no Odoo ID provided' });
           continue;
        }

        // Check if it already exists by odoo_id
        const { data: existingAcc } = await supabase.from('accessories').select('id').eq('odoo_id', odooId).maybeSingle();
        
        let targetUuid = existingAcc?.id;

        if (!existingAcc) {
          console.log(`[Odoo Webhook] Creating new accessory from Odoo ID: ${odooId}`);
          targetUuid = crypto.randomUUID();

          // 1. Insert into Supabase accessories table
          const insertData = {
            id: targetUuid,
            odoo_id: parseInt(odooId, 10),
            name: name,
            price: price !== undefined ? parseFloat(price) : 0,
            stock: stock !== undefined ? parseInt(stock, 10) : 0,
            category: 'Accesorios', // Default category
            is_active: true,
            unit_type: 'Unidad',
            language: 'Spanish'
          };

          const { error: insertErr } = await supabase.from('accessories').insert(insertData);
          
          if (insertErr) {
            if (insertErr.code === '23505') {
              console.log(`[Odoo Webhook] Odoo ID ${odooId} already inserted by parallel request.`);
              // We can just fetch it again
              const { data: retryAcc } = await supabase.from('accessories').select('id').eq('odoo_id', odooId).single();
              if (retryAcc) targetUuid = retryAcc.id;
            } else {
              console.error("DB Insert Error:", insertErr);
              results.push({ id: odooId, status: 'error', reason: 'Failed to insert into Supabase', error: insertErr.message });
              continue;
            }
          }
          results.push({ id: targetUuid, status: 'created', source_odoo_id: odooId });
        } else {
          // Update existing
          const updateData: any = {};
          if (price !== undefined) updateData.price = parseFloat(price);
          if (stock !== undefined) updateData.stock = parseInt(stock, 10);
          if (record.name) updateData.name = record.name;

          if (Object.keys(updateData).length > 0) {
            await supabase.from('accessories').update(updateData).eq('id', targetUuid);
            results.push({ id: targetUuid, status: 'updated_via_odooid', data: updateData });
          }
        }

        // 2. Update Odoo's default_code async to prevent deadlock (fire and forget)
        if (targetUuid) {
          const updateOdoo = async () => {
            // Wait 2 seconds so Odoo can finish its current transaction lock
            await new Promise(r => setTimeout(r, 2000));
            try {
              const uid = await getOdooUid();
              await odooJsonRpc(odooUrl!, 'call', {
                service: 'object',
                method: 'execute_kw',
                args: [
                  odooDb, uid, odooApiKey, 
                  'product.product', 
                  'write', 
                  [[parseInt(odooId, 10)], { default_code: targetUuid }]
                ]
              });
              console.log(`[Odoo Webhook] Successfully updated Odoo default_code for ID ${odooId}`);
            } catch (rpcErr: any) {
              console.error("[Odoo Webhook] Async Odoo RPC Error:", rpcErr.message);
            }
          };
          // Do not await, let it run
          updateOdoo();
        }
        
      } else {
        // --- UPDATE FLOW (Product already has a default_code) ---
        let table = 'products';
        let { data: item, error: productErr } = await supabase.from('products').select('id').eq('id', defaultCode).maybeSingle();
        
        if (!item) {
          table = 'accessories';
          const { data: accItem } = await supabase.from('accessories').select('id').eq('id', defaultCode).maybeSingle();
          item = accItem;
        }

        if (item) {
          const updateData: any = {};
          if (price !== undefined) updateData.price = parseFloat(price);
          if (stock !== undefined) updateData.stock = parseInt(stock, 10);
          if (record.name) updateData.name = record.name; // Update name if provided

          if (Object.keys(updateData).length > 0) {
            const { error } = await supabase.from(table).update(updateData).eq('id', defaultCode);
            if (error) {
              results.push({ id: defaultCode, status: 'error', error: error.message });
            } else {
              results.push({ id: defaultCode, status: 'updated', data: updateData, table });
            }
          } else {
            results.push({ id: defaultCode, status: 'ignored', reason: 'No fields to update' });
          }
        } else {
          // It has a default_code but it's not in our DB. 
          // It might be a product created in Odoo that they manually gave a random default_code to.
          results.push({ id: defaultCode, status: 'ignored', reason: 'ID not found in DB' });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("[Odoo Webhook] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
