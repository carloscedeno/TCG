import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join('..', '.env'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) {
    env[key.trim()] = val.join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_SERVICE_ROLE_KEY'] || env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const url = `${supabaseUrl}/rest/v1/ranking_seasons`;

async function seed() {
  const data = [
    { title: 'TOP 20', subtitle: '2026/SEASON 2', game_context: 'GND', is_active: true },
    { title: 'LIGA DE CAMPEONES', subtitle: 'VERANO 2026', game_context: 'MTG', is_active: true }
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error inserting seasons:", errorText);
    } else {
      console.log("Seasons inserted successfully");
    }
  } catch(e) {
    console.error(e);
  }
}

seed();
