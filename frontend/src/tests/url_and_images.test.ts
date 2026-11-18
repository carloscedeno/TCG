import { getCardKingdomUrl } from '../utils/urlUtils';
import { getOptimizedScryfallUrl } from '../utils/imageOptimization';

describe('urlUtils & imageOptimization', () => {
  describe('getCardKingdomUrl', () => {
    it('generates standard non-foil search URL', () => {
      const url = getCardKingdomUrl('Sol Ring', false);
      expect(url).toBe('https://www.cardkingdom.com/catalog/search?filter%5Bname%5D=Sol+Ring');
    });

    it('strips back face for DFC cards (//)', () => {
      const url = getCardKingdomUrl('Delver of Secrets // Insectile Aberration', false);
      expect(url).toContain('filter%5Bname%5D=Delver+of+Secrets');
      expect(url).not.toContain('Insectile');
    });

    it('adds mtg_foil tab when isFoil is true', () => {
      const url = getCardKingdomUrl('Lightning Bolt', true);
      expect(url).toContain('filter%5Btab%5D=mtg_foil');
    });
  });

  describe('getOptimizedScryfallUrl', () => {
    it('returns empty string for null or undefined', () => {
      expect(getOptimizedScryfallUrl(null)).toBe('');
      expect(getOptimizedScryfallUrl(undefined)).toBe('');
    });

    it('rewrites Scryfall size segment', () => {
      const raw = 'https://cards.scryfall.io/normal/front/1/2/12345.jpg';
      expect(getOptimizedScryfallUrl(raw, 'small')).toBe('https://cards.scryfall.io/small/front/1/2/12345.jpg');
      expect(getOptimizedScryfallUrl(raw, 'large')).toBe('https://cards.scryfall.io/large/front/1/2/12345.jpg');
    });

    it('rewrites Exburst Gundam image quality segments', () => {
      const raw = 'https://exburst.dev/gundam/cards/md/GD01-001.webp';
      expect(getOptimizedScryfallUrl(raw, 'small')).toBe('https://exburst.dev/gundam/cards/sd/GD01-001.webp');
      expect(getOptimizedScryfallUrl(raw, 'large')).toBe('https://exburst.dev/gundam/cards/hd/GD01-001.webp');
    });

    it('preserves SortSwift CDN URLs unchanged', () => {
      const raw = 'https://sortswift.nyc3.digitaloceanspaces.com/cards/rfb-001.png';
      expect(getOptimizedScryfallUrl(raw, 'small')).toBe(raw);
    });
  });
});
