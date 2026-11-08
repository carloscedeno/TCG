import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_URL_OVERRIDE') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const WEBHOOK_SECRET = Deno.env.get('ODOO_WEBHOOK_SECRET')

    const urlObj = new URL(req.url)
    const urlSecret = urlObj.searchParams.get('secret')

    if (urlSecret !== WEBHOOK_SECRET) {
      console.warn('Unauthorized webhook request from Odoo.')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const rawBody = await req.json()
    console.log("Raw Odoo Webhook Payload (Event Sync):", JSON.stringify(rawBody))

    const supabase = createClient(supabaseUrl, supabaseKey)
    const records = Array.isArray(rawBody) ? rawBody : [rawBody]

    for (const record of records) {
        if (!record.id) continue;
        
        // Map Odoo event fields to Supabase events table
        const eventData = {
            odoo_id: record.id,
            name: record.name || 'Unnamed Event',
            event_date: record.date_begin,
            capacity: record.seats_max > 0 ? record.seats_max : null,
            is_active: record.active !== false && record.is_published !== false,
            description: record.note || '',
            image_url: record.x_image_url || null,
            game_code: record.x_game_code || null,
            format: record.x_format || null,
            entry_fee: record.x_entry_fee || null,
        };

        console.log(`Upserting event: ${eventData.name} (Odoo ID: ${eventData.odoo_id})`);

        const { error } = await supabase
            .from('events')
            .upsert(eventData, { onConflict: 'odoo_id' });
            
        if (error) {
            console.error(`Error upserting event ${eventData.odoo_id}:`, error);
        }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error(`Error processing event webhook: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
