export const rarityMap: Record<string, string> = {
    'Common': 'Común',
    'Uncommon': 'Infrecuente',
    'Rare': 'Rara',
    'Mythic': 'Mítica',
    'All': 'Todas'
};

export const typeMap: Record<string, string> = {
    'Creature': 'Criatura',
    'Instant': 'Instantáneo',
    'Sorcery': 'Conjuro',
    'Enchantment': 'Encantamiento',
    'Artifact': 'Artefacto',
    'Planeswalker': 'Planeswalker',
    'Land': 'Tierra'
};

export const colorMap: Record<string, string> = {
    'White': 'Blanco',
    'Blue': 'Azul',
    'Black': 'Negro',
    'Red': 'Rojo',
    'Green': 'Verde',
    'Colorless': 'Incoloro',
    'Multicolor': 'Multicolor'
};

export const reverseRarityMap: Record<string, string> = Object.entries(rarityMap).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});
export const reverseTypeMap: Record<string, string> = Object.entries(typeMap).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});
export const reverseColorMap: Record<string, string> = Object.entries(colorMap).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});
