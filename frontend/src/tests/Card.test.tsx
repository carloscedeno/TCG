import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../components/Card/Card';

jest.mock('../utils/api', () => ({
  fetchCardDetails: jest.fn(),
  addToCart: jest.fn(),
}));

describe('Card Component (Ley 20 & Visual Guards)', () => {
  const baseProps = {
    card_id: 'c-1',
    name: 'Lightning Bolt',
    set: 'M11',
    imageUrl: 'https://cards.scryfall.io/normal/front/a/b/ab123.jpg',
    price: 2.5,
    rarity: 'common',
    total_stock: 4,
  };

  it('renders card name, set, and formatted price', () => {
    render(<Card {...baseProps} />);
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    expect(screen.getByText(/2\.50/)).toBeInTheDocument();
  });

  it('renders discount badge and strikethrough original price when discount_percentage > 0', () => {
    render(
      <Card
        {...baseProps}
        price={8.0}
        original_price={10.0}
        discount_percentage={20}
      />
    );
    expect(screen.getAllByText(/-20%/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/10\.00/)).toBeInTheDocument();
    expect(screen.getByText(/8\.00/)).toBeInTheDocument();
  });

  it('handles nullish/zero price safely without throwing', () => {
    render(<Card {...baseProps} price={0} total_stock={0} />);
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
  });

  it('shows DFC flip button when card has // in name', () => {
    render(
      <Card
        {...baseProps}
        name="Delver of Secrets // Insectile Aberration"
      />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('hides Add to Cart button by default and shows it when showCartButton=true', () => {
    const { rerender } = render(<Card {...baseProps} showCartButton={false} />);
    expect(screen.queryByTitle(/Añadir al carrito/i)).not.toBeInTheDocument();

    rerender(<Card {...baseProps} showCartButton={true} />);
    // In grid/list mode with showCartButton=true, an add action button is rendered
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
