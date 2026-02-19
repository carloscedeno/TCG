/**
 * Generates a robust Search URL for CardKingdom.
 * This format is more reliable than direct slugs which can change or be inconsistent.
 * 
 * @param name The card name (e.g. "Sol Ring")
 * @param isFoil Whether to filter for the Foil version
 * @returns A working CardKingdom search URL
 */
export const getCardKingdomUrl = (name: string, isFoil: boolean = false): string => {
    const baseUrl = 'https://www.cardkingdom.com/catalog/search';
    const queryParams = new URLSearchParams();

    queryParams.append('filter[name]', name);

    if (isFoil) {
        // Verified: 'mtg_foil' is the correct tab value for foils
        queryParams.append('filter[tab]', 'mtg_foil');
    }

    return `${baseUrl}?${queryParams.toString()}`;
};
