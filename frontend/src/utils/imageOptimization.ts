/**
 * imageOptimization.ts
 * Utilidades para interceptar y optimizar la carga de imágenes desde Scryfall y otras fuentes.
 */

type ScryfallSize = 'small' | 'normal' | 'large' | 'png' | 'art_crop' | 'border_crop';

/**
 * Recibe una URL de Scryfall (ej: https://cards.scryfall.io/normal/front/...) 
 * y la convierte al tamaño deseado para ahorrar ancho de banda.
 * Si la URL no es de Scryfall, la devuelve tal cual.
 */
export const getOptimizedScryfallUrl = (url: string | undefined | null, size: ScryfallSize = 'small'): string => {
  if (!url) return '';
  
  // Validar si es una URL de scryfall
  if (url.includes('cards.scryfall.io')) {
    // Las URLs de Scryfall suelen tener el formato: https://cards.scryfall.io/<tamaño>/front/...
    return url.replace(/(cards\.scryfall\.io\/)(small|normal|large|png|art_crop|border_crop)(\/)/i, `$1${size}$3`);
  }

  // Validar si es una URL de Gundam (exburst.dev)
  if (url.includes('exburst.dev/gundam/cards')) {
    // Exburst soporta /hd/, /md/ y /sd/.
    let exburstSize = 'md';
    if (size === 'small') exburstSize = 'sd';
    if (size === 'large' || size === 'png') exburstSize = 'hd';
    
    return url.replace(/\/cards\/(hd|md|sd)\//i, `/cards/${exburstSize}/`);
  }

  // Si usamos un proxy futuro (ej. Cloudflare), podríamos interceptarlo aquí
  return url;
};
