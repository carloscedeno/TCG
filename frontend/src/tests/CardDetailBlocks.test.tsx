import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CardDetailBlocks } from '../components/Card/CardDetailBlocks';
import { resolveLocalizedCardImage } from '../utils/cardLanguage';

const mockDetails = {
  printing_id: 'p-pc-foil',
  card_id: 'c-soul-stone',
  name: 'The Soul Stone',
  game: 'MTG',
  set: "Beyond the Universe: Marvel's Spider-Man Prerelease Cards",
  set_code: 'SPM',
  collector_number: '66s',
  image_url: 'https://example.com/soul-stone-pc.jpg',
  price: 179.99,
  total_stock: 10,
  legalities: {
    standard: 'legal',
    modern: 'legal',
    pioneer: 'legal',
    pauper: 'not_legal',
    duel: 'legal',
    commander: 'legal',
    vintage: 'legal',
    legacy: 'legal',
  },
};

const mockVersionGroups = [
  {
    base: {
      printing_id: 'p-pc-foil',
      set_name: "Marvel's Spider-Man Prerelease Cards",
      set_code: 'SPM',
      collector_number: '66s',
      image_url: 'https://example.com/soul-stone-pc.jpg',
      price: 179.99,
      stock: 4,
      finish: 'foil',
      is_foil: true,
    },
    normal: null,
    foil: {
      printing_id: 'p-pc-foil',
      set_name: "Marvel's Spider-Man Prerelease Cards",
      set_code: 'SPM',
      collector_number: '66s',
      image_url: 'https://example.com/soul-stone-pc.jpg',
      price: 179.99,
      original_price: 199.99,
      discount_percentage: 10,
      stock: 4,
      finish: 'foil',
      is_foil: true,
      language: 'EN',
    },
    etched: null,
    languages: ['EN', 'JP', 'ES'],
    totalStock: 4,
  },
  {
    base: {
      printing_id: 'p-spm-norm',
      set_name: "Marvel's Spider-Man",
      set_code: 'SPM',
      collector_number: '66',
      image_url: 'https://example.com/soul-stone-spm.jpg',
      price: 120,
      stock: 3,
      finish: 'nonfoil',
      is_foil: false,
    },
    normal: {
      printing_id: 'p-spm-norm',
      set_name: "Marvel's Spider-Man",
      set_code: 'SPM',
      collector_number: '66',
      image_url: 'https://example.com/soul-stone-spm.jpg',
      price: 120,
      stock: 3,
      finish: 'nonfoil',
      is_foil: false,
    },
    foil: {
      printing_id: 'p-spm-foil',
      set_name: "Marvel's Spider-Man",
      set_code: 'SPM',
      collector_number: '66',
      image_url: 'https://example.com/soul-stone-spm.jpg',
      price: 160,
      stock: 3,
      finish: 'foil',
      is_foil: true,
    },
    etched: null,
    totalStock: 6,
  },
];

describe('CardDetailBlocks (3-Block Detail View)', () => {
  it('renders MTG 6-format legalities, collector number, stock, discount, language pills, and separated Normal/Foil versions', () => {
    const onSelectVersion = jest.fn();
    const onSelectLanguage = jest.fn();
    const onAddToCart = jest.fn();

    render(
      <CardDetailBlocks
        details={mockDetails}
        loading={false}
        error={null}
        onClose={jest.fn()}
        activePrintingId="p-pc-foil"
        selectedFinish="foil"
        selectedLanguage="EN"
        activeGroup={mockVersionGroups[0]}
        activeVersion={mockVersionGroups[0].foil}
        versionGroups={mockVersionGroups}
        currentImage="https://example.com/soul-stone-pc.jpg"
        hasMultipleFaces={false}
        onFlipFace={jest.fn()}
        onSelectVersion={onSelectVersion}
        onSelectLanguage={onSelectLanguage}
        onAddToCart={onAddToCart}
        isAdding={false}
        addedSuccess={false}
      />
    );

    // Block 2: Title, TCG name, collector code, discount & price
    expect(screen.getByText('Magic: The Gathering')).toBeInTheDocument();
    expect(screen.getByText('The Soul Stone')).toBeInTheDocument();
    expect(screen.getByText(/SPM #66s/)).toBeInTheDocument();
    expect(screen.getAllByText(/179\.99 \$/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/10% OFF/i)).toBeInTheDocument();
    expect(screen.getAllByText('DISP: 4').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId('finish-tab-foil')).toHaveTextContent(/^FOIL$/);
    expect(screen.getByTestId('lang-btn-en')).toHaveTextContent('ENG');
    expect(screen.getByTestId('lang-btn-en')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('lang-btn-jp')).toHaveTextContent('JPN');
    expect(screen.getByTestId('lang-btn-es')).toHaveTextContent('SPN');
    fireEvent.click(screen.getByTestId('lang-btn-es'));
    expect(onSelectLanguage).toHaveBeenCalledWith('ES');
    expect(screen.getByTestId('version-stock-label')).toHaveTextContent('DISP: 4');
    expect(screen.getByTestId('quantity-control').className).toContain('w-28 h-10');
    expect(screen.getByTestId('add-to-cart-button').className).toContain('w-28 h-10');
    expect(screen.getByTestId('versions-count-label')).toHaveTextContent('2 Versiones');

    // MTG strictly 6 formats (5 legal + Pauper not legal; Legacy omitted)
    expect(screen.getByTestId('legality-standard')).toHaveAttribute('data-legal', 'true');
    expect(screen.getByTestId('legality-modern')).toHaveAttribute('data-legal', 'true');
    expect(screen.getByTestId('legality-pioneer')).toHaveAttribute('data-legal', 'true');
    expect(screen.getByTestId('legality-pauper')).toHaveAttribute('data-legal', 'false');
    expect(screen.getByTestId('legality-duel')).toHaveAttribute('data-legal', 'true');
    expect(screen.getByTestId('legality-commander')).toHaveAttribute('data-legal', 'true');
    expect(screen.queryByTestId('legality-legacy')).not.toBeInTheDocument();

    // Block 3: Total stock + separated Normal & Foil prices
    expect(screen.getByText('TOTAL DISP: 10')).toBeInTheDocument();
    expect(screen.getByText('120.00 $')).toBeInTheDocument();
    expect(screen.getByText('160.00 $')).toBeInTheDocument();

    // Quantity selector updates quantity sent to onAddToCart (capped to stock=4)
    const qtyInput = screen.getByLabelText('Cantidad') as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: '3' } });
    fireEvent.click(screen.getByTestId('add-to-cart-button'));
    expect(onAddToCart).toHaveBeenCalledWith(3);

    // Clicking separated Normal option in Block 3 selects that exact printing_id and nonfoil finish
    fireEvent.click(screen.getByText('120.00 $'));
    expect(onSelectVersion).toHaveBeenCalledWith('p-spm-norm', 'nonfoil');
  });

  it('uses English reference image for normal non-English MTG stock and Japanese art only for Japanese-exclusive editions', () => {
    const solJp = resolveLocalizedCardImage({
      productImage: 'https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/555449.jpg',
      language: 'JP',
      game: 'MTG',
      setCode: 'slds',
      collectorNumber: '1604',
    });
    expect(solJp.imageUrl).toBe('https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/555449.jpg');

    const kithkinEs = resolveLocalizedCardImage({
      productImage: 'https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/15550_ES.jpg',
      language: 'ES',
      game: 'MTG',
      setCode: 'lrw',
      collectorNumber: '26',
    });
    expect(kithkinEs.imageUrl).toBe('https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/15550.jpg');

    const staJpOnly = resolveLocalizedCardImage({
      productImage: 'https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/235900.jpg',
      language: 'JP',
      game: 'MTG',
      setCode: 'sta',
      collectorNumber: '90',
    });
    expect(staJpOnly.imageUrl).toBe('https://api.scryfall.com/cards/sta/90/ja?format=image&version=normal');
    expect(staJpOnly.fallbackImageUrl).toBe('https://sortswift.nyc3.cdn.digitaloceanspaces.com/cards/235900.jpg');
  });
});
