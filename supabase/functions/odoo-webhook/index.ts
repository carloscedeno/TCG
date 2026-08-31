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

    const envSecret = Deno.env.get('ODOO_WEBHOOK_SECRET');
    const validTokens = ['geekorium_secret_2026', 'geekorium_odoo_secret_2026'];
    if (envSecret) validTokens.push(envSecret);

    if (!token || !validTokens.includes(token)) {
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

    // Dual-Sync Architecture (Prevent infinite loops via x-forwarded-sync header)
    const isForwarded = req.headers.get('x-forwarded-sync') === 'true';
    const isDev = supabaseUrl.includes('bqfkqnnostzaqueujdms');
    const isProd = supabaseUrl.includes('sxuotvogwvmxuvwbsscv');

    if (!isForwarded) {
        let targetUrl = '';
        if (isDev) {
            targetUrl = `https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/odoo-webhook?token=${EXPECTED_TOKEN}`;
        } else if (isProd) {
            targetUrl = `https://bqfkqnnostzaqueujdms.supabase.co/functions/v1/odoo-webhook?token=${EXPECTED_TOKEN}`;
        }

        if (targetUrl) {
            try {
                fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-forwarded-sync': 'true' },
                    body: JSON.stringify(body)
                }).catch(err => console.error("Async forward error:", err.message));
            } catch (fwdError: any) {
                console.error("Error initiating forward:", fwdError.message);
            }
        }
    }

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

      // 1. Is it a Sales Order (from Web or Odoo)?
      if (record.amount_total !== undefined || record.order_line !== undefined || record.model === 'sale.order' || (record.name && record.name.startsWith('S'))) {
        const odooOrderName = record.name;
        const webOrderId = record.client_order_ref;
        const odooOrderId = record.id;
        
        console.log(`[Odoo Webhook] Processing Sales Order: ${odooOrderName} (Web ID: ${webOrderId || 'None - Created in Odoo'})`);
        
        try {
          const uid = await getOdooUid();
          
          // A) Fetch full Sales Order from Odoo
          const soResult = await odooJsonRpc(odooUrl!, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [
              odooDb, uid, odooApiKey, 
              'sale.order', 
              'search_read', 
              [[['id', '=', odooOrderId]]],
              { fields: ['amount_total', 'order_line', 'partner_id', 'state', 'invoice_status', 'name'], limit: 1 }
            ]
          });
          
          if (!soResult || soResult.length === 0) {
            console.error(`[Odoo Webhook] Could not fetch Odoo SO details for ID ${odooOrderId}`);
            continue;
          }
          
          const so = soResult[0];
          const amountTotal = so.amount_total;
          const lineIds = so.order_line || [];
          const partnerId = so.partner_id ? so.partner_id[0] : null;
          
          // Determine status
          let newStatus = 'pending_payment';
          if (so.state === 'cancel') {
            newStatus = 'cancelled';
          } else if (so.invoice_status === 'invoiced') {
            newStatus = 'paid';
          }

          let targetWebOrderId = webOrderId;

          // If no webOrderId, this order originated in Odoo!
          if (!targetWebOrderId) {
            if (!partnerId) {
              console.warn(`[Odoo Webhook] SO ${odooOrderName} has no partner_id. Skipping.`);
              continue;
            }

            // Fetch partner email
            const partnerResult = await odooJsonRpc(odooUrl!, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey, 
                'res.partner', 
                'search_read', 
                [[['id', '=', partnerId]]],
                { fields: ['email'], limit: 1 }
              ]
            });

            const partnerEmail = partnerResult?.[0]?.email;
            if (!partnerEmail) {
              console.warn(`[Odoo Webhook] Partner ID ${partnerId} has no email. Skipping.`);
              continue;
            }

            // Look up Supabase user by email
            const { data: usersData } = await supabase.auth.admin.listUsers();
            const matchingUser = usersData?.users?.find((u: any) => u.email?.toLowerCase() === partnerEmail.toLowerCase());

            if (!matchingUser) {
              console.warn(`[Odoo Webhook] No Supabase user found for email ${partnerEmail}. Skipping.`);
              continue;
            }

            // Check if order already exists in Supabase by odoo_order_id
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('id')
              .eq('odoo_order_id', odooOrderName)
              .maybeSingle();

            if (existingOrder) {
              targetWebOrderId = existingOrder.id;
              await supabase.from('orders').update({
                total_amount: amountTotal,
                status: newStatus
              }).eq('id', targetWebOrderId);
            } else {
              targetWebOrderId = crypto.randomUUID();
              const { error: insErr } = await supabase.from('orders').insert({
                id: targetWebOrderId,
                user_id: matchingUser.id,
                total_amount: amountTotal,
                status: newStatus,
                odoo_order_id: odooOrderName
              });
              if (insErr) {
                console.error("[Odoo Webhook] Failed to insert new order:", insErr.message);
                continue;
              }
            }
          }

          // B) Fetch the SO Lines to get products and quantities
          let lines: any[] = [];
          if (lineIds.length > 0) {
            lines = await odooJsonRpc(odooUrl!, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey, 
                'sale.order.line', 
                'search_read', 
                [[['id', 'in', lineIds]]],
                { fields: ['product_id', 'product_uom_qty', 'price_unit', 'name'] }
              ]
            });
          }
          
          // C) Delete existing order_items for this order
          await supabase.from('order_items').delete().eq('order_id', targetWebOrderId);
          
          // D) Rebuild order_items from Odoo lines
          const productIdsInLines = lines.map((l: any) => l.product_id[0]);
          let odooProducts: any[] = [];
          if (productIdsInLines.length > 0) {
            odooProducts = await odooJsonRpc(odooUrl!, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey, 
                'product.product', 
                'search_read', 
                [[['id', 'in', productIdsInLines]]],
                { fields: ['id', 'default_code', 'name'] }
              ]
            });
          }
          
          const odooProductMap = new Map();
          for (const p of odooProducts) {
             odooProductMap.set(p.id, { default_code: p.default_code, name: p.name });
          }
          
          const newOrderItems = [];
          for (const line of lines) {
             const odooProdId = line.product_id[0];
             const prodInfo = odooProductMap.get(odooProdId);
             const defaultCode = prodInfo?.default_code;
             const productName = line.name || prodInfo?.name || "Producto de Odoo";
             
             let productId = null;
             let accessoryId = null;
             
             if (defaultCode) {
               const { data: prodData } = await supabase.from('products').select('id').eq('id', defaultCode).maybeSingle();
               if (prodData) {
                 productId = defaultCode;
               } else {
                 const { data: accData } = await supabase.from('accessories').select('id').eq('id', defaultCode).maybeSingle();
                 if (accData) {
                   accessoryId = defaultCode;
                 } else {
                   accessoryId = defaultCode; 
                 }
               }
             }
             
             newOrderItems.push({
               order_id: targetWebOrderId,
               product_id: productId,
               accessory_id: accessoryId,
               product_name: productName,
               quantity: Math.round(line.product_uom_qty),
               price_at_purchase: line.price_unit
             });
          }
          
          if (newOrderItems.length > 0) {
             const { error: insertErr } = await supabase.from('order_items').insert(newOrderItems);
             if (insertErr) {
               console.error("[Odoo Webhook] Failed to insert new order_items:", insertErr.message);
             }
          }
          
          // E) Update total_amount and status for web-origin order if applicable
          if (webOrderId) {
            await supabase.from('orders').update({ 
              status: newStatus, 
              odoo_order_id: odooOrderName,
              total_amount: amountTotal
            }).eq('id', webOrderId);
          }
          
          results.push({ id: targetWebOrderId, odoo_order_id: odooOrderName, status: 'synced_successfully' });
          
        } catch(e: any) {
          console.error("[Odoo Webhook] Order sync failed:", e.message);
          results.push({ odoo_order: odooOrderName, status: 'error', reason: e.message });
        }
        
        continue;
      }

      // 2. Is it an Event?
      if (record.date_begin !== undefined || record.is_event === true || record.model === 'event.event') {
         const odooId = record.id;
         if (!odooId) {
            results.push({ status: 'ignored', reason: 'No Odoo ID provided for event' });
            continue;
         }

         const name = record.name;
         const eventDate = record.date_begin; 
         const capacity = record.seats_max !== undefined ? parseInt(record.seats_max, 10) : null;
         
         const { data: existingEvent } = await supabase.from('events').select('id, name, event_date, capacity').eq('odoo_id', odooId).maybeSingle();
         
         const eventData: any = {
           odoo_id: odooId,
           is_active: true
         };
         if (name) eventData.name = name;
         if (eventDate) eventData.event_date = eventDate;
         if (capacity !== null) eventData.capacity = capacity;
         
         if (existingEvent) {
            // Anti-loop check: only update if something actually changed
            const nameChanged = name && existingEvent.name !== name;
            const dateChanged = eventDate && existingEvent.event_date !== eventDate;
            const capacityChanged = capacity !== null && existingEvent.capacity !== capacity;

            if (!nameChanged && !dateChanged && !capacityChanged) {
               results.push({ id: existingEvent.id, status: 'ignored_no_changes' });
               continue;
            }

            const { error: eventErr } = await supabase.from('events').update(eventData).eq('id', existingEvent.id);
            if (eventErr) {
               results.push({ id: odooId, status: 'error_updating_event', reason: eventErr.message });
            } else {
               results.push({ id: existingEvent.id, status: 'updated_event_via_odoo' });
            }
         } else {
            // Need a name and date_begin at least for a new event
            if (!name || !eventDate) {
               results.push({ id: odooId, status: 'error', reason: 'Missing name or date_begin for new event' });
               continue;
            }
            const { error: eventErr } = await supabase.from('events').insert(eventData);
            if (eventErr) {
               results.push({ id: odooId, status: 'error_creating_event', reason: eventErr.message });
            } else {
               results.push({ id: odooId, status: 'created_event_via_odoo' });
            }
         }
         continue;
      }

      // 3. Is it a Product/Accessory?
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
            language: 'Spanish',
            image_url: `https://geekorium1.odoo.com/web/image/product.product/${odooId}/image_1024`
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
