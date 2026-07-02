-- Normalización de condiciones y acabados (finish) para eliminar duplicados causados por scrapers inconsistentes
-- Esta migración resuelve el problema donde 'near_mint' vs 'NM' o 'normal' vs 'nonfoil' creaban entradas duplicadas en el catálogo.

-- 1. Redirigir carritos para productos cuyo equivalente normalizado (mismo nombre, edición, condición NM y acabado nonfoil) ya existe
WITH all_normalized AS (
    SELECT 
        id,
        CASE WHEN condition IN ('near_mint', 'false', 'Near Mint', 'near mint') THEN 'NM' WHEN condition IN ('D', 'damaged', 'Damaged') THEN 'DMG' ELSE condition END as norm_cond,
        CASE WHEN finish IN ('normal', 'regular', 'Normal', 'Regular') THEN 'nonfoil' ELSE finish END as norm_finish,
        LOWER(name) as norm_name,
        LOWER(set_code) as norm_set,
        created_at
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
),
groups AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM all_normalized
    GROUP BY norm_name, norm_set, norm_cond, norm_finish
    HAVING COUNT(*) > 1
),
cart_dups AS (
    SELECT ci.id as dup_ci_id, ci.cart_id, ci.quantity, g.keep_id
    FROM public.cart_items ci
    JOIN groups g ON ci.product_id = ANY(g.all_ids) AND ci.product_id != g.keep_id
)
UPDATE public.cart_items ci_keep
SET quantity = ci_keep.quantity + cd.quantity
FROM cart_dups cd
WHERE ci_keep.cart_id = cd.cart_id AND ci_keep.product_id = cd.keep_id;

-- 2. Eliminar ítems de carrito redundantes que ya fueron sumados
WITH all_normalized AS (
    SELECT 
        id,
        CASE WHEN condition IN ('near_mint', 'false', 'Near Mint', 'near mint') THEN 'NM' WHEN condition IN ('D', 'damaged', 'Damaged') THEN 'DMG' ELSE condition END as norm_cond,
        CASE WHEN finish IN ('normal', 'regular', 'Normal', 'Regular') THEN 'nonfoil' ELSE finish END as norm_finish,
        LOWER(name) as norm_name,
        LOWER(set_code) as norm_set,
        created_at
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
),
groups AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM all_normalized
    GROUP BY norm_name, norm_set, norm_cond, norm_finish
    HAVING COUNT(*) > 1
)
DELETE FROM public.cart_items ci
USING groups g
WHERE ci.product_id = ANY(g.all_ids) AND ci.product_id != g.keep_id
  AND EXISTS (SELECT 1 FROM public.cart_items ci2 WHERE ci2.cart_id = ci.cart_id AND ci2.product_id = g.keep_id);

-- 3. Redirigir el resto de referencias en carritos, pedidos e historial de ofertas hacia el producto principal (keep_id)
WITH all_normalized AS (
    SELECT 
        id,
        CASE WHEN condition IN ('near_mint', 'false', 'Near Mint', 'near mint') THEN 'NM' WHEN condition IN ('D', 'damaged', 'Damaged') THEN 'DMG' ELSE condition END as norm_cond,
        CASE WHEN finish IN ('normal', 'regular', 'Normal', 'Regular') THEN 'nonfoil' ELSE finish END as norm_finish,
        LOWER(name) as norm_name,
        LOWER(set_code) as norm_set,
        created_at
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
),
groups AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM all_normalized
    GROUP BY norm_name, norm_set, norm_cond, norm_finish
    HAVING COUNT(*) > 1
)
UPDATE public.cart_items ci SET product_id = g.keep_id FROM groups g WHERE ci.product_id = ANY(g.all_ids) AND ci.product_id != g.keep_id;

WITH all_normalized AS (
    SELECT 
        id,
        CASE WHEN condition IN ('near_mint', 'false', 'Near Mint', 'near mint') THEN 'NM' WHEN condition IN ('D', 'damaged', 'Damaged') THEN 'DMG' ELSE condition END as norm_cond,
        CASE WHEN finish IN ('normal', 'regular', 'Normal', 'Regular') THEN 'nonfoil' ELSE finish END as norm_finish,
        LOWER(name) as norm_name,
        LOWER(set_code) as norm_set,
        created_at
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
),
groups AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM all_normalized
    GROUP BY norm_name, norm_set, norm_cond, norm_finish
    HAVING COUNT(*) > 1
)
UPDATE public.order_items oi SET product_id = g.keep_id FROM groups g WHERE oi.product_id = ANY(g.all_ids) AND oi.product_id != g.keep_id;

WITH all_normalized AS (
    SELECT 
        id,
        CASE WHEN condition IN ('near_mint', 'false', 'Near Mint', 'near mint') THEN 'NM' WHEN condition IN ('D', 'damaged', 'Damaged') THEN 'DMG' ELSE condition END as norm_cond,
        CASE WHEN finish IN ('normal', 'regular', 'Normal', 'Regular') THEN 'nonfoil' ELSE finish END as norm_finish,
        LOWER(name) as norm_name,
        LOWER(set_code) as norm_set,
        created_at
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
),
groups AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM all_normalized
    GROUP BY norm_name, norm_set, norm_cond, norm_finish
    HAVING COUNT(*) > 1
)
UPDATE public.product_offers_history poh SET product_id = g.keep_id FROM groups g WHERE poh.product_id = ANY(g.all_ids) AND poh.product_id != g.keep_id;

-- 4. Fusionar el stock sumando el total del grupo en el producto principal
WITH all_normalized AS (
    SELECT 
        id, stock,
        CASE WHEN condition IN ('near_mint', 'false', 'Near Mint', 'near mint') THEN 'NM' WHEN condition IN ('D', 'damaged', 'Damaged') THEN 'DMG' ELSE condition END as norm_cond,
        CASE WHEN finish IN ('normal', 'regular', 'Normal', 'Regular') THEN 'nonfoil' ELSE finish END as norm_finish,
        LOWER(name) as norm_name,
        LOWER(set_code) as norm_set,
        created_at
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
),
groups AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids,
        SUM(stock) as total_stock
    FROM all_normalized
    GROUP BY norm_name, norm_set, norm_cond, norm_finish
    HAVING COUNT(*) > 1
)
UPDATE public.products p SET stock = g.total_stock FROM groups g WHERE p.id = g.keep_id;

-- 5. Eliminar los productos duplicados secundarios (cuyo stock ya fue sumado)
WITH all_normalized AS (
    SELECT 
        id,
        CASE WHEN condition IN ('near_mint', 'false', 'Near Mint', 'near mint') THEN 'NM' WHEN condition IN ('D', 'damaged', 'Damaged') THEN 'DMG' ELSE condition END as norm_cond,
        CASE WHEN finish IN ('normal', 'regular', 'Normal', 'Regular') THEN 'nonfoil' ELSE finish END as norm_finish,
        LOWER(name) as norm_name,
        LOWER(set_code) as norm_set,
        created_at
    FROM public.products
    WHERE name IS NOT NULL AND set_code IS NOT NULL
),
groups AS (
    SELECT 
        (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] as keep_id,
        ARRAY_AGG(id) as all_ids
    FROM all_normalized
    GROUP BY norm_name, norm_set, norm_cond, norm_finish
    HAVING COUNT(*) > 1
)
DELETE FROM public.products p USING groups g WHERE p.id = ANY(g.all_ids) AND p.id != g.keep_id;

-- 6. Normalizar finalmente todos los valores de condición y acabado al estándar del sistema sin violar restricciones únicas
UPDATE public.products SET condition = 'NM' WHERE condition IN ('near_mint', 'false', 'Near Mint', 'near mint');
UPDATE public.products SET condition = 'DMG' WHERE condition IN ('D', 'damaged', 'Damaged');
UPDATE public.products SET finish = 'nonfoil' WHERE finish IN ('normal', 'regular', 'Normal', 'Regular');

UPDATE public.order_items SET finish = 'nonfoil' WHERE finish IN ('normal', 'regular', 'Normal', 'Regular');
UPDATE public.inventory_logs SET condition = 'NM' WHERE condition IN ('near_mint', 'false', 'Near Mint', 'near mint');
UPDATE public.inventory_logs SET condition = 'DMG' WHERE condition IN ('D', 'damaged', 'Damaged');
UPDATE public.inventory_logs SET finish = 'nonfoil' WHERE finish IN ('normal', 'regular', 'Normal', 'Regular');
