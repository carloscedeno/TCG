import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchCart, listUserCarts, switchActiveCart, createNamedCart, clearActiveCart as clearActiveCartApi } from '../utils/api';
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
    refreshCart: (isPos?: boolean) => Promise<void>;
    switchCart: (cartId: string) => Promise<void>;
    createCart: (name: string, isPos?: boolean) => Promise<void>;
    removeCart: (cartId: string) => Promise<void>;
    clearActiveCart: () => Promise<void>;
    isLoading: boolean;
    activeCartName: string | null;
    currentIsPos: boolean;
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
    removeCart: async () => { },
    clearActiveCart: async () => { },
    isLoading: false,
    activeCartName: null,
    currentIsPos: false,
});

const CART_STORAGE_KEY = 'geekorium_cart_snapshot';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log('DEBUG: CartProvider Mounting v18 - POS Provider Order Fixed');
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [availableCarts, setAvailableCarts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [priceChangeAlert, setPriceChangeAlert] = useState(false);
    const [activeCartName, setActiveCartName] = useState<string | null>(() => {
        return localStorage.getItem('pos_active_name');
    });
    const [currentIsPos, setCurrentIsPos] = useState<boolean>(() => {
        return localStorage.getItem('pos_active_is_pos') === 'true';
    });

    const refreshCart = useCallback(async (_forcedIsPos?: boolean) => {
        console.log(`DEBUG: refreshCart [v25] - fetching state for:`, user?.email || 'guest');
        setIsLoading(true);
        try {
            // 1. Fetch items in the CURRENT ACTIVE cart
            let fetchedItems: CartItem[] = [];
            let cartResponse: any = null;
            try {
                cartResponse = await fetchCart();
                const rawItems = cartResponse.items || [];
                
                // CRITICAL: If logged in, prioritize DB items and IGNORE local guest items 
                // to prevent $0.00 ghosting/contamination.
                fetchedItems = rawItems
                    .filter((item: any) => !user || !String(item.id).startsWith('guest-'))
                    .map((item: any) => ({
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
                
                // Update Session state from unified RPC result
                if (user && cartResponse.id) {
                    setActiveCartName(cartResponse.name || 'Carrito Principal');
                    setCurrentIsPos(cartResponse.is_pos || false);
                    localStorage.setItem('pos_active_name', cartResponse.name || '');
                    localStorage.setItem('pos_active_is_pos', String(cartResponse.is_pos || false));
                }

                // Save snapshot for price change detection
                localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(fetchedItems));
            } catch (err) {
                console.warn('CartContext: current cart items load failed', err);
                setCartItems([]);
            }
            
            // 2. Fetch list of available carts (Crucial for Admin Management)
            if (user) {
                try {
                    const carts = await listUserCarts(true); // Fetch all POS-aware carts
                    setAvailableCarts(carts);
                    
                    // If metadata wasn't set by fetchCart result alone (fallback):
                    const active = carts.find(c => c.is_active);
                    if (active && (!cartResponse?.id || active.id === cartResponse.id)) {
                        setActiveCartName(active.name || 'Carrito Principal');
                        setCurrentIsPos(active.is_pos || false);
                    }
                } catch (err) {
                    console.error('CartContext: available carts load failed', err);
                    setAvailableCarts([]);
                }
            } else {
                setActiveCartName(null);
                setCurrentIsPos(false);
                setAvailableCarts([]);
                localStorage.removeItem('pos_active_name');
                localStorage.removeItem('pos_active_is_pos');
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

    // Load whenever user or auth state changes
    useEffect(() => {
        // Only run if we actually have context or after initial mount delay
        const timer = setTimeout(() => {
            refreshCart();
        }, 100);
        
        return () => clearTimeout(timer);
    }, [user, refreshCart]);

    useEffect(() => {
        const handler = () => {
            console.log(`DEBUG: cart-updated event detected [v25] - refreshing...`);
            refreshCart();
        };
        window.addEventListener('cart-updated', handler as any);
        
        return () => {
            window.removeEventListener('cart-updated', handler as any);
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

    const createCart = async (name: string, isPos: boolean = false) => {
        setIsLoading(true);
        try {
            await createNamedCart(name, isPos);
            await refreshCart(isPos);
        } catch (err: any) {
            console.error('Failed to create cart:', err);
            // Alert user of permission issues
            if (err.message?.includes('admin') || err.message?.includes('permisos')) {
                alert('Error: Solo los administradores pueden realizar esta acción.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const removeCart = async (cartId: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este cliente de la terminal?')) return;
        
        setIsLoading(true);
        try {
            await (import('../utils/api').then(api => api.deleteCart(cartId)));
            await refreshCart(currentIsPos);
        } catch (err: any) {
            console.error('Failed to delete cart:', err);
            alert(err.message || 'Error al eliminar el carrito');
        } finally {
            setIsLoading(false);
        }
    };

    const clearActiveCart = async () => {
        setIsLoading(true);
        try {
            await clearActiveCartApi();
            await refreshCart(false);
        } catch (err) {
            console.error('Failed to clear active cart:', err);
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
            removeCart,
            clearActiveCart,
            isLoading,
            activeCartName,
            currentIsPos
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
