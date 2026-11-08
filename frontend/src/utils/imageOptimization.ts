/**
 * imageOptimization.ts
 * Utilidades para interceptar y optimizar la carga de imágenes desde Scryfall, SortSwift y otras fuentes.
 */

type ScryfallSize = 'small' | 'normal' | 'large' | 'png' | 'art_crop' | 'border_crop';

/**
 * Recibe una URL de imagen (ej: Scryfall, Exburst/Gundam, SortSwift)
 * y la convierte al tamaño deseado para ahorrar ancho de banda.
 * Si la URL no es transformable, la devuelve tal cual.
 */
export const getOptimizedScryfallUrl = (url: string | undefined | null, size: ScryfallSize = 'small'): string => {
  if (!url) return '';
  
  // 1. Validar si es una URL de Scryfall
  if (url.includes('cards.scryfall.io')) {
    // Formato Scryfall: https://cards.scryfall.io/<tamaño>/front/...
    return url.replace(/(cards\.scryfall\.io\/)(small|normal|large|png|art_crop|border_crop)(\/)/i, `$1${size}$3`);
  }

  // 2. Validar si es una URL de Gundam (exburst.dev)
  if (url.includes('exburst.dev/gundam/cards')) {
    // Exburst soporta /hd/, /md/ y /sd/.
    let exburstSize = 'md';
    if (size === 'small') exburstSize = 'sd';
    if (size === 'large' || size === 'png') exburstSize = 'hd';
    
    return url.replace(/\/cards\/(hd|md|sd)\//i, `/cards/${exburstSize}/`);
  }

  // 3. Validar si es una URL de SortSwift CDN (DigitalOcean Spaces)
  if (url.includes('sortswift') || url.includes('digitaloceanspaces.com')) {
    // Las imágenes de SortSwift son servidas directamente desde el bucket CDN en alta definición
    return url;
  }

  // Si usamos un proxy futuro (ej. Cloudflare Images), podríamos interceptarlo aquí
  return url;
};
