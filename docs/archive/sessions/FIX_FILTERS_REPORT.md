# Documentación de Corrección de Filtros y Ordenamiento

**Fecha:** 5 Febrero 2026
**Estado:** ✅ Completado y Verificado
**Versión:** 1.1.0

## Resumen del Problema

Los usuarios reportaron que los filtros de "Ordenamiento" (Order By) y "Edición" (Set) no funcionaban correctamente, especialmente en la pestaña de "Inventory" (Marketplace). Al seleccionar una edición, la lista no se filtraba, y el ordenamiento por precio o maná no tenía efecto o no mostraba resultados.

## Diagnóstico Técnico

1. **Fallo de Despliegue en Edge Function**: La función `tcg-api` tenía problemas recurrentes de despliegue ("Bundle generation timed out"), lo que dejaba una versión antigua de la API en producción que no soportaba los nuevos parámetros de ordenamiento.
2. **Lógica Frontend Desactualizada**: La pestaña de "Inventory" usaba un endpoint (`fetchProducts`) que no pasaba todos los filtros (Set, Rareza, Tipo, Color) a la base de datos.
3. **Error Silencioso en Búsqueda de IDs**: Una consulta en `api.ts` buscaba juegos por la columna incorrecta (`name` en lugar de `game_name`), causando fallos silenciosos al filtrar por juego.

## Solución Implementada

### 1. Base de Datos (PostgreSQL)

* **Nueva Función RPC (`get_products_filtered`)**: Se creó una función dedicada para el marketplace que soporta filtrado por múltiples criterios (Juego, Set, Rareza, Tipo, Color) y ordenamiento dinámico (Precio, Maná, Fecha).
* **Permisos Robustos**: Se aseguró que las funciones `get_unique_cards_optimized` y `get_products_filtered` tengan permisos `SECURITY DEFINER` y grants explícitos para usuarios anónimos y autenticados.

### 2. Frontend (`api.ts`)

* **Bypass de Edge Function**: Se modificó la lógica para llamar **directamente a las funciones RPC de base de datos** desde el cliente Supabase. Esto elimina la dependencia de la Edge Function inestable para la recuperación de datos crítica.
* **Soporte Total de Filtros**: Se actualizó `fetchProducts` para recibir y mapear todos los filtros de la UI (Set, Rarity, Color, Type) a los parámetros de la función RPC.
* **Corrección de Columnas**: Se corrigió la búsqueda de `game_id` para usar la columna válida `game_name`.

### 3. Interfaz de Usuario (`Home.tsx`)

* **Nuevas Opciones de Ordenamiento**:
  * `Mana: Low to High` / `High to Low`
  * `Price: Low to High` / `High to Low`
  * `Name (A-Z)`
  * `Newest`
* **Integración de Filtros**: Se aseguró que la selección de filtros en el sidebar se propague correctamente a la llamada de datos, tanto en "Archives" como en "Inventory".

## Verificación

Se realizaron pruebas manuales y automatizadas (browser agent) confirmando:

* ✅ Filtrado correcto por Edición (ej. "Lorwyn Eclipsed").
* ✅ Ordenamiento por Precio (Asc/Desc) efectivo.
* ✅ Ordenamiento por Maná (Asc/Desc) efectivo.
* ✅ Carga de datos exitosa en ambas pestañas (Archives e Inventory).

## Archivos Modificados

* `frontend/src/utils/api.ts`
* `frontend/src/pages/Home.tsx`
* `supabase/migrations/20260205_optimized_card_query.sql` (y migraciones adicionales aplicadas vía RPC)
