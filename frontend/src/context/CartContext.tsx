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
    console.log('DEBUG: CartProvider Mounting v16 - POS Unified Logic Active');
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [availableCarts, setAvailableCarts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [priceChangeAlert, setPriceChangeAlert] = useState(false);
    const [activeCartName, setActiveCartName] = useState<string | null>(null);

    const refreshCart = useCallback(async () => {
        console.log('DEBUG: refreshCart [v16] - fetching state for:', user?.email || 'guest');
        setIsLoading(true);
        try {
            // 1. Fetch items in the CURRENT ACTIVE cart
            let fetchedItems: CartItem[] = [];
            try {
                const data = await fetchCart();
                fetchedItems = (data.items || []).map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id,
                    quantity: item.quantity || 1,
                    price: Number(item.products?.price || 0),
                    name: item.products?.name,
                    image_url: item.products?.image_url,
                    is_foil: item.products?.is_foil,
                    set_code: item.products?.set_code,
                }));
                setCartItems(Array.isArray(fetchedItems) ? fetchedItems : []);
                
                // Save snapshot for price change detection
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(fetchedItems));
            } catch (err) {
                console.warn('CartContext: current cart items load failed', err);
                setCartItems([]);
            }
            
            // 2. Fetch list of available carts (Crucial for Admin Management)
            // Even if not admin, we try to fetch to support personal multi-cart if enabled later
            if (user) {
                try {
                    const carts = await listUserCarts();
                    setAvailableCarts(carts);
                    
                    // Find and set the active cart name based on is_active flag from DB
                    const active = carts.find(c => c.is_active);
                    if (active) {
                        setActiveCartName(active.name || 'Carrito Principal');
                    } else if (carts.length > 0) {
                        // Fallback if none marked active but they exist
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
                    const hasPriceChange = fetchedItems.some(item => {
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
        } catch (err) {
            console.error('CartContext: failed to load cart state', err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Load on mount and subscribe to cart-updated events
    useEffect(() => {
        refreshCart();
        
        const handler = () => {
            console.log('DEBUG: cart-updated event detected - refreshing...');
            refreshCart();
        };
        window.addEventListener('cart-updated', handler);
        
        // Polling as a last resort (once every 30s in v16, less aggressive)
        const interval = setInterval(handler, 30000); 
        
        return () => {
            window.removeEventListener('cart-updated', handler);
            clearInterval(interval);
        };
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
