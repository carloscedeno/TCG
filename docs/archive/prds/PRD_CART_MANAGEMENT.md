# PRD: Cart Management & Item Control

## 📋 Overview

Implementar funcionalidad completa de gestión del carrito de compras, permitiendo a los usuarios modificar cantidades y eliminar items antes del checkout.

## 🎯 Objetivos

1. **Control Total del Carrito**: Usuarios pueden ajustar cantidades y eliminar items
2. **UX Mejorada**: Feedback visual inmediato en todas las operaciones
3. **Tests Estables**: E2E tests que no acumulen items entre ejecuciones
4. **Persistencia Correcta**: Cambios se reflejan inmediatamente en la base de datos

## 🔧 Componentes a Modificar

### 1. Backend - Nuevos RPCs de Supabase

#### `update_cart_item_quantity`

```sql
CREATE OR REPLACE FUNCTION public.update_cart_item_quantity(
    p_cart_item_id uuid,
    p_new_quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
    v_cart_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Verify ownership
    SELECT cart_id INTO v_cart_id 
    FROM cart_items 
    WHERE id = p_cart_item_id;
    
    IF NOT EXISTS (SELECT 1 FROM carts WHERE id = v_cart_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    
    -- Update quantity
    IF p_new_quantity > 0 THEN
        UPDATE cart_items 
        SET quantity = p_new_quantity 
        WHERE id = p_cart_item_id;
    ELSE
        DELETE FROM cart_items WHERE id = p_cart_item_id;
    END IF;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
```

#### `remove_from_cart`

```sql
CREATE OR REPLACE FUNCTION public.remove_from_cart(
    p_cart_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
    v_cart_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Verify ownership
    SELECT cart_id INTO v_cart_id 
    FROM cart_items 
    WHERE id = p_cart_item_id;
    
    IF NOT EXISTS (SELECT 1 FROM carts WHERE id = v_cart_id AND user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;
    
    DELETE FROM cart_items WHERE id = p_cart_item_id;
    
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;
```

### 2. Frontend - API Client (`src/utils/api.ts`)

Agregar funciones:

```typescript
export const updateCartItemQuantity = async (cartItemId: string, quantity: number): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('update_cart_item_quantity', {
      p_cart_item_id: cartItemId,
      p_new_quantity: quantity
    });
    
    if (error) throw error;
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cart-updated'));
    
    return data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

export const removeFromCart = async (cartItemId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('remove_from_cart', {
      p_cart_item_id: cartItemId
    });
    
    if (error) throw error;
    
    // Trigger cart update event
    window.dispatchEvent(new Event('cart-updated'));
    
    return data;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};
```

### 3. Frontend - CartDrawer Component

#### Diseño UI Actualizado

```tsx
// En cada cart-item, agregar controles de cantidad y eliminar:

<div className="flex items-center justify-between">
    <span className="text-sm font-mono font-black text-geeko-cyan">
        ${(item.products?.price || 0).toFixed(2)}
    </span>
    
    {/* Quantity Controls */}
    <div className="flex items-center gap-2">
        <button
            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            data-testid="decrease-quantity-button"
            className="w-7 h-7 bg-black/40 hover:bg-red-500/20 border border-white/5 
                       hover:border-red-500/50 rounded-lg flex items-center justify-center 
                       transition-all group"
            disabled={item.quantity <= 1}
        >
            <Minus size={14} className="text-neutral-400 group-hover:text-red-500" />
        </button>
        
        <span className="text-xs font-bold min-w-[2rem] text-center">
            x{item.quantity}
        </span>
        
        <button
            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            data-testid="increase-quantity-button"
            className="w-7 h-7 bg-black/40 hover:bg-geeko-cyan/20 border border-white/5 
                       hover:border-geeko-cyan/50 rounded-lg flex items-center justify-center 
                       transition-all group"
        >
            <Plus size={14} className="text-neutral-400 group-hover:text-geeko-cyan" />
        </button>
        
        <button
            onClick={() => handleRemoveItem(item.id)}
            data-testid="remove-item-button"
            className="w-7 h-7 bg-black/40 hover:bg-red-500/20 border border-white/5 
                       hover:border-red-500/50 rounded-lg flex items-center justify-center 
                       transition-all group ml-2"
        >
            <Trash2 size={14} className="text-neutral-400 group-hover:text-red-500" />
        </button>
    </div>
</div>
```

#### Handlers

```typescript
const [updating, setUpdating] = useState<string | null>(null);

const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveItem(cartItemId);
        return;
    }
    
    setUpdating(cartItemId);
    try {
        await updateCartItemQuantity(cartItemId, newQuantity);
        await loadCart(); // Refresh cart
    } catch (err) {
        console.error('Failed to update quantity', err);
        alert('Error al actualizar cantidad');
    } finally {
        setUpdating(null);
    }
};

const handleRemoveItem = async (cartItemId: string) => {
    setUpdating(cartItemId);
    try {
        await removeFromCart(cartItemId);
        await loadCart(); // Refresh cart
    } catch (err) {
        console.error('Failed to remove item', err);
        alert('Error al eliminar item');
    } finally {
        setUpdating(null);
    }
};
```

### 4. Tests E2E - Commerce Spec

Actualizar `beforeEach` para limpiar el carrito:

```typescript
test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear cart before each test
    await page.getByTestId('cart-button').click();
    
    // Wait for cart to open
    await page.waitForTimeout(500);
    
    // Remove all items if any exist
    const removeButtons = page.getByTestId('remove-item-button');
    const count = await removeButtons.count();
    
    for (let i = 0; i < count; i++) {
        await removeButtons.first().click();
        await page.waitForTimeout(300); // Wait for removal animation
    }
    
    // Close cart
    await page.getByTestId('cart-button').click();
});
```

## 📊 Criterios de Aceptación

### Funcionalidad

- [ ] Usuario puede incrementar cantidad de un item en el carrito
- [ ] Usuario puede decrementar cantidad de un item en el carrito
- [ ] Decrementar a 0 elimina el item automáticamente
- [ ] Usuario puede eliminar un item directamente con el botón de basura
- [ ] Cambios se reflejan inmediatamente en el subtotal y total
- [ ] Cambios persisten al refrescar la página
- [ ] Botones se deshabilitan durante operaciones (loading state)

### UX

- [ ] Feedback visual al hacer hover sobre botones
- [ ] Animación suave al eliminar items
- [ ] Loading spinner o estado deshabilitado durante updates
- [ ] Mensajes de error claros si algo falla
- [ ] Botón de decrementar deshabilitado cuando quantity = 1

### Tests

- [ ] E2E test `commerce.spec.ts` pasa completamente
- [ ] Test de "persist cart items" pasa sin acumulación
- [ ] Test de "atomic checkout" completa sin timeouts
- [ ] Nuevo test para verificar update de cantidades
- [ ] Nuevo test para verificar eliminación de items

## 🎨 Diseño Visual

### Estados de Botones

- **Normal**: `bg-black/40 border-white/5`
- **Hover Incrementar**: `bg-geeko-cyan/20 border-geeko-cyan/50`
- **Hover Decrementar/Eliminar**: `bg-red-500/20 border-red-500/50`
- **Disabled**: `opacity-50 cursor-not-allowed`

### Iconos

- Incrementar: `Plus` (lucide-react)
- Decrementar: `Minus` (lucide-react)
- Eliminar: `Trash2` (lucide-react)

## 🔒 Seguridad

1. **RLS Policies**: Verificar que usuarios solo puedan modificar sus propios cart_items
2. **Validación Backend**: Cantidad debe ser >= 0
3. **Ownership Check**: Verificar que el cart_item pertenece al usuario autenticado
4. **Error Handling**: Retornar errores claros sin exponer detalles internos

## 📝 Notas de Implementación

### Orden de Implementación

1. Crear RPCs en Supabase (migration)
2. Agregar funciones a `api.ts`
3. Actualizar `CartDrawer.tsx` con UI y handlers
4. Actualizar tests E2E
5. Verificar que todos los tests pasen
6. Deploy

### Consideraciones

- **Optimistic Updates**: Considerar actualizar UI antes de confirmar con backend
- **Debouncing**: Si se implementa input numérico directo, usar debounce
- **Stock Validation**: Verificar stock disponible antes de incrementar
- **Guest Cart**: Asegurar que funcione también para usuarios no autenticados (localStorage)

## ✅ Definition of Done

- [ ] Código implementado y revisado
- [ ] RPCs creados y probados manualmente
- [ ] UI implementada con todos los estados visuales
- [ ] Tests E2E actualizados y pasando (10/10)
- [ ] Build exitoso sin errores de TypeScript
- [ ] Deployment a GitHub Pages exitoso
- [ ] Funcionalidad verificada en producción
- [ ] Documentación actualizada si es necesario
