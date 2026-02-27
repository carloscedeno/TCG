/**
 * smoke_test_foil.mjs
 * Verifica que la Edge Function tcg-api genera entradas foil virtuales
 * para cartas que tienen prices.usd_foil en la DB, y NO las genera para las que no.
 *
 * Estrategia: 10 sets × 10 cards = 100 requests totales
 * - cards CON usd_foil  → deben tener entrada foil en all_versions
 * - cards SIN usd_foil  → NO deben tener entrada foil en all_versions
 *
 * Uso: node smoke_test_foil.mjs
 */

const API_BASE = 'https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dW90dm9nd3ZteHV2d2Jzc2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjUyNzUsImV4cCI6MjA4MjcwMTI3NX0.0qL7dIEnwg22RyORGX06G97VjdH4C8_l4Qgm2oPEYTY';
const HEADERS = { 'Authorization': `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' };

// 10 sets × 10 cards (mezcla con y sin usd_foil según la DB)
const TEST_CARDS = [
    // CON = Conflux (2009, tiene foil en la mayoría)
    { id: '29b7a8b1-b98e-483a-87a4-73bd831c03d4', name: 'Path to Exile', set: 'CON', hasFoil: true, foilPrice: 7.92 },
    { id: '90665426-118e-4f0b-8222-1b516678a2f5', name: 'Cylian Sunsinger', set: 'CON', hasFoil: true, foilPrice: 0.63 },
    { id: 'cb032cd3-96a4-4cef-bb89-0843f2ed8189', name: 'Aven Trailblazer', set: 'CON', hasFoil: true, foilPrice: 0.26 },
    { id: 'e2a179b9-e962-49a4-ad92-8cd0291296c1', name: 'Scarland Thrinax', set: 'CON', hasFoil: true, foilPrice: 0.49 },
    { id: 'd74d6cdb-a087-4b3d-bf25-509200ed6d93', name: 'Scattershot Archer', set: 'CON', hasFoil: true, foilPrice: 4.63 },
    { id: '1e9f43c8-9df6-49df-b145-4a19bc55e8f4', name: 'Rhox Bodyguard', set: 'CON', hasFoil: false, foilPrice: null },
    { id: '28fd2dce-b91f-441f-a3ea-af87cc925713', name: 'Toxic Iguanar', set: 'CON', hasFoil: true, foilPrice: 0.50 },
    { id: '5cc12ebe-54d8-4b91-8c68-3cde5690e26a', name: 'Obelisk of Alara', set: 'CON', hasFoil: true, foilPrice: 1.20 },
    { id: '258c7201-02b0-4e16-9fa6-0a79631e7724', name: 'Gluttonous Slime', set: 'CON', hasFoil: true, foilPrice: 1.87 },
    { id: '21f7e17c-45df-45e9-8dcf-7fc90fa4d65d', name: 'Scepter of Fugue', set: 'CON', hasFoil: true, foilPrice: 0.90 },
    // DDN = Duel Decks Speed vs Cunning (sin foil en casi todas)
    { id: 'b05b371c-e66b-4219-863e-95e3ddca4a71', name: 'Goblin', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: '44f76f49-b04e-4f67-aaa7-abd9e6d028cb', name: 'Act of Treason', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: '0c0b85d3-ce46-4f12-8315-4cbf338eb8f0', name: 'Goblin Deathraiders', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: '9745cc70-d6a0-43c5-b8d7-a930d95e94c7', name: 'Leonin Snarecaster', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: 'c7b2e97a-76f7-438d-9e4f-2447d468366f', name: 'Fleeting Distraction', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: '9128ec7b-5321-4810-b5e9-5d4c15644ecd', name: 'Mana Leak', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: 'f24906cd-9ace-4684-94b9-a66dc4fe5162', name: 'Infantry Veteran', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: '4acaef84-55d1-43dc-b10a-696182e6709b', name: 'Repeal', set: 'DDN', hasFoil: false, foilPrice: null },
    { id: '31f21aae-e25b-4d14-b558-a848a9372f92', name: 'Zurgo Helmsmasher', set: 'DDN', hasFoil: true, foilPrice: 0.60 },
    { id: '52dd1712-6937-4630-b44c-952699307da4', name: 'Fury of the Horde', set: 'DDN', hasFoil: false, foilPrice: null },
    // G17 = 2017 Gift Pack (solo foil, sin nonfoil)
    { id: '9a1636d7-2c04-4dfa-8501-0bd9771e3ddc', name: 'Mountain (g17)', set: 'G17', hasFoil: true, foilPrice: 0.42 },
    { id: '8326b99f-9ccd-401e-aef9-9473303d10a0', name: 'Island (g17)', set: 'G17', hasFoil: true, foilPrice: 0.48 },
    { id: 'f7720870-b6cc-4833-930d-6da05b36d17a', name: 'Plains (g17)', set: 'G17', hasFoil: true, foilPrice: 0.42 },
    { id: '049528b8-f922-4671-931d-9b37640d5a07', name: 'Forest (g17)', set: 'G17', hasFoil: true, foilPrice: 0.42 },
    { id: '75384818-7003-4a9a-9da8-9b2455d98a4e', name: 'Swamp (g17)', set: 'G17', hasFoil: true, foilPrice: 0.55 },
    // MMA = Modern Masters (todos con foil)
    { id: '3102b0df-04c0-418c-a316-c8ea8660e9f7', name: 'Stingscourger', set: 'MMA', hasFoil: true, foilPrice: 0.35 },
    { id: '776b5512-2520-4fd5-87a3-f8a5c56769ad', name: 'Worm Harvest', set: 'MMA', hasFoil: true, foilPrice: 0.83 },
    { id: 'a1a25f62-0ef5-4941-b9af-1ce1a63fb5e8', name: 'Facevaulter', set: 'MMA', hasFoil: true, foilPrice: 0.17 },
    { id: '035c3112-222d-4362-9109-c8b872a59a2b', name: 'Lotus Bloom', set: 'MMA', hasFoil: true, foilPrice: 7.27 },
    { id: 'c285b3a0-a27c-4416-a1b5-90219a5c7800', name: 'Relic of Progenitus', set: 'MMA', hasFoil: true, foilPrice: 7.29 },
    { id: '19cd6bcc-ca47-47cc-9fe4-c29e9c176485', name: 'Paradise Mantle', set: 'MMA', hasFoil: true, foilPrice: 19.44 },
    { id: '2a60afc2-d383-4a52-8a0e-0d9dc68fed03', name: "Executioner's Capsule", set: 'MMA', hasFoil: true, foilPrice: 0.74 },
    { id: 'a12788a7-5309-4a23-930d-009dc3305cef', name: 'Pallid Mycoderm', set: 'MMA', hasFoil: true, foilPrice: 0.32 },
    { id: '2b922fc5-602b-4f92-9588-00a77a9d803c', name: 'Greater Gargadon', set: 'MMA', hasFoil: true, foilPrice: 2.69 },
    { id: 'aa2c9306-b065-4813-8817-ae46a7725b5e', name: 'Academy Ruins', set: 'MMA', hasFoil: true, foilPrice: 15.72 },
    // PCMP = Champs and States (mezcla)
    { id: '521a1843-e604-4954-be21-38b31867f670', name: 'Electrolyze', set: 'PCMP', hasFoil: false, foilPrice: null },
    { id: '6f5725dc-82a7-48b3-857e-7ccbf3726cbd', name: "Urza's Factory", set: 'PCMP', hasFoil: false, foilPrice: null },
    { id: 'f3e3374a-e2e3-4c81-aa4f-098b190bbf66', name: 'Serra Avenger', set: 'PCMP', hasFoil: true, foilPrice: 61.19 },
    { id: 'f78edb37-e36e-4761-8293-154744040d65', name: 'Doran, the Siege Tower', set: 'PCMP', hasFoil: true, foilPrice: 199.00 },
    { id: '265c269e-1b5e-4e5f-873f-7733bd4142aa', name: 'Voidslime', set: 'PCMP', hasFoil: true, foilPrice: 41.18 },
    { id: '1692ba5a-7ccd-4623-876d-a587d6491cec', name: 'Groundbreaker', set: 'PCMP', hasFoil: true, foilPrice: 43.48 },
    { id: '64d02c9b-7362-4479-b26d-7de843bd2ac3', name: 'Blood Knight', set: 'PCMP', hasFoil: false, foilPrice: null },
    // PMPS = Magic Premiere Shop 2005 (todos foil, set especial)
    { id: '994bbfff-a8f2-46d9-87bb-f694f9216c07', name: 'Island (pmps-1)', set: 'PMPS', hasFoil: true, foilPrice: 24.95 },
    { id: '5a2512b0-0f2e-4b56-b9f1-888c11bbaa55', name: 'Plains (pmps-1)', set: 'PMPS', hasFoil: true, foilPrice: 14.95 },
    { id: '74fd6522-505d-4f74-99e3-1efeee415992', name: 'Forest (pmps)', set: 'PMPS', hasFoil: true, foilPrice: 15.69 },
    { id: '013d50da-98c2-4f33-b478-7c6230f0267e', name: 'Mountain (pmps)', set: 'PMPS', hasFoil: true, foilPrice: 32.50 },
    { id: '4fefd1b1-5c7b-421f-9011-f666893c0320', name: 'Swamp (pmps)', set: 'PMPS', hasFoil: true, foilPrice: 24.56 },
    { id: '21b74c08-c7cf-4df3-b3f3-c4f07c599f86', name: 'Plains (pmps-2)', set: 'PMPS', hasFoil: true, foilPrice: 49.25 },
    { id: 'd198de62-32be-41e1-8d4b-c47fe5ff87a0', name: 'Swamp (pmps-2)', set: 'PMPS', hasFoil: true, foilPrice: 25.99 },
    // PVAN = Vanguard Series (sin foil, serie de cartas especiales)
    { id: '1cc16638-093d-4010-89ae-a1e564921e62', name: 'Squee (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: 'af5cc745-7072-4f7f-94eb-c7670cb498ff', name: 'Oracle (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: 'a320e0f4-bcc9-4bfa-8e05-b62f9752c01c', name: 'Tahngarth (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: '3b7de05c-e5aa-421a-bf16-b16fef8fc6ef', name: 'Titania (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: '4e485e72-bca0-46d5-b59d-89f17389ec26', name: 'Rofellos (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: '991f614e-7550-46ca-9091-96167d780c6c', name: 'Crovax (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: '90e5cab2-b540-4c04-9fb1-be193888f605', name: 'Sliver Queen Brood', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: '3309d7fc-6cff-4599-b480-042d3dfa3342', name: 'Lyna (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: '286ec938-81a2-4626-b340-b7aa0192a4bd', name: 'Greven il-Vec', set: 'PVAN', hasFoil: false, foilPrice: null },
    { id: 'f0c696d1-0b5d-4102-ad93-46cb8e1e5d91', name: 'Xantcha (Vanguard)', set: 'PVAN', hasFoil: false, foilPrice: null },
    // SCG = Scourge (2003, todos con foil)
    { id: 'de53d083-251e-42a4-9e2e-c2978c80615b', name: 'Karona, False God', set: 'SCG', hasFoil: true, foilPrice: 58.18 },
    { id: '760a66bd-2821-4710-8f02-3c30772dd884', name: 'Reaping the Graves', set: 'SCG', hasFoil: true, foilPrice: 11.87 },
    { id: 'df6e8844-3736-4fb1-bedb-6a6bfa6ccdc8', name: 'Reward the Faithful', set: 'SCG', hasFoil: true, foilPrice: 3.90 },
    { id: '18f26b88-cffc-47ed-a70a-7d704a32c8bb', name: 'Daru Spiritualist', set: 'SCG', hasFoil: true, foilPrice: 1.55 },
    { id: '3b57b41c-f99c-4525-8541-f025b7e31974', name: 'Ancient Ooze', set: 'SCG', hasFoil: true, foilPrice: 15.09 },
    { id: '2bd3e13d-53f8-42bf-aa83-09a9ca94a9f0', name: 'Bladewing the Risen', set: 'SCG', hasFoil: true, foilPrice: 60.36 },
    { id: 'a633d85b-4be1-44a2-8fd8-1ccec4a95ecb', name: 'Mistform Warchief', set: 'SCG', hasFoil: true, foilPrice: 2.96 },
    { id: 'defbbd3a-0e7d-4af2-b25f-9003ddad0bf5', name: 'Grip of Chaos', set: 'SCG', hasFoil: true, foilPrice: 12.71 },
    { id: '5e8a7e5c-f252-4de8-94d7-e7327210bf26', name: 'Decree of Justice', set: 'SCG', hasFoil: true, foilPrice: 68.84 },
    { id: '88042031-64af-4f84-85d5-95992b43aa6c', name: 'Carrion Feeder', set: 'SCG', hasFoil: true, foilPrice: 41.96 },
    // TMT = Teenage Mutant Ninja Turtles (sin precios en su mayoría)
    { id: '183c6c8d-3e5c-4a7b-bd5a-cbaa0a781a58', name: 'Raphael, Ninja Destroyer', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: 'e1a866e6-4108-4290-9680-8f1652fbcf77', name: 'Primordial Pachyderm', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: '8cca5d97-c754-4d8a-8f59-b59a712a8fd0', name: 'Dark Leo & Shredder', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: 'e640e930-0907-40f2-9015-88f8c1e8ee5c', name: 'Broadcast Takeover', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: '8f946b3d-7d2a-4210-a909-d16078757e3b', name: 'Shark Shredder', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: '2884abe5-80f4-4beb-850a-98f91ee929e3', name: "Leonardo's Technique", set: 'TMT', hasFoil: false, foilPrice: null },
    { id: '9982e108-69d7-4a80-950d-4e30af140fe0', name: 'Casey Jones', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: '82bc7c05-d107-43db-89ba-5c5984925d72', name: 'Donatello', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: '3942f813-6241-49f5-8df3-e60e2e332410', name: 'Krang, Master Mind', set: 'TMT', hasFoil: false, foilPrice: null },
    { id: '0825a28f-f60b-4f80-83e3-cad6f9b266ce', name: 'Ninja Teen', set: 'TMT', hasFoil: true, foilPrice: 49.99 },
    // W16 = Welcome Deck 2016 (sin foil)
    { id: '8363865b-23f9-4cca-beb4-a5d467caff4c', name: 'Mind Rot', set: 'W16', hasFoil: false, foilPrice: null },
    { id: '9b434a60-0875-47f4-a626-2c9bfa3c9b3b', name: 'Cone of Flame', set: 'W16', hasFoil: false, foilPrice: null },
    { id: '41eaedf2-38be-4825-a711-3cc0f7659ae3', name: 'Borderland Marauder', set: 'W16', hasFoil: false, foilPrice: null },
    { id: '01007d7f-e29b-49d5-bc60-44b2fb77ed3d', name: 'Air Servant', set: 'W16', hasFoil: false, foilPrice: null },
    { id: 'ca25d8fe-93b3-4d2c-96df-ca6e4f528543', name: 'Shivan Dragon', set: 'W16', hasFoil: false, foilPrice: null },
    { id: '3e28d7bb-4520-4cf4-85c9-c56f5da40d82', name: 'Sengir Vampire', set: 'W16', hasFoil: false, foilPrice: null },
    { id: 'c8017c06-82ea-4661-b422-e5b9089842e2', name: 'Disperse', set: 'W16', hasFoil: false, foilPrice: null },
    { id: 'afc8ec11-78cc-438f-9e49-50089fd247e6', name: 'Nightmare', set: 'W16', hasFoil: false, foilPrice: null },
    { id: '98485e9e-dbac-44dd-a446-ef3ef81830c1', name: 'Walking Corpse', set: 'W16', hasFoil: false, foilPrice: null },
    { id: 'e90aaa61-3281-4e8f-9eb3-548896d0c14d', name: 'Incremental Growth', set: 'W16', hasFoil: false, foilPrice: null },
];

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

async function testCard(card) {
    const url = `${API_BASE}/${card.id}`;
    let data;
    try {
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) {
            return { ...card, status: 'ERROR', reason: `HTTP ${res.status}` };
        }
        data = await res.json();
    } catch (e) {
        return { ...card, status: 'ERROR', reason: e.message };
    }

    const allVersions = data.all_versions ?? [];

    // Buscar entradas foil para este printing_id específico
    // La API genera el id foil como '{uuid}-foil' pero el printing_id base es el mismo
    const foilEntry = allVersions.find(v =>
        (v.printing_id === card.id || v.printing_id === `${card.id}-foil`) &&
        (v.is_foil === true || v.finish === 'foil')
    );

    const issues = [];

    if (card.hasFoil) {
        // Debe existir entrada foil
        if (!foilEntry) {
            issues.push('❌ falta entrada foil en all_versions');
        } else {
            // Verificar precio foil (tolerancia de $1 para variaciones de mercado)
            const actualPrice = parseFloat(foilEntry.price ?? 0);
            const diff = Math.abs(actualPrice - card.foilPrice);
            if (diff > 1.00) {
                issues.push(`⚠ precio foil: got $${actualPrice.toFixed(2)}, expected $${card.foilPrice}`);
            }
        }
    } else {
        // NO debe existir entrada foil para este printing
        if (foilEntry) {
            issues.push('❌ tiene entrada foil inesperada (DB no tiene usd_foil)');
        }
    }

    return {
        ...card,
        status: issues.length === 0 ? 'PASS' : (issues.some(i => i.startsWith('❌')) ? 'FAIL' : 'WARN'),
        reason: issues.join(' | '),
        allVersionsCount: allVersions.length,
        foilFound: !!foilEntry,
        foilPrice_actual: foilEntry ? parseFloat(foilEntry.price ?? 0).toFixed(2) : null,
    };
}

async function main() {
    console.log(`\n🃏  ${CYAN}TCG-API Foil Smoke Test — 10 Sets × 10 Cards${RESET}`);
    console.log('='.repeat(75));
    console.log(`Testing ${TEST_CARDS.length} cards from 10 different sets in production...\n`);

    // Ejecutar en lotes de 10 para no saturar la API
    const results = [];
    for (let i = 0; i < TEST_CARDS.length; i += 10) {
        const batch = TEST_CARDS.slice(i, i + 10);
        const batchResults = await Promise.all(batch.map(testCard));
        results.push(...batchResults);
        // Mostrar progreso
        process.stdout.write(`  Progress: ${Math.min(i + 10, TEST_CARDS.length)}/${TEST_CARDS.length} cards tested...\r`);
    }
    console.log('');

    // Agrupar por set
    const bySet = {};
    for (const r of results) {
        if (!bySet[r.set]) bySet[r.set] = [];
        bySet[r.set].push(r);
    }

    let totalPass = 0, totalFail = 0, totalWarn = 0, totalError = 0;

    for (const [setCode, cards] of Object.entries(bySet)) {
        const setPass = cards.filter(c => c.status === 'PASS').length;
        const setFail = cards.filter(c => c.status === 'FAIL').length;
        const setWarn = cards.filter(c => c.status === 'WARN').length;
        const setError = cards.filter(c => c.status === 'ERROR').length;
        const setOk = setFail === 0 && setError === 0;

        console.log(`\n${setOk ? GREEN : RED}[${setCode}]${RESET} ${cards[0].set} — ${setPass}✓ ${setFail > 0 ? RED + setFail + '✗' + RESET : '0✗'} ${setWarn > 0 ? setWarn + '⚠' : ''}`);

        for (const r of cards) {
            const icon = r.status === 'PASS' ? `${GREEN}✓${RESET}` : r.status === 'WARN' ? `\x1b[33m⚠${RESET}` : r.status === 'ERROR' ? '\x1b[33m?${RESET}' : `${RED}✗${RESET}`;
            const foilMark = r.hasFoil ? `${CYAN}[FOIL $${r.foilPrice}]${RESET}` : `${DIM}[no foil]${RESET}`;
            const actual = r.foilPrice_actual ? ` → got $${r.foilPrice_actual}` : '';
            console.log(`  ${icon} ${r.name.padEnd(30)} ${foilMark}${actual}${r.reason ? '\n      ' + r.reason : ''}`);

            totalPass += r.status === 'PASS' ? 1 : 0;
            totalFail += r.status === 'FAIL' ? 1 : 0;
            totalWarn += r.status === 'WARN' ? 1 : 0;
            totalError += r.status === 'ERROR' ? 1 : 0;
        }
    }

    console.log('\n' + '='.repeat(75));
    const allGood = totalFail === 0 && totalError === 0;
    console.log(`${allGood ? GREEN : RED}Results: ${totalPass} passed | ${totalFail} failed | ${totalWarn} warnings | ${totalError} errors${RESET}`);
    console.log('='.repeat(75) + '\n');

    process.exit(allGood ? 0 : 1);
}

main().catch(console.error);
