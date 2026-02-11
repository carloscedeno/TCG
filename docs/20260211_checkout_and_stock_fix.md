# Documentación de Corrección: Checkout y Stock Fetch (2026-02-11)

## Resumen del Problema

Se identificaron dos problemas críticos que afectaban el flujo de compra y la visualización de productos:

1. **Error 400 en `create_order_atomic`**: Al intentar finalizar una compra como usuario logueado, el servidor devolvía un error 400. Esto se debía a que el frontend enviaba el ID interno del producto (`products.id`) en lugar del `printing_id` esperado por la función RPC para validar el stock.
2. **Error 400 en `fetchCardDetails` (URL Length Limit)**: Al cargar los detalles de cartas con muchas impresiones (como tierras básicas), la URL de la petición GET a Supabase excedía el límite permitido debido a la gran cantidad de IDs en el filtro `printing_id=in.(...)`.

## Solución Implementada

### 1. Backend (Supabase)

Se creó una nueva función RPC para manejar la consulta de stock de manera eficiente y evitar los límites de longitud de URL.

* **Archivo**: `supabase/migrations/20260211_fix_stock_fetch.sql`
* **Función**: `get_products_stock_by_printing_ids`
* **Descripción**: Recibe un array de `printing_ids` y devuelve el stock y precio de los productos correspondientes.

```sql
CREATE OR REPLACE FUNCTION public.get_products_stock_by_printing_ids(p_printing_ids UUID[])
RETURNS TABLE (
  id UUID,
  printing_id UUID,
  stock INT,
  price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.printing_id, p.stock, p.price
  FROM public.products p
  WHERE p.printing_id = ANY(p_printing_ids)
  AND p.stock > 0;
END;
$$;
```

### 2. Frontend (`frontend/src/utils/api.ts`)

Se realizaron las siguientes modificaciones:

* **`fetchCart`**: Se corrigió el mapeo de datos para usuarios logueados. Ahora se asigna correctamente `row.printing_id` al campo `product_id` del item del carrito. Esto asegura que `create_order` reciba el ID correcto para la validación de stock.
* **`fetchCardDetails`**: Se reemplazó la llamada GET directa a la tabla `products` por una llamada a la nueva RPC `get_products_stock_by_printing_ids`. Esto soluciona el problema de longitud de URL para cartas con muchas versiones.
* **Limpieza**: Se eliminaron variables no utilizadas (`rpcError`) para limpiar warnings del linter.

## Verificación

* Se verificó que el build del frontend (`npm run build`) se complete exitosamente sin errores.
* La lógica de checkout ahora utiliza consistentemente `printing_id` tanto para el carrito de invitados como para usuarios registrados.
* La carga de stock en el modal de detalles de carta es robusta frente a gran cantidad de versiones.
