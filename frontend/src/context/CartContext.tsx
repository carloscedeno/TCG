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
            // 1. Fetch items in the CURRENT ACTIVE cart
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
                setCartItems(Array.isArray(items) ? items : []);
                
                // Save snapshot for price change detection
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            } catch (err) {
                console.warn('CartContext: current cart items load failed', err);
                setCartItems([]);
            }
            
            // 2. Fetch list of available carts (Crucial for Admin Management)
            if (user) {
                try {
                    const carts = await listUserCarts();
                    setAvailableCarts(carts);
                    
                    // Find and set the active cart name
                    const active = carts.find(c => c.is_active);
                    if (active) {
                        setActiveCartName(active.name || 'Carrito Principal');
                    } else if (carts.length > 0) {
                        setActiveCartName(carts[0].name || 'Carrito Principal');
                    } else {
                        setActiveCartName(null);
                    }
                } catch (err) {
                    console.error('CartContext: available carts load failed', err);
                    setAvailableCarts([]);
                }
            } else {
                setActiveCartName(null);
                setAvailableCarts([]);
            }

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
        if (user) {
            refreshCart();
        }
        const handler = () => refreshCart();
        window.addEventListener('cart-updated', handler);
        return () => window.removeEventListener('cart-updated', handler);
    }, [refreshCart, user, isAdmin]); // Added user and isAdmin to ensure it runs when state updates

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
        } catch (err: any) {
            console.error('Failed to create cart:', err);
            // Alert user of permission issues
            if (err.message?.includes('admin')) {
                alert('Error: Solo los administradores pueden realizar esta acción.');
            }
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
