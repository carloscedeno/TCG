import { render, cleanup } from '@testing-library/react';
import { useSeoMeta, buildCardProductSeo, SITE_URL } from '../hooks/useSeoMeta';

const SeoTestHarness = ({ config }: { config: Parameters<typeof useSeoMeta>[0] }) => {
  useSeoMeta(config);
  return null;
};

describe('useSeoMeta & Schema.org builders', () => {
  afterEach(() => {
    cleanup();
    document.head.innerHTML = '';
    document.title = '';
  });

  test('updates title, description, canonical, OG tags, and JSON-LD script', () => {
    render(
      <SeoTestHarness
        config={{
          title: 'Torneos TCG | Geekorium',
          description: 'Calendario oficial de torneos en Venezuela',
          canonicalPath: '/tournaments',
          image: 'https://geekorium.shop/branding/Misiones.jpg',
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: 'FNM Standard',
          },
          schemaId: 'test-events-ld',
        }}
      />
    );

    expect(document.title).toBe('Torneos TCG | Geekorium');
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Calendario oficial de torneos en Venezuela'
    );
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE_URL}/tournaments`
    );
    expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://geekorium.shop/branding/Misiones.jpg'
    );

    const ldScript = document.getElementById('test-events-ld');
    expect(ldScript).not.toBeNull();
    expect(JSON.parse(ldScript?.textContent || '{}')).toMatchObject({
      '@type': 'Event',
      name: 'FNM Standard',
    });
  });

  test('buildCardProductSeo generates Product + Offer JSON-LD with stock and foil finish', () => {
    const seo = buildCardProductSeo({
      id: '1234-foil',
      name: 'Lightning Bolt',
      setName: 'Alpha',
      setCode: 'lea',
      price: 12.5,
      stock: 4,
      imageUrl: 'https://cards.scryfall.io/normal/bolt.jpg',
      finish: 'foil',
      game: 'MTG',
    });

    expect(seo.title).toContain('Lightning Bolt [Foil] (Alpha) — $12.50 | Geekorium');
    expect(seo.canonicalPath).toBe('/card/1234-foil');
    expect(seo.ogType).toBe('product');
    expect(seo.jsonLd).toMatchObject({
      '@type': 'Product',
      name: 'Lightning Bolt [Foil]',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: '12.50',
        availability: 'https://schema.org/InStock',
      },
    });
  });

  test('removes custom schema script on unmount', () => {
    const { unmount } = render(
      <SeoTestHarness
        config={{
          title: 'Card Test',
          description: 'Desc',
          canonicalPath: '/card/abc',
          jsonLd: { '@type': 'Product', name: 'Sol Ring' },
          schemaId: 'geeko-product-jsonld',
        }}
      />
    );

    expect(document.getElementById('geeko-product-jsonld')).not.toBeNull();
    unmount();
    expect(document.getElementById('geeko-product-jsonld')).toBeNull();
  });
});
