import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_MAP: Record<number, { game_code: string; game_id: number; name: string }> = {
  1: { game_code: "MTG", game_id: 22, name: "Magic: The Gathering" },
  3: { game_code: "PKM", game_id: 23, name: "Pokémon" },
  13: { game_code: "OPC", game_id: 13, name: "One Piece TCG" },
  62: { game_code: "FAB", game_id: 25, name: "Flesh and Blood" },
  63: { game_code: "DGM", game_id: 18, name: "Digimon" },
  68: { game_code: "OPC", game_id: 13, name: "One Piece TCG" },
  86: { game_code: "GND", game_id: 17, name: "Gundam Card Game" },
  89: { game_code: "RFB", game_id: 16, name: "Riftbound" },
};

const COLOR_MAP: Record<string, string> = {
  white: "W",
  blue: "U",
  black: "B",
  red: "R",
  green: "G",
};

function cleanText(val: unknown): string {
  if (!val) return "";
  if (Array.isArray(val)) return val.filter(Boolean).map(String).join(", ");
  return String(val).trim();
}

function normalizeSetName(sname: string): string {
  if (!sname) return "";
  let s = sname.trim();
  s = s.replace(/\s*\([A-Z0-9]+\)$/, "").trim();
  s = s.replace(/^10th\b/i, "Tenth");
  s = s.replace(/^9th\b/i, "Ninth");
  s = s.replace(/^8th\b/i, "Eighth");
  s = s.replace(/^7th\b/i, "Seventh");
  s = s.replace(/^6th\b/i, "Classic Sixth");
  if (s.toLowerCase() === "commander") return "Commander 2011";
  return s;
}

function deriveSetCode(setName: string, number = ""): string {
  if (!setName) return "unk";
  if (number && number.includes("-")) {
    const part = number.split("-")[0].trim();
    if (part.length >= 2 && part.length <= 6) return part.toLowerCase();
  }
  const words = setName.match(/[a-zA-Z0-9]+/g);
  if (words && words.length > 0) {
    if (words.length === 1) return words[0].slice(0, 4).toLowerCase();
    return words.map((w) => w[0]).join("").slice(0, 5).toLowerCase();
  }
  return "set";
}

function mapBinToStoreLocation(binName: string, gameCode = "MTG"): string {
  if (!binName) return "E1-N10-B01-PENDIENTE";
  const bU = binName.toUpperCase().trim();
  if (bU.includes("VAULT") || bU.includes("VITRINA")) return `E3-N01-V01-${gameCode}-ALTOVALOR`;
  if (bU.includes("CARPETA")) return `E2-N01-C01-${gameCode}-BINDER`;
  if (bU.includes("COSTE1")) return "E1-N01-B01-MTG-W-C1";
  if (bU.includes("COSTE2")) return "E1-N01-B02-MTG-W-C2";
  if (bU.includes("BULK")) return `E1-N04-B01-${gameCode}-BULK`;
  return `E1-N09-B01-${bU.slice(0, 12)}`;
}

async function fetchAllRows(
  supabase: any,
  table: string,
  selectCols: string,
  orderByCol: string,
  notNullCol?: string,
) {
  const items: any[] = [];
  const pageSize = 1000;
  let offset = 0;
  while (true) {
    let query = supabase
      .from(table)
      .select(selectCols)
      .order(orderByCol, { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (notNullCol) {
      query = query.not(notNullCol, "is", null);
    }
    const { data, error } = await query;
    if (error) throw new Error(`DB error reading ${table}: ${error.message}`);
    const rows = data || [];
    items.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return items;
}

async function fetchTcgplayerDetailsBatch(pids: string[]): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  const batchSize = 25;
  for (let i = 0; i < pids.length; i += batchSize) {
    const chunk = pids.slice(i, i + batchSize);
    await Promise.all(
      chunk.map(async (pid) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(`https://mp-search-api.tcgplayer.com/v1/product/${pid}/details`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              "Accept": "application/json",
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (res.ok) {
            results[pid] = await res.json();
          }
        } catch (_err) {
          // fallback handled downstream
        }
      }),
    );
  }
  return results;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://bqfkqnnostzaqueujdms.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseServiceKey) {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in Edge Function environment");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let sortswiftApiKey = Deno.env.get("SORTSWIFT_API_KEY") || "";
    if (!sortswiftApiKey) {
      const { data: config } = await supabase
        .from("system_config")
        .select("value")
        .eq("key", "SORTSWIFT_API_KEY")
        .maybeSingle();
      sortswiftApiKey = config?.value || "ss_inv_fa551970f693f49c03d8b0120d35e6b314ce980a6a31eda3b6b683520efec738";
    }

    // 1. Fetch ALL live RAW cards from SortSwift API (limit=1000 per page)
    const rawCards: any[] = [];
    let cursor: string | null = null;
    while (true) {
      let url = "https://inventory-api.sortswift.com/api/inventory/api-key/raw-cards?limit=1000";
      if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

      const ssRes = await fetch(url, {
        headers: {
          "X-API-Key": sortswiftApiKey,
          "Accept": "application/json",
        },
      });

      if (!ssRes.ok) {
        const errText = await ssRes.text();
        throw new Error(`SortSwift API HTTP ${ssRes.status}: ${errText}`);
      }

      const ssJson = await ssRes.json();
      const pageData = ssJson?.data || [];
      if (pageData.length === 0) break;
      rawCards.push(...pageData);

      cursor = ssJson?.pagination?.nextCursor || null;
      const hasMore = ssJson?.pagination?.hasMore;
      if (!cursor || !hasMore) break;
    }

    // 2. Filter active & available cards
    const activeBinsSet = new Set<string>();
    const filteredCards = rawCards.filter((c) => {
      if (c.deletedAt !== null && c.deletedAt !== undefined) return false;
      const inv = c.inventory || {};
      if (inv.status !== "available") return false;
      const qty = Number(c.quantity || 0);
      if (qty <= 0) return false;
      if (inv.bin) activeBinsSet.add(String(inv.bin));
      return true;
    });

    // 3. Load existing DB state in parallel with deterministic ORDER BY
    const [allSets, allPrintings, allProducts] = await Promise.all([
      fetchAllRows(supabase, "sets", "set_id, set_name, set_code, game_id", "set_id"),
      fetchAllRows(
        supabase,
        "card_printings",
        "printing_id, card_id, set_id, set_code, collector_number, is_foil, api_source_id, rarity, image_url",
        "printing_id",
        "api_source_id",
      ),
      fetchAllRows(
        supabase,
        "products",
        "id, name, game, set_code, set_name, printing_id, condition, finish, stock, price, cost, physical_location, sortswift_id, barcode, type_line, colors, release_date, rarity, image_url",
        "id",
      ),
    ]);

    // Index existing sets
    const setsByGameAndName = new Map<string, any>();
    const existingSetCodes = new Set<string>();
    let maxSetId = 32000;
    for (const s of allSets) {
      if (s.set_id && s.set_id > maxSetId) maxSetId = s.set_id;
      if (s.set_name) {
        setsByGameAndName.set(`${s.game_id}|${String(s.set_name).trim().toLowerCase()}`, s);
      }
      if (s.set_code) {
        existingSetCodes.add(`${s.game_id}|${String(s.set_code).trim().toLowerCase()}`);
      }
    }

    // Index products by printing_id first so we know which printing_ids have valid products
    const rawProductsByPrintingId = new Map<string, any[]>();
    for (const prod of allProducts) {
      if (!prod.printing_id) continue;
      const arr = rawProductsByPrintingId.get(prod.printing_id) || [];
      arr.push(prod);
      rawProductsByPrintingId.set(prod.printing_id, arr);
    }

    const scorePrinting = (printingId: string): number => {
      const prods = rawProductsByPrintingId.get(printingId) || [];
      if (prods.length === 0) return 0;
      let score = 1;
      for (const p of prods) {
        if (!String(p.name || "").startsWith("Card ") && p.set_name !== "SortSwift Ingestion") score += 10;
        if (Number(p.stock || 0) > 0) score += 5;
      }
      return score;
    };

    // Index canonical printings by (api_source_id, is_foil) and identify any duplicate printings
    const printingsByPidAndFoil = new Map<string, any>();
    const printingsByPidAny = new Map<string, any>();
    const printingIdToPid = new Map<string, string>();
    const duplicatePrintingIds = new Set<string>();

    for (const p of allPrintings) {
      const pidStr = String(p.api_source_id || "").trim();
      if (!pidStr) continue;
      const isFoil = Boolean(p.is_foil);
      const key = `${pidStr}|${isFoil}`;
      printingIdToPid.set(p.printing_id, pidStr);

      if (!printingsByPidAndFoil.has(key)) {
        printingsByPidAndFoil.set(key, p);
      } else {
        const existingP = printingsByPidAndFoil.get(key)!;
        if (scorePrinting(p.printing_id) > scorePrinting(existingP.printing_id)) {
          duplicatePrintingIds.add(existingP.printing_id);
          printingsByPidAndFoil.set(key, p);
        } else {
          duplicatePrintingIds.add(p.printing_id);
        }
      }

      if (!printingsByPidAny.has(pidStr) || !duplicatePrintingIds.has(p.printing_id)) {
        printingsByPidAny.set(pidStr, p);
      }
    }

    // Separate valid products from duplicate/placeholder products
    const productsByPrintingId = new Map<string, any>();
    const productsByPid = new Map<string, any>();
    const existingProductsMap = new Map<string, any>();
    const duplicateProductIdsToDelete: string[] = [];

    for (const prod of allProducts) {
      if (!prod.printing_id) continue;
      const isPlaceholder = String(prod.name || "").startsWith("Card ") || prod.set_name === "SortSwift Ingestion";
      const pidForProd = printingIdToPid.get(prod.printing_id);

      // If this product points to a duplicate printing_id or an unlinked Scryfall printing with stock 0 or placeholder
      if (duplicatePrintingIds.has(prod.printing_id) || isPlaceholder || (!pidForProd && Number(prod.stock || 0) === 0)) {
        duplicateProductIdsToDelete.push(prod.id);
        continue;
      }

      if (!productsByPrintingId.has(prod.printing_id)) {
        productsByPrintingId.set(prod.printing_id, prod);
      }
      if (pidForProd && !productsByPid.has(pidForProd)) {
        productsByPid.set(pidForProd, prod);
      }
      const cond = String(prod.condition || "NM").toUpperCase();
      const fin = String(prod.finish || "nonfoil").toLowerCase();
      existingProductsMap.set(`${prod.printing_id}|${cond}|${fin}`, prod);
    }

    // Clean up any duplicate products & duplicate printings in batches
    if (duplicateProductIdsToDelete.length > 0) {
      for (let i = 0; i < duplicateProductIdsToDelete.length; i += 200) {
        const chunk = duplicateProductIdsToDelete.slice(i, i + 200);
        await supabase.from("products").delete().in("id", chunk);
      }
    }
    if (duplicatePrintingIds.size > 0) {
      const dupPrintArr = Array.from(duplicatePrintingIds);
      for (let i = 0; i < dupPrintArr.length; i += 200) {
        const chunk = dupPrintArr.slice(i, i + 200);
        await supabase.from("card_printings").delete().in("printing_id", chunk);
      }
    }

    // 4. Determine which TCGplayer PIDs are not yet known in our DB
    const unknownPidsSet = new Set<string>();
    for (const it of filteredCards) {
      const pid = String(it.catalog?.productId || "").trim();
      if (!pid) continue;
      const existingP = printingsByPidAny.get(pid);
      const existingProd = productsByPid.get(pid) || (existingP ? productsByPrintingId.get(existingP.printing_id) : null);
      if (!existingP || !existingProd || String(existingProd.name || "").startsWith("Card ")) {
        unknownPidsSet.add(pid);
      }
    }

    const unknownPids = Array.from(unknownPidsSet);
    const tcgDetailsMap = unknownPids.length > 0 ? await fetchTcgplayerDetailsBatch(unknownPids) : {};

    // Look up existing cards by card_name for newly resolved TCGplayer items
    const newCardNamesSet = new Set<string>();
    for (const pid of unknownPids) {
      const d = tcgDetailsMap[pid];
      const cname = (d?.productName || `Card ${pid}`).trim();
      if (cname) newCardNamesSet.add(cname);
    }

    const cardIdByGameAndName = new Map<string, string>();
    // Pre-populate cardIdByGameAndName from existing printings & products so new printings of existing cards always share card_id
    const printingIdToCardId = new Map<string, string>();
    for (const p of allPrintings) {
      if (p.printing_id && p.card_id) {
        printingIdToCardId.set(p.printing_id, p.card_id);
      }
    }
    const GAME_CODE_TO_ID: Record<string, number> = {
      MTG: 22,
      PKM: 23,
      OPC: 13,
      FAB: 25,
      DGM: 18,
      GND: 17,
      RFB: 16,
    };
    for (const prod of allProducts) {
      if (prod.printing_id && prod.name) {
        const cid = printingIdToCardId.get(prod.printing_id);
        const gid = GAME_CODE_TO_ID[prod.game] || 22;
        if (cid) {
          cardIdByGameAndName.set(`${gid}|${String(prod.name).trim().toLowerCase()}`, cid);
        }
      }
    }

    const newCardNamesArr = Array.from(newCardNamesSet);
    for (let i = 0; i < newCardNamesArr.length; i += 100) {
      const chunkNames = newCardNamesArr.slice(i, i + 100);
      const { data: matchedCards } = await supabase
        .from("cards")
        .select("card_id, card_name, game_id, mana_cost, created_at")
        .in("card_name", chunkNames);
      for (const c of matchedCards || []) {
        if (c.card_name) {
          const key = `${c.game_id}|${String(c.card_name).trim().toLowerCase()}`;
          if (!cardIdByGameAndName.has(key) || c.mana_cost || c.created_at) {
            cardIdByGameAndName.set(key, c.card_id);
          }
        }
      }
    }

    // 5. Prepare any new sets, cards, and printings needed
    const newSetsToInsert: any[] = [];
    const newCardsToInsert: any[] = [];
    const newPrintingsToInsert: any[] = [];

    for (const it of filteredCards) {
      const ssId = it.id;
      const catId = Number(it.catalog?.categoryId || 1);
      const pid = String(it.catalog?.productId || "").trim();
      const variant = it.variant || {};
      const printingFinish = String(variant.printing || "Normal");
      const isFoil = printingFinish.toLowerCase().includes("foil");
      const priceVal = Number(it.price?.amount || 0);
      const binName = String(it.inventory?.bin || "");

      const gameInfo = CATEGORY_MAP[catId] || { game_code: "OTHERS", game_id: 35, name: "Otros" };
      const gameCode = gameInfo.game_code;
      const gameId = gameInfo.game_id;

      const imgs = it.images || {};
      const frontImg = imgs.front?.url || null;
      const catImg = imgs.catalog?.url || null;
      const officialImg =
        catImg || (pid ? `https://tcgplayer-cdn.tcgplayer.com/product/${pid}_in_1000x1000.jpg` : null) || frontImg;

      const exactPrintingKey = `${pid}|${isFoil}`;
      if (printingsByPidAndFoil.has(exactPrintingKey)) {
        continue;
      }

      // Check if sibling printing (same pid, different foil) exists
      const siblingPrinting = printingsByPidAny.get(pid);
      const details = tcgDetailsMap[pid] || {};
      const customAttrs = details.customAttributes || {};
      const collectorNum = siblingPrinting?.collector_number || cleanText(customAttrs.number) || "0";
      const rarity = siblingPrinting?.rarity || cleanText(customAttrs.rarityDbName) || "Common";

      let setId: number;
      let setCode: string;
      let cardId: string;

      if (siblingPrinting && siblingPrinting.card_id && siblingPrinting.set_id) {
        setId = siblingPrinting.set_id;
        setCode = siblingPrinting.set_code || "set";
        cardId = siblingPrinting.card_id;
      } else {
        const cardName = (details.productName || `Card ${pid}`).trim();
        const rawSetName = (details.setName || "SortSwift Ingestion").trim();
        const normSname = normalizeSetName(rawSetName);
        let releaseDate = customAttrs.releaseDate || null;
        if (releaseDate && typeof releaseDate === "string" && releaseDate.includes("T")) {
          releaseDate = releaseDate.split("T")[0];
        }

        const setKey = `${gameId}|${normSname.toLowerCase()}`;
        const rawKey = `${gameId}|${rawSetName.toLowerCase()}`;
        const matchedSet = setsByGameAndName.get(setKey) || setsByGameAndName.get(rawKey);

        if (matchedSet) {
          setId = matchedSet.set_id;
          setCode = matchedSet.set_code;
        } else {
          maxSetId += 1;
          const baseCode = deriveSetCode(normSname, collectorNum);
          let candidateCode = baseCode;
          let suffix = 2;
          while (existingSetCodes.has(`${gameId}|${candidateCode}`)) {
            candidateCode = `${baseCode.slice(0, 4)}${suffix}`;
            suffix += 1;
          }
          existingSetCodes.add(`${gameId}|${candidateCode}`);
          const newSetObj = {
            set_id: maxSetId,
            game_id: gameId,
            set_name: rawSetName,
            set_code: candidateCode,
            release_date: releaseDate,
          };
          newSetsToInsert.push(newSetObj);
          setsByGameAndName.set(setKey, newSetObj);
          setsByGameAndName.set(rawKey, newSetObj);
          setId = maxSetId;
          setCode = candidateCode;
        }

        const cardLookupKey = `${gameId}|${cardName.toLowerCase()}`;
        if (cardIdByGameAndName.has(cardLookupKey)) {
          cardId = cardIdByGameAndName.get(cardLookupKey)!;
        } else {
          cardId = crypto.randomUUID();
          const typeLine = cleanText(customAttrs.fullType || customAttrs.cardType) || "Card";
          const oracleText = cleanText(customAttrs.description);
          const rawColors = customAttrs.color || customAttrs.energyType;
          let colors: string[] = [];
          if (rawColors) {
            const arr = Array.isArray(rawColors) ? rawColors : [rawColors];
            colors = arr.filter(Boolean).map((c) => {
              const s = String(c).trim();
              return gameCode === "MTG" ? COLOR_MAP[s.toLowerCase()] || s : s;
            });
          }

          newCardsToInsert.push({
            card_id: cardId,
            game_id: gameId,
            card_name: cardName,
            type_line: typeLine,
            oracle_text: oracleText,
            rarity,
            colors,
            tcg_specific_attributes: {},
          });
          cardIdByGameAndName.set(cardLookupKey, cardId);
        }
      }

      const printingId = crypto.randomUUID();
      const newPrintingObj = {
        printing_id: printingId,
        card_id: cardId,
        set_id: setId,
        set_code: setCode,
        collector_number: collectorNum,
        rarity,
        is_foil: isFoil,
        is_non_foil: !isFoil,
        image_url: officialImg,
        image_url_normal: officialImg,
        image_url_small:
          catImg || (pid ? `https://tcgplayer-cdn.tcgplayer.com/product/${pid}_200w.jpg` : null) || officialImg,
        api_source_id: pid,
        avg_market_price_usd: priceVal,
        related_uris: frontImg ? { raw_scan_url: frontImg } : {},
        tcg_specific_printing_attributes: {
          tcgplayer_id: pid,
          sortswift_raw_id: ssId,
          sortswift_bin: binName,
          raw_scan_url: frontImg,
        },
      };

      newPrintingsToInsert.push(newPrintingObj);
      printingsByPidAndFoil.set(exactPrintingKey, newPrintingObj);
      if (!printingsByPidAny.has(pid)) {
        printingsByPidAny.set(pid, newPrintingObj);
      }
    }

    // Insert new sets, cards, printings in batches of 100
    const batchSize = 100;
    for (let i = 0; i < newSetsToInsert.length; i += batchSize) {
      const { error } = await supabase.from("sets").insert(newSetsToInsert.slice(i, i + batchSize));
      if (error) console.warn("Insert sets warning:", error.message);
    }
    for (let i = 0; i < newCardsToInsert.length; i += batchSize) {
      const { error } = await supabase.from("cards").insert(newCardsToInsert.slice(i, i + batchSize));
      if (error) throw new Error(`Insert cards error: ${error.message}`);
    }
    for (let i = 0; i < newPrintingsToInsert.length; i += batchSize) {
      const { error } = await supabase.from("card_printings").insert(newPrintingsToInsert.slice(i, i + batchSize));
      if (error) throw new Error(`Insert printings error: ${error.message}`);
    }

    // 6. Aggregate all active SortSwift items by (printing_id, condition, finish)
    interface AggregatedItem {
      printing_id: string;
      condition: string;
      finish: string;
      total_qty: number;
      name: string;
      game: string;
      set_code: string;
      set_name: string;
      collector_number: string;
      price: number;
      cost: number;
      image_url: string | null;
      rarity: string;
      language: string;
      physical_location: string;
      bin_name: string;
      sortswift_id: string;
      barcode: string;
      type_line: string;
      colors: string[];
      release_date: string | null;
      pid: string;
    }

    const aggregatedMap = new Map<string, AggregatedItem>();
    let totalUnits = 0;

    for (const it of filteredCards) {
      const ssId = it.id;
      const catId = Number(it.catalog?.categoryId || 1);
      const pid = String(it.catalog?.productId || "").trim();
      const barcode = it.barcode || `GEEKO-${String(ssId).slice(-8).toUpperCase()}`;
      const variant = it.variant || {};
      const condition = String(variant.condition || "NM").toUpperCase();
      const printingFinish = String(variant.printing || "Normal");
      const isFoil = printingFinish.toLowerCase().includes("foil");
      const finish = isFoil ? "foil" : "nonfoil";
      const language = String(variant.language || "EN");
      const qty = Number(it.quantity || 1);
      totalUnits += qty;

      const priceVal = Number(it.price?.amount || 0);
      const costVal = Number(it.cost?.amount || 0);
      const binName = String(it.inventory?.bin || "");

      const gameInfo = CATEGORY_MAP[catId] || { game_code: "OTHERS", game_id: 35, name: "Otros" };
      const gameCode = gameInfo.game_code;
      const physicalLoc = mapBinToStoreLocation(binName, gameCode);

      const printingObj = printingsByPidAndFoil.get(`${pid}|${isFoil}`) || printingsByPidAny.get(pid);
      if (!printingObj) continue;

      const printingId = printingObj.printing_id;
      const existingProd =
        existingProductsMap.get(`${printingId}|${condition}|${finish}`) ||
        productsByPrintingId.get(printingId) ||
        productsByPid.get(pid);

      const details = tcgDetailsMap[pid] || {};
      const customAttrs = details.customAttributes || {};

      const cardName = (details.productName || existingProd?.name || `Card ${pid}`).trim();
      const setName = (details.setName || existingProd?.set_name || "SortSwift Ingestion").trim();
      const setCode = printingObj.set_code || existingProd?.set_code || "set";
      const collectorNum = printingObj.collector_number || cleanText(customAttrs.number) || "0";
      const rarity = printingObj.rarity || existingProd?.rarity || cleanText(customAttrs.rarityDbName) || "Common";

      const imgs = it.images || {};
      const frontImg = imgs.front?.url || null;
      const catImg = imgs.catalog?.url || null;
      const officialImg =
        catImg ||
        printingObj.image_url ||
        existingProd?.image_url ||
        (pid ? `https://tcgplayer-cdn.tcgplayer.com/product/${pid}_in_1000x1000.jpg` : null) ||
        frontImg;

      let releaseDate = customAttrs.releaseDate || existingProd?.release_date || null;
      if (releaseDate && typeof releaseDate === "string" && releaseDate.includes("T")) {
        releaseDate = releaseDate.split("T")[0];
      }

      const typeLine =
        cleanText(customAttrs.fullType || customAttrs.cardType) || existingProd?.type_line || "Card";

      let colors: string[] = existingProd?.colors || [];
      if (Array.isArray(customAttrs.color)) {
        colors = customAttrs.color.map((c: any) => COLOR_MAP[String(c).toLowerCase()] || String(c));
      }

      const aggKey = `${printingId}|${condition}|${finish}`;
      const currentAgg = aggregatedMap.get(aggKey);
      if (currentAgg) {
        currentAgg.total_qty += qty;
        if (priceVal > 0) currentAgg.price = priceVal;
        if (binName) {
          currentAgg.bin_name = binName;
          currentAgg.physical_location = physicalLoc;
        }
      } else {
        aggregatedMap.set(aggKey, {
          printing_id: printingId,
          condition,
          finish,
          total_qty: qty,
          name: cardName,
          game: gameCode,
          set_code: setCode,
          set_name: setName,
          collector_number: collectorNum,
          price: priceVal > 0 ? priceVal : 0.5,
          cost: costVal,
          image_url: officialImg,
          rarity,
          language,
          physical_location: physicalLoc,
          bin_name: binName,
          sortswift_id: ssId,
          barcode,
          type_line: typeLine,
          colors,
          release_date: releaseDate,
          pid,
        });
      }
    }

    // 7. Diff against existing products in Supabase DEV
    const byTcg: Record<
      string,
      {
        added: number;
        added_units: number;
        updated: number;
        updated_units: number;
        unchanged: number;
        unchanged_units: number;
        zeroed: number;
      }
    > = {};

    const ensureTcg = (g: string) => {
      if (!byTcg[g]) {
        byTcg[g] = {
          added: 0,
          added_units: 0,
          updated: 0,
          updated_units: 0,
          unchanged: 0,
          unchanged_units: 0,
          zeroed: 0,
        };
      }
    };

    const productsToUpsert: any[] = [];
    const sampleNewCards: Array<{ name: string; set: string; finish: string; qty: number; bin: string; game: string }> =
      [];
    const sampleUpdatedCards: Array<{
      name: string;
      set: string;
      finish: string;
      prev_qty: number;
      new_qty: number;
      bin: string;
      game: string;
    }> = [];
    const auditRows: any[] = [];

    let addedCount = 0;
    let addedUnits = 0;
    let updatedCount = 0;
    let updatedUnits = 0;
    let unchangedCount = 0;
    let unchangedUnits = 0;
    let zeroedCount = 0;

    for (const [aggKey, item] of aggregatedMap.entries()) {
      ensureTcg(item.game);
      const existing = existingProductsMap.get(aggKey);

      if (!existing) {
        addedCount += 1;
        addedUnits += item.total_qty;
        byTcg[item.game].added += 1;
        byTcg[item.game].added_units += item.total_qty;

        if (sampleNewCards.length < 20) {
          sampleNewCards.push({
            name: item.name,
            set: item.set_name,
            finish: item.finish === "foil" ? "Foil" : "Normal",
            qty: item.total_qty,
            bin: item.bin_name,
            game: item.game,
          });
        }

        productsToUpsert.push({
          id: crypto.randomUUID(),
          name: item.name,
          game: item.game,
          set_code: item.set_code,
          set_name: item.set_name,
          price: item.price,
          price_usd: item.price,
          stock: item.total_qty,
          cost: item.cost,
          image_url: item.image_url,
          rarity: item.rarity,
          printing_id: item.printing_id,
          condition: item.condition,
          finish: item.finish,
          language: item.language,
          physical_location: item.physical_location,
          sortswift_id: item.sortswift_id,
          barcode: item.barcode,
          type_line: item.type_line,
          colors: item.colors,
          release_date: item.release_date,
        });

        auditRows.push({
          action: "AGREGADO (NUEVO)",
          game: item.game,
          name: item.name,
          set_name: item.set_name,
          collector_number: item.collector_number,
          condition: item.condition,
          finish: item.finish === "foil" ? "Foil" : "Normal",
          language: item.language,
          prev_stock: 0,
          new_stock: item.total_qty,
          delta: `+${item.total_qty}`,
          price: item.price.toFixed(2),
          cost: item.cost.toFixed(2),
          bin: item.bin_name,
          location: item.physical_location,
          barcode: item.barcode,
          ss_id: item.sortswift_id,
          pid: item.pid,
        });
      } else {
        const prevStock = Number(existing.stock ?? 0);
        const newStock = item.total_qty;
        const prevPrice = Number(existing.price ?? 0);
        const stockChanged = prevStock !== newStock;
        const locChanged = existing.physical_location !== item.physical_location;
        const priceChanged = Math.abs(prevPrice - item.price) > 0.009;

        if (stockChanged || locChanged || priceChanged) {
          updatedCount += 1;
          updatedUnits += newStock;
          byTcg[item.game].updated += 1;
          byTcg[item.game].updated_units += newStock;

          if (sampleUpdatedCards.length < 15) {
            sampleUpdatedCards.push({
              name: item.name,
              set: item.set_name,
              finish: item.finish === "foil" ? "Foil" : "Normal",
              prev_qty: prevStock,
              new_qty: newStock,
              bin: item.bin_name,
              game: item.game,
            });
          }

          productsToUpsert.push({
            id: existing.id,
            name: item.name,
            game: item.game,
            set_code: item.set_code,
            set_name: item.set_name,
            price: item.price,
            price_usd: item.price,
            stock: newStock,
            cost: item.cost,
            image_url: item.image_url,
            rarity: item.rarity,
            printing_id: item.printing_id,
            condition: item.condition,
            finish: item.finish,
            language: item.language,
            physical_location: item.physical_location,
            sortswift_id: item.sortswift_id,
            barcode: item.barcode,
            type_line: item.type_line,
            colors: item.colors,
            release_date: item.release_date,
          });

          const diff = newStock - prevStock;
          auditRows.push({
            action: "STOCK ACTUALIZADO",
            game: item.game,
            name: item.name,
            set_name: item.set_name,
            collector_number: item.collector_number,
            condition: item.condition,
            finish: item.finish === "foil" ? "Foil" : "Normal",
            language: item.language,
            prev_stock: prevStock,
            new_stock: newStock,
            delta: diff >= 0 ? `+${diff}` : `${diff}`,
            price: item.price.toFixed(2),
            cost: item.cost.toFixed(2),
            bin: item.bin_name,
            location: item.physical_location,
            barcode: item.barcode,
            ss_id: item.sortswift_id,
            pid: item.pid,
          });
        } else {
          unchangedCount += 1;
          unchangedUnits += newStock;
          byTcg[item.game].unchanged += 1;
          byTcg[item.game].unchanged_units += newStock;

          auditRows.push({
            action: "SIN CAMBIOS (EN PARIDAD)",
            game: item.game,
            name: item.name,
            set_name: item.set_name,
            collector_number: item.collector_number,
            condition: item.condition,
            finish: item.finish === "foil" ? "Foil" : "Normal",
            language: item.language,
            prev_stock: prevStock,
            new_stock: newStock,
            delta: "0",
            price: item.price.toFixed(2),
            cost: item.cost.toFixed(2),
            bin: item.bin_name,
            location: item.physical_location,
            barcode: item.barcode,
            ss_id: item.sortswift_id,
            pid: item.pid,
          });
        }
      }
    }

    // Check existing products not present in active SortSwift inventory
    const idsToZero: string[] = [];
    for (const [prodKey, existing] of existingProductsMap.entries()) {
      if (!aggregatedMap.has(prodKey)) {
        const g = existing.game || "MTG";
        ensureTcg(g);
        const prevStock = Number(existing.stock ?? 0);
        if (prevStock > 0) {
          idsToZero.push(existing.id);
        }
        zeroedCount += 1;
        byTcg[g].zeroed += 1;

        auditRows.push({
          action: "ELIMINADO / STOCK EN CERO",
          game: g,
          name: existing.name || "Unknown",
          set_name: existing.set_name || existing.set_code || "Unknown",
          collector_number: "0",
          condition: existing.condition || "NM",
          finish: existing.finish === "foil" ? "Foil" : "Normal",
          language: "EN",
          prev_stock: prevStock,
          new_stock: 0,
          delta: `-${prevStock}`,
          price: Number(existing.price || 0).toFixed(2),
          cost: Number(existing.cost || 0).toFixed(2),
          bin: "SIN LOTE ACTIVO EN SORTSWIFT",
          location: existing.physical_location || "SIN UBICACION",
          barcode: existing.barcode || "N/A",
          ss_id: existing.sortswift_id || "N/A",
          pid: "N/A",
        });
      }
    }

    // 8. Execute Batched Upserts on products (chunks of 200)
    const upsertBatchSize = 200;
    for (let i = 0; i < productsToUpsert.length; i += upsertBatchSize) {
      const chunk = productsToUpsert.slice(i, i + upsertBatchSize);
      const { error } = await supabase
        .from("products")
        .upsert(chunk, { onConflict: "printing_id,condition,finish" });
      if (error) throw new Error(`Upsert products error: ${error.message}`);
    }

    for (let i = 0; i < idsToZero.length; i += upsertBatchSize) {
      const chunkIds = idsToZero.slice(i, i + upsertBatchSize);
      const { error } = await supabase.from("products").update({ stock: 0 }).in("id", chunkIds);
      if (error) throw new Error(`Zero stock products error: ${error.message}`);
    }

    // 9. Phase 2: Real-Time Parity Sync with Odoo ERP (product.product + stock.quant)
    let odooSynced = false;
    let odooCreated = 0;
    let odooUpdated = 0;
    let odooStockApplied = 0;
    let odooError: string | null = null;

    const odooUrl = Deno.env.get("ODOO_URL");
    const odooDb = Deno.env.get("ODOO_DB");
    const odooUsername = Deno.env.get("ODOO_USERNAME");
    const odooApiKey = Deno.env.get("ODOO_API_KEY");

    if (odooUrl && odooDb && odooUsername && odooApiKey) {
      try {
        const odooRpc = async (service: string, method: string, args: any[]) => {
          const res = await fetch(`${odooUrl}/jsonrpc`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "GeekoriumSync/2.0",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "call",
              params: { service, method, args },
              id: Math.floor(Math.random() * 1000000),
            }),
          });
          const json = await res.json();
          if (json.error) {
            throw new Error(json.error.data?.message || json.error.message || "Odoo RPC error");
          }
          return json.result;
        };

        const odooUid = await odooRpc("common", "authenticate", [odooDb, odooUsername, odooApiKey, {}]);
        if (odooUid) {
          const ODOO_CAT_MAP: Record<string, number> = {
            MTG: 10,
            PKM: 28,
            YGO: 30,
            OPC: 20,
            DGM: 26,
            FAB: 18,
            GND: 24,
            RFB: 22,
          };
          const DEFAULT_ODOO_CAT = 34;
          const ODOO_WH_STOCK = 5;

          const codesToSync = [
            ...productsToUpsert.map((p) => String(p.id)),
            ...idsToZero.map((id) => String(id)),
          ];

          if (codesToSync.length > 0) {
            const existingOdooByCode = new Map<string, number>();
            for (let i = 0; i < codesToSync.length; i += 200) {
              const codeChunk = codesToSync.slice(i, i + 200);
              const found = await odooRpc("object", "execute_kw", [
                odooDb,
                odooUid,
                odooApiKey,
                "product.product",
                "search_read",
                [[["default_code", "in", codeChunk]]],
                { fields: ["id", "default_code"] },
              ]);
              for (const rec of found || []) {
                if (rec.default_code) existingOdooByCode.set(String(rec.default_code), rec.id);
              }
            }

            const toCreateOdoo: Array<{ vals: any; stock: number }> = [];
            const quantUpdates: Array<{ product_id: number; location_id: number; inventory_quantity: number }> = [];

            for (const p of productsToUpsert) {
              const code = String(p.id);
              const existingOdooId = existingOdooByCode.get(code);
              const sCode = String(p.set_code || "UNK").toUpperCase();
              const finishStr = p.finish === "foil" ? " (Foil)" : "";
              const cond = String(p.condition || "NM").toUpperCase();
              const fullName = `[${sCode}] ${p.name}${finishStr} - ${cond}`;
              const catId = ODOO_CAT_MAP[p.game] || DEFAULT_ODOO_CAT;

              if (existingOdooId) {
                odooUpdated += 1;
                await odooRpc("object", "execute_kw", [
                  odooDb,
                  odooUid,
                  odooApiKey,
                  "product.product",
                  "write",
                  [[existingOdooId], { list_price: Number(p.price || 0) }],
                ]);
                quantUpdates.push({
                  product_id: existingOdooId,
                  location_id: ODOO_WH_STOCK,
                  inventory_quantity: Number(p.stock || 0),
                });
              } else {
                toCreateOdoo.push({
                  vals: {
                    name: fullName,
                    default_code: code,
                    list_price: Number(p.price || 0),
                    available_in_pos: true,
                    is_storable: true,
                    categ_id: catId,
                  },
                  stock: Number(p.stock || 0),
                });
              }
            }

            for (const zId of idsToZero) {
              const existingOdooId = existingOdooByCode.get(String(zId));
              if (existingOdooId) {
                quantUpdates.push({
                  product_id: existingOdooId,
                  location_id: ODOO_WH_STOCK,
                  inventory_quantity: 0,
                });
              }
            }

            for (let i = 0; i < toCreateOdoo.length; i += 100) {
              const chunk = toCreateOdoo.slice(i, i + 100);
              const newOdooIds = await odooRpc("object", "execute_kw", [
                odooDb,
                odooUid,
                odooApiKey,
                "product.product",
                "create",
                [chunk.map((c) => c.vals)],
              ]);
              if (Array.isArray(newOdooIds)) {
                odooCreated += newOdooIds.length;
                newOdooIds.forEach((nid: number, idx: number) => {
                  quantUpdates.push({
                    product_id: nid,
                    location_id: ODOO_WH_STOCK,
                    inventory_quantity: chunk[idx].stock,
                  });
                });
              }
            }

            for (let i = 0; i < quantUpdates.length; i += 100) {
              const qChunk = quantUpdates.slice(i, i + 100);
              const quantIds = await odooRpc("object", "execute_kw", [
                odooDb,
                odooUid,
                odooApiKey,
                "stock.quant",
                "create",
                [qChunk],
              ]);
              if (Array.isArray(quantIds) && quantIds.length > 0) {
                await odooRpc("object", "execute_kw", [
                  odooDb,
                  odooUid,
                  odooApiKey,
                  "stock.quant",
                  "action_apply_inventory",
                  [quantIds],
                ]);
                odooStockApplied += quantIds.length;
              }
            }
          }
          odooSynced = true;
        }
      } catch (oErr: any) {
        odooError = oErr?.message || String(oErr);
        console.warn("Odoo phase 2 sync warning:", odooError);
      }
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        status: "synced_live",
        duration_ms: durationMs,
        total_raw_cards: filteredCards.length,
        total_units: totalUnits,
        total_unique_nodes: aggregatedMap.size,
        new_tcg_resolved: Object.keys(tcgDetailsMap).length,
        new_sets_created: newSetsToInsert.length,
        new_cards_created: newCardsToInsert.length,
        new_printings_created: newPrintingsToInsert.length,
        added_count: addedCount,
        added_units: addedUnits,
        updated_count: updatedCount,
        updated_units: updatedUnits,
        unchanged_count: unchangedCount,
        unchanged_units: unchangedUnits,
        zeroed_count: zeroedCount,
        active_bins_count: activeBinsSet.size,
        odoo_synced: odooSynced,
        odoo_created: odooCreated,
        odoo_updated: odooUpdated,
        odoo_stock_applied: odooStockApplied,
        odoo_error: odooError,
        by_tcg: byTcg,
        sample_new_cards: sampleNewCards,
        sample_updated_cards: sampleUpdatedCards,
        audit_rows: auditRows,
        message: `Sincronización en vivo completada en ${(durationMs / 1000).toFixed(1)}s: ${filteredCards.length} cartas singles procesadas (${addedCount} nuevas, ${updatedCount} actualizadas, ${unchangedCount} en paridad).`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("sortswift-sync live error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error interno en sortswift-sync",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
