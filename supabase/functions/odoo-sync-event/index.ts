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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("[Odoo Sync Event] Received payload:", JSON.stringify(payload));

    const record = payload.record;
    if (!record || (payload.type !== 'INSERT' && payload.type !== 'UPDATE')) {
      return new Response(JSON.stringify({ message: "Ignored" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { id, name, event_date, capacity, odoo_id } = record;

    const odooUrl = Deno.env.get('ODOO_URL');
    const odooDb = Deno.env.get('ODOO_DB');
    const odooUsername = Deno.env.get('ODOO_USERNAME');
    const odooApiKey = Deno.env.get('ODOO_API_KEY');

    if (!odooUrl || !odooDb || !odooUsername || !odooApiKey) {
      throw new Error("Missing Odoo credentials.");
    }

    const uid = await odooJsonRpc(odooUrl, 'call', {
      service: 'common',
      method: 'authenticate',
      args: [odooDb, odooUsername, odooApiKey, {}]
    });

    const odooData: any = {
       name: name,
       date_begin: event_date,
       date_end: event_date // simplify for now
    };
    if (capacity) odooData.seats_max = capacity;

    let newOdooId = odoo_id;

    if (!odoo_id) {
        // Create in Odoo
        console.log("Creating new event in Odoo...");
        newOdooId = await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [odooDb, uid, odooApiKey, 'event.event', 'create', [odooData]]
        });
        
        // Update Supabase with the new odoo_id
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase.from('events').update({ odoo_id: newOdooId }).eq('id', id);
        console.log(`Successfully created event ${newOdooId} in Odoo and updated Supabase.`);

    } else {
        // Update in Odoo
        console.log(`Updating existing event ${odoo_id} in Odoo...`);
        await odooJsonRpc(odooUrl, 'call', {
            service: 'object',
            method: 'execute_kw',
            args: [odooDb, uid, odooApiKey, 'event.event', 'write', [[odoo_id], odooData]]
        });
        console.log(`Successfully updated event ${odoo_id} in Odoo.`);
    }

    return new Response(JSON.stringify({ success: true, odoo_id: newOdooId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("[Odoo Sync Event] Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
