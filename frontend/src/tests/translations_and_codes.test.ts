import { rarityMap, typeMap, colorMap } from '../utils/translations';

const CANONICAL_TCG_CODES = ['MTG', 'PKM', 'YGO', 'OPC', 'LOR', 'FAB', 'RFB', 'GND', 'DGM'] as const;

describe('Translations & Canonical TCG Codes (Ley 18)', () => {
  it('maps core MTG rarities to Spanish', () => {
    expect(rarityMap['Common']).toBe('Común');
    expect(rarityMap['Uncommon']).toBe('Infrecuente');
    expect(rarityMap['Rare']).toBe('Rara');
    expect(rarityMap['Mythic']).toBe('Mítica');
  });

  it('maps core card types and colors to Spanish', () => {
    expect(typeMap['Creature']).toBe('Criatura');
    expect(typeMap['Instant']).toBe('Instantáneo');
    expect(colorMap['Multicolor']).toBe('Multicolor');
    expect(colorMap['Colorless']).toBe('Incoloro');
  });

  it('maintains 3-letter canonical TCG codes without legacy names', () => {
    expect(CANONICAL_TCG_CODES).toHaveLength(9);
    for (const code of CANONICAL_TCG_CODES) {
      expect(code).toMatch(/^[A-Z]{3}$/);
    }
    expect(CANONICAL_TCG_CODES).not.toContain('SINGLES');
    expect(CANONICAL_TCG_CODES).not.toContain('POKEMON');
    expect(CANONICAL_TCG_CODES).not.toContain('YUGIOH');
  });
});
