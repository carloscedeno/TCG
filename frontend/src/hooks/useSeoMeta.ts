import { useEffect } from 'react';

export const SITE_URL = 'https://geekorium.shop';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/branding/Logo.png`;

export interface SeoMetaConfig {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  ogType?: 'website' | 'product' | 'article';
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  schemaId?: string;
}

const upsertMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertCanonical = (href: string) => {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

export const buildAbsoluteUrl = (pathOrUrl?: string): string => {
  if (!pathOrUrl) return SITE_URL;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
};

export const buildCardProductSeo = (params: {
  id: string;
  name: string;
  setName?: string;
  setCode?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  finish?: string;
  game?: string;
  rarity?: string;
  isAccessory?: boolean;
}): SeoMetaConfig => {
  const cleanName = params.name.replace(/\(preventa\)/gi, '').trim();
  const setLabel = params.setName || params.setCode?.toUpperCase() || '';
  const finishLabel = !params.isAccessory && params.finish === 'foil' ? ' [Foil]' : '';
  const priceLabel = typeof params.price === 'number' && params.price > 0 ? ` — $${params.price.toFixed(2)}` : '';
  const availability = (params.stock ?? 0) > 0 ? 'Disponible en stock' : 'Disponible por encargo';

  const title = `${cleanName}${finishLabel}${setLabel ? ` (${setLabel})` : ''}${priceLabel} | Geekorium`;
  const description = `Compra ${cleanName}${finishLabel}${setLabel ? ` de ${setLabel}` : ''} en Geekorium Venezuela. ${availability}${priceLabel ? ` a ${priceLabel.replace(' — ', '')} USD` : ''}.`;
  const canonicalPath = `/card/${params.id}`;
  const image = params.imageUrl || DEFAULT_OG_IMAGE;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${cleanName}${finishLabel}`,
    image,
    description,
    sku: params.id,
    category: params.game || (params.isAccessory ? 'TCG Accessories' : 'Trading Card Singles'),
    brand: {
      '@type': 'Brand',
      name: params.game || 'Geekorium',
    },
    offers: {
      '@type': 'Offer',
      url: buildAbsoluteUrl(canonicalPath),
      priceCurrency: 'USD',
      price: typeof params.price === 'number' && params.price > 0 ? params.price.toFixed(2) : '0.00',
      availability: (params.stock ?? 0) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/PreOrder',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Geekorium Emporio Mágico',
        url: SITE_URL,
      },
    },
  };

  return {
    title,
    description,
    canonicalPath,
    image,
    ogType: 'product',
    jsonLd,
    schemaId: 'geeko-product-jsonld',
  };
};

export const useSeoMeta = (config: SeoMetaConfig | null) => {
  const serializedJsonLd = config?.jsonLd ? JSON.stringify(config.jsonLd) : '';

  useEffect(() => {
    if (!config || typeof document === 'undefined') return;

    const canonicalUrl = buildAbsoluteUrl(config.canonicalPath);
    const ogImage = buildAbsoluteUrl(config.image || DEFAULT_OG_IMAGE);
    const ogType = config.ogType || 'website';
    const schemaElementId = config.schemaId || 'geeko-seo-jsonld';

    document.title = config.title;
    upsertMetaTag('name', 'description', config.description);
    upsertCanonical(canonicalUrl);

    if (config.robots) {
      upsertMetaTag('name', 'robots', config.robots);
    }

    upsertMetaTag('property', 'og:type', ogType);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:title', config.title);
    upsertMetaTag('property', 'og:description', config.description);
    upsertMetaTag('property', 'og:image', ogImage);

    upsertMetaTag('property', 'twitter:url', canonicalUrl);
    upsertMetaTag('property', 'twitter:title', config.title);
    upsertMetaTag('property', 'twitter:description', config.description);
    upsertMetaTag('property', 'twitter:image', ogImage);

    let scriptEl = document.getElementById(schemaElementId) as HTMLScriptElement | null;
    if (serializedJsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = schemaElementId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = serializedJsonLd;
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      if (config.schemaId && config.schemaId !== 'geeko-seo-jsonld') {
        document.getElementById(config.schemaId)?.remove();
      }
    };
  }, [
    config?.title,
    config?.description,
    config?.canonicalPath,
    config?.image,
    config?.ogType,
    config?.robots,
    config?.schemaId,
    serializedJsonLd,
  ]);
};
