import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchCart, listUserCarts, switchActiveCart, createNamedCart } from '../utils/api';
import { useAuth } from './AuthContext';

interface CartItem {
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    name?: string;
    image_url?: string;
    is_foil?: boolean;
    set_code?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    availableCarts: any[];
    cartCount: number;
    priceChangeAlert: boolean;
    dismissPriceAlert: () => void;
    refreshCart: () => Promise<void>;
    switchCart: (cartId: string) => Promise<void>;
    createCart: (name: string) => Promise<void>;
    isLoading: boolean;
    activeCartName: string | null;
}

const CartContext = createContext<CartContextType>({
    cartItems: [],
    availableCarts: [],
    cartCount: 0,
    priceChangeAlert: false,
    dismissPriceAlert: () => { },
    refreshCart: async () => { },
    switchCart: async () => { },
    createCart: async () => { },
    isLoading: false,
    activeCartName: null,
});

const CART_STORAGE_KEY = 'geekorium_cart_snapshot';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAdmin } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [availableCarts, setAvailableCarts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [priceChangeAlert, setPriceChangeAlert] = useState(false);
    const [activeCartName, setActiveCartName] = useState<string | null>(null);

    const refreshCart = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch items in the CURRENT ACTIVE cart
            const data = await fetchCart();
            
            // If admin, fetch list of carts too
            if (user && isAdmin) {
                const carts = await listUserCarts();
                setAvailableCarts(carts);
                
                // Find and set the active cart name
                const active = carts.find(c => c.is_active);
                if (active) {
                    setActiveCartName(active.name || 'Carrito Principal');
                } else {
                    setActiveCartName(null);
                }
            } else {
                setActiveCartName(null);
            }

            const items: CartItem[] = (data.items || []).map((item: any) => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity || 1,
                price: Number(item.products?.price || 0),
                name: item.products?.name,
                image_url: item.products?.image_url,
                is_foil: item.products?.is_foil,
                set_code: item.products?.set_code,
            }));

            // Compare against localStorage snapshot to detect price changes
            const snapshot = localStorage.getItem(CART_STORAGE_KEY);
            if (snapshot) {
                try {
                    const savedItems: CartItem[] = JSON.parse(snapshot);
                    const hasPriceChange = items.some(item => {
                        const saved = savedItems.find(s => s.product_id === item.product_id);
                        return saved && Math.abs(saved.price - item.price) > 0.01;
                    });
                    if (hasPriceChange) {
                        setPriceChangeAlert(true);
                    }
                } catch {
                    // Ignore parsing errors
                }
            }

            // Save snapshot
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            setCartItems(Array.isArray(items) ? items : []);
        } catch (err) {
            console.error('CartContext: failed to load cart', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, isAdmin]);

    // Load on mount and subscribe to cart-updated events
    useEffect(() => {
        refreshCart();
        const handler = () => refreshCart();
        window.addEventListener('cart-updated', handler);
        return () => window.removeEventListener('cart-updated', handler);
    }, [refreshCart]);

    const cartCount = Array.isArray(cartItems)
        ? cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0)
        : 0;

    const dismissPriceAlert = () => setPriceChangeAlert(false);

    const switchCart = async (cartId: string) => {
        setIsLoading(true);
        try {
            await switchActiveCart(cartId);
            await refreshCart();
        } catch (err) {
            console.error('Failed to switch cart:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const createCart = async (name: string) => {
        setIsLoading(true);
        try {
            await createNamedCart(name);
            await refreshCart();
        } catch (err) {
            console.error('Failed to create cart:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CartContext.Provider value={{ 
            cartItems, 
            availableCarts,
            cartCount, 
            priceChangeAlert, 
            dismissPriceAlert, 
            refreshCart, 
            switchCart,
            createCart,
            isLoading,
            activeCartName
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
