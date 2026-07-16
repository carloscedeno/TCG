const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envDev = fs.readFileSync('../.env.dev', 'utf8');
const url = envDev.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = envDev.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

supabase.from('card_printings').select('printing_id, name:cards!inner(card_name), image_url, collector_number, set_code, card_id').ilike('cards.card_name', '%//%').limit(5).then(res => {
  if (res.error) console.error(res.error);
  else console.log("With //:", JSON.stringify(res.data, null, 2));
});
