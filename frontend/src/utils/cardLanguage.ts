const LANG_CANONICAL_MAP: Record<string, string> = {
  en: 'EN',
  eng: 'EN',
  english: 'EN',
  es: 'ES',
  sp: 'ES',
  spn: 'ES',
  esp: 'ES',
  spanish: 'ES',
  jp: 'JP',
  ja: 'JP',
  jpn: 'JP',
  japanese: 'JP',
  ko: 'KO',
  kr: 'KO',
  kor: 'KO',
  korean: 'KO',
  de: 'DE',
  ger: 'DE',
  german: 'DE',
  ru: 'RU',
  rus: 'RU',
  russian: 'RU',
  pt: 'PT',
  por: 'PT',
  portuguese: 'PT',
  it: 'IT',
  ita: 'IT',
  italian: 'IT',
  fr: 'FR',
  fra: 'FR',
  french: 'FR',
  ct: 'CT',
  zht: 'CT',
  cs: 'CS',
  zhs: 'CS',
  cn: 'CS',
};

const LANG_BADGE_MAP: Record<string, string> = {
  EN: 'ENG',
  ES: 'SPN',
  JP: 'JPN',
  KO: 'KOR',
  DE: 'GER',
  RU: 'RUS',
  PT: 'POR',
  IT: 'ITA',
  FR: 'FRA',
  CT: 'CHI',
  CS: 'CHI',
};

const LANG_SCRYFALL_MAP: Record<string, string> = {
  EN: 'en',
  ES: 'es',
  JP: 'ja',
  KO: 'ko',
  DE: 'de',
  RU: 'ru',
  PT: 'pt',
  IT: 'it',
  FR: 'fr',
  CT: 'zht',
  CS: 'zhs',
};

export function normalizeLanguageCode(raw?: string | null): string {
  const cleaned = String(raw || '').trim().toLowerCase();
  if (!cleaned) return 'EN';
  return LANG_CANONICAL_MAP[cleaned] || cleaned.toUpperCase();
}

export function getLanguageBadgeLabel(raw?: string | null): string {
  const canonical = normalizeLanguageCode(raw);
  return LANG_BADGE_MAP[canonical] || canonical;
}

export function getScryfallLanguageCode(raw?: string | null): string {
  const canonical = normalizeLanguageCode(raw);
  return LANG_SCRYFALL_MAP[canonical] || canonical.toLowerCase();
}

const LOCALIZED_URL_REGEX = /_(ES|JP|PT|RU|IT|FR|KO|DE|CT|ZHS|ZHT)\./i;

export function resolveLocalizedCardImage(opts: {
  productImage?: string | null;
  printingImage?: string | null;
  language?: string | null;
  game?: string | null;
  setCode?: string | null;
  collectorNumber?: string | null;
}): { imageUrl: string; fallbackImageUrl?: string } {
  const productImg = (opts.productImage || '').trim();
  const printingImg = (opts.printingImage || '').trim();
  const baseFallback = productImg || printingImg || '';
  const lang = normalizeLanguageCode(opts.language);

  if (lang === 'EN') {
    return {
      imageUrl: productImg || printingImg || '',
      fallbackImageUrl: productImg && printingImg && productImg !== printingImg ? printingImg : undefined,
    };
  }

  // If DB product already stores a localized asset (e.g. *_ES.jpg, *_JP.jpg), prefer it directly
  if (productImg && LOCALIZED_URL_REGEX.test(productImg)) {
    return {
      imageUrl: productImg,
      fallbackImageUrl: printingImg && printingImg !== productImg ? printingImg : undefined,
    };
  }

  // For MTG, try Scryfall localized image endpoint when product/printing lacks localized file suffix
  const isMtg = !opts.game || ['MTG', 'MAGIC', '22'].includes(String(opts.game).toUpperCase());
  const cleanSet = (opts.setCode || '').trim().toLowerCase();
  const cleanNum = (opts.collectorNumber || '').trim();
  if (isMtg && cleanSet && cleanSet !== '??' && cleanNum) {
    const scryfallLang = getScryfallLanguageCode(lang);
    const localizedUrl = `https://api.scryfall.com/cards/${encodeURIComponent(cleanSet)}/${encodeURIComponent(cleanNum)}/${scryfallLang}?format=image`;
    return {
      imageUrl: localizedUrl,
      fallbackImageUrl: baseFallback || undefined,
    };
  }

  return { imageUrl: baseFallback };
}

const LANGUAGE_ORDER = ['EN', 'JP', 'ES', 'KO', 'DE', 'RU', 'PT', 'IT', 'FR', 'CT', 'CS'];

export function sortLanguageCodes(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    const idxA = LANGUAGE_ORDER.indexOf(a);
    const idxB = LANGUAGE_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

function getFinishKey(v: any): 'nonfoil' | 'foil' | 'etched' {
  const f = (v?.finish || (v?.is_foil ? 'foil' : 'nonfoil')).toLowerCase();
  if (f === 'etched') return 'etched';
  if (f === 'foil' || v?.is_foil) return 'foil';
  return 'nonfoil';
}

function pickPreferredVariant(variants: any[], targetFinish: string, preferredLang?: string): any | null {
  const matchingFinish = variants.filter((v) => getFinishKey(v) === targetFinish);
  if (matchingFinish.length === 0) return null;
  if (preferredLang) {
    const normPref = normalizeLanguageCode(preferredLang);
    const exactLang = matchingFinish.find((v) => normalizeLanguageCode(v.language || v.lang) === normPref);
    if (exactLang) return exactLang;
  }
  return (
    matchingFinish.find((v) => (v.stock || 0) > 0 && normalizeLanguageCode(v.language || v.lang) === 'EN') ||
    matchingFinish.find((v) => (v.stock || 0) > 0) ||
    matchingFinish[0]
  );
}

export function groupCardVersions(
  rawVersions: any[],
  preferredLang?: string,
  fallbackMeta?: { set_code?: string; set?: string }
): any[] {
  if (!Array.isArray(rawVersions) || rawVersions.length === 0) return [];

  const groups: Record<string, any> = {};
  for (const rawV of rawVersions) {
    const setCode = rawV.set_code || fallbackMeta?.set_code || '??';
    const setName = rawV.set_name || fallbackMeta?.set || 'Unknown Set';
    const lang = normalizeLanguageCode(rawV.language || rawV.lang);
    const v = {
      ...rawV,
      set_code: setCode,
      set_name: setName,
      language: lang,
    };
    const key = `${setCode}-${v.collector_number || v.printing_id}`;
    if (!groups[key]) {
      groups[key] = {
        base: v,
        variants: [],
        normal: null,
        foil: null,
        etched: null,
        languages: [] as string[],
        totalStock: 0,
      };
    }
    groups[key].variants.push(v);
    if (groups[key].base.set_name === 'Unknown Set' && v.set_name !== 'Unknown Set') {
      groups[key].base = v;
    }
  }

  for (const g of Object.values(groups)) {
    const langSet = new Set<string>();
    let total = 0;
    for (const v of g.variants) {
      langSet.add(v.language);
      total += Number(v.stock || 0);
    }
    g.languages = sortLanguageCodes(Array.from(langSet));
    g.normal = pickPreferredVariant(g.variants, 'nonfoil', preferredLang);
    g.foil = pickPreferredVariant(g.variants, 'foil', preferredLang);
    g.etched = pickPreferredVariant(g.variants, 'etched', preferredLang);
    g.base = g.normal || g.foil || g.etched || g.variants[0];
    g.totalStock = total;
  }

  return Object.values(groups).sort((a: any, b: any) => {
    const aAvail = a.totalStock > 0 ? 1 : 0;
    const bAvail = b.totalStock > 0 ? 1 : 0;
    if (bAvail !== aAvail) return bAvail - aAvail;
    return (a.base?.set_name || '').localeCompare(b.base?.set_name || '');
  });
}

export function resolveActiveVersion(
  activeGroup: any,
  selectedFinish: 'nonfoil' | 'foil' | 'etched',
  selectedLanguage?: string
): any | null {
  if (!activeGroup) return null;
  const variants: any[] = Array.isArray(activeGroup.variants)
    ? activeGroup.variants
    : [activeGroup.normal, activeGroup.foil, activeGroup.etched, activeGroup.base].filter(Boolean);

  if (variants.length === 0) return activeGroup.base || null;

  const targetLang = selectedLanguage ? normalizeLanguageCode(selectedLanguage) : null;
  if (targetLang) {
    const exact = variants.find((v) => getFinishKey(v) === selectedFinish && normalizeLanguageCode(v.language) === targetLang);
    if (exact) return exact;
  }

  const sameFinish = variants.find((v) => getFinishKey(v) === selectedFinish);
  if (sameFinish) return sameFinish;

  if (targetLang) {
    const sameLang = variants.find((v) => normalizeLanguageCode(v.language) === targetLang);
    if (sameLang) return sameLang;
  }

  return activeGroup.normal || activeGroup.foil || activeGroup.etched || activeGroup.base || variants[0];
}

