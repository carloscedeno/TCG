import { getCardKingdomUrl } from '../utils/urlUtils';

export interface ExternalMarketplaceInfo {
  name: string;
  label: string;
  buildUrl: (card: {
    name: string;
    isFoil?: boolean;
    externalId?: string;
    setCode?: string;
    collectorNumber?: string;
  }) => string | null;
}

export interface TCGAttributeDef {
  key: string;
  label: string;
  badgeBg?: string;
  badgeTextColor?: string;
}

export interface TCGConfig {
  gameCode: string;
  gameName: string;
  colorsOrDomains: string[];
  types: string[];
  formats?: string[]; // Formatos relevantes de legalidad. Si no está definido, se oculta la sección.
  externalMarketplace?: ExternalMarketplaceInfo;
  specificAttributes?: TCGAttributeDef[];
}

export const TCG_REGISTRY: Record<string, TCGConfig> = {
  MTG: {
    gameCode: 'MTG',
    gameName: 'Magic: The Gathering',
    colorsOrDomains: ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'],
    types: ['Creature', 'Instant', 'Sorcery', 'Enchantment', 'Artifact', 'Planeswalker', 'Land'],
    formats: ['standard', 'pioneer', 'modern', 'legacy', 'commander', 'pauper'],
    externalMarketplace: {
      name: 'CardKingdom',
      label: 'Comprar @ CardKingdom',
      buildUrl: (card) => getCardKingdomUrl(card.name, card.isFoil),
    },
  },
  RFB: {
    gameCode: 'RFB',
    gameName: 'Riftbound',
    colorsOrDomains: ['Fury', 'Calm', 'Order', 'Chaos', 'Mind', 'Body'],
    types: ['Champion', 'Legend', 'Unit', 'Spell', 'Gear', 'Battlefield', 'Rune'],
    formats: undefined, // Riftbound no tiene formatos tradicionales de MTG
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => {
        const isNumeric = /^\d+$/.test(String(card.externalId || '').trim());
        if (isNumeric) {
          return `https://www.tcgplayer.com/product/${card.externalId}`;
        }
        return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`;
      },
    },
    specificAttributes: [
      { key: 'might', label: 'Might', badgeBg: 'bg-red-500/20 border-red-500/30', badgeTextColor: 'text-red-400' },
      { key: 'cost', label: 'Cost', badgeBg: 'bg-cyan-500/20 border-cyan-500/30', badgeTextColor: 'text-cyan-400' },
      { key: 'domains', label: 'Domains', badgeBg: 'bg-purple-500/20 border-purple-500/30', badgeTextColor: 'text-purple-300' },
    ],
  },
  GND: {
    gameCode: 'GND',
    gameName: 'Gundam Card Game',
    colorsOrDomains: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'White'],
    types: ['Unit', 'Command', 'Resource', 'Pilot', 'Base'],
    // Gundam no maneja formatos de legalidad MTG
    formats: undefined,
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => {
        const isNumeric = /^\d+$/.test(String(card.externalId || '').trim());
        if (isNumeric) {
          return `https://www.tcgplayer.com/product/${card.externalId}`;
        }
        return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`;
      },
    },
    specificAttributes: [
      { key: 'cost_level', label: 'Cost/Level', badgeBg: 'bg-blue-500/20 border-blue-500/30', badgeTextColor: 'text-blue-400' },
      { key: 'ap', label: 'AP', badgeBg: 'bg-amber-500/20 border-amber-500/30', badgeTextColor: 'text-amber-400' },
      { key: 'hp', label: 'HP', badgeBg: 'bg-emerald-500/20 border-emerald-500/30', badgeTextColor: 'text-emerald-400' },
    ],
  },
  PKM: {
    gameCode: 'PKM',
    gameName: 'Pokémon',
    colorsOrDomains: ['Grass', 'Fire', 'Water', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'],
    types: ['Pokémon', 'Trainer', 'Energy'],
    formats: ['standard', 'expanded'],
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => {
        const isNumeric = /^\d+$/.test(String(card.externalId || '').trim());
        if (isNumeric) {
          return `https://www.tcgplayer.com/product/${card.externalId}`;
        }
        return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`;
      },
    },
    specificAttributes: [
      { key: 'hp', label: 'HP', badgeBg: 'bg-emerald-500/20 border-emerald-500/30', badgeTextColor: 'text-emerald-400' },
    ],
  },
  OPC: {
    gameCode: 'OPC',
    gameName: 'One Piece',
    colorsOrDomains: ['Red', 'Blue', 'Green', 'Purple', 'Black', 'Yellow'],
    types: ['Character', 'Event', 'Stage', 'Leader'],
    formats: ['standard'],
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => {
        const isNumeric = /^\d+$/.test(String(card.externalId || '').trim());
        if (isNumeric) {
          return `https://www.tcgplayer.com/product/${card.externalId}`;
        }
        return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`;
      },
    },
    specificAttributes: [
      { key: 'cost', label: 'Cost', badgeBg: 'bg-blue-500/20 border-blue-500/30', badgeTextColor: 'text-blue-400' },
      { key: 'power', label: 'Power', badgeBg: 'bg-orange-500/20 border-orange-500/30', badgeTextColor: 'text-orange-400' },
      { key: 'life', label: 'Life', badgeBg: 'bg-rose-500/20 border-rose-500/30', badgeTextColor: 'text-rose-400' },
    ],
  },
  DGM: {
    gameCode: 'DGM',
    gameName: 'Digimon',
    colorsOrDomains: ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'],
    types: ['Digimon', 'Tamer', 'Option'],
    formats: ['standard'],
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => (card.externalId ? `https://www.tcgplayer.com/product/${card.externalId}` : null),
    },
    specificAttributes: [
      { key: 'play_cost', label: 'Play Cost', badgeBg: 'bg-blue-500/20 border-blue-500/30', badgeTextColor: 'text-blue-400' },
      { key: 'dp', label: 'DP', badgeBg: 'bg-amber-500/20 border-amber-500/30', badgeTextColor: 'text-amber-400' },
    ],
  },
  FAB: {
    gameCode: 'FAB',
    gameName: 'Flesh and Blood',
    colorsOrDomains: ['Red', 'Yellow', 'Blue'],
    types: ['Hero', 'Weapon', 'Equipment', 'Action', 'Attack Reaction', 'Defense Reaction', 'Instant'],
    formats: ['classic_constructed', 'blitz'],
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => (card.externalId ? `https://www.tcgplayer.com/product/${card.externalId}` : null),
    },
  },
  LOR: {
    gameCode: 'LOR',
    gameName: 'Lorcana',
    colorsOrDomains: ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'],
    types: ['Character', 'Action', 'Item', 'Location'],
    formats: ['core'],
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => (card.externalId ? `https://www.tcgplayer.com/product/${card.externalId}` : null),
    },
  },
  YGO: {
    gameCode: 'YGO',
    gameName: 'Yu-Gi-Oh!',
    colorsOrDomains: ['Dark', 'Light', 'Earth', 'Water', 'Fire', 'Wind', 'Divine'],
    types: ['Monster', 'Spell', 'Trap'],
    formats: ['advanced', 'traditional'],
    externalMarketplace: {
      name: 'TCGplayer',
      label: 'Ver en TCGplayer',
      buildUrl: (card) => (card.externalId ? `https://www.tcgplayer.com/product/${card.externalId}` : null),
    },
  },
  WXS: {
    gameCode: 'WXS',
    gameName: 'Wixoss',
    colorsOrDomains: ['White', 'Red', 'Blue', 'Green', 'Black', 'Colorless'],
    types: ['LRIG', 'SIGNI', 'Spell'],
    formats: ['all_star', 'key_selection'],
  },
};

/**
 * Normaliza un código o nombre de juego al código estándar TCG_REGISTRY.
 */
export const normalizeGameCode = (game?: string | null): string => {
  if (!game) return 'MTG';
  const upper = game.trim().toUpperCase();

  if (upper === 'MTG' || upper.includes('MAGIC')) return 'MTG';
  if (upper === 'RFB' || upper.includes('RIFTBOUND')) return 'RFB';
  if (upper === 'GND' || upper.includes('GUNDAM')) return 'GND';
  if (upper === 'PKM' || upper.includes('POKEMON') || upper.includes('POKÉMON')) return 'PKM';
  if (upper === 'OPC' || upper.includes('ONE PIECE') || upper === 'ONEPIECE') return 'OPC';
  if (upper === 'DGM' || upper.includes('DIGIMON')) return 'DGM';
  if (upper === 'FAB' || upper.includes('FLESH')) return 'FAB';
  if (upper === 'LOR' || upper.includes('LORCANA')) return 'LOR';
  if (upper === 'YGO' || upper.includes('YU-GI-OH') || upper.includes('YUGIOH')) return 'YGO';
  if (upper === 'WXS' || upper.includes('WIXOSS')) return 'WXS';

  return upper in TCG_REGISTRY ? upper : 'MTG';
};

/**
 * Obtiene la configuración de un TCG. Retorna MTG por defecto si no se reconoce.
 */
export const getTcgConfig = (game?: string | null): TCGConfig => {
  const code = normalizeGameCode(game);
  return TCG_REGISTRY[code] || TCG_REGISTRY.MTG;
};

/**
 * Construye el enlace de marketplace externo de forma totalmente dinámica.
 */
export const getExternalMarketplaceLink = (
  game: string | undefined | null,
  card: {
    name: string;
    isFoil?: boolean;
    externalId?: string;
    setCode?: string;
    collectorNumber?: string;
  }
): { name: string; label: string; url: string } | null => {
  const config = getTcgConfig(game);
  if (!config.externalMarketplace) return null;

  const url = config.externalMarketplace.buildUrl(card);
  if (!url) return null;

  return {
    name: config.externalMarketplace.name,
    label: config.externalMarketplace.label,
    url,
  };
};
