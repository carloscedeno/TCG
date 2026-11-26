import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CheckoutPage } from '../pages/CheckoutPage';

const mockNavigate = jest.fn();
const mockFetchCart = jest.fn();
const mockCreateOrder = jest.fn();
const mockSendCheckoutEmail = jest.fn();
const mockFetchUserAddresses = jest.fn();
const mockSaveUserAddress = jest.fn();

const mockAuthGetUser = jest.fn();
const mockProfilesSingle = jest.fn();
const mockProfilesLimit = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

jest.mock('../utils/api', () => ({
  fetchCart: (...args: any[]) => mockFetchCart(...args),
  createOrder: (...args: any[]) => mockCreateOrder(...args),
  sendCheckoutEmailNotification: (...args: any[]) => mockSendCheckoutEmail(...args),
  fetchUserAddresses: (...args: any[]) => mockFetchUserAddresses(...args),
  saveUserAddress: (...args: any[]) => mockSaveUserAddress(...args),
}));

jest.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: (...args: any[]) => mockAuthGetUser(...args),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: (...args: any[]) => mockProfilesSingle(...args),
            }),
            or: () => ({
              limit: (...args: any[]) => mockProfilesLimit(...args),
            }),
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ single: jest.fn() }) }),
      };
    },
  },
}));

const sampleCartItems = [
  {
    id: 'ci-1',
    product_id: 'prod-1',
    quantity: 1,
    products: {
      id: 'prod-1',
      name: 'Lightning Bolt',
      set_code: 'LEA',
      price: 10,
      stock: 2,
      finish: 'nonfoil',
    },
  },
];

describe('CheckoutPage Multi-Cart (POS) vs Standard Checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'admin-uuid', email: 'admin@geekorium.shop' } },
    });
    mockProfilesSingle.mockResolvedValue({
      data: {
        first_name: 'Admin',
        last_name: 'Geeko',
        phone: '04141112233',
        cedula: 'V-99999999',
        address: 'Oficina Admin',
      },
    });
    mockFetchUserAddresses.mockResolvedValue([]);
    mockCreateOrder.mockResolvedValue({ order_id: 'ord-test-1', success: true });
    mockSendCheckoutEmail.mockResolvedValue({});
  });

  it('POS checkout does not prefill Admin data and allows order creation without email or user account', async () => {
    mockFetchCart.mockResolvedValue({
      id: 'pos-cart-1',
      name: 'Carlos Perez',
      is_pos: true,
      items: sampleCartItems,
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText(/Datos del Cliente \(Atención\)/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Nombre Completo/i) as HTMLInputElement;
    const whatsappInput = screen.getByLabelText(/Número de WhatsApp/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/Correo Electrónico/i) as HTMLInputElement;

    // Prefilled from POS cart name, NEVER from Admin profile
    expect(nameInput.value).toBe('Carlos Perez');
    expect(emailInput.value).toBe('');
    expect(whatsappInput.value).toBe('');
    expect(mockFetchUserAddresses).not.toHaveBeenCalled();

    // Fill only customer WhatsApp (no email, no registered user linked)
    fireEvent.change(whatsappInput, { target: { value: '04141234567' } });

    const submitBtn = screen.getByRole('button', { name: /Confirmar y Pagar por WhatsApp/i });
    expect(submitBtn).toBeEnabled();

    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    });

    const callArg = mockCreateOrder.mock.calls[0][0];
    expect(callArg.userId).toBeNull();
    expect(callArg.cartId).toBe('pos-cart-1');
    expect(callArg.customerName).toBe('Carlos Perez');
    expect(callArg.shippingAddress.is_pos).toBe(true);
    expect(callArg.shippingAddress.email).toBe('');
    expect(callArg.guestInfo).toEqual({ email: '', phone: '04141234567' });
    expect(mockSendCheckoutEmail).not.toHaveBeenCalled();
  });

  it('POS checkout can link a registered user from profiles and attach order to their userId', async () => {
    jest.useFakeTimers();
    mockFetchCart.mockResolvedValue({
      id: 'pos-cart-2',
      name: 'Carrito Principal',
      is_pos: true,
      items: sampleCartItems,
    });
    mockProfilesLimit.mockResolvedValue({
      data: [
        {
          id: 'cust-uuid-42',
          username: 'eklala',
          first_name: 'Erika',
          last_name: 'Garcia',
          email: 'erika@example.com',
          phone: '04245556677',
          cedula: 'V-27669420',
          address: 'Altamira',
        },
      ],
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar cliente por nombre/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar cliente por nombre/i);
    fireEvent.change(searchInput, { target: { value: 'Erika' } });

    await act(async () => {
      jest.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText('Erika Garcia')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Seleccionar/i }));

    expect((screen.getByLabelText(/Nombre Completo/i) as HTMLInputElement).value).toBe('Erika Garcia');
    expect((screen.getByLabelText(/Correo Electrónico/i) as HTMLInputElement).value).toBe('erika@example.com');
    expect((screen.getByLabelText(/Número de WhatsApp/i) as HTMLInputElement).value).toBe('04245556677');

    const submitBtn = screen.getByRole('button', { name: /Confirmar y Pagar por WhatsApp/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledTimes(1);
    });

    const callArg = mockCreateOrder.mock.calls[0][0];
    expect(callArg.userId).toBe('cust-uuid-42');
    expect(callArg.guestInfo).toBeUndefined();
    expect(callArg.customerName).toBe('Erika Garcia');
    expect(callArg.shippingAddress.email).toBe('erika@example.com');
    expect(mockSendCheckoutEmail).toHaveBeenCalledWith(
      expect.objectContaining({ user_email: 'erika@example.com' })
    );

    jest.useRealTimers();
  });

  it('Standard (non-POS) checkout keeps prefilling the logged-in user profile and userId', async () => {
    mockFetchCart.mockResolvedValue({
      id: 'std-cart-1',
      name: 'Carrito Principal',
      is_pos: false,
      items: sampleCartItems,
    });

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByText(/Tus Datos/i)).toBeInTheDocument();
      expect((screen.getByLabelText(/Correo Electrónico/i) as HTMLInputElement).value).toBe('admin@geekorium.shop');
    });

    expect((screen.getByLabelText(/Nombre Completo/i) as HTMLInputElement).value).toBe('Admin Geeko');
    expect(screen.queryByText(/Vincular Usuario Registrado/i)).not.toBeInTheDocument();
  });
});
