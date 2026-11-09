/**
 * Configuration and helpers for controlling single card purchases.
 * When singles purchases are disabled (e.g. in production until further notice):
 * - Cards are viewable/browsable in catalog, search, and details.
 * - Add to cart buttons for cards are disabled and display "Cerrado Hasta Nuevo Aviso".
 * - Accessories and non-card products remain purchasable as normal.
 */

export const SINGLES_CLOSED_MESSAGE = 'Cerrado Hasta Nuevo Aviso';

const getEnv = (): Record<string, any> => {
  try {
    return (new Function('return import.meta.env'))();
  } catch {
    return (typeof process !== 'undefined' && process.env) || {};
  }
};

export const isSinglesPurchaseDisabled = (): boolean => {
  const env = getEnv();

  // Explicit override via environment variable if present
  if (env.VITE_DISABLE_SINGLES_PURCHASE === 'true') return true;
  if (env.VITE_DISABLE_SINGLES_PURCHASE === 'false') return false;

  // Allow localStorage override for testing: localStorage.setItem('singles_purchase_disabled', 'true')
  if (typeof window !== 'undefined' && window.localStorage) {
    const localOverride = window.localStorage.getItem('singles_purchase_disabled');
    if (localOverride === 'true') return true;
    if (localOverride === 'false') return false;
  }

  // By default, disabled in production (non-dev, non-localhost, non-127.0.0.1)
  const isDev = env.DEV || (typeof window !== 'undefined' && window.location && (
    window.location.hostname.includes('dev') ||
    window.location.hostname.includes('localhost') ||
    window.location.hostname === '127.0.0.1'
  ));

  return !isDev;
};
