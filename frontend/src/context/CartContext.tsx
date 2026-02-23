import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchCart } from '../utils/api';

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
    cartCount: number;
    priceChangeAlert: boolean;
    dismissPriceAlert: () => void;
    refreshCart: () => Promise<void>;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType>({
    cartItems: [],
    cartCount: 0,
    priceChangeAlert: false,
    dismissPriceAlert: () => { },
    refreshCart: async () => { },
    isLoading: false,
});

const CART_STORAGE_KEY = 'geekorium_cart_snapshot';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [priceChangeAlert, setPriceChangeAlert] = useState(false);

    const refreshCart = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchCart();
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
            setCartItems(items);
        } catch (err) {
            console.error('CartContext: failed to load cart', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load on mount and subscribe to cart-updated events
    useEffect(() => {
        refreshCart();
        const handler = () => refreshCart();
        window.addEventListener('cart-updated', handler);
        return () => window.removeEventListener('cart-updated', handler);
    }, [refreshCart]);

    const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    const dismissPriceAlert = () => setPriceChangeAlert(false);

    return (
        <CartContext.Provider value={{ cartItems, cartCount, priceChangeAlert, dismissPriceAlert, refreshCart, isLoading }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
