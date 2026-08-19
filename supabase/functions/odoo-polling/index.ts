import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function odooJsonRpc(url: string, method: string, params: any) {
  const payload = {
    jsonrpc: "2.0",
    method: method,
    params: params,
    id: Math.floor(Math.random() * 1000000)
  };

  const response = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 GeekoriumSync/1.0'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (json.error) {
      throw new Error(`Odoo RPC Error: ${json.error.data?.message || json.error.message}`);
    }
    return json.result;
  } catch (err: any) {
    throw new Error(`Failed to parse Odoo response from ${url}/jsonrpc: ${err.message}. Response: ${text ? text.substring(0, 100) : ''}`);
  }
}

// Function to get UTC string 'YYYY-MM-DD HH:MM:SS'
function getOdooTimeString(minutesAgo: number): string {
  const date = new Date(Date.now() - minutesAgo * 60000);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');

    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
      throw new Error("Missing Odoo credentials.");
    }

    console.log("[Odoo Polling] Starting poll...");
    
    // Authenticate
    const uid = await odooJsonRpc(odooUrl, 'call', {
      service: 'common',
      method: 'authenticate',
      args: [odooDb, odooUsername, odooApiKey, {}]
    });

    if (!uid) throw new Error("Authentication failed with Odoo.");

    const timeString = getOdooTimeString(10); // Poll last 10 minutes
    console.log(`[Odoo Polling] Checking for updates since ${timeString}`);

    const results: any = { orders: [], events: [], products: [] };

    // ============================================
    // 1. Fetch Updated Sales Orders
    // ============================================
    const orders = await odooJsonRpc(odooUrl, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [
        odooDb, uid, odooApiKey, 
        'sale.order', 
        'search_read', 
        [[['write_date', '>=', timeString], ['state', '=', 'sale'], ['client_order_ref', '!=', false]]],
        { fields: ['id', 'name', 'client_order_ref', 'amount_total', 'order_line'] }
      ]
    });

    for (const so of orders) {
      const odooOrderName = so.name;
      const webOrderId = so.client_order_ref;
      const odooOrderId = so.id;
      const amountTotal = so.amount_total;
      
      const { data: existingOrder } = await supabase.from('orders').select('status').eq('id', webOrderId).maybeSingle();
      
      if (existingOrder && existingOrder.status !== 'paid') {
        console.log(`[Odoo Polling] Marking Web Order ${webOrderId} as paid (Odoo SO: ${odooOrderName})`);
        // Note: we can sync lines here if needed, but since we created the order from the web, the lines are already there.
        // We just mark it as paid.
        const { error } = await supabase
          .from('orders')
          .update({ status: 'paid', odoo_order_id: odooOrderName, total_amount: amountTotal })
          .eq('id', webOrderId);
          
        if (error) console.error("Error updating order:", error);
        else results.orders.push(webOrderId);
      }
    }

    // ============================================
    // 2. Fetch Updated Events
    // ============================================
    const events = await odooJsonRpc(odooUrl, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [
        odooDb, uid, odooApiKey, 
        'event.event', 
        'search_read', 
        [[['write_date', '>=', timeString]]],
        { fields: ['id', 'name', 'date_begin', 'seats_max'] }
      ]
    });

    for (const ev of events) {
      const odooId = ev.id;
      const capacity = ev.seats_max ? parseInt(ev.seats_max, 10) : null;
      
      const { data: existingEvent } = await supabase.from('events').select('id').eq('odoo_id', odooId).maybeSingle();
      const eventData: any = { odoo_id: odooId, is_active: true, name: ev.name, event_date: ev.date_begin };
      if (capacity !== null) eventData.capacity = capacity;

      if (existingEvent) {
        await supabase.from('events').update(eventData).eq('id', existingEvent.id);
        results.events.push({ id: existingEvent.id, action: 'updated' });
      } else {
        await supabase.from('events').insert(eventData);
        results.events.push({ odoo_id: odooId, action: 'created' });
      }
    }

    // ============================================
    // 3. Fetch Updated Products from Odoo -> Supabase (Accessories)
    // ============================================
    const products = await odooJsonRpc(odooUrl, 'call', {
      service: 'object',
      method: 'execute_kw',
      args: [
        odooDb, uid, odooApiKey, 
        'product.product', 
        'search_read', 
        [[['write_date', '>=', timeString]]],
        { fields: ['id', 'name', 'display_name', 'default_code', 'list_price', 'qty_available'] }
      ]
    });

    for (const record of products) {
      const defaultCode = record.default_code;
      const price = record.list_price;
      const stock = record.qty_available;
      const name = record.display_name || record.name;
      const odooId = record.id;

      if (!defaultCode) {
        // Create new accessory if it has no default_code yet
        const { data: existingAcc } = await supabase.from('accessories').select('id').eq('odoo_id', odooId).maybeSingle();
        let targetUuid = existingAcc?.id;

        if (!existingAcc) {
          targetUuid = crypto.randomUUID();
          await supabase.from('accessories').insert({
            id: targetUuid,
            odoo_id: parseInt(odooId, 10),
            name: name,
            price: price !== undefined ? parseFloat(price) : 0,
            stock: stock !== undefined ? parseInt(stock, 10) : 0,
            category: 'Accesorios',
            is_active: true,
            unit_type: 'Unidad',
            language: 'Spanish'
          });
          results.products.push({ action: 'created', id: targetUuid });

          // Update Odoo's default_code async
          (async () => {
             try {
                await odooJsonRpc(odooUrl, 'call', {
                  service: 'object',
                  method: 'execute_kw',
                  args: [ odooDb, uid, odooApiKey, 'product.product', 'write', [[parseInt(odooId, 10)], { default_code: targetUuid }] ]
                });
             } catch(e) {}
          })();
        } else {
          await supabase.from('accessories').update({ price: parseFloat(price), stock: parseInt(stock, 10), name: name }).eq('id', targetUuid);
          results.products.push({ action: 'updated', id: targetUuid });
        }
      } else {
        // Update existing item by default_code
        let table = 'products';
        let { data: item } = await supabase.from('products').select('id').eq('id', defaultCode).maybeSingle();
        
        if (!item) {
          table = 'accessories';
          const { data: accItem } = await supabase.from('accessories').select('id').eq('id', defaultCode).maybeSingle();
          item = accItem;
        }

        if (item) {
          await supabase.from(table).update({ price: parseFloat(price), stock: parseInt(stock, 10) }).eq('id', defaultCode);
          results.products.push({ action: 'updated', id: defaultCode, table });
        }
      }
    }

    // ============================================
    // 4. Fetch Updated Singles from Supabase -> Odoo
    // ============================================
    // Get ISO string for 10 minutes ago
    const supaTimeString = new Date(Date.now() - 10 * 60000).toISOString();
    console.log(`[Odoo Polling] Checking Supabase products modified since ${supaTimeString}`);

    const { data: updatedSingles, error: singlesErr } = await supabase
      .from('products')
      .select('id, name, set_code, finish, condition, price, stock, discount_percentage')
      .gte('updated_at', supaTimeString);

    if (singlesErr) {
      console.error("Error fetching updated singles from Supabase:", singlesErr);
    } else if (updatedSingles && updatedSingles.length > 0) {
      console.log(`[Odoo Polling] Found ${updatedSingles.length} updated singles to sync to Odoo`);
      
      results.synced_singles = 0;
      
      // Helper to ensure category hierarchy
      const ensureCategory = async (catName: string, parentId?: number) => {
        const domain = [['name', '=', catName]];
        if (parentId) domain.push(['parent_id', '=', parentId]);
        const found = await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [odooDb, uid, odooApiKey, 'product.category', 'search', [domain], { limit: 1 }]
        });
        if (found && found.length > 0) return found[0];
        
        const createData: any = { name: catName };
        if (parentId) createData.parent_id = parentId;
        return await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [odooDb, uid, odooApiKey, 'product.category', 'create', [createData]]
        });
      };

      const catJuegosId = await ensureCategory("Juegos TCG");
      const catMtgId = await ensureCategory("MTG", catJuegosId);
      const catSinglesId = await ensureCategory("Singles", catMtgId);

      for (const item of updatedSingles) {
        const finishStr = item.finish === 'foil' ? ' (Foil)' : '';
        const name = `[${item.set_code}] ${item.name}${finishStr} - ${item.condition}`;
        const listPrice = item.discount_percentage && item.discount_percentage > 0 
           ? item.price * (1 - item.discount_percentage / 100)
           : item.price;

        const searchResult = await odooJsonRpc(odooUrl, 'call', {
          service: 'object',
          method: 'execute_kw',
          args: [
            odooDb, uid, odooApiKey, 
            'product.product', 
            'search', 
            [[['default_code', '=', item.id]]], 
            { limit: 1 }
          ]
        });

        if (searchResult && searchResult.length > 0) {
          // Update existing
          await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [
              odooDb, uid, odooApiKey, 
              'product.product', 
              'write', 
              [[searchResult[0]], { 
                 list_price: listPrice,
                 name: name,
                 detailed_type: 'product',
                 is_storable: true
              }]
            ]
          });
          
          // Update stock
          if (item.stock !== undefined) {
            await odooJsonRpc(odooUrl, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey, 
                'stock.quant', 
                'create', 
                [{
                  product_id: searchResult[0],
                  location_id: 8, // Standard WH/Stock location
                  inventory_quantity: item.stock
                }]
              ]
            });
            await odooJsonRpc(odooUrl, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey, 
                'stock.quant', 
                'action_apply_inventory', 
                [[]]
              ]
            });
          }
        } else {
          // Create new
          const createData: any = {
            name: name,
            default_code: item.id,
            list_price: listPrice,
            detailed_type: 'product',
            is_storable: true,
            categ_id: catSinglesId,
            description_sale: "Single importado automáticamente desde Web",
          };
          const newId = await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [odooDb, uid, odooApiKey, 'product.product', 'create', [createData]]
          });

          // Set initial stock
          if (newId && item.stock !== undefined && item.stock > 0) {
            await odooJsonRpc(odooUrl, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey, 
                'stock.quant', 
                'create', 
                [{
                  product_id: newId,
                  location_id: 8,
                  inventory_quantity: item.stock
                }]
              ]
            });
            await odooJsonRpc(odooUrl, 'call', {
              service: 'object',
              method: 'execute_kw',
              args: [
                odooDb, uid, odooApiKey, 
                'stock.quant', 
                'action_apply_inventory', 
                [[]]
              ]
            });
          }
        }
        results.synced_singles++;
      }
    }

    console.log("[Odoo Polling] Poll complete.", results);
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("[Odoo Polling] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
