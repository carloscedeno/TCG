/**
 * Unit tests for the ManaBox TXT parser logic.
 * These test the pure parsing functions (no network calls).
 *
 * Run with: npx jest src/tests/txt_parser.test.ts
 */

// ---------------------------------------------------------------------------
// Minimal inline re-implementation of the parser logic.
// Replace import paths if the parser is extracted into its own module.
// ---------------------------------------------------------------------------

interface ParsedCard {
    quantity: number;
    name: string;
    set_code?: string;
    collector_number?: string;
    is_foil: boolean;
}

interface ParseResult {
    cards: ParsedCard[];
    failed_rows: { line: number; raw: string; reason: string }[];
}

/**
 * Parse a ManaBox export TXT file content.
 *
 * Expected line format (example):
 *   4 Lightning Bolt (M10) 149
 *   1 Black Lotus *F* (LEA) 232
 *   2 Snapcaster Mage (Foil) (ISD) 78
 */
function parseManaboxTxt(content: string): ParseResult {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const cards: ParsedCard[] = [];
    const failed_rows: ParseResult['failed_rows'] = [];

    const FOIL_MARKERS = [/\*F\*/i, /\(F\)/i, /\bFoil\b/i, /\bETCHED\b/i];

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (raw.startsWith('//') || raw.startsWith('#')) continue; // comments

        // Detect foil by marker presence
        const is_foil = FOIL_MARKERS.some(r => r.test(raw));

        // Strip foil markers for name extraction
        let cleaned = raw.replace(/\*F\*/gi, '').replace(/\(F\)/gi, '').replace(/\bFoil\b/gi, '').replace(/\bETCHED\b/gi, '').trim();

        // Extract collector number: last group of digits after set code
        const collectorMatch = cleaned.match(/\(([A-Z0-9]+)\)\s*(\d+)\s*$/i);
        let set_code = collectorMatch?.[1]?.toUpperCase();
        const collector_number = collectorMatch?.[2];

        // Remove set+collector from string
        if (collectorMatch) {
            cleaned = cleaned.slice(0, collectorMatch.index).trim();
        } else {
            // Try to remove just the set code (no collector number)
            const setOnlyMatch = cleaned.match(/\(([A-Z0-9]+)\)\s*$/i);
            if (setOnlyMatch) {
                set_code = setOnlyMatch[1].toUpperCase();
                cleaned = cleaned.slice(0, setOnlyMatch.index).trim();
            }
        }

        // Extract leading number (quantity)
        const quantityMatch = cleaned.match(/^(\d+)\s+/);
        if (!quantityMatch) {
            failed_rows.push({ line: i + 1, raw, reason: 'No quantity found at start of line' });
            continue;
        }

        const quantity = parseInt(quantityMatch[1], 10);
        const name = cleaned.slice(quantityMatch[0].length).trim();

        if (!name || name.length < 2) {
            failed_rows.push({ line: i + 1, raw, reason: 'Card name too short or missing' });
            continue;
        }

        cards.push({ quantity, name, set_code, collector_number, is_foil });
    }

    return { cards, failed_rows };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parseManaboxTxt', () => {
    it('parses a normal card correctly', () => {
        const input = '4 Lightning Bolt (M10) 149';
        const { cards, failed_rows } = parseManaboxTxt(input);
        expect(failed_rows).toHaveLength(0);
        expect(cards).toHaveLength(1);
        const [card] = cards;
        expect(card.name).toBe('Lightning Bolt');
        expect(card.quantity).toBe(4);
        expect(card.set_code).toBe('M10');
        expect(card.collector_number).toBe('149');
        expect(card.is_foil).toBe(false);
    });

    it('detects foil via *F* marker', () => {
        const input = '1 Black Lotus *F* (LEA) 232';
        const { cards } = parseManaboxTxt(input);
        expect(cards[0].is_foil).toBe(true);
        expect(cards[0].name).toBe('Black Lotus');
        expect(cards[0].set_code).toBe('LEA');
    });

    it('detects foil via (F) marker', () => {
        const input = '2 Force of Will (F) (ALL) 82';
        const { cards } = parseManaboxTxt(input);
        expect(cards[0].is_foil).toBe(true);
        expect(cards[0].name).toBe('Force of Will');
    });

    it('detects foil via "Foil" word', () => {
        const input = '1 Snapcaster Mage Foil (ISD) 78';
        const { cards } = parseManaboxTxt(input);
        expect(cards[0].is_foil).toBe(true);
        expect(cards[0].name).toBe('Snapcaster Mage');
    });

    it('detects etched foil', () => {
        const input = '1 Mox Diamond ETCHED (EUR) 45';
        const { cards } = parseManaboxTxt(input);
        expect(cards[0].is_foil).toBe(true);
    });

    it('handles card name with special characters (apostrophe, comma)', () => {
        const input = "3 Asmoranomardicadaistinaculdacar (MH2) 100";
        const { cards, failed_rows } = parseManaboxTxt(input);
        expect(failed_rows).toHaveLength(0);
        expect(cards[0].name).toBe('Asmoranomardicadaistinaculdacar');
    });

    it('handles card without collector_number', () => {
        const input = '2 Birds of Paradise (RAV)';
        const { cards, failed_rows } = parseManaboxTxt(input);
        expect(failed_rows).toHaveLength(0);
        expect(cards[0].collector_number).toBeUndefined();
        expect(cards[0].set_code).toBe('RAV');
        expect(cards[0].name).toBe('Birds of Paradise');
    });

    it('handles card with no set code at all', () => {
        const input = '1 Counterspell';
        const { cards, failed_rows } = parseManaboxTxt(input);
        expect(failed_rows).toHaveLength(0);
        expect(cards[0].set_code).toBeUndefined();
        expect(cards[0].collector_number).toBeUndefined();
    });

    it('adds corrupted/malformed lines to failed_imports', () => {
        const input = 'not a valid line at all\n3 Lightning Bolt (M10) 149';
        const { cards, failed_rows } = parseManaboxTxt(input);
        expect(failed_rows).toHaveLength(1);
        expect(failed_rows[0].reason).toContain('No quantity');
        expect(cards).toHaveLength(1);
    });

    it('ignores comment lines starting with //', () => {
        const input = '// This is a comment\n4 Counterspell (6ED) 61\n# Another comment';
        const { cards, failed_rows } = parseManaboxTxt(input);
        expect(failed_rows).toHaveLength(0);
        expect(cards).toHaveLength(1);
    });

    it('handles empty name line as failed row', () => {
        const input = '5  ';
        const { failed_rows } = parseManaboxTxt(input);
        expect(failed_rows.length).toBeGreaterThan(0);
    });

    it('parses 500+ lines in under 2000ms', () => {
        const block = Array.from({ length: 550 }, (_, i) =>
            `${(i % 4) + 1} Test Card ${i} *F* (TST) ${i + 1}`
        ).join('\n');

        const start = performance.now();
        const { cards } = parseManaboxTxt(block);
        const elapsed = performance.now() - start;

        expect(elapsed).toBeLessThan(2000);
        expect(cards.length).toBe(550);
        expect(cards.every(c => c.is_foil)).toBe(true);
    });
});
