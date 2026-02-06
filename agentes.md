# Bitácora de Errores y Lecciones Aprendidas (Agentes)

## 2026-02-05: Optimización de Búsqueda y Filtros

### Error: UX de Autocompletado vs. Búsqueda Activa

**Problema**: Al implementar el autocompletado en el frontend, se mantuvo el `debounce` automático que disparaba la búsqueda principal cada vez que el usuario escribía. Esto causaba que la lista de resultados se recargara innecesariamente antes de que el usuario terminara de escribir o seleccionara una sugerencia.
**Lección**: **Desacoplar siempre el input de búsqueda del trigger de búsqueda.**

- El input debe actualizar solo el estado local para las sugerencias.
- La búsqueda principal (`activeSearchQuery`) solo debe actualizarse mediante acción explícita (`Enter` o `Click` en sugerencia).

### Error: Timeout (500) en Queries DB Complejas

**Problema**: La función `get_unique_cards_optimized` utilizaba `DISTINCT ON (card_name)` junto con un `ORDER BY` complejo que involucraba un JOIN (`s.release_date`). Al no existir índices específicos para esta combinación, Postgres realizaba un sort en memoria de toda la tabla, causando timeouts (Error 500) cuando la tabla creció o el cache estaba frío.
**Lección**: **Índices obligatorios para Sort/Filter.**

- Si usas `DISTINCT ON (columna)`, DEBE haber un índice en `(columna)`.
- Si filtras con `ILIKE`, DEBE haber un índice `GIN` con `pg_trgm` (`gin_trgm_ops`).
- Verificar siempre el `EXPLAIN ANALYZE` de las queries nuevas en un entorno con datos reales o volumetría similar.

### Acción Correctiva

- Se refactorizó el frontend para separar `query` (input) de `activeSearchQuery` (fetch).
- Se creó una migración añadiendo índices B-Tree para `card_name` y GIN/TRGM para búsquedas de texto.
- Se aseguró la extensión `pg_trgm`.

## 2026-02-06: Solución Definitiva de Performance

### Error Crítico: Timeout Persistente a pesar de Índices

**Problema**: A pesar de añadir los índices sugeridos arriba, el error 500 continuó. La operación `DISTINCT ON` sobre 80,000 filas con Joins complejos y RLS activo es simplemente demasiado pesada para ejecutarse en tiempo real (<2s) consistentemente.

**Lección Definitiva: NO Usar Queries Dinámicas para Vistas Principales**

- **Regla**: Si necesitas deduplicar (`DISTINCT ON`) o agregar datos de una tabla principal grande (>10k filas) para la vista por defecto: **USA UNA VISTA MATERIALIZADA**.
- **Por qué**: Postgres debe escanear/ordenar TODAS las filas candidatas para encontrar la "primera" antes de aplicar el `LIMIT`. Los índices ayudan, pero no eliminan el overhead de RLS y Joins.
- **Solución**: Pre-calcúlar la lista limpia en una `MATERIALIZED VIEW` y consultarla con `SELECT *`.
- **Seguridad**: Usar `SECURITY DEFINER` en la función RPC para saltar el overhead de RLS si la vista materializada ya contiene datos públicos filtrados.
