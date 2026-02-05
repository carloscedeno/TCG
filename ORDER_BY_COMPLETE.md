# Resultado de Actualización de Filtros de Ordenamiento

## Cambios Realizados

1. **Base de Datos**:
    - Se actualizó la función `get_unique_cards_optimized` para soportar ordenamiento por:
        - `mana_asc` / `mana_desc` (Mana Value)
        - `price_asc` / `price_desc` (Market Price o Store Price)
        - `name` (A-Z)
        - `newest` / `release_date` (Fecha de lanzamiento)

2. **Frontend**:
    - Se agregaron las opciones al dropdown "Order By" en la página principal.
    - Se incluyó "Mana: Low to High" y "Mana: High to Low" (solo visible en pestaña "Archives").
    - Se incluyó "Price: Low to High" y "Price: High to Low".

3. **Backend (Edge Function)**:
    - Se actualizó el mapeo de respuesta para incluir el campo `cmc` (Converted Mana Cost) en los datos de la carta, útil para debug y visualización futura.

## Cómo Probar

1. Ir a la página principal.
2. Seleccionar "Archives" (si se quiere probar filtro por Maná).
3. Cambiar el dropdown "Order By" a "Mana: Low to High".
4. Verificar que aparezcan cartas con coste bajo (0, 1) primero.
5. Cambiar a "Price: High to Low".
6. Verificar que aparezcan cartas valiosas primero.

## Estado

- ✅ Planificado
- ✅ Implementado
- ✅ Desplegado
