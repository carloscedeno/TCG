import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulate() {
  console.log("=== Iniciando Simulación de Rankings Jerárquicos ===");

  // 1. Crear Temporada MAGIC
  const { data: magicSeason, error: err1 } = await supabase.from('ranking_seasons').insert({
    title: 'Magic: Liga de Facciones',
    subtitle: 'Temporada de Verano 2026',
    description: 'La gran liga inter-facciones de Magic The Gathering. Elige tu equipo y lucha por la victoria.',
    game_context: 'MTG',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Magicthegathering-logo.svg/1200px-Magicthegathering-logo.svg.png',
    is_active: true
  }).select().single();

  if (err1) throw err1;
  console.log(`✅ Temporada creada: ${magicSeason.title}`);

  // 2. Crear Equipos/Categorías para Magic
  const categories = [
    { name: 'Los Dragones de Tarkir', description: 'Furia y fuego puro.', image_url: 'https://cdn-icons-png.flaticon.com/512/10040/10040378.png' },
    { name: 'Sindicato de Orzhov', description: 'Riqueza y extorsión.', image_url: 'https://cdn-icons-png.flaticon.com/512/10040/10040375.png' }
  ];

  const catIds = [];
  for (const cat of categories) {
    const { data: cData, error: cErr } = await supabase.from('ranking_categories').insert({
      season_id: magicSeason.id,
      name: cat.name,
      description: cat.description,
      image_url: cat.image_url
    }).select().single();
    if (cErr) throw cErr;
    catIds.push(cData.id);
    console.log(`✅ Categoría/Equipo creado: ${cData.name}`);
  }

  // 3. Crear Subcategorías dentro del primer equipo (Opcional, para demostrar jerarquía)
  const { data: subCat, error: subErr } = await supabase.from('ranking_categories').insert({
    season_id: magicSeason.id,
    parent_id: catIds[0],
    name: 'Escuadrón de Élite',
    description: 'Los mejores jugadores de Tarkir.',
    image_url: 'https://cdn-icons-png.flaticon.com/512/10040/10040376.png'
  }).select().single();
  if (subErr) throw subErr;
  console.log(`✅ Subcategoría creada: ${subCat.name} (Hijo de ${categories[0].name})`);

  // 4. Crear Rangos (Tiers)
  const tiers = [
    { name: 'Novato', order_index: 1 },
    { name: 'Veterano', order_index: 2 },
    { name: 'Maestro', order_index: 3 }
  ];

  const tierIds = [];
  for (const tier of tiers) {
    const { data: tData, error: tErr } = await supabase.from('ranking_tiers').insert({
      season_id: magicSeason.id,
      name: tier.name,
      order_index: tier.order_index
    }).select().single();
    if (tErr) throw tErr;
    tierIds.push(tData.id);
  }
  console.log(`✅ ${tierIds.length} Rangos creados.`);

  // 5. Crear Jugadores de Prueba (con user_id = null por simplicidad)
  const players = [
    { season_id: magicSeason.id, category_id: catIds[0], name: 'Carlos (Admin)', points: 1500, tier_id: tierIds[2] },
    { season_id: magicSeason.id, category_id: subCat.id, name: 'Aníbal', points: 1200, tier_id: tierIds[1] },
    { season_id: magicSeason.id, category_id: catIds[1], name: 'Valerie', points: 900, tier_id: tierIds[0] },
    { season_id: magicSeason.id, category_id: null, name: 'Jugador Solitario', points: 500, tier_id: tierIds[0] } // Sin equipo
  ];

  for (const p of players) {
    const { error: pErr } = await supabase.from('ranking_players').insert(p);
    if (pErr) throw pErr;
    console.log(`✅ Jugador añadido: ${p.name}`);
  }

  console.log("=== Simulación Completada Exitosamente ===");
}

simulate().catch(console.error);
