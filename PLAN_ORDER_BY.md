# Plan de Implementación: Corrección de Filtros "Order By"

**Fecha**: 2026-02-05
**Objetivo**: Implementar y corregir el sistema de ordenamiento en el listado de cartas para soportar: Mana Value, Precio, Nombre y Newest (Fecha de lanzamiento).

---

## 1. Diagnóstico Actual

### 1.1 Base de Datos (PostgreSQL)

La función actual `get_unique_cards_optimized` (en `20260205_optimized_card_query.sql`) tiene lógica de ordenamiento limitada.

- **Implementado**:
  - `name` (Nombre A-Z)
  - `release_date` (Newest)
- **Faltante**:
  - `cmc` (Mana Value) - La columna existe en la tabla `cards` como `cmc`.
  - `price` (Precio) - El precio viene de `aggregated_prices.avg_market_price_usd` o `products.price`. No hay lógica de ordenamiento para esto.

### 1.2 Backend (Edge Function)

- El endpoint `/api/cards` recibe el parámetro `sort` y lo pasa directamente a la función RPC de base de datos.
- No requiere cambios mayores, solo asegurar que los nuevos valores ('cmc', 'price_asc', 'price_desc') pasen limpiamente.

### 1.3 Frontend (React)

- El estado `sortBy` en `Home.tsx` maneja el ordenamiento.
- El mapeo actual de parámetros es inconsistente.
- Falta la UI (opciones en el dropdown) para seleccionar "Mana Value" y "Price".

---

## 2. Plan de Acción

### Paso 1: Actualizar Función de Base de Datos

Modificar la función `get_unique_cards_optimized` para soportar los nuevos criterios de ordenamiento.

**Cambios en SQL**:
Agregar casos al bloque `ORDER BY`:

```sql
ORDER BY 
  CASE WHEN sort_by = 'name' THEN rp.card_name END ASC,
  CASE WHEN sort_by = 'newest' OR sort_by = 'release_date' THEN rp.release_date END DESC NULLS LAST,
  CASE WHEN sort_by = 'mana_asc' THEN rp.cmc END ASC,
  CASE WHEN sort_by = 'mana_desc' THEN rp.cmc END DESC,
  CASE WHEN sort_by = 'price_asc' THEN COALESCE(rp.store_price, rp.avg_market_price_usd, 0) END ASC,
  CASE WHEN sort_by = 'price_desc' THEN COALESCE(rp.store_price, rp.avg_market_price_usd, 0) END DESC NULLS LAST,
  rp.card_name ASC -- Fallback
```

*Nota: Necesitamos asegurarnos de exponer `cmc` en la CTE `ranked_printings` de la función SQL, ya que actualmente no se selecciona.*

### Paso 2: Actualizar Frontend (UI y Lógica)

**Archivo**: `frontend/src/pages/Home.tsx`

1. **Actualizar Dropdown de Ordenamiento**:
    Agregar las opciones:
    - Newest (Default)
    - Name (A-Z)
    - Price: Low to High
    - Price: High to Low
    - Mana Value: Low to High
    - Mana Value: High to Low

2. **Actualizar lógica de llamada al API**:
    Asegurar que los valores seleccionados se traduzcan a los strings que espera el SQL:
    - 'newest'
    - 'name'
    - 'price_asc'
    - 'price_desc'
    - 'mana_asc'
    - 'mana_desc'

### Paso 3: Testing y Validación

1. **Validar "Mana Value"**: Verificar que cartas de costo 1 salgan antes que costo 5 (en asc).
2. **Validar "Precio"**: Verificar ordenamiento correcto usando precios de mercado.
3. **Validar "Newest"**: Verificar que sets recientes aparezcan primero.

---

## 3. Tareas Técnicas Detalladas

### SQL (Urgente)

1. Modificar `get_unique_cards_optimized`:
   - Agregar `c.cmc` a la selección inicial dentro de la CTE `ranked_printings`.
   - Agregar `rp.cmc` a la selección final.
   - Implementar el `CASE` extendido en el `ORDER BY`.

### Frontend

1. Modificar el componente `<select>` o dropdown de filtros en `Home.tsx`.
2. Actualizar la función `fetchCards` en `Home.tsx` o `api.ts` para pasar el valor crudo del sort si ya coincide con el backend.

---

## 4. Estimación de Tiempo

- **DB Update**: 15 min
- **Frontend Update**: 20 min
- **Testing**: 15 min
- **Total**: ~50 min
