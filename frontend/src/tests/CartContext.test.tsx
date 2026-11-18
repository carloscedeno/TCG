import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CartProvider, useCart } from '../context/CartContext';

const mockFetchCart = jest.fn();
const mockListUserCarts = jest.fn();

jest.mock('../utils/api', () => ({
  fetchCart: (...args: any[]) => mockFetchCart(...args),
  listUserCarts: (...args: any[]) => mockListUserCarts(...args),
  switchActiveCart: jest.fn(),
  createNamedCart: jest.fn(),
  clearActiveCart: jest.fn(),
}));

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

const CartProbe = () => {
  const { cartItems, cartCount, isLoading } = useCart();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="count">{cartCount}</span>
      <span data-testid="items">{cartItems.length}</span>
    </div>
  );
};

describe('CartContext (Guest & Array Guards)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('aggregates cartCount accurately from fetched items', async () => {
    mockFetchCart.mockResolvedValue({
      items: [
        { id: '1', product_id: 'p1', quantity: 2, price: 5.0, name: 'Sol Ring' },
        { id: '2', product_id: 'p2', quantity: 3, price: 1.5, name: 'Brainstorm' },
      ],
      priceChanged: false,
    });

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('5');
      expect(screen.getByTestId('items')).toHaveTextContent('2');
    });
  });

  it('handles malformed non-array response without crashing (.reduce guard)', async () => {
    mockFetchCart.mockResolvedValue({
      items: null,
      priceChanged: false,
    });

    render(
      <CartProvider>
        <CartProbe />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
