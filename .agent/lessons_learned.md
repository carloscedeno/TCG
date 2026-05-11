# ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Â  TCG Hub - Developer Knowledge Base (Lessons Learned)

Este documento registra los desafÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­os tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.

## ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂºÃƒâ€šÃ‚Â  Entorno y Dependencias

### 1. Conflictos de VersiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en CI/CD (GitHub Actions)

- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.
- **Causa**: Versiones muy recientes de librerÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­as a veces tardan horas/dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **Causa**: Versiones muy recientes de librerÃƒÂ­as a veces tardan horas/dÃƒÂ­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **LecciÃƒÆ’Ã‚Â³n**:
  - Sincronizar la versiÃƒÂ³n de Python del runner (3.12) con la local.
  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.

### 153. RestauraciÃ³n de Identidad y Pantone (Mayo 2026)
- **Problema**: El intento de "modernizar" o "neutralizar" el diseÃ±o mediante un cambio de Pantone (de Geeko Cyan #00D1FF a Electric Blue #0099FF) provocÃ³ una pÃ©rdida de identidad visual y fue percibido como un error ("se ve verde").
- **Causa RaÃ­z**: Sobre-correcciÃ³n estética sin validar contra la marca establecida. El uso de sombras y resplandores en tonos azulados sobre un fondo oscuro puede alterar la percepciÃ³n del color base si no se usa el valor exacto de la marca.
- **SoluciÃ³n**: Revertir globalmente a #00D1FF (Geeko Cyan). Restaurar elementos de marca explÃ­citos (etiqueta "SINGLES", iconos de destellos) que habÃ­an sido simplificados excesivamente.
- **LecciÃ³n**: La documentaciÃ³n visual y los pantallazos de producciÃ³n (`geekorium.shop`) son la **fuente de verdad absoluta**. Cualquier refactorizaciÃ³n tipogrÃ¡fica o de color debe ser validada contra estos antes de darla por finalizada. Evitar la "invenciÃ³n" de nuevos selectores o disposiciones si el usuario solicita "restaurar lo anterior".

### 148. RemediaciÃ³n de Flujo "Por Encargo" (Bypass de Stock) â€” 2026-05-07
- **Problema:** El checkout fallaba con error de "Stock insuficiente" al intentar comprar cartas sin existencia fÃ­sica, a pesar de que la Regla de Negocio 4 permite pedidos "Por Encargo".
- **Causa RaÃ­z:** El RPC `create_order_atomic` tenÃ­a una validaciÃ­n estricta `IF v_current_stock < quantity THEN RAISE EXCEPTION` que no discriminaba entre productos normales y pedidos on-demand.
- **SoluciÃ³n:** Implementar un flag `is_on_demand` en la lÃ³gica de la orden. El frontend detecta `quantity > stock` y envÃ­a el flag; el RPC usa este flag para saltar la excepciÃ³n y marcar la lÃ­nea de pedido correctamente.
- **Regla Derivada:** Todo flujo de checkout atÃ³mico debe soportar un bypass de validaciÃ³n de stock si el Ã­tem estÃ¡ marcado como "on-demand" (LecciÃ³n #148).

### 143. SincronizaciÃƒÂ³n SKU-Aware
- **Problema**: Los scripts de sincronizaciÃƒÂ³n con CardKingdom tenÃƒÂ­an errores de mapeo en sets modernos.
- **Causa**: El uso de campos descriptivos ambiguos en lugar de identificadores ÃƒÂºnicos.
- **LecciÃƒÂ³n**: Los scripts de sincronizaciÃƒÂ³n con CardKingdom deben priorizar el SKU (`[F]SET-NNNN`) sobre el campo `variation` para sets modernos y tokens para garantizar un mapeo 100% exacto de acabados y coleccionistas.

### 144. ResoluciÃƒÂ³n DinÃƒÂ¡mica de Juegos
- **Problema**: Errores en el frontend al intentar cargar datos de juegos debido a IDs cambiantes entre entornos.
- **Causa**: Hardcoding de IDs de bases de datos seriales.
- **LecciÃƒÂ³n**: Evitar hardcoding de IDs de bases de datos seriales en el frontend. En entornos de desarrollo, Magic: The Gathering puede ser ID 1, mientras que en producciÃƒÂ³n es ID 22. Se implementÃƒÂ³ una resoluciÃƒÂ³n dinÃƒÂ¡mica en `api.ts` basada en el nombre del juego o su cÃƒÂ³digo (`MTG`).

## Ã°Å¸â€”â€ž Base de Datos y Supabase

### 2. "Precios Invisibles" (AgregaciÃƒÂ³n Fallida)

- **Problema**: El script de sincronizaciÃƒÂ³n insertaba precios pero no se reflejaban en la UI.
- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requerÃƒÂ­a un `condition_id` vÃƒÂ¡lido. Los inserts manuales omitÃƒÂ­an estos campos, dejando los precios en un limbo.
- **LecciÃƒÂ³n**: Todo script de ingesta de precios debe incluir:
  - `timestamp`: ISO string (UTC).
  - `condition_id`: ID numÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rico correspondiente (ej: 16 para Near Mint).
  - `is_foil`: Booleano explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­cito.

### 3. Timeouts en Filtros (Performance)

- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.
- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndices.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:
  - **ÃƒÆ’Ã†â€™ÃƒÂ¯Ã‚Â¿Ã‚Â½ndices CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.
  - **Estrategia de Consulta**: Para tablas masivas, es mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡pido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.

## ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã¢â‚¬â„¢ÃƒÂ¯Ã‚Â¿Ã‚Â½ Frontend y API

### 4. Coherencia en el Fallback de Supabase

- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".
- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ndar de Postgres) que no existe en esta estructura especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­fica.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Mantener mapeos de nombres de columnas idÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nticos entre la respuesta del API local y el cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo de fallback de Supabase.
- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.
- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.
- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.

### 5. Counting Strategy & Timeouts

- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:
  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micos donde el planificador de Postgres ya tiene estadÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sticas.
  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n con "Infinite Scroll" o botones de "Siguiente".

## ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â¡ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ Despliegue y CI/CD

### 6. TypeScript Strict Build (TS6133)

- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.
- **Causa**: ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de `tsconfig.json` con `noUnusedParameters: true`.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n exitosa.

### 7. Variables de Entorno en GitHub Actions

- **Problema**: El frontend funcionaba localmente pero en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n los dropdowns (Sets) estaban vacÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­os y las bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsquedas fallaban.
- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a 404).
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:
  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.
  - **Resiliencia de Fallback**: Todo endpoint crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ definido.

---

## ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Â  Frontend y UX

### 8. UX de Autocompletado vs. BÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda Activa (Feb 2026)

- **Problema**: Al implementar el autocompletado, el `debounce` automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡tico disparaba la bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda principal cada vez que el usuario escribÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a, recargando resultados innecesariamente.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: **Desacoplar siempre el input de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda del trigger de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda.**
  - El input solo actualiza el estado local para sugerencias.
  - La bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda principal (`activeSearchQuery`) solo se actualiza mediante acciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­cita (`Enter` o click en sugerencia).
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Se refactorizÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ el frontend para separar `query` (input) de `activeSearchQuery` (fetch).

### 9. Timeout en Queries con DISTINCT ON (Feb 2026)

- **Problema**: `DISTINCT ON (card_name)` + `ORDER BY` con JOIN (`s.release_date`) causaba timeout (Error 500) sin ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndices especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ficos para esa combinaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: **ÃƒÆ’Ã†â€™ÃƒÂ¯Ã‚Â¿Ã‚Â½ndices obligatorios para Sort/Filter.**
  - Si usas `DISTINCT ON (columna)`, DEBE haber un ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndice en `(columna)`.
  - Si filtras con `ILIKE`, DEBE haber ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndice `GIN` con `pg_trgm`.
  - Verificar siempre con `EXPLAIN ANALYZE` en datos con volumetrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a real.

### 10. NO Usar Queries DinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micas para Vistas Principales de Tablas Grandes (Feb 2026)

- **Problema**: A pesar de ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndices correctos, `DISTINCT ON` sobre 80,000+ filas con Joins y RLS activo sigue siendo demasiado pesado.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Definitiva: USAR VISTA MATERIALIZADA.**
  - Si deduplicar o agregar de tabla principal grande (>10k filas): pre-calcular en `MATERIALIZED VIEW`.
  - Usar `SECURITY DEFINER` en la funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n RPC para saltar overhead de RLS si la vista ya contiene datos pÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºblicos filtrados.

### 11. CardModal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ Nunca Filtrar all_versions al Cambiar Printing (Feb 2026)

- **Problema**: Al cambiar el printing seleccionado, la lista de versiones desaparecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a si la respuesta de la API para ese printing no incluÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a todas las versiones.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Preservar siempre el array `all_versions` en el estado del frontend al navegar entre printings. Nunca re-derivarlo de la respuesta parcial de un printing individual.

### 12. Soporte Foil Virtual ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ Entidades Virtuales No En DB (Feb 2026)

- **Problema**: Intentar buscar registros de cartas foil como entidades separadas en la DB fallaba.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Las cartas foil son **entradas virtuales** generadas por la Edge Function `tcg-api` cuando `prices.usd_foil IS NOT NULL`. No existen como filas separadas en `card_printings`. Nunca hacer migrations que asuman lo contrario.

### 13. DFC (Double-Faced Cards) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ Links y Flip de Imagen (Feb 2026)

- **Problema**: Los links de CardKingdom para DFCs fallaban porque incluÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an el nombre de ambas caras (`//`). Las imÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡genes DFC no flippeaban.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:
  - **Links**: Usar solo `card_faces[0].name` (cara frontal) para bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsquedas en CardKingdom.
  - **Flip**: Detectar DFC por `card_faces?.length > 1`. Implementar toggle de imagen client-side.
  - **Fallback Frontend**: Si `image_uris` es null, usar `card_faces[0].image_uris` como fallback.

### 14. Precios: Siempre Parsear como Number (Feb 2026)

- **Problema**: `toFixed()` crasheaba cuando el precio venÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a como string o null de la API.
- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Siempre convertir: `const price = Number(rawPrice)`. Verificar `isNaN(price)` antes de formatear. Mostrar `S/P` si null/undefined.

### 145. AlineaciÃƒÂ³n de ParÃƒÂ¡metros RPC y SincronizaciÃƒÂ³n de URL (Abril 2026)
- **Problema**: El buscador y los filtros de la tienda dejaron de funcionar tras una refactorizaciÃƒÂ³n de nombres de variables en el frontend.
- **Causa RaÃƒz**: 
  1. Desajuste entre los nombres de parÃƒÂ¡metros esperados por la base de datos de producciÃƒÂ³n (`game_filter`, `rarity_filter`) y los enviados por el frontend (`game_code`, `rarities`).
  2. El componente `Home.tsx` no sincronizaba el estado de bÃƒÂºsqueda (`q`) desde la URL cuando el usuario navegaba o usaba sugerencias de la cabecera.
  3. Al aplicar filtros, la URL se sobrescribÃƒa por completo en lugar de mezclarse con los parÃƒÂ¡metros existentes (borrando el tÃƒÂ©rmino de bÃƒÂºsqueda).
- **LecciÃƒÂ³n**: 
  - **VerificaciÃƒÂ³n de Firma**: Siempre verificar la firma exacta de la funciÃƒÂ³n en la base de datos de producciÃƒÂ³n antes de cambiar nombres de parÃƒÂ¡metros en `api.ts`.
  - **URL como Source of Truth**: El estado del frontend debe seguir a la URL (One-Way Data Flow). Implementar efectos robustos que lean de `searchParams` y actualicen el estado interno.
  - **Mezcla de ParÃƒÂ¡metros**: Usar `new URLSearchParams(searchParams)` para conservar el estado existente al aplicar nuevos filtros.
  - **Soporte de UX**: Asegurar que la tecla `Enter` en formularios de bÃƒÂºsqueda "confirme" la acciÃƒÂ³n y actualice la URL para disparar el fetch.

### 146. Linting CrÃƒÂ­tico en CI/CD (GitHub Actions)
- **Problema**: El despliegue de producciÃ³n fallaba con un error de variable no utilizada, a pesar de funcionar localmente.
- **Causa**: `npm run build` en entornos CI suele aplicar reglas de linting mÃ¡s estrictas (`no-unused-vars`). Componentes con importaciones comentadas o "fantasmas" bloquean el pipeline.
- **LecciÃƒÂ³n**: Eliminar siempre las importaciones no utilizadas antes de un push. Si una funcionalidad se comenta temporalmente (ej: botÃ³n "Explore"), su importaciÃ³n asociada (ej: `ExternalLink`) debe comentarse o eliminarse tambiÃ©n.

### 147. Robustez en Consultas Join de Supabase (PostgREST)
- **Problema**: Scripts de backend fallaban con `NoneType` errors al intentar acceder a datos de joins complejos.
- **Causa**: PostgREST puede devolver `null` en objetos anidados si la relaciÃ³n no existe o si hay ambigÃ¼edad en el esquema. Acceder directamente como `item['cards']['card_name']` sin validaciÃ³n previa es peligroso.
- **LecciÃƒÂ³n**: Usar siempre `.get()` y validaciÃ³n defensiva para datos provenientes de joins complejos en Supabase. Implementar fallbacks razonables (ej: `game_code` por defecto a 'MTG') y logging granular para identificar registros huÃ©rfanos.

---

## ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€¦Ã‚Â½Ãƒâ€šÃ‚Â¨ DiseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o y Branding

### 15. Restricciones de ItÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡licas por SecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ Spec Geekorium (Feb 2026)

- **Problema**: Clase `italic` aparecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a en headings de secciones donde la spec lo prohÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­be explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ador estableciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ que `font-web-titles` (Daito/Roboto Slab) no debe usarse en itÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡lica en secciones de contenido informativo (ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mo comprar?, Ayuda). Solo se permite italic en tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tulos de marca/admin.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Remover `italic` de `Home.tsx` L581 (ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mo comprar?) y `HelpPage.tsx` L28 (ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿AÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn tienes dudas?).
- **Regla Derivada**: Al implementar headings con `font-web-titles`, verificar si la secciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ en la lista de restricciones de la spec. La lista actual: secciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n `ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mo comprar?` y secciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Ayuda.

### 16. Tokens de Color de Marca: Incluir Todas las Variantes del Spec (Feb 2026)

- **Problema**: El token `#523176` (variante tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cnica morada) estaba en la spec pero no definido en `index.css` como CSS variable.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Al implementar la paleta inicial se omitiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ esta variante por considerarla secundaria.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Agregar `--color-geeko-violet-deep: #523176` al bloque `@theme` de `index.css`.
- **Regla Derivada**: Al adoptar un nuevo spec de diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o, mapear **todas** las variantes de color del documento al sistema de tokens, incluso si no se usan inmediatamente. Pendiente usarlo en: bordes de cartas Lorcana, sellos de cera, accents de sets especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ficos.

---

## ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â§Ãƒâ€šÃ‚Âª Testing

### 17. Patch Target Correcto para Servicios con `supabase_admin` (Feb 2026)

- **Problema**: `test_collection_import.py` fallaba con `AttributeError: module does not have the attribute 'supabase'`.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El service `collection_service.py` fue refactorizado para usar `supabase_admin = get_supabase_admin()` en lugar de `supabase`. Los tests seguÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an mockeando el atributo viejo.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Cambiar el patch target en los fixtures de `'api.services.collection_service.supabase'` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `'api.services.collection_service.supabase_admin'`.
- **Regla Derivada**: Cuando un servicio renombra su variable de cliente de Supabase, buscar y actualizar TODOS los tests que la mockean. Usar `grep_search` con `patch(` + el mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³dulo para detectarlos.

### 18. Lazy Imports en Servicios ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mo Parchearlos (Feb 2026)

- **Problema**: `patch('src.api.services.collection_service.MatcherService')` fallaba porque `MatcherService` se importa dentro del cuerpo de la funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (`from .matcher_service import MatcherService`), no al nivel del mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³dulo.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Los lazy imports (dentro de la funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n) no crean atributos en el namespace del mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³dulo que los contiene, por lo que no son patcheables desde ahÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Parchear en el mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³dulo **fuente**, no en el mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³dulo importador: `patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock)`.
- **Regla Derivada**: Si una clase/funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n se importa con `from .modulo import Clase` dentro de una funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, siempre parchear en `modulo.Clase`, no en `servicio_importador.Clase`.

### 19. Mock Chain para `ValuationService` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ Two-Step Query (Feb 2026)

- **Problema**: `test_valuation_calculation_logic` afirmaba `store_price == 100.0` pero obtenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a `1.0`.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El test pasaba `{'source': 'geekorium', 'price_usd': 100.0}` pero el servicio NO usa el campo `source` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ hace primero un query a la tabla `sources` para obtener un mapa `{source_id ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ source_code}`, luego itera `price_history` buscando `source_id` (entero).
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Reescribir el mock como un `table_side_effect` que retorna datos distintos por tabla: `sources` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ mapa de IDs, `price_history` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ filas con `source_id` (int), no `source` (str).
- **Regla Derivada**: Antes de escribir mocks para servicios, leer su implementaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n para identificar el flujo exacto de queries. Los servicios con lookups de tablas de referencia (como `sources`, `conditions`) requieren mocks de mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples tablas.

### 20. Reemplazo Exhaustivo de Colores Heredados al Refactorizar UI (Feb 2026)

- **Problema**: Tras remover la clase `italic` en `HelpPage.tsx` para ajustarse a una regla tipogrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡fica nueva, se revelaron clases utilitarias de color heredadas (`bg-[#f4e4bc]`, `text-black`, `bg-[#25D366]`) que desentonaban con el nuevo spec.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: RefactorizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n local "quirÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºrgica" (solo tocar `italic`) en componentes sin auditar si su paleta general sigue el nuevo "DiseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o Fix".
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Reemplazo masivo de colores heredados en el componente modificado. Beige (`#f4e4bc`) a Primario (`#373266`), Negro (`text-black`) a Blanco (`#FFFFFF`), y Verde (`#25D366`) a Cyan (`geeko-cyan` / `#00AEB4`). AdemÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s se debiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ re-aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir `font-web-titles` porque el `<h3/>` carecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a de familia tipogrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡fica tras quitar la itÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡lica.
- **Regla Derivada**: Siempre que se modifique un componente heredado ("legacy") para ajustarlo a nuevas reglas de brand, auditar TODO el componente. Eliminar colores *hardcoded* obsoletos y aplicar los nuevos tokens de marca. Validar que no perder clases como `italic` descubra la falta de clases estructurales como familias de fuentes (`font-web-titles`).

### 21. Fallbacks Visuales en Vistas Combinadas de DB (Feb 2026)

- **Problema**: Las imÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡genes de las cartas no se mostraban en el Grid ("Imagen No Disponible"), a pesar de existir imÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡genes en la base de datos de Scryfall.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El endpoint RPC `get_products_filtered` retornaba directamente la columna `image_url` de la tabla `products`, la cual puede ser nula dependiendo del formato de importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, en lugar de considerar el fallback a la tabla unida `card_printings`.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Refactorizar la proyecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n SQL para incluir `COALESCE(p.image_url, cp.image_url) as image_url`.
- **Regla Derivada**: Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.

### 22. Validaciones Locales Estrictas (Feb 2026)

- **Problema**: Formularios sin validaciÃƒÆ’Ã‚Â³n previa enviaban datos inconsistentes (ej. formato de telÃƒÆ’Ã‚Â©fono errÃƒÆ’Ã‚Â³neo) al equipo de soporte.
- **SoluciÃƒÆ’Ã‚Â³n / LecciÃƒÆ’Ã‚Â³n**: Validar clide-side formatos especÃƒÆ’Ã‚Â­ficos (ej. venezolanos 04), rechazar letras en cÃƒÆ’Ã‚Â©dula (
eplace(/\D/g, '')), y forzar longitud en campos de texto antes de habilitar el pago.
- **Regla Derivada**: Todo input vital para el pago/contacto fÃƒÆ’Ã‚Â­sico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.

### 23. BÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda y ValidaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Stock en SQL (Feb 2026)

- **Problema**: El carrito permitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a agregar mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s cartas de las que habÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a en stock si se hacÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples clicks o llamadas al RPC dd_to_cart. AdemÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s, la bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda global a veces no priorizaba coincidencias exactas.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El control de stock no totalizaba las cantidades previas del mismo item en el carrito antes de comparar con el stock mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ximo.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Refactorizar dd_to_cart sumando quantity + v_current_qty > v_stock y lanzando un error. Ajustar get_products_filtered con un ORDER BY que priorice strings idÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nticos (p.name ILIKE ).
- **Regla Derivada**: Todo control de inventario en el backend debe ser calculable (suma del estado actual + intento) y rechazar transacciones a nivel SQL, y las funciones de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda deben devolver coincidencias exactas primero.

### 24. Resolviendo TipografÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­as en UI EspecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­fica (Feb 2026)

- **Problema**: El diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o UI requerÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a mapeos hiperespecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ficos de tipografÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­as (Daito para tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tulos, Bogue para precios, Rubik para cuerpo) en base a mockups donde no bastaba heredar la tipografÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a general.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Las clases CSS como ont-sans no sobreescribÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an correctamente la jerarquÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a necesaria si el componente padre tenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a otra.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Aplicar clases nominales directas en Tailwind (ont-web-titles, ont-titles, ont-sans) a los subnodos del texto en los componentes y remover tags italic que forzaban el fallback del font.
- **Regla Derivada**: La fidelidad 1:1 de PRD UI requiere aplicar clases tipogrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ficas explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citas en el nivel mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s bajo (hojas) del nodo del DOM y evitar modificadores de estilo globales (como italic o bold general) que rompan el font-face de UI.

### [Guest Checkout & Inventory Pattern] ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-02-27

- **Problema:** Riesgo de doble venta en un e-commerce de productos ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnicos (trading cards) cuando los pagos son asÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ncronos (Zelle/Pago MÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³vil) y los usuarios no tienen cuenta.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** Falta de un estado intermedio que bloquee el inventario temporalmente mientras el pago ocurre off-platform.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Implementar un estado de orden `pending_payment` que reduce el `reserved_stock` inmediatamente mediante un RPC atÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mico de Supabase, acompaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ado de un Job/RPC que cancela las ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rdenes expiradas (superan 24 hrs sin validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n) y devuelve el stock. Uso de URLs ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnicas (`/order/:id`) para que invitados suban su comprobante.
- **Regla Derivada:** Todo cambio de estado de `orders` debe evaluarse en el RPC `update_order_status` para gestionar `reserved_stock` vs `stock` dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micamente y de forma atÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mica.

### 2. ValidaciÃƒÆ’Ã‚Â³n y Reserva Diferida - 2026-03-01

- **Problema:** Exigir comprobantes upfront choca con la realidad del stock fÃƒÆ’Ã‚Â­sico desfasado.
- **Causa RaÃƒÆ’Ã‚Â­z:** El proceso asumÃƒÆ’Ã‚Â­a que el stock del e-commerce siempre era 100% exacto respecto a la tienda fÃƒÆ’Ã‚Â­sica.
- **SoluciÃƒÆ’Ã‚Â³n:** Romper el pago y la verificaciÃƒÆ’Ã‚Â³n en 2 pasos. Reservar el stock primero (pending_verification), y pagar despuÃƒÆ’Ã‚Â©s (awaiting_payment).
- **Regla Derivada:** Cualquier estado que cambie a cancelled/returned desde active debe liberar el stock inmediatamente para evitar desajustes remanentes.

### 3. Evitar Bloqueos de UI por Fugas de InteracciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n - 2026-03-01

- **Problema:** Un modal (CardModal) que se cierra al agregar al carrito funcionaba bien en testing local pero dejaba la UI colgada (timeout por capa transparente superpuesta) en pruebas E2E en ProducciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** El modal tenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica condicional que solo lo cerraba si se pasaba un prop onAddToCartSuccess. En flujos donde este prop faltaba, la promesa colgaba visualmente porque esperaba al callback para cerrarse.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Consolidar el cierre del modal (onClose()) para que siempre ocurra de manera incondicional, independiente de callbacks extra.
- **Regla Derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales a nivel del componente que las renderiza, no deben depender de hooks inyectados opcionales.

### 10. TypeError: reduce is not a function en ProducciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-02

- **Problema:** La aplicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n fallaba en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n al navegar a /profile con un error Uncaught TypeError: s.reduce is not a function.
- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** Respuestas de la API que devuelven objetos vacÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­os o
ull en lugares donde se espera un arreglo (ej. cartItems, collection). React Context o servicios no estaban garantizando un valor fallback de arreglo estable.
- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** ImplementaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n masiva de protecciones Array.isArray(data) ? data : [] antes de cualquier llamada a .reduce(), .map() o .filter().
- **Regla Derivada:** **Defensive Data Handling**. Prohibido usar mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©todos de arreglo sobre datos de API sin validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n previa con Array.isArray(). Codificado en AGENTS.md y PRD_MASTER.md.

### 64. Redundancia CrÃƒÆ’Ã‚Â­tica en Historial de Precios ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-02

- **Problema:** La base de datos alcanzÃƒÆ’Ã‚Â³ 1.42 GB (lÃƒÆ’Ã‚Â­mite plan 1.1 GB) debido a la tabla 'price_history'.
- **Causa RaÃƒÆ’Ã‚Â­z:** Scrapers guardaban el precio diario de 30,000+ cartas incluso si el precio no variaba, generando un 95% de redundancia.
- **SoluciÃƒÆ’Ã‚Â³n:** DeduplicaciÃƒÆ’Ã‚Â³n tÃƒÆ’Ã‚Â©cnica e implementaciÃƒÆ’Ã‚Â³n de lÃƒÆ’Ã‚Â³gica diferencial en 'sync_cardkingdom_api.py'.

### 65. IntegraciÃƒÆ’Ã‚Â³n de ManaBox y PriorizaciÃƒÆ’Ã‚Â³n de Scryfall ID (Marzo 2026)

- **Problema**: La importaciÃƒÆ’Ã‚Â³n por nombre/set puede fallar en cartas con nombres similares o mÃƒÆ’Ã‚Âºltiples versiones (promos, showcase).
- **SoluciÃƒÆ’Ã‚Â³n**: Implementar una detecciÃƒÆ’Ã‚Â³n automÃƒÆ’Ã‚Â¡tica de encabezados en el frontend (ManaBox ID, Scryfall ID) y priorizar la bÃƒÆ’Ã‚Âºsqueda por scryfall_id en el backend. Esto garantiza una precisiÃƒÆ’Ã‚Â³n del 100% y evita el mapeo manual.
- **NormalizaciÃƒÆ’Ã‚Â³n**: Las condiciones de ManaBox (e.g.
ear_mint, lightly_played) deben normalizarse en el backend a cÃƒÆ’Ã‚Â³digos internos (NM, LP) para mantener la integridad de la base de datos.
- **UX**: Una pre-visualizaciÃƒÆ’Ã‚Â³n que use los mismos ÃƒÆ’Ã‚Â­ndices de mapeo que la lÃƒÆ’Ã‚Â³gica de parseo evita confusiones visuales en el proceso de importaciÃƒÆ’Ã‚Â³n.

### 66. Soporte de FoliaciÃƒÆ’Ã‚Â³n (Finish) y AgregaciÃƒÆ’Ã‚Â³n en Lotes (Marzo 2026)

- **Problema**: Errores `ON CONFLICT` al intentar importar la misma carta en versiÃƒÆ’Ã‚Â³n Foil y Non-Foil en un mismo lote, y fallos de visualizaciÃƒÆ’Ã‚Â³n de precios/stock para versiones foil.
- **Causa RaÃƒÆ’Ã‚Â­z**: La restricciÃƒÆ’Ã‚Â³n de unicidad en la tabla `products` no incluÃƒÆ’Ã‚Â­a la columna `finish`. AdemÃƒÆ’Ã‚Â¡s, la lÃƒÆ’Ã‚Â³gica de importaciÃƒÆ’Ã‚Â³n no consolidaba duplicados dentro del mismo batch antes de enviarlos a la DB.
- **SoluciÃƒÆ’Ã‚Â³n**:
  - **DB**: Agregar columna `finish` y actualizar la restricciÃƒÆ’Ã‚Â³n ÃƒÆ’Ã‚Âºnica a `(printing_id, condition, finish)`.
  - **Edge Function**: Implementar un diccionario de agregaciÃƒÆ’Ã‚Â³n en el `tcg-api` que sume cantidades de filas idÃƒÆ’Ã‚Â©nticas (mismo printing+condition+finish) antes del `upsert`.
  - **Vistas**: Actualizar `products_with_prices` para incluir la columna `finish` y asegurar que el frontend reciba este metadato.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/LEYES_DEL_SISTEMA.md) -> Regla de Negocio 3 (AgregaciÃƒÆ’Ã‚Â³n en Lotes).

### 67. Fuentes Locales Sin Archivo = 404 Silencioso en Build Ã¢â‚¬â€� 2026-03-03

- **Problema**: La app en produccion generaba `GET /fonts/Daito.woff2 404` en la consola del navegador.
- **Causa Raiz**: Declaraciones `@font-face` en `index.css` referenciaban archivos con `url('/fonts/...')` que nunca existieron en `frontend/public/fonts/`. El build de Vite compila sin errores aunque los archivos no existan.
- **Solucion**: Eliminar `@font-face` locales e importar `Cinzel` y `Cinzel Decorative` de Google Fonts como fallbacks premium.
- **Regla Derivada**: Toda fuente en `@font-face` con `url('/fonts/...')` DEBE tener su archivo fisico. Si no esta disponible, usar Google Fonts. Documentar el original como comentario en el CSS.

### 18. Toggle Variant UI y CardKingdom Pricing

- **Problema:** Los botones de variante Foil/Normal quedaban habilitados sin stock disponible (o no funcionales), y el precio 'Mercado Externo' (MKT) fusionaba foil y normal mostrando el mismo valor para ambas versiones.
- **Causa RaÃƒÆ’Ã‚Â­z:** La UI dependÃƒÆ’Ã‚Â­a del atributo disabled basado en la *ausencia* de datos, pero no comprobaba stock === 0. AdemÃƒÆ’Ã‚Â¡s, pi.ts usaba genericamente vg_market_price_usd para variantes sintÃƒÆ’Ã‚Â©ticas sin bifurcar adecuadamente entre prices.usd y prices.usd_foil.
- **SoluciÃƒÆ’Ã‚Â³n:** Implementar renderizado condicional ({condition && <button>}) u ocultamiento via JS para variantes inexistentes, aÃƒÆ’Ã‚Â±adir validaciÃƒÆ’Ã‚Â³n disabled={(stock || 0) === 0} para variantes existentes pero agotadas. En pi.ts, asignar prices.usd a nonfoil y prices.usd_foil a foil explÃƒÆ’Ã‚Â­citamente al expandir el objeto ll_versions.
- **Regla Derivada:** UI de variantes en E-commerce fÃƒÆ’Ã‚Â­sico: Si no existe variante, oculta el UI. Si existe pero no hay stock, deshabilita la UI (opacity-50). Los precios externos siempre deben extraer las propiedades separadas (usd vs usd_foil) del provider base.

### 67. ConfiguraciÃƒÆ’Ã‚Â³n de Pydantic v2 (SettingsConfigDict)

- **Problema**: pydantic-settings generaba errores (como Config error o validaciÃƒÆ’Ã‚Â³n fallida) al intentar heredar de BaseSettings y usar una clase interna Config.
- **Causa RaÃƒÆ’Ã‚Â­z**: Con la introducciÃƒÆ’Ã‚Â³n de Pydantic v2, la declaraciÃƒÆ’Ã‚Â³n de configuraciÃƒÆ’Ã‚Â³n mediante subclases Config quedÃƒÆ’Ã‚Â³ obsoleta a favor de model_config.
- **SoluciÃƒÆ’Ã‚Â³n**: Usar model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8') dentro de la clase Settings.
- **Regla Derivada**: Siempre actualizar los esquemas de configuraciÃƒÆ’Ã‚Â³n a las convenciones de Pydantic v2 para garantizar soporte continuo y evitar problemas con pytest y builds.

### 68. EnvÃƒÆ’Ã‚Â­o AsÃƒÆ’Ã‚Â­ncrono de Correos en FastAPI

- **Problema**: Realizar el envÃƒÆ’Ã‚Â­o de correos (ej: servidor SMTP) de manera sÃƒÆ’Ã‚Â­ncrona dentro del path operator del carrito de compras introducÃƒÆ’Ã‚Â­a latencias inaceptables en la respuesta (checkout), degradando la experiencia de usuario.
- **Causa RaÃƒÆ’Ã‚Â­z**: La operaciÃƒÆ’Ã‚Â³n de red con SMTP bloquea el hilo principal si no se delega a una tarea de fondo.
- **SoluciÃƒÆ’Ã‚Â³n**: Delegar el envÃƒÆ’Ã‚Â­o a tareas asÃƒÆ’Ã‚Â­ncronas no bloqueantes. En este caso se empleÃƒÆ’Ã‚Â³ syncio.create_task() (tambiÃƒÆ’Ã‚Â©n se puede usar BackgroundTasks de FastAPI) para despachar correos (al cliente y admin) inmediatamente antes de devolver la respuesta 200 OK.
- **Regla Derivada**: Cualquier integraciÃƒÆ’Ã‚Â³n con servicios externos de notificaciones en rutas sensibles debe ser wait de una tarea en fondo o despachado asÃƒÆ’Ã‚Â­ncronamente para mantener latencias < 500ms.

### 23. Prioridad de IntenciÃƒÆ’Ã‚Â³n del Usuario sobre DocumentaciÃƒÆ’Ã‚Â³n EstÃƒÆ’Ã‚Â¡tica ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-05

- **Problema:** El PRD y otros documentos de diseÃƒÆ’Ã‚Â±o especificaban vincular el botÃƒÆ’Ã‚Â³n de correo a una landing de Mailchimp, pero el usuario reportÃƒÆ’Ã‚Â³ esto como un error.
- **Causa RaÃƒÆ’Ã‚Â­z:** DocumentaciÃƒÆ’Ã‚Â³n de diseÃƒÆ’Ã‚Â±o obsoleta que no fue actualizada tras cambios en la estrategia de marketing del cliente.
- **SoluciÃƒÆ’Ã‚Â³n:** Priorizar la comunicaciÃƒÆ’Ã‚Â³n directa del usuario sobre lo escrito en docs/. Implementar `mailto:info@geekorium.shop` directamente.
- **Regla Derivada:** En caso de contradicciÃƒÆ’Ã‚Â³n entre un documento `docs/*.md` y una instrucciÃƒÆ’Ã‚Â³n directa del usuario en el chat, el chat siempre tiene la razÃƒÆ’Ã‚Â³n. Marcar la discrepancia en el log para futura actualizaciÃƒÆ’Ã‚Â³n de docs.

### 24. JerarquÃƒÂ­a de ConfiguraciÃƒÂ³n SMTP (Mar 2026)

- **Problema**: Los correos no se enviaban porque las credenciales estaban en frontend/.env pero el backend las buscaba en la raÃƒÂ­z.
- **LecciÃƒÂ³n**: Los operativos backend (FastAPI/Python) suelen buscar el archivo .env en la raÃƒÂ­z del proyecto. Las configuraciones compartidas o crÃƒÂ­ticas de backend deben centralizarse allÃƒÂ­ para ser accesibles.

### 25. Seguridad de Secretos en ProducciÃƒÂ³n (Mar 2026)

- **Problema**: Hardcodear secretos en .env es un riesgo de seguridad en producciÃƒÂ³n.
- **LecciÃƒÂ³n**: Implementar validaciÃƒÂ³n en pydantic.BaseSettings (usando model_post_init) para asegurar que variables como SMTP_PASSWORD se provean via entorno del sistema y no vÃƒÂ­a archivo fÃƒÂ­sico en modo production.

### 27. OptimizaciÃƒÂ³n de Storage y DecisiÃƒÂ³n de Ocultar Features (Mar 2026)

- **Problema**: El flujo de carga de comprobantes de pago disparaba el uso de cuota de Supabase Storage de forma acelerada.
- **Causa RaÃƒÂ­z**: Carga de archivos binarios (imÃƒÂ¡genes) en cada transacciÃƒÂ³n, lo que podrÃƒÂ­a agotar la cuota gratuita/pagada sin un valor de negocio crÃƒÂ­tico inmediato (ya existe flujo WhatsApp).
- **LecciÃƒÂ³n**: En proyectos con restricciones de cuota, es mejor ocultar features de alto consumo de storage ("payment-proofs") y delegar la validaciÃƒÂ³n al canal asistido (WhatsApp) que ya se utiliza para el cierre de venta.
- **AcciÃƒÂ³n**: Se comentÃƒÂ³ el componente de carga en `OrderTrackingPage.tsx` y se eliminÃƒÂ³ la migraciÃƒÂ³n de creaciÃƒÂ³n del bucket.

### 28. Checkout AtÃƒÂ³mico y Desacoplamiento de Schema (Mar 2026)

- **Problema**: El flujo de checkout fallaba silenciosamente ("Orden no encontrada") a pesar de que el carrito se vaciaba.
- **Causa RaÃƒÂ­z**: El RPC `create_order_atomic` intentaba insertar un valor en la columna `product_name` de `order_items`, la cual no existÃƒÂ­a en el schema de producciÃƒÂ³n. El admin funcionaba porque usaba un JOIN dinÃƒÂ¡mico, ocultando la inconsistencia.
- **SoluciÃƒÂ³n**: Se aÃƒÂ±adiÃƒÂ³ la columna `product_name` a `order_items` para persistir el nombre del producto en el momento de la compra (snapshotting) y se habilitaron permisos pÃƒÂºblicos (anon/authenticated) para el rastreo.
- **Regla Derivada**: En flujos atÃƒÂ³micos (RPC), cualquier error de schema en una sub-tabla cancela toda la transacciÃƒÂ³n. Siempre verificar que las columnas usadas en el RPC existan en todas las tablas afectadas.

### 29. Hosting para E-commerce: Cloudflare Pages vs. GitHub Pages (Mar 2026)

- **Problema**: GitHub Pages prohÃƒÂ­be explÃƒÂ­citamente el uso comercial en su capa gratuita, lo que pone en riesgo sitios de venta directa como Geekorium.
- **SoluciÃƒÂ³n**: Migrar a **Cloudflare Pages**.
- **LecciÃƒÂ³n**: Cloudflare Pages permite oficialmente uso comercial en su plan gratuito y ofrece ancho de banda ilimitado, eliminando riesgos de costos por trÃƒÂ¡fico de imÃƒÂ¡genes pesadas (cartas TCG).
- **SPA Routing**: Cloudflare usa un archivo `_redirects` en `public/` con la regla `/* /index.html 200` para manejar rutas de React de forma nativa.

### 30. Estrategia de Branching y CI/CD (Mar 2026)

- **Problema**: Desplegar directamente desde `main` sin un entorno de previsualizaciÃƒÂ³n aumenta el riesgo de errores en producciÃƒÂ³n.
- **LecciÃƒÂ³n**: Adoptar un modelo de `dev` (Preview) y `main` (Production).
- **Flujo**: Cloudflare Pages genera despliegues automÃƒÂ¡ticos para cada rama. Los cambios se validan en la URL de preview de `dev` antes de ser incorporados a `main` vÃƒÂ­a Pull Request para el despliegue final.

### 31. Cloudflare Pages vs. Workers para Frontend Ã¢â‚¬â€� 2026-03-07

- **Problema:** ConfusiÃƒÂ³n en el dashboard de Cloudflare al intentar desplegar un frontend de React usando la secciÃƒÂ³n de "Workers".
- **LecciÃƒÂ³n:** Los **Workers** son para lÃƒÂ³gica serverless (scripts), mientras que **Pages** es la herramienta diseÃƒÂ±ada para hosting de sitios estÃƒÂ¡ticos (Vite, React). Siempre usar la pestaÃƒÂ±a "Pages" para el despliegue del frontend.

### 32. SEO Condicional vÃƒÂ­a Variables de Entorno de Vite Ã¢â‚¬â€� 2026-03-07

- **Problema:** Necesidad de activar SEO (meta tags y robots) solo en la rama de producciÃƒÂ³n (`main`) y ocultar el sitio en desarrollo/preview (`dev`).
- **SoluciÃƒÂ³n:** Usar placeholders `%VITE_SEO_...%` y `%VITE_ROBOTS%` en `index.html`.
- **ConfiguraciÃƒÂ³n:**
  - **Prod:** `VITE_ROBOTS=index, follow`
  - **Dev/Preview:** `VITE_ROBOTS=noindex, nofollow`
- **Ventaja:** Permite inyectar SEO real solo en el dominio productivo sin aÃƒÂ±adir dependencias pesadas de React.

### 33. Root Directory en Estructuras Monorepo/Subcarpetas Ã¢â‚¬â€� 2026-03-07

- **Problema:** El build fallaba en Cloudflare porque intentaba buscar `package.json` en la raÃƒÂ­z del repo.
- **LecciÃƒÂ³n:** En proyectos donde el frontend reside en una subcarpeta (ej: `/frontend`), es OBLIGATORIO configurar el **Root Directory** en el dashboard de Cloudflare para que el proceso de build se ejecute en el contexto correcto.

### 34. Conflicto de Auto-detecciÃƒÂ³n (Vite vs. VitePress) en Cloudflare Ã¢â‚¬â€� 2026-03-07

- **Problema:** Cloudflare Pages intentaba usar un preset de "VitePress" en lugar de "Vite" debido a la presencia de archivos de documentaciÃƒÂ³n o nombres similares, lo que resultaba en errores 404 por rutas de assets incorrectas.
- **SoluciÃƒÂ³n:** Configurar explÃƒÂ­citamente el **Framework Preset** como **"None"** en el dashboard de Cloudflare. Esto obliga al sistema a usar solo el comando de build (`npm run build`) y el directorio de salida (`dist`) especificado, sin suposiciones de frameworks adicionales.

### 35. SPA Routing: `404.html` vs `_redirects` en Cloudflare Pages Ã¢â‚¬â€� 2026-03-07

- **Problema:** El uso de un archivo `_redirects` con la regla `/* /index.html 200` puede generar advertencias de "Redirect Loop" en el dashboard de Cloudflare si se combina con redirecciones de dominio (ej. HTTP -> HTTPS).
- **SoluciÃƒÂ³n:** El mÃƒÂ©todo mÃƒÂ¡s robusto para SPAs en Cloudflare Pages es la estrategia de **`404.html` fallback**. Al copiar el `index.html` generado al archivo `404.html` durante el build, Cloudflare servirÃƒÂ¡ la aplicaciÃƒÂ³n para cualquier ruta no encontrada, permitiendo que el router de React tome el control sin generar avisos de bucle.

### 36. GestiÃƒÂ³n de Multi-entorno de Base de Datos (Supabase) Ã¢â‚¬â€� 2026-03-07

- **Problema**: Riesgo de contaminar datos de producciÃƒÂ³n o romper el schema productivo durante el desarrollo de nuevas features.
- **SoluciÃƒÂ³n**: Segregar bases de datos usando proyectos independientes de Supabase vinculados a las ramas de Cloudflare.
- **LecciÃƒÂ³n**: La mejor forma de manejar mÃƒÂºltiples bases de datos en un SPA desplegado en Cloudflare Pages es mediante **Environment Overrides**. Al configurar variables como `VITE_SUPABASE_URL` de forma distinta para los entornos de "Production" y "Preview", la aplicaciÃƒÂ³n se conecta automÃƒÂ¡ticamente al proyecto de Supabase correcto basado en el branch desde el que se desplegÃƒÂ³.
- **Edge Functions**: Es crÃƒÂ­tico recordar que las Edge Functions y sus secretos deben sincronizarse manualmente (o vÃƒÂ­a CLI link) en ambos proyectos, ya que son entornos aislados.

### 37. Restricciones de Despliegue en GitHub Environments Ã¢â‚¬â€� 2026-03-07

- **Problema**: El despliegue de la rama `dev` fallaba con "Branch is not allowed to deploy due to environment protection rules".
- **Causa RaÃƒÂ­z**: Los repositorios de GitHub con "Environments" (ej: `github-pages`) suelen restringir los despliegues solo a `main` por defecto en la secciÃƒÂ³n "Deployment branches and tags".
- **SoluciÃƒÂ³n**: Ajustar la configuraciÃƒÂ³n del Environment en GitHub Settings para permitir todas las ramas ("No restriction") o aÃƒÂ±adir explÃƒÂ­citamente la rama `dev`.
- **LecciÃƒÂ³n**: Al habilitar un nuevo entorno de hosting (como GitHub Pages para `dev`), el primer despliegue fallarÃƒÂ¡ si no se actualizan los permisos de rama en el Dashboard de GitHub.

### 38. RefactorizaciÃƒÂ³n de IDs de Proyecto Supabase Ã¢â‚¬â€� 2026-03-07

- **Problema**: El uso de IDs de Supabase hardcodeados en URLs de Edge Functions impedÃƒÂ­a que la rama `dev` conectara con su propia instancia de base de datos.
- **SoluciÃƒÂ³n**: Reemplazar todos los IDs estÃƒÂ¡ticos por la variable de entorno `VITE_SUPABASE_PROJECT_ID`.
- **LecciÃƒÂ³n**: Para sistemas multi-entorno, el ID del proyecto debe tratarse como un secreto dinÃƒÂ¡mico inyectado por el hoster, igual que la URL y la Anon Key. Esto garantiza que el frontend siempre hable con el backend correcto segÃƒÂºn su origen.

### 39. PriorizaciÃƒÂ³n de Card Kingdom sobre Goldfish (Marzo 2026)

- **Problema**: Inconsistencias de precios por uso de mÃƒÂºltiples fuentes de mercado externo sin una jerarquÃƒÂ­a clara.
- **DecisiÃƒÂ³n**: Card Kingdom es ahora la fuente de verdad ÃƒÂºnica para precios de mercado externo. Se eliminÃƒÂ³ el uso de la tabla `aggregated_prices` (Goldfish).
- **LecciÃƒÂ³n**: Mantener sistemas de fallback complejos a fuentes de datos obsoletas introduce "ruido" en la valoraciÃƒÂ³n y dificulta el debugging. La simplicidad de una sola fuente (CK) mejora la fiabilidad.
- **ImplementaciÃƒÂ³n**: Si el precio de la tienda (`Geekorium`) es nulo, el sistema siempre debe recurrir al precio actual de Card Kingdom (`price_history`).

### 40. Limpieza de Selects en Supabase (Frontend & Backend) Ã¢â‚¬â€� Marzo 2026

- **Problema**: Al realizar cambios en la lÃƒÂ³gica de negocio (como remover una tabla), es fÃƒÂ¡cil olvidar limpiar los strings de `select()` en el frontend (`api.ts`) o backend.
- **LecciÃƒÂ³n**: Los errores de "Property X does not exist" en el frontend suelen deberse a proyecciones incompletas en la llamada de Supabase. Siempre verificar que todos los campos necesarios (incluyendo `stock`, `is_foil`, etc.) estÃƒÂ©n presentes en el string de `select` tras una refactorizaciÃƒÂ³n.
- **AcciÃƒÂ³n**: Se restaurÃƒÂ³ la columna `stock` en `fetchCardDetails` que se habÃƒÂ­a omitido accidentalmente durante la limpieza de Goldfish.

### 41. SimplificaciÃƒÆ’Ã‚Â³n de Precios y Reversa de Branding (Marzo 2026)

- **Problema**: Estrategia de precios confusa que mezclaba mÃƒÆ’Ã‚Âºltiples fuentes y condiciones. Intento errÃƒÆ’Ã‚Â³neo de "limpiar" el branding de Geekorium.
- **Causa RaÃƒÆ’Ã‚Â­z**: El usuario aclarÃƒÆ’Ã‚Â³ que la prioridad era usar **Card Kingdom NM** como fuente ÃƒÆ’Ã‚Âºnica de verdad para los precios de Geekorium, y que el branding original debe conservarse intacto.
- **SoluciÃƒÆ’Ã‚Â³n**:
  - Refactorizar lÃƒÆ’Ã‚Â³gica de precios en `ValuationService`, Edge Functions y DB para filtrar estrictamente por 'NM' de Card Kingdom.
  - Revertir cualquier cambio en el nombre de la marca ("Geekorium", "Geekorium El Emporio") en el frontend y servicios de email.
- **LecciÃƒÆ’Ã‚Â³n**: La simplicidad en los precios agiliza la operaciÃƒÆ’Ã‚Â³n. Nunca asumir que el branding debe "profesionalizarse" si el usuario no lo pide; respetar la identidad establecida es crÃƒÆ’Ã‚Â­tico.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Regla 1 (Precios de Geekorium): Solo precios NM de Card Kingdom.
392:
393: ### 42. High-Performance SQL Bulk Updates (Marzo 2026)
394:
395: - **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.

### 42. High-Performance SQL Bulk Updates (Marzo 2026)

- **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.
- **Causa RaÃƒÆ’Ã‚Â­z**: Nested loops over the target table and the subquery for every row.
- **SoluciÃƒÆ’Ã‚Â³n**: Use `UPDATE FROM` with a Common Table Expression (CTE). Pre-calculate all prices in memory and join them to the target table in a single pass.
- **Regla Derivada**: Bulk metadata updates in Supabase must use the `CTE + UPDATE FROM` pattern.

### 43. Defensive API Path Normalization (Marzo 2026)

- **Problema**: Edge Functions returning 400 or 500 errors intermittently due to unexpected URL prefixes (e.g., `/functions/v1/api/`) or trailing slashes added by some clients/proxies.
- **SoluciÃƒÆ’Ã‚Â³n**: Implement a robust "strip and normalized" loop at the start of the Edge Function to remove multiple prefixes and standardize endpoints to a base path (e.g., `/api/sets`).
- **Regla Derivada**: Edge Functions must be agnostic to deployment-specific URL prefixes.

### 44. ConexiÃƒÆ’Ã‚Â³n Segura a Supabase Pooler (Marzo 2026)

- **Problema**: "Connection timed out" o "Host not found" al intentar conectar scripts de Python externos a la DB de producciÃƒÆ’Ã‚Â³n.
- **Causa**: Intentar usar el host del dashboard o la IP directa que puede estar bloqueada o rotada.
- **SoluciÃƒÆ’Ã‚Â³n**: Usar el **Transaction Pooler** (Puerto 5432 o 6543). El host debe ser `[region].pooler.supabase.com` y el usuario DEBE incluir el Project Ref (`postgres.[project-ref]`).
- **LecciÃƒÆ’Ã‚Â³n**: Siempre configurar el `DATABASE_URL` con el pooler para scripts de mantenimiento masivo de larga duraciÃƒÆ’Ã‚Â³n.

### 45. Estrategia de Batched Updates para DenormalizaciÃƒÆ’Ã‚Â³n (Marzo 2026)

- **Problema**: Actualizar columnas denormalizadas (`avg_market_price_usd`) en una tabla de 200k+ registros fallaba consistentemente por `statement timeout`.
- **Causa**: El planificador de Postgres intentaba un Sequential Scan masivo con subconsultas correlacionadas.
- **SoluciÃƒÆ’Ã‚Â³n**: Implementar un script de Python que procese la tabla por IDs primarios en lotes (ej. 1,000 registros). Esto libera el bloqueo de tabla entre lotes y evita que el proceso supere el lÃƒÆ’Ã‚Â­mite de tiempo de una transacciÃƒÆ’Ã‚Â³n individual.
- **LecciÃƒÂ³n**: Si una migraciÃƒÂ³n SQL tarda mÃƒÂ¡s de 30s en Postgres de Supabase, no forzar el timeout; mover la lÃƒÂ³gica a un batch script externo.

### 46. Correct Denormalization Level (Per-Printing vs. Per-Card) Ã¢â‚¬â€� 2026-03-10

- **Problema**: Al denormalizar precios (`avg_market_price_usd`) en la tabla `cards`, todas las versiones de una carta (ej. Pandemonium de *Exodus* vs. *The List*) mostraban el mismo precio, perdiendo la precisiÃƒÂ³n por versiÃƒÂ³n.
- **Causa RaÃƒÂ­z**: Una carta (`card_id`) puede tener mÃƒÂºltiples impresiones (`printing_id`) con precios drÃƒÂ¡sticamente diferentes. Denormalizar a nivel de carta colapsa esta distinciÃƒÂ³n.
- **SoluciÃƒÂ³n**: Mover la columna denormalizada a `card_printings`. Actualizar Materialized Views y RPCs para unir por `printing_id` en lugar de `card_id` cuando se trate de precios.
- **Regla Derivada**: Nunca denormalizar datos que varÃƒÂ­an por ediciÃƒÂ³n/acabado en la tabla maestra de cartas; usar siempre la tabla de impresiones.

### 48. Zero-Error Supabase Security Advisor (Mar 2026)

- **Problema**: Supabase Security Advisor reportaba mÃƒÂºltiples vulnerabilidades de RLS y riesgos en vistas con `SECURITY DEFINER`.
- **Causa**: Tablas de metadatos (sets, cards) y de usuario (orders, carts) carecÃƒÂ­an de polÃƒÂ­ticas de seguridad explÃƒÂ­citas, exponiendo datos de negocio o de clientes. Vistas recreadas sin `security_invoker = true` bypassaban el RLS.
- **SoluciÃƒÂ³n**:
  - Habilitar RLS en **todas** las tablas pÃƒÂºblicas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
  - Definir polÃƒÂ­ticas granulares: `SELECT` pÃƒÂºblico para metadatos (cards, sets) y `Owner-Only` para datos sensibles (user_watchlist, user_addresses) usando `auth.uid()`.
  - Configurar vistas con `security_invoker = true` para asegurar que respeten los permisos del usuario que consulta.
- **LecciÃƒÂ³n**: Un estado de "Zero Errors" en el Security Advisor no solo es una mÃƒÂ©trica de cumplimiento, sino una garantÃƒÂ­a de que el acceso a datos estÃƒÂ¡ controlado por polÃƒÂ­ticas y no por la configuraciÃƒÂ³n por defecto del motor.

441: ### 49. RLS Policies for Guest Checkout (Mar 2026)
442:
443: - **Problema**: Habilitar RLS en tablas de carrito (`carts`, `cart_items`) y pedidos (`orders`) rompe el flujo de "Guest Checkout" si se restringe el acceso solo a usuarios autenticados.
444: - **Causa**: Los usuarios anÃƒÂ³nimos (`anon`) necesitan interactuar temporalmente con sus propios datos sin una sesiÃƒÂ³n de Supabase Auth persistente.
445: - **SoluciÃƒÂ³n**: Implementar polÃƒÂ­ticas permitiendo `INSERT` a `anon` y `SELECT` basado en el `id` del carrito o pedido si el usuario posee la referencia (ej: ID en localStorage). Para `orders`, permitir `SELECT` pÃƒÂºblico pero restringido por ID para seguimiento.
446: - **Regla Derivada**: Siempre validar que las polÃƒÂ­ticas de RLS no bloqueen flujos de usuarios no autenticados vitales para la conversiÃƒÂ³n de venta.
447:
448: ### 50. Branding Asset Synchronization & Consistency (Mar 2026)
449:
450: - **Problema**: Discrepancia entre los archivos de diseÃƒÂ±o en `docs/logos/` y los assets servidos en `frontend/public/branding/`, resultando en logotipos desactualizados o inconsistentes.
451: - **Causa**: Falta de un flujo de sincronizaciÃƒÂ³n definido; los componentes de React referenciaban archivos antiguos (ej: `Logo.jpg` en lugar de `Logo.png`).
452: - **SoluciÃƒÂ³n**:
453:   - Establecer `docs/logos/` como la fuente de verdad.
454:   - Sincronizar manualmente (o vÃƒÂ­a script) a `frontend/public/branding/`.
455:   - Refactorizar todos los componentes frontend (`Footer`, `Home`, `WelcomeModal`, `HelpPage`, `LegalPage`) para usar el nuevo path y extensiÃƒÂ³n.
456:   - Actualizar `index.html` para el favicon y apple-touch-icon.
457: - **LecciÃƒÂ³n**: La identidad visual debe tratarse como cÃƒÂ³digo; cualquier cambio en el "Source of Truth" de diseÃƒÂ±o requiere una auditorÃƒÂ­a de referencias en todo el frontend para garantizar la integridad visual de la marca.

### 51. Fallback Matching by Collector Number (CardKingdom Sync) Ã¢â‚¬â€� 2026-03-11

- **Problema**: El script de sincronizaciÃƒÂ³n de CardKingdom fallaba al actualizar precios para ediciones especiales (ej. TMNT, PZA) debido a IDs de Scryfall faltantes o discrepantes.
- **Causa RaÃƒÂ­z**: No siempre hay un mapeo 1:1 de `scryfall_id` en el catÃƒÂ¡logo de CardKingdom para sets promocionales o de colaboraciÃƒÂ³n.
- **SoluciÃƒÂ³n**: Implementar una lÃƒÂ³gica de respaldo (fallback) que extraiga el `collector_number` del SKU de CardKingdom (ej. "TMT-0017" -> "17") y realice el match combinando `set_name` + `collector_number`.
- **Regla Derivada**: Todo script de sincronizaciÃƒÂ³n de precios externo debe tener un mÃƒÂ©todo de match de respaldo basado en metadatos fÃƒÂ­sicos (set + nÃƒÂºmero) si el ID ÃƒÂºnico del proveedor falla.

### 52. UnificaciÃƒÂ³n de Archivos de Entorno (.env) Ã¢â‚¬â€� 2026-03-11

- **Problema**: Discrepancias de llaves (especialmente `SUPABASE_SERVICE_ROLE_KEY`) y corrupciÃƒÂ³n de archivos debido a mÃƒÂºltiples archivos `.env` (raÃƒÂ­z y frontend/).
- **Causa RaÃƒÂ­z**: DesincronizaciÃƒÂ³n manual entre archivos y herramientas (Vite vs Python) buscando configuraciones en lugares distintos.
- **SoluciÃƒÂ³n**: Centralizar todas las variables en un ÃƒÂºnico `.env` en la raÃƒÂ­z. Configurar Vite con `envDir: '../'` para leer desde la raÃƒÂ­z.
- **LecciÃƒÂ³n**: En monorepos pequeÃƒÂ±os o proyectos con subcarpetas, un solo archivo de entorno en la raÃƒÂ­z garantiza que todos los servicios (Frontend, API, Scripts) operen sobre la misma "fuente de verdad".

### 53. GestiÃƒÂ³n de Procesos HuÃƒÂ©rfanos en SincronizaciÃƒÂ³n Ã¢â‚¬â€� 2026-03-11

- **Problema**: Errores intermitentes de `Invalid API Key` o falta de actualizaciÃƒÂ³n de datos a pesar de aplicar correcciones en el cÃƒÂ³digo y el `.env`.
- **Causa RaÃƒÂ­z**: Procesos de Python persistentes en segundo plano que mantienen versiones obsoletas de las variables de entorno o que bloquean conexiones a la base de datos.
- **SoluciÃƒÂ³n**: Antes de reintentar sincronizaciones crÃƒÂ­ticas tras cambios en la configuraciÃƒÂ³n, es obligatorio listar y terminar procesos huÃƒÂ©rfanos (`Stop-Process -Name python -Force`).
- **Regla Derivada**: (Codificada en LEYES_DEL_SISTEMA.md) Todo cambio estructural en configuraciÃƒÂ³n requiere un reinicio limpio de servicios y procesos de mantenimiento.

### 54. Robustez en Scripts de DiagnÃƒÂ³stico (Supabase SQL vs API) Ã¢â‚¬â€� 2026-03-11

- **Problema**: Scripts de diagnÃƒÂ³stico rÃƒÂ¡pido fallan por `APIError` al intentar realizar joins complejos (`table.select('*, cards(name)')`).
- **Causa RaÃƒÂ­z**: Restricciones de aliasing en la API PostgREST o desconfiguraciÃƒÂ³n momentÃƒÂ¡nea de relaciones en el cliente Python.
- **SoluciÃƒÂ³n**: Para verificaciones manuales rÃƒÂ¡pidas, preferir consultas SQL directas vÃƒÂ­a `psycopg2` o realizar selecciones simples de IDs y resolver relaciones programÃƒÂ¡ticamente.
- **LecciÃƒÂ³n**: La simplicidad en el diagnÃƒÂ³stico previene falsos negativos causados por la propia herramienta de prueba.

### 55. Variables SEO de Vite No Reemplazadas en ProducciÃƒÂ³n Ã¢â‚¬â€� 2026-03-11

- **Problema**: El tab del navegador mostraba literalmente `%VITE_SEO_TITLE%` en producciÃƒÂ³n (`geekorium.shop`).
- **Causa RaÃƒÂ­z**: Los placeholders `%VITE_*%` en `index.html` solo son reemplazados por Vite durante el build si la variable estÃƒÂ¡ definida como env var en ese momento. Las variables `VITE_SEO_TITLE`, `VITE_SEO_DESCRIPTION`, `VITE_SEO_KEYWORDS`, `VITE_SEO_IMAGE` y `VITE_APP_URL` nunca fueron configuradas en el dashboard de Cloudflare Pages Ã¢â€ â€™ Environment Variables Ã¢â€ â€™ Production.
- **SoluciÃƒÂ³n**: Hardcodear los valores SEO estÃƒÂ¡ticos directamente en `frontend/index.html`. Mantener solo `%VITE_ROBOTS%` como placeholder (para controlar indexaciÃƒÂ³n por entorno: `index, follow` en prod, `noindex, nofollow` en dev).
- **Variables faltantes descubiertas en Cloudflare**: `VITE_SUPABASE_PROJECT_ID` y `VITE_ROBOTS`.
- **Regla Derivada**: Auditar `index.html` en cada setup de proyecto nuevo. Todo `%VITE_*%` que no estÃƒÂ© en el dashboard del hosting es un bug silencioso. Las metas SEO estÃƒÂ¡ticas (tÃƒÂ­tulo, descripciÃƒÂ³n de marca) deben hardcodearse; las dinÃƒÂ¡micas por entorno (robots, URL canÃƒÂ³nica) se parametrizan.
- **Google Search Console**: Para que Google indexe un sitio nuevo, NO basta con tener `robots: index, follow`. Se requiere verificar el dominio en GSC (via registro TXT en DNS de Cloudflare) y enviar el sitemap manualmente. Sin esto, el crawl puede tardar semanas o no ocurrir.

### 56. Error de "Migration Mismatch" en Supabase CI/CD (GitHub Actions) Ã¢â‚¬â€� 2026-03-11

- **Problema**: El pipeline `supabase/setup` en GitHub Actions fallaba con "Migration mismatch" al intentar hacer push o reset a la base de datos de Preview.
- **Causa RaÃƒÂ­z**: Borrar o renombrar archivos de migraciÃƒÂ³n localmente no elimina sus registros histÃƒÂ³ricos de la DB remota en Supabase (`supabase_migrations.schema_migrations`). El CLI detecta esta divergencia y aborta.
- **SoluciÃƒÂ³n**: Ir al SQL Editor del proyecto Supabase remoto y hacer `DELETE FROM supabase_migrations.schema_migrations WHERE version = 'VERSION_HUERFANA';` para alinear la DB con los archivos locales antes de re-ejecutar el pipeline.
- **Regla Derivada**: Nunca eliminar scripts de migraciÃƒÂ³n que ya se ejecutaron en un entorno alojado, a menos que tambiÃƒÂ©n se purgue su huella en la tabla interna de Supabase o se haga un reset completo desde cero.

### 57. Sobrecritura Incompleta en Patrones de Fallback API a Supabase Ã¢â‚¬â€� 2026-03-11

- **Problema**: Una carta Foil obtenÃƒÂ­a el precio de `$5.99` (precio Normal) en lugar de `$59.99` (precio Foil) en el frontend.
- **Causa RaÃƒÂ­z**: En `api.ts`, una respuesta exitosa pero incompleta desde FastAPI llenaba la propiedad `data.all_versions` con objetos sin `finish` ni `avg_market_price_foil_usd`. Aunque se detectaba que faltaba data (`apiVersionsLackFinishData`), la lÃƒÂ³gica saltaba el *query de Supabase fallback* porque la condiciÃƒÂ³n original era `if (!data.all_versions || data.all_versions.length === 0)`.
- **SoluciÃƒÂ³n**: Cuando se detecta data incompleta (e.g., `apiVersionsLackFinishData`), es obligatorio vaciar el atributo base explÃƒÂ­citamente (`data.all_versions = []` o `delete data.all_versions`) antes del chequeo condicional del fallback para forzar la re-evaluaciÃƒÂ³n estructurada desde la base de datos directa.
- **Regla Derivada**: En patrones donde un API proxy falla/devuelve data parcial y el frontend tiene un fallback directo a la DB de Supabase, la data parcial errÃƒÂ³nea DEBE purgarse por completo en memoria. Mezclar las respuestas (`{...baseData, ...data}`) sin purgar provoca cortocircuitos lÃƒÂ³gicos en la UI.

### 58. Unicidad FÃƒÂ­sica y React Keys en RPCs de Inventario Ã¢â‚¬â€� 2026-03-11

- **Problema**: El frontend mostraba duplicados exactos (ej. 2 cartas idÃƒÂ©nticas) o sobreescribÃƒÂ­a variantes al renderizar resultados de bÃƒÂºsqueda si no habÃƒÂ­a distinciÃƒÂ³n entre foil y nonfoil en la respuesta del RPC `get_products_filtered`.
- **Causa RaÃƒÂ­z**: En la tabla `products`, las variantes Foil y Nonfoil del mismo `printing_id` estÃƒÂ¡n separadas. Sin embargo, si el RPC no retorna la columna `finish`, el frontend las mapeaba ambas usando unicÃƒÂ¡mente `printing_id` como React Key, causando advertencias de UI de claves duplicadas, sobreescritura de cartas, y perdiendo el estado visual "Foil".
- **SoluciÃƒÂ³n**: Asegurarse de que el RPC recupere la columna `finish` (`LOWER(COALESCE(p.finish, 'nonfoil')) as finish`) y utilizarla en el frontend para generar un React Key ÃƒÂºnico (`${printing_id}-${finish}`). Adicionalmente, pasar `is_foil` explicitamente al componente derivÃƒÂ¡ndolo de `finish`.
- **Regla Derivada**: Todo RPC que retorne listas de inventario fÃƒÂ­sico TCG debe siempre exponer y proyectar los diferenciadores fÃƒÂ­sicos (ej. `finish`, `condition`) al frontend para garantizar unicidad garantizada en las visualizaciones de React y posibilitar lÃƒÂ³gica UI condicional.

### 59. Recarga de CachÃƒÂ© PostgREST y Precios Ramificados en RPCs Ã¢â‚¬â€� 2026-03-11

- **Problema**: Tras aÃƒÂ±adir la columna `finish` al RPC `get_products_filtered` en la base de datos de producciÃƒÂ³n mediante un script SQL directo, el frontend seguÃƒÂ­a recibiendo la respuesta antigua (sin `finish`) y mostrando precios incorrectos para las versiones Foil.
- **Causa RaÃƒÂ­z**:
  1. PostgREST (la capa API de Supabase) mantiene un cachÃƒÂ© del schema de la base de datos. Los cambios directos en funciones SQL no invalidan este cachÃƒÂ© automÃƒÂ¡ticamente, lo que provoca que la API siga retornando la firma antigua de la funciÃƒÂ³n.
  2. Inicialmente, no se considerÃƒÂ³ que el precio a mostrar (*market price*) debe ramificarse dependiendo del *finish*. La consulta SQL usaba `avg_market_price_usd` de forma genÃƒÂ©rica para todas las variantes.
- **SoluciÃƒÂ³n**:
  1. Ejecutar `NOTIFY pgrst, 'reload schema';` inmediatamente despuÃƒÂ©s de alterar una funciÃƒÂ³n SQL cruda.
  2. Modificar el RPC para que el precio devuelto dependa inteligentemente de la variante fÃƒÂ­sica que se va a imprimir en esa fila: `COALESCE(CASE WHEN LOWER(p.finish) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)`.
- **Regla Derivada**: Al desarrollar RPCs unificados de inventario TCG, la proyecciÃƒÂ³n de la propiedad `price` no puede ser plana; **debe** ramificarse evaluando las banderas fÃƒÂ­sicas (`finish`, y en el futuro `condition` o `language`). AdemÃƒÂ¡s, cualquier parche SQL *hotfix* aplicado en vivo sobre Supabase requiere estrictamente recargar la capa API HTTP (`NOTIFY pgrst, 'reload schema'`).

### 60. Uso de Supabase CLI en Windows (npx) Ã¢â‚¬â€� 2026-03-12

- **Problema**: El comando `supabase` falla con `CommandNotFoundException` si no estÃƒÂ¡ en el PATH global del sistema.
- **SoluciÃƒÂ³n**: Usar siempre `npx supabase` para invocar el CLI local. Para despliegues remotos, es obligatorio incluir el flag `--project-ref [ID]` para evitar ambigÃƒÂ¼edades si el enlace local (`.supabase/config`) no estÃƒÂ¡ sincronizado.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla TÃƒÂ©cnica (Herramientas CLI).

### 61. SincronizaciÃƒÂ³n de Edge Functions Duplicadas Ã¢â‚¬â€� 2026-03-12

- **Problema**: Desplegar una funciÃƒÂ³n corregida (ej. `api`) no solucionaba el problema en todas las partes del sitio (ej. Admin o Import) porque existÃƒÂ­a otra funciÃƒÂ³n idÃƒÂ©ntica con distinto nombre (`tcg-api`) desplegada previamente.
- **LecciÃƒÂ³n**: Durante fases de transiciÃƒÂ³n o refactorizaciÃƒÂ³n de nombres de funciones, es Mandatorio sincronizar el cÃƒÂ³digo en ambas carpetas (`api/` y `tcg-api/`) antes del despliegue para garantizar consistencia en todo el ecosistema.
- **Regla Derivada**: Evitar la fragmentaciÃƒÂ³n de lÃƒÂ³gica compartida; si dos Edge Functions hacen lo mismo, deben eliminarse o mantenerse estrictamente en espejo hasta la migraciÃƒÂ³n total.

### 62. LÃƒÂ³gica de Pedidos "Por Encargo" (Stock 0) Ã¢â‚¬â€� 2026-03-12

- **Problema**: El sistema bloqueaba la venta de cartas sin stock fÃƒÂ­sico, limitando el e-commerce solo a lo disponible en preventa o inventario actual.
- **SoluciÃƒÂ³n**:
  - **Bypassing**: Modificar RPC `add_to_cart` para ignorar la validaciÃƒÂ³n de `stock_actual` si el producto permite pedidos on-demand.
  - **CreaciÃƒÂ³n On-the-fly**: Si una variante (Foil/NM) no existe en la tabla `products`, el RPC debe crearla con stock 0 en lugar de fallar, permitiendo que el usuario la "encargue".
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 4 (Soporte Por Encargo).

### 68. Discrepancia de Stock "8 fuera / 1 dentro" (Marzo 2026)

- **Problema**: El buscador mostraba stock disponible, pero el modal mostraba "Por encargo".
- **Causa RaÃƒÂ­z**: Uso de IDs sintÃƒÂ©ticos en el frontend (`uuid-foil`, `uuid-nonfoil`) que no coincidÃƒÂ­an con el `printing_id` real al consultar el stock por RPC.
- **SoluciÃƒÂ³n**: Refactorizar `api.ts` para extraer el base UUID (stripping suffixes) antes de filtrar el resultado del RPC de stock.
- **LecciÃƒÂ³n**: Las llaves de React y los IDs de navegaciÃƒÂ³n pueden ser sintÃƒÂ©ticos para garantizar unicidad visual, pero los queries de datos de negocio (stock, precio) DEBEN trabajar sobre el ID canÃƒÂ³nico de la base de datos.
- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `fetchCardDetails` ahora normaliza los IDs antes del mapeo de stock.

### 23. Prioridad de Precios: Mercado vs Inventario Ã¢â‚¬â€� 2026-03-12

- **Problema**: Cartas en stock mostraban precio de $0.00 o "---" en el modal, aunque en la bÃƒÂºsqueda se veÃƒÂ­a el precio correcto ($24.99).
- **Causa RaÃƒÂ­z**: En `api.ts`, la lÃƒÂ³gica de mezcla de datos de inventario usaba el operador `??` (nullish coalescing), lo que permitÃƒÂ­a que un valor de `0` en la tabla `products` (precio no seteado manualmente) sobrescribiera el `market_price` de la tabla `card_printings`.
- **SoluciÃƒÂ³n**: Refactorizar la lÃƒÂ³gica en `fetchCardDetails` para validar que el precio de inventario sea estrictamente mayor a 0 antes de usarlo como override.
- **LecciÃƒÂ³n**: Un precio de `0` en el inventario debe tratarse pedagÃƒÂ³gicamente como "sin precio manual" (fallback al mercado), no como "precio gratis". La lÃƒÂ³gica de negocio debe ser consistente entre el listado (`get_products_filtered` RPC) y el detalle (`api.ts`).
- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `finalPrice` ahora valida `Number(exactProd.price) > 0`.

### 69. UnificaciÃƒÂ³n de Credenciales SMTP y SincronizaciÃƒÂ³n de Edge Functions Ã¢â‚¬â€� 2026-03-12

- **Problema**: El envÃƒÂ­o de correos fallaba silenciosamente tras cambios en la configuraciÃƒÂ³n debido a discrepancias en los nombres de variables de entorno entre las funciones `api` (`SMTP_USERNAME`) y `tcg-api` (`SMTP_USER`).
- **Causa RaÃƒÂ­z**: FragmentaciÃƒÂ³n de cÃƒÂ³digo entre funciones duplicadas que realizan tareas similares y falta de logs de diagnÃƒÂ³stico para la carga de secretos de Supabase.
- **SoluciÃƒÂ³n**:
  - Unificar los nombres de variables a `SMTP_USERNAME` y `SMTP_PASSWORD` en todas las Edge Functions.
  - Sincronizar la lÃƒÂ³gica de envÃƒÂ­o de notificaciones entre `api/index.ts` y `tcg-api/index.ts`.
  - AÃƒÂ±adir logs de consola explÃƒÂ­citos (`SMTP credentials loaded: true/false`) para facilitar el debugging en el dashboard de Supabase.
- **Regla Derivada**: Las variables de entorno para infraestructuras compartidas (SMTP, API Keys) deben seguir un esquema de nombrado ÃƒÂºnico en todo el proyecto. Cualquier cambio en una Edge Function "espejo" debe replicarse inmediatamente en la otra.

### 70. Price Fallback Chain & Starred Collector Numbers Ã¢â‚¬â€� 2026-03-12
- **Problema:** Cartas en stock mostraban "S/P" (Sin Precio) a pesar de tener datos de mercado en otras versiones.
- **Causa RaÃƒÂ­z:** Existencia de versiones duplicadas (con "Ã¢Ëœâ€¦" en el nÃƒÂºmero de coleccionista) que carecÃƒÂ­an de metadatos de precio, mientras que la versiÃƒÂ³n base sÃƒÂ­ los tenÃƒÂ­a. El buscador devolvÃƒÂ­a la versiÃƒÂ³n sin precio.
- **SoluciÃƒÂ³n:**
  1. Refactorizar el RPC `get_products_filtered` con una cadena de fallback: `Market(Finish) -> Market(Nonfoil) -> Market(Foil) -> Store Price -> 0`.
  2. Ejecutar un script de correcciÃƒÂ³n de datos para copiar precios de versiones base a versiones starred.
- **Regla Derivada:** Todo RPC de inventario debe implementar fallbacks de precio entre acabados (finish) para mitigar falta de metadata especÃƒÂ­fica.
### 71. LÃƒÂ³gica de DetecciÃƒÂ³n de Foil y RemediaciÃƒÂ³n Masiva (Marzo 2026)

- **Problema**: El sistema importaba casi todas las cartas como "Foil", incluso tierras duales de 3ED que no existen en ese acabado.
- **Causa RaÃƒÂ­z**:
  1. **Bug en Edge Function**: La lÃƒÂ³gica `finish.toLowerCase().includes('foil')` devolvÃƒÂ­a true para "nonfoil" porque contiene la palabra "foil".
  2. **Data Inconsistente**: Miles de registros en `products` heredaron este error, ensuciando el inventario y la visualizaciÃƒÂ³n.
- **SoluciÃƒÂ³n**:
  - **CÃƒÂ³digo**: Refactorizar a `(finish === 'foil' || (finish.includes('foil') && !finish.includes('nonfoil')))` para exclusividad.
  - **DB**: Script PL/pgSQL masivo que:
    - Identifica cartas marcadas como `foil` que no soportan ese acabado segÃƒÆ’Ã‚Âºn `card_printings`.
    - Fusiona el stock con la versiÃƒÂ³n `nonfoil` si existe, o renombra la entrada en place.
    - Actualiza `order_items` y `cart_items` para mantener integridad referencial antes de borrar registros duplicados.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance y Datos). Las correcciones de finish deben considerar la tabla unida `card_printings`.
### 72. Ultra-Performance Filtering via Single-Table Denormalization (March 2026)

- **Problema**: Timeouts (500) y latencia alta en filtros complejos (Color, Tipo, Rareza) sobre tablas de 200k+ registros con mÃƒÂºltiples joins.
- **Causa RaÃƒÂ­z**: La ejecuciÃƒÂ³n de joins dinÃƒÂ¡micos en Supabase/PostgREST es costosa. Los ÃƒÂ­ndices en tablas relacionales no siempre compensan el overhead del planificador de Postgres en queries muy ramificadas.
- **SoluciÃƒÂ³n**: **Extrema DenormalizaciÃƒÂ³n**. Mover metadatos crÃƒÂ­ticos (`release_date`, `colors`, `set_name`, `type_line`) directamente a la tabla `products`. RediseÃƒÂ±ar el RPC `get_products_filtered` para que sea un query de una sola tabla (`FROM products`).
- **SincronizaciÃƒÂ³n**: Usar un trigger `BEFORE INSERT OR UPDATE` en la tabla destino para poblar los datos, y triggers `AFTER UPDATE` en las tablas fuente para "tocar" los registros relacionados y forzar la sincronizaciÃƒÂ³n sin recursiÃƒÂ³n infinita.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance). Si una query con Joins supera los 200ms, denormalizar metadatos a la tabla principal.

### 73. Frontend Request Cancellation with AbortController (March 2026)

- **Problema**: "Race conditions" visuales y sobrecarga del servidor al mover sliders de filtros (Precio/AÃƒÂ±o) rÃƒÂ¡pidamente. El servidor procesaba peticiones que el usuario ya no necesitaba.
- **Causa RaÃƒÂ­z**: Cada cambio en el estado disparaba un `fetch` asÃƒÂ­ncrono. Sin cancelaciÃƒÂ³n, las respuestas podÃƒÂ­an llegar desordenadas o acumularse en el backend.
- **SoluciÃƒÂ³n**: Implementar `AbortController` en el hook `useEffect` de data fetching.
- **PatrÃƒÂ³n**:

```typescript
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, [filters]);
```

- **Regla Derivada**: Todo component de bÃƒÂºsqueda/filtrado masivo DEBE implementar `AbortController` para gestionar el ciclo de vida de las peticiones de red.
### 74. Robust Foil Matching & Finishes Array (March 2026)

- **Problema**: Cartas importadas como foil eran guardadas como non-foil por el RPC `bulk_import_inventory`, resultando en visualizaciÃƒÂ³n y precios incorrectos (ej. "Wan Shi Tong, Librarian").
- **Causa RaÃƒÂ­z**:
  1. El RPC priorizaba el match por la columna `is_foil`, ignorando el array `finishes` usado por sets modernos (Avatar, etc.).
  2. Fallback de Scryfall: Algunas versiones (starred collector numbers) no tienen metadata de precio foil, causando confusiÃƒÂ³n en el matching si no hay una jerarquÃƒÂ­a clara.
- **SoluciÃƒÂ³n**:
  - **Backend**: Actualizar RPC para que considere `requested_finish` vs (`is_foil` OR `finishes` array) con prioridad sobre la fecha de lanzamiento.
  - **Frontend**: Implementar una heurÃƒÂ­stica de validaciÃƒÂ³n en `BulkImport.tsx` que detecta precios altos ($ > 50) en cartas marcadas como non-foil, lanzando un aviso de confirmaciÃƒÂ³n.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 6 (ImportaciÃƒÂ³n Robusta).
### 75. Non-Automatic Joins in Supabase Client Ã¢â‚¬â€� 2026-03-13
- **Problema**: `Could not find a relationship between 'orders' and 'profiles' in the schema cache` al intentar un join simple.
- **Causa**: Supabase PostgREST no detecta relaciones automÃƒÂ¡ticas si los campos no tienen foreign keys explÃƒÂ­citas en el schema real de Postgres o si hay ambigÃƒÂ¼edades en la cachÃƒÂ© del cliente.
- **SoluciÃƒÂ³n**: Evitar joins forzados si no son necesarios. Para `orders`, los datos del comprador ya estÃƒÂ¡n denormalizados en `guest_info` o `shipping_address`. Usar esos campos directamente es mÃƒÂ¡s resiliente.
- **Regla Derivada**: No asumir que `select('*, table(*)')` funcionarÃƒÂ¡ siempre; verificar foreign keys en el schema antes de intentar joins profundos.

### 76. Email Priority in Orders Ã¢â‚¬â€� 2026-03-13
- **Problema**: El admin mostraba "N/A" en el correo del comprador.
- **Causa**: Se buscaba en `orders.user_email` (columna inexistente) o se intentaba unir con `profiles` (que no guarda emails en esta arquitectura).
- **SoluciÃƒÂ³n**: La jerarquÃƒÂ­a de email correcta es: `guest_info.email` -> `shipping_address.email`.
- **Regla Derivada**: Para ÃƒÂ³rdenes de invitados y usuarios registrados, el email de contacto seguro reside en los metadatos de envÃƒÂ­o/invitado.

### 77. Inventory Zero-Price Integrity Sweep Ã¢â‚¬â€� 2026-03-13
- **Problema**: Productos "On-Demand" o con errores de importaciÃƒÂ³n terminaban con precio $0.00 en el carrito.
- **Causa**: Falta de validaciÃƒÂ³n reactiva en el momento de la inserciÃƒÂ³n o desincronizaciÃƒÂ³n con el mercado.
- **SoluciÃƒÂ³n**: Implementar barridos (sweeps) automÃƒÂ¡ticos que busquen precios 0 y los reparen consultando `card_printings`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla 7 (PrevenciÃƒÂ³n de Zero-Price).

### 78. RemociÃƒÂ³n Proactiva de Funcionalidades "On-Hold" (Marzo 2026)

- **Problema**: El inicio de sesiÃƒÂ³n social (Google, Discord, Microsoft) fue solicitado para ser ocultado o puesto en "hold" para simplificar la experiencia de usuario inicial.
- **LecciÃƒÂ³n**: Cuando una funcionalidad secundaria se pone en pausa por decisiÃƒÂ³n del usuario, no basta con comentarla si genera advertencias de lint o aumenta el peso muerto del cÃƒÂ³digo. Es preferible removerla limpiamente de la UI y los componentes asociados, manteniendo el estado de autenticaciÃƒÂ³n core intacto.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 8 (Simplicidad y Foco). Funcionalidades en hold deben ser removidas de la vista activa para evitar ruido visual y tÃƒÂ©cnico.
- Ã¢Å“â€¦ **Visibilidad Condicional de Carrito**: El botÃƒÂ³n "AÃƒÂ±adir al carrito" ahora estÃƒÂ¡ oculto por defecto en la vista general (grid/list) y solo es visible en el modal de detalles, mejorando la estÃƒÂ©tica de navegaciÃƒÂ³n masiva.
- Ã¢Å“â€¦ **Filtrado de Stock Robusto (Multi-capa)**: ImplementaciÃƒÂ³n de limpieza de ÃƒÂ­tems agotados directamente en `api.ts` y componentes de detalle. EliminaciÃƒÂ³n completa de versiones "Por Encargo" ($0.00) en el flujo de vista de stock.
- Ã¢Å“â€¦ **Ocultamiento de SecciÃƒÂ³n Archivo**: Removida la pestaÃƒÂ±a de histÃƒÂ³rico para simplificar la UX. El sistema ahora opera exclusivamente sobre el inventario vivo (Marketplace).

### 79. Component Prop Drilling for Visibility Control (March 2026)

- **Problema**: Necesidad de implementar un patrÃƒÂ³n de `showElement` prop con un valor por defecto.
- **ImplementaciÃƒÂ³n**:
  - `CardProps` ahora incluye `showCartButton?: boolean = false`.
  - Los padres (`CardGrid`) propagan este prop.
  - El modal de detalle (`CardModal`) lo ignora o lo fuerza a `true`, manteniendo la funcionalidad aislada.
- **LecciÃƒÂ³n**: Al rediseÃƒÂ±ar visibilidad de componentes compartidos, usar props booleanos explÃƒÂ­citos en lugar de lÃƒÂ³gicas globales de estado si el cambio es puramente de visualizaciÃƒÂ³n contextual. Esto permite mayor flexibilidad sin efectos secundarios en otras partes de la app.
### 25. Ocultamiento de Features vs. EliminaciÃƒÂ³n (Marzo 2026)

- **Problema**: El sistema de "Archivo" confundÃƒÂ­a a los usuarios reciÃƒÂ©n registrados.
- **Causa RaÃƒÂ­z**: Presencia de una funcionalidad de referencia histÃƒÂ³rica en un sitio de venta directa.
- **LecciÃƒÂ³n**: Para cambios de UX rÃƒÂ¡pidos bajo presiÃƒÂ³n, ocultar el punto de entrada (`tabs`) y forzar el estado inicial (`activeTab`) es mÃƒÂ¡s seguro y rÃƒÂ¡pido que eliminar cÃƒÂ³digo de fondo.
- **ImplementaciÃƒÂ³n**: En `Home.tsx`, forzar `activeTab: 'marketplace'`, retornar `null` en el botÃƒÂ³n de toggle e ignorar el parÃƒÂ¡metro URL `?tab=reference`.
- **Integridad**: Mantener una rama de referencia (`v1.0-productiva`) antes de apagar funcionalidades importantes garantiza la reversibilidad total sin miedo a perder cÃƒÂ³digo legado.

### 81. AlineaciÃƒÂ³n de IDs de Fuentes de Precios (Marzo 2026)

- **Problema**: Discrepancias en el historial de precios debido a mÃƒÂºltiples IDs (`1`, `21`) asignados a la misma fuente (Card Kingdom) en diferentes etapas del desarrollo.
- **Causa RaÃƒÂ­z**: Inconsistencia en scripts de raspado (scrapers) iniciales que no compartÃƒÂ­an una tabla de referencia de fuentes.
- **SoluciÃƒÂ³n**: Estandarizar IDs de fuentes crÃƒÂ­ticas: **16 para TCGplayer** y **17 para Card Kingdom**. Ejecutar scripts de alineaciÃƒÂ³n (`align_everything.py`) para migrar registros histÃƒÂ³ricos al ID oficial y consolidar las tablas `sources` y `price_sources`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 1. Todo script de sincronizaciÃƒÂ³n debe usar el ID 17 para Card Kingdom de forma hardcodeada o mediante lookup en la tabla de referencia oficial.


### 82. Storefront Caching & Pricing Updates (April 2026)
- **Problema**: El inventario (products) fue actualizado exitosamente para eliminar productos con precio .00, pero la grilla en la tienda seguÃƒÂ­a mostrando .00.
- **Causa RaÃƒÂ­z**: La visualizaciÃƒÂ³n principal del frontend depende de la Vista Materializada mv_unique_cards, la cual se alimenta de la tabla de catÃƒÂ¡logo card_printings, no del inventario directo.
- **SoluciÃƒÂ³n**: Para que un ajuste de mercado se refleje visualmente, el script debe actualizar la columna de precios denormalizada en card_printings y luego ejecutar explÃƒÂ­citamente REFRESH MATERIALIZED VIEW mv_unique_cards;.
- **Regla Derivada**: Todo update de pricing que deba verse en frontend requiere refrescar la vista materializada como ÃƒÂºltimo paso obligatorio.

### 83. Integridad en Egresos Masivos (Abril 2026)
- **Problema**: Riesgo de inconsistencia de stock al procesar archivos CSV con filas duplicadas o cantidades que exceden el stock disponible en un entorno multi-transaccional.
- **Causa RaÃƒÂ­z**: Si no se agrupan las cantidades por "Printing + Condition + Finish" antes de comparar con la DB, dos filas pequeÃƒÂ±as podrÃƒÂ­an pasar la validaciÃƒÂ³n individualmente pero fallar la resta combinada, o generar errores de restricciÃƒÂ³n.
- **SoluciÃƒÂ³n**: 
- **AgregaciÃƒÂ³n Previa**: El RPC de validaciÃƒÂ³n (`preview_bulk_egress`) y ejecuciÃƒÂ³n debe usar un CTE para sumar todas las cantidades del lote por nodo fÃƒÂ­sico antes de evaluar el stock.
  - **Aborto Transaccional**: La operaciÃƒÂ³n de egreso debe ser atÃƒÂ³mica (una sola funciÃƒÂ³n RPC). Si una sola carta del lote falla la validaciÃƒÂ³n de stock final (stock - pedido < 0), se debe lanzar una excepciÃƒÂ³n para revertir el lote completo, evitando estados de inventario parciales.
- **Regla Derivada**: Todo proceso de baja de inventario debe registrarse obligatoriamente en `inventory_logs` con un motivo explÃƒÂ­cito para auditorÃƒÂ­a administrativa.

### 84. Frictionless WhatsApp Checkout (April 2026)
- **Concept**: Reducing a 2-step checkout to a single form by using "safe defaults" (CÃƒÂ©dula, Address, etc.) for required backend fields while focusing the UI on Name, WhatsApp, and Email.
- **UI Logic**: Use of a dynamic "Confirm & Pay" button that remains disabled (grey) until the 3 mandatory fields are valid, then turns green with a glow effect.
- **Notification**: Email is mandatory as it's the primary channel for automated order confirmation, complementary to the manual WhatsApp flow.

### 85. Branding & "Secret" Access (April 2026)
- **Pattern**: Hiding "Login" buttons from the public view during BETA to prioritize conversion and reduce unauthorized support requests.
- **Implementation**: Providing a "Secret Link" (`/geeko-login`) for the internal team instead of a UI-hidden button.
- **UX**: Updating the restricted route handler (`AdminRoute`) to provide a helpful "Restricted Access" screen with a link to the secret login, improving internal use while keeping public users away.

### 86. WhatsApp Itemized Order Detail Ã¢â‚¬â€� Regression Risk (April 2026)
- **Problema**: After a UX simplification session (April 6), the WhatsApp redirect message was reduced to aggregate counts ("Normal: 5, Foil: 2"), losing the per-card breakdown. This blocked operational review of orders.
- **Causa RaÃƒÂ­z**: Frictionless checkout improvements over-simplified the WA message to reduce message length, inadvertently removing data needed by the store team.
- **SoluciÃƒÂ³n**: Restore the itemized format: `Ã¢â‚¬Â¢ Qty x Name [SET] [FINISH] - $Total`. Cap at 40 items and append an overflow note directing to email for full detail.
- **Regla Derivada**: The WhatsApp message is the PRIMARY operational channel for the Geekorium team. It MUST always include a per-card breakdown. Simplification of the checkout form must NEVER simplify the order detail sent to the store.

### 87. PDF Receipt via New Window (No Library) (April 2026)
- **Problema**: `window.print()` called on the main checkout page produced an unstyled browser print of the entire app UI, not a real comprobante.
- **SoluciÃƒÂ³n**: `generateReceiptHTML()` in `CheckoutSuccessPage.tsx` produces a standalone, self-contained HTML document (with Google Fonts, full CSS branding, item table, and status badge) opened via `window.open()`. The receipt page auto-fires `window.print()` on load.
- **PatrÃƒÂ³n**: Pass all data needed for the receipt (`customerInfo`, `items`, `total`, `orderId`) through React Router's `navigate()` state. No DB round-trip needed on the success page.
- **Regla Derivada**: For lightweight, one-time document generation in a React SPA, prefer the new-window HTML approach over PDF libraries (jsPDF, react-pdf). It requires zero npm dependencies and produces a print-ready, fully branded document.

### 88. AtÃƒÂ³mica EliminaciÃƒÂ³n de Ãƒï¿½tems e Inventario (Abril 2026)
- **Problema**: Eliminar un ÃƒÂ­tem de un pedido requiere actualizar el total y restaurar el stock fÃƒÂ­sico simÃƒÂºltaneamente para evitar discrepancias.
- **Causa RaÃƒÂ­z**: LÃƒÂ³gica distribuida en el frontend puede fallar si la conexiÃƒÂ³n se interrumpe entre llamadas.
- **SoluciÃƒÂ³n**: Crear una funciÃƒÂ³n RPC `delete_order_item_v1` que maneje: 1. VerificaciÃƒÂ³n de estado de orden, 2. Incremento de stock en `products`, 3. RecÃƒÂ¡lculo de `total_amount`, 4. EliminaciÃƒÂ³n de la fila en `order_items`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 6 (Integridad Global). Operaciones cruzadas entre Pedidos e Inventario deben ser atÃƒÂ³micas vÃƒÂ­a SQL.

### 89. UI-Based Confirmation vs Browser Native (Abril 2026)
- **Problema**: El uso de `window.confirm()` en entornos de producciÃƒÂ³n puede ser bloqueado o auto-cancelado por el navegador si se detectan mÃƒÂºltiples re-renders o interferencias de eventos, resultando en botones que "no hacen nada".
- **Causa RaÃƒÂ­z**: El log de consola mostraba "User clicked CANCEL" instantÃƒÂ¡neamente sin que el usuario interactuara.
- **SoluciÃƒÂ³n**: Implementar un estado de confirmaciÃƒÂ³n en lÃƒÂ­nea (`confirmingItemId`). Al pulsar la acciÃƒÂ³n, el botÃƒÂ³n cambia a un set de iconos "Confirmar [Check] / Cancelar [X]".
- **Ventaja**: Evita bloqueos de scripts del navegador, es mÃƒÂ¡s rÃƒÂ¡pido y coherente con el lenguaje visual de la app (Rose-Neon).
- **Regla Derivada**: Preferir estados de confirmaciÃƒÂ³n "Inline" para acciones destructivas en el panel administrativo para garantizar robustez ante polÃƒÂ­ticas de seguridad de navegadores modernos.

### 90. Touch-First Visibility vs Desktop-Only Hover (April 2026)
- **Problem**: Critical actions (like "Add to Cart") were hidden behind a hover state (`opacity-0 group-hover:opacity-100`). This made the feature inaccessible on smartphones, tablets, and POS touchscreens.
- **Solution**: Switch to **Permanent Visibility**. Important CTA (Call to Action) buttons should always be visible (at least partially) or have a very clear visual affordance that doesn't rely on mouse pointers.
- **Improved UX**: Use a "Pulse" or subtle expansion animation on hover for *desktop enrichment*, but ensure the base state is usable for touch.

### 91. React.memo Custom Comparison Pitfalls (April 2026)
- **Problem**: A component (`Card.tsx`) refused to show a new button even when the parent passed `showCartButton={true}`.
- **Causa RaÃƒÂ­z**: The `React.memo` second argument (comparison function) was manually listing props to watch (`card_id`, `price`, etc.) but was **omitting** `showCartButton`. React saw the props changed, but the manual check said "nothing important changed", blocking the re-render.
- **LecciÃƒÂ³n**: Avoid manual prop comparison in `React.memo` unless strictly necessary for performance. If used, it MUST include every prop that affects the visual output. When in doubt, let React's default shallow comparison handle it.

### 92. Implicit 'any' in Production Builds (April 2026)

- **Problema**: El servidor de desarrollo (`npm run dev`) funcionaba perfectamente, pero la compilaciÃƒÂ³n de producciÃƒÂ³n (`npm run build`) fallaba con `error TS7006: Parameter 'm' implicitly has an 'any' type`.
- **Causa**: La configuraciÃƒÂ³n de TypeScript en modo estricto para producciÃƒÂ³n prohÃƒÂ­be el uso de `any` implÃƒÂ­cito en parÃƒÂ¡metros de funciones (especialmente en `.map()`, `.filter()`).
- **LecciÃƒÂ³n**: Nunca omitir el tipado en funciones de transformaciÃƒÂ³n de datos en `utils/api.ts`. Un simple `(m: any)` permite que el build pase y asegura que el despliegue no se bloquee.

### 93. OptimizaciÃƒÂ³n de Rendimiento en Carrito de Invitados (Abril 2026)

- **Problema**: Usuarios no logueados experimentaban un retraso de varios segundos al editar el carrito.
- **Causa**: La funciÃƒÂ³n `fetchCart` realizaba peticiones secuenciales (individuales) a Supabase por cada ÃƒÂ­tem. Un carrito de 15 ÃƒÂ­tems disparaba ~30-45 queries.
- **SoluciÃƒÂ³n**: **Batch Fetching**. Agrupar todos los IDs de impresiÃƒÂ³n, realizar una ÃƒÂºnica consulta `.in()` para metadatos y una ÃƒÂºnica llamada RPC para stock/precios vivos. Esto reduce la complejidad de $O(N)$ a $O(1)$ viajes de red.
- **Mapeo de Datos**: Al usar batch fetching, es crÃƒÂ­tico asegurar que el objeto retornado mantenga la estructura esperada por los componentes (nested `products` object). Se debe corregir el mapeo en `CartContext` para soportar tanto datos planos como anidados.

### 94. Schema Discrepancies en CI/CD y Error 42P10 (Abril 2026)

- **Problema**: El script de importaciÃƒÂ³n de Supabase fallaba en GitHub Actions con el error `postgrest.exceptions.APIError: {'code': '42P10', 'message': 'there is no unique or exclusion constraint matching the ON CONFLICT specification'}`.
- **Causa**: El script intentaba un `upsert` usando `on_conflict='game_id,set_code'`. El entorno local de desarrollo sÃƒÂ­ poseÃƒÂ­a esa restricciÃƒÂ³n explÃƒÂ­cita de clave compuesta, pero la base de datos remota de producciÃƒÂ³n solo tenÃƒÂ­a implementado un `UNIQUE(set_code)`. PostgREST arrojaba excepciÃƒÂ³n de esquema inmediatamente al no hallar correspondencia exacta a las columnas especificadas.
- **SoluciÃƒÂ³n**: ProgramaciÃƒÂ³n defensiva en scripts de BD multi-entorno utilizando fallbacks dinÃƒÂ¡micos (Ej: atrapar especÃƒÂ­ficamente el cÃƒÂ³digo `'42P10'` en el bloque de excepciones y re-ejecutar el `upsert` haciendo un "Fallback" a `on_conflict='set_code'`).
### 95. Gatillos de SincronizaciÃƒÂ³n y Visibilidad de Inventario (Abril 2026)

- **Problema**: Nuevas ediciones importadas exitosamente (ej: Strixhaven) no eran visibles en el inventario a pesar de tener stock y pertenecer al juego correcto (`MTG`).
- **Causa RaÃƒÂ­z**:
  1. El frontend requiere `type_line` y `colors` para renderizar las cartas; si son nulos, la carta se omite.
  2. La funciÃƒÂ³n de base de datos `sync_product_metadata` (gatillo en `products`) omitÃƒÂ­a estos campos en su clÃƒÂ¡usula `SELECT INTO`, por lo que nunca se poblaban automÃƒÂ¡ticamente desde el catÃƒÂ¡logo.
- **SoluciÃƒÂ³n**:
  - Actualizar el trigger de PostgreSQL para incluir `type_line`, `colors` y `release_date` (usando `COALESCE` para preservar datos manuales si existen).
  - Forzar una sincronizaciÃƒÂ³n masiva ("Touch" update) de los productos afectados.
- **Regla Derivada**: Todo gatillo de sincronizaciÃƒÂ³n denormalizada entre el catÃƒÂ¡logo maestro y el inventario DEBE incluir la totalidad de los campos crÃƒÂ­ticos para la UI del frontend.

### 96. CardKingdom SKU-Based Mapping (April 2026)

- **Problema**: La sincronizaciÃƒÂ³n de precios para Strixhaven fallaba o se contaminaba con ediciones antiguas debido a que el campo `variation` de CK estaba vacÃƒÂ­o para sets modernos.
- **Causa RaÃƒÂ­z**: El catÃƒÂ¡logo de CardKingdom para sets modernos (Strixhaven, Tokens, etc.) incrusta el nÃƒÂºmero de coleccionista y el acabado directamente en el SKU (`[F]SET-NNNN`), no en los campos de metadatos tradicionales.
- **LecciÃƒÂ³n**:
  - **Foil Detection**: El prefijo `F` en el SKU es la fuente ÃƒÂºnica de verdad para detectar versiones Foil.
  - **Collector mapping**: Extraer el nÃƒÂºmero del SKU sustrayendo ceros a la izquierda.
  - **Prioridad de EdiciÃƒÂ³n**: Al mapear por cÃƒÂ³digo de set (ej: `soa`), priorizar manualmente ediciones primarias ("Secrets of Strixhaven") sobre aliases o sub-sets para evitar oscilaciones de precios.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 7.

### 97. High-Performance Batch SQL Updates (April 2026)

- **Problema**: Actualizar >25,000 precios mediante `executemany` (mÃƒÂºltiples `UPDATE` individuales) sobre un pooler (puerto 6543) excedÃƒÂ­a los 90 minutos de ejecuciÃƒÂ³n.
- **Causa RaÃƒÂ­z**: Latencia de red acumulada y round-trip por cada fila, sumado al overhead del gestor de conexiones por cada transacciÃƒÂ³n individual.
- **SoluciÃƒÂ³n**: **VALUES Table Pattern**. Agrupar los cambios en chunks (ej: 2,000 filas) y ejecutar un solo `UPDATE target_table SET col = v.new_val FROM (VALUES (...), (...)) AS v(id, new_val) WHERE target_table.id = v.id`.
- **Resultado**: El tiempo de ejecuciÃƒÂ³n bajÃƒÂ³ de >90 minutos a **63 segundos** para 47,000 actualizaciones.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 18.

### 98. RPC Overload and Frontend Consistency (April 2026)

- **Problema**: El checkout fallaba en producciÃƒÂ³n con el error "Function not found" a pesar de existir localmente y en el dashboard.
- **Causa RaÃƒÂ­z**: Un script de limpieza de sobrecargas (`drop_order_overloads.py`) eliminÃƒÂ³ la versiÃƒÂ³n exacta que el frontend llamaba (con `p_cart_id`). PostgREST no hace fallback automÃƒÂ¡tico si la firma es ambigÃƒÂ¼a o falta un parÃƒÂ¡metro requerido.
- **LecciÃƒÂ³n**:
    - **ProtecciÃƒÂ³n de Firmas**: Nunca eliminar sobrecargas de funciones crÃƒÂ­ticas sin verificar la versiÃƒÂ³n exacta que el frontend (especialmente en producciÃƒÂ³n) estÃƒÂ¡ llamando.
    - **Resilient RPC Pattern**: Restaurar funciones con `DEFAULT NULL` en parÃƒÂ¡metros nuevos para mantener compatibilidad con callers antiguos (Edge Functions) y nuevos (Frontend).
- **Regla Derivada**: Toda actualizaciÃƒÂ³n de firma de RPC en producciÃƒÂ³n debe ser retrocompatible o desplegarse simultÃƒÂ¡neamente con el frontend.

### 145. Polymorphic Order Integrity (Accessories) Ã¢â‚¬â€� 2026-04-23
- **Problema**: Los pedidos mixtos (cartas + accesorios) fallaban en el checkout porque el sistema solo esperaba `product_id`.
- **Causa RaÃƒÂ­z**: La tabla `order_items` usa claves forÃƒÂ¡neas separadas y mutuamente excluyentes para accesorios y productos. El frontend enviaba IDs en campos inconsistentes dependiendo del origen (carrito de invitados vs logueados).
- **SoluciÃƒÂ³n**: Refactorizar el RPC `create_order_atomic` para manejar `product_id` y `accessory_id` de forma polimÃƒÂ³rfica con recuperaciÃƒÂ³n de ID defensiva.
- **Regla Derivada**: Todo ÃƒÂ­tem de orden debe pasar por un mapeador de IDs en el frontend antes de enviarse al RPC, asegurando que se identifique correctamente si es un producto base o un accesorio.

### 146. Guest Tracking RLS & 406 Errors Ã¢â‚¬â€� 2026-04-23
- **Problema**: El rastreo de pedidos para invitados devolvÃƒÂ­a "0 rows" o `406 Not Acceptable`.
- **Causa RaÃƒÂ­z**: RLS habilitado sin polÃƒÂ­ticas que permitieran al rol `anon` leer pedidos por ID. PostgREST devuelve 406 si el usuario no tiene permisos de `SELECT` sobre las columnas solicitadas.
- **SoluciÃƒÂ³n**: Conceder `GRANT SELECT` a `anon` y `authenticated` en `orders` y `order_items`, y crear una polÃƒÂ­tica pÃƒÂºblica `FOR SELECT USING (true)` (el acceso se limita de facto por el conocimiento del UUID de la orden).
- **Regla Derivada**: El flujo de "Guest Checkout" requiere que las tablas de ÃƒÂ³rdenes sean legibles por el rol `anon` mediante polÃƒÂ­ticas de RLS que permitan el acceso por ID.

### 147. PostgREST Schema Cache Latency Ã¢â‚¬â€� 2026-04-24
- **Problema**: Tras ejecutar migraciones SQL (especialmente `DROP` y `CREATE OR REPLACE FUNCTION`), el frontend sigue recibiendo errores 404 o firmas de funciÃƒÂ³n antiguas.
- **Causa RaÃƒÂ­z**: La capa API de Supabase (PostgREST) mantiene un cachÃƒÂ© del esquema que no siempre se invalida instantÃƒÂ¡neamente ante cambios DDL directos vÃƒÂ­a SQL Editor.
- **LecciÃƒÂ³n**: Al realizar cambios crÃƒÂ­ticos en funciones RPC que el frontend consume, es una buena prÃƒÂ¡ctica ejecutar `NOTIFY pgrst, 'reload schema';` o realizar un cambio menor en el esquema (como un comentario `COMMENT ON FUNCTION ...`) para forzar la invalidaciÃƒÂ³n del cachÃƒÂ©.

### 148. Inclusive Filtering for Generic Accessories Ã¢â‚¬â€� 2026-04-24
- **Problema**: Los accesorios "GenÃƒÂ©ricos" (como fundas, cajas o dados) desaparecÃƒÂ­an de la tienda cuando el usuario seleccionaba un juego especÃƒÂ­fico (MTG, PKM), a pesar de ser compatibles con todos.
- **Causa RaÃƒÂ­z**: El filtro SQL `a.game_id = p_game_id` excluÃƒÂ­a filas donde `game_id` es NULL (productos genÃƒÂ©ricos).
- **SoluciÃƒÂ³n**: Implementar una lÃƒÂ³gica de filtrado inclusiva: `WHERE (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL)`. Esto asegura que los productos especÃƒÂ­ficos del juego Y los genÃƒÂ©ricos aparezcan siempre.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 9. Los productos sin ID de juego se consideran universales y deben aparecer en todos los contextos de filtrado de juego.

### 149. Admin UI Alignment & State Sync Ã¢â‚¬â€� 2026-04-24
- **Problema**: DesalineaciÃƒÂ³n visual en tablas administrativas tras aÃƒÂ±adir nuevas columnas (`is_active`, `game_id`), causando que los datos no coincidan con sus encabezados.
- **LecciÃƒÂ³n**: Al expandir tablas complejas en React, evitar el uso de ÃƒÂ­ndices de array para renderizar columnas. Usar un mapeo explÃƒÂ­cito de celdas por nombre de propiedad y asegurar que el nÃƒÂºmero de etiquetas `<th/>` sea idÃƒÂ©ntico al de `<td/>` en cada fila para evitar "drift" visual.

### 150. Dynamic Game Mapping in Bulk Imports Ã¢â‚¬â€� 2026-04-24
- **Problema**: Los scripts de importaciÃƒÂ³n masiva fallaban con errores de llave forÃƒÂ¡nea (`accessories_game_id_fkey`) al intentar insertar IDs de juegos que no existÃƒÂ­an en el entorno de destino (ej: ID 6 para Digimon).
- **SoluciÃƒÂ³n**: No usar IDs hardcodeados en scripts de importaciÃƒÂ³n. Usar subconsultas dinÃƒÂ¡micas: `(SELECT game_id FROM games WHERE game_name ILIKE '...' LIMIT 1)`.
- **Regla Derivada**: Todo script de utilidad de carga masiva debe resolver IDs de tablas de referencia dinÃƒÂ¡micamente mediante el nombre o cÃƒÂ³digo de la entidad.

### 151. Defensive Optional Chaining for Polymorphic Data Ã¢â‚¬â€� 2026-04-24
- **Problema**: El componente `CardModal` y `CardDetail` crasheaban con `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` al abrir accesorios en el catÃƒÂ¡logo.
- **Causa RaÃƒÂ­z**: El campo `set_code` no existe para accesorios. El componente asumÃƒÂ­a que todos los productos son cartas TCG y llamaba `.toUpperCase()` directamente sin verificar null/undefined.
- **SoluciÃƒÂ³n**: Usar optional chaining en todos los `string.toUpperCase()` sobre datos de API: `set_code?.toUpperCase()`. Enriquecer la respuesta de `fetchCardDetails` para accesorios con campos placeholder (`set_code: category`, `collector_number: 'ACC'`).
- **Regla Derivada**: **Nunca** llamar mÃƒÂ©todos de string directamente sobre propiedades de datos de API. Siempre usar `?.` o validar con un guard antes. Aplica especialmente cuando la misma vista renderiza tipos de datos polimÃƒÂ³rficos (cartas, accesorios).

### 152. Polymorphic UI: Separate Layouts for Different Product Types Ã¢â‚¬â€� 2026-04-24
- **Problema**: El `CardModal`, diseÃƒÂ±ado para cartas TCG, mostraba informaciÃƒÂ³n irrelevante (FOIL/NONFOIL toggle, "EDICIÃƒâ€œN / IMPRESIONES", legalidad de formatos, CardKingdom link) cuando se abrÃƒÂ­a un accesorio como una caja de Gundam o snacks.
- **Causa RaÃƒÂ­z**: Reutilizar el mismo layout de carta para todos los tipos de productos es un anti-patrÃƒÂ³n cuando las entidades tienen caracterÃƒÂ­sticas fundamentalmente diferentes.
- **SoluciÃƒÂ³n**: Condicionar el layout completo con `details?.is_accessory`. Cuando es `true`, renderizar un layout alternativo limpio: imagen centrada, nombre, categorÃƒÂ­a, badge de stock prominente, precio simple ("Precio"), y CTA de carrito. Cuando es `false`, usar el layout original de carta con todas sus secciones.
- **Regla Derivada**: En plataformas de e-commerce polimÃƒÂ³rficas (cartas + accesorios), el modal/detalle debe detectar el tipo de producto y renderizar el layout apropiado. No intentar ocultar secciones con condicionales dispersos; mejor separar los branches de rendering completos.

### 153. JSX Fragment Nesting in Ternary Conditionals Ã¢â‚¬â€� 2026-04-24
- **Problema**: Al refactorizar un componente grande (CardModal) para agregar un branch ternario complejo, mÃƒÂºltiples errores de TypeScript surgieron: "JSX element has no corresponding closing tag", "Expected closing tag for JSX fragment".
- **Causa RaÃƒÂ­z**: Al dividir el rendering existente en dos branches de un ternario (accesorio vs carta), es fÃƒÂ¡cil perder el `<>` de apertura del fragment en el branch `else`, y los `</div>` de cierre previos al fragment quedan "huÃƒÂ©rfanos".
- **SoluciÃƒÂ³n**:
  1. Usar `tsc --noEmit` para verificar JSX antes de `npm run build`.
  2. Al agregar un ternario que envuelve mÃƒÂºltiples elementos, aÃƒÂ±adir explÃƒÂ­citamente `<>` y `</>` para el branch que lo necesita.
  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir lÃƒÂ­neas separadas).
- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ lÃƒÂ­neas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.

  2. Al agregar un ternario que envuelve mÃºltiples elementos, aÃ±adir explÃ­citamente `<>` y `</>` para el branch que lo necesita.
  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir lÃ­neas separadas).
- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ lÃ­neas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.

### 154. CartContext Flattening vs CartDrawer Nested Fields â€” 2026-04-24
- **Problema**: Los Ã­tems del carrito mostraban `$0.00` individualmente en `CartDrawer`, aunque el SUBTOTAL total era correcto.
- **Causa RaÃ­z**: `CartContext.refreshCart()` aplana los datos del RPC `get_user_cart` en campos de primer nivel (`item.price`, `item.name`, `item.image_url`, `item.set_code`). Sin embargo, `CartDrawer` leÃ­a la estructura anidada antigua (`item.products?.price`), que no existe en el state aplanado â€” resultando en `undefined â†’ $0.00`.
- **Por quÃ© el SUBTOTAL funcionaba**: La lÃ³gica del subtotal ya tenÃ­a el fallback correcto `(item.products?.price || item.price || 0)`, pero la lÃ­nea de display por Ã­tem no.
- **SoluciÃ³n**: Actualizar `CartDrawer` para leer los campos planos primero con el nested como fallback: `item.price || item.products?.price || 0`. Aplicar el mismo patrÃ³n a `name`, `image_url`, `set_code` e `is_foil`.
- **Regla Derivada**: Cuando `CartContext` cambia la forma del state (de nested a flat), TODOS los consumidores (`CartDrawer`, `CheckoutPage`, etc.) deben actualizarse simultÃ¡neamente. El patrÃ³n seguro es siempre usar `item.price || item.products?.price` para soportar ambas formas durante transiciones.

### 101. Rigor de TypeScript en CI/CD (Variables no usadas) â€” 2026-04-25
- **Problema:** El build fallÃ³ mÃºltiples veces en el servidor de despliegue debido a variables declaradas pero no usadas (`TS6133`).
- **Causa RaÃ­z:** El entorno local (VS Code/Dev) era mÃ¡s permisivo que el pipeline de producciÃ³n/dev del servidor.
- **SoluciÃ³n:** Limpieza quirÃºrgica de imports y variables no usadas. No asumir que si "funciona en local" pasarÃ¡ el build del servidor.
- **Regla Derivada:** Realizar un `npm run build` local antes de cada push para detectar errores de tipado estricto.

### 102. SincronizaciÃ³n URL-Estado para NavegaciÃ³n Reactiva â€” 2026-04-25
- **Problema:** El menÃº cambiaba la URL pero el catÃ¡logo no se actualizaba ni cambiaba de pestaÃ±a.
- **Causa RaÃ­z:** El componente principal (`Home.tsx`) solo leÃ­a los `searchParams` en el montaje inicial.
- **SoluciÃ³n:** Implementar un `useEffect` que escuche `searchParams` y sincronice el estado local (`activeTab`, `filters`).
- **Regla Derivada:** Cualquier navegaciÃ³n basada en URL en una SPA requiere sincronizaciÃ³n reactiva del estado interno para disparar nuevos fetches de datos.

### 103. ResoluciÃ³n de AmbigÃ¼edad en PostgREST (PGRST203) â€” 2026-04-26
- **Problema:** La API de Supabase fallaba al llamar a una funciÃ³n RPC con error de mÃºltiples candidatos.
- **Causa RaÃ­z:** Redefinir funciones sin borrar versiones anteriores con firmas similares crea sobrecarga ambigua.
- **SoluciÃ³n:** Limpieza profunda usando un bloque PL/pgSQL que recorre los OIDs de las funciones duplicadas.
- **Regla Derivada:** Siempre incluir DROP FUNCTION IF EXISTS con la firma exacta antes de recrear RPCs.

### 104. AuditorÃ­a de Datos de Referencia (Lookups) â€” 2026-04-26
- **SoluciÃ³n**: UnificaciÃ³n de registros, actualizaciÃ³n de llaves forÃ¡neas y estandarizaciÃ³n de cÃ³digos.
- **Regla Derivada**: Antes de expandir un catÃ¡logo maestro, auditar la tabla actual para mapear IDs existentes.

### 148. EstabilizaciÃ³n de Precios Reales y Omni-Sync (Mayo 2026)
- **Problema**: Desajustes de precios "congelados" en producciÃ³n (ej: $16.99 vs $14.99) y fallas persistentes en los pipelines de GitHub Actions.
- **Causa RaÃ­z**: 
- **SoluciÃ³n:** Centralizar objetos de mapeo (gameMap, gameMapInv) a nivel global en el componente.
- **Regla Derivada:** Nunca usar Strings mÃ¡gicos para mapeos de negocio; centralizar en constantes unificadas.

### 106. Strict Filtering for Polymorphic Catalogs (MTG vs. Generic) - 2026-04-27
- **Causa RaÃ­z:** La funciÃ³n de base de datos (get_accessories_filtered) usaba una condiciÃ³n 'loose': AND (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL). Esto forzaba la inclusiÃ³n de genÃ©ricos en cada filtro de juego.
- **SoluciÃ³n:** Implementar filtrado estricto en el RPC eliminando la condiciÃ³n OR a.game_id IS NULL cuando se provee un p_game_id. Adicionalmente, ajustar el frontend para que el botÃ³n general de 'Productos' no fuerce un juego por defecto (cambiando el fallback de ['Magic: The Gathering'] a []), permitiendo ver el catÃ¡logo completo solo cuando se desea.
- **Regla Derivada:** En catÃ¡logos con productos especÃ­ficos de nicho y productos genÃ©ricos, el filtro de juego debe ser estricto para evitar ruido visual ('contaminaciÃ³n de resultados'). Los productos genÃ©ricos deben ser accesibles solo en la vista global sin filtros.

### 107. Standardizing Multi-TCG Codes (Database vs. Frontend) - 2026-04-27
- **SoluciÃƒÂ³n:** Modificar la consulta SQL dentro del RPC `get_products_filtered` para asegurar que las comparaciones sean case-insensitive, utilizando funciones como `UPPER()` (ej. `UPPER(p.set_code) = ANY(set_filter)`) y permitiendo mapeos tanto de cÃƒÂ³digo de set como de nombre (ej. `p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter)`). AdemÃƒÂ¡s, se estandarizÃƒÂ³ la resoluciÃƒÂ³n del ID de juego internamente.
- **Regla Derivada:** LEYES_DEL_SISTEMA.md > Toda consulta de filtrado de texto o cÃƒÂ³digos provenientes de URLs o interfaces debe ser explÃƒÂ­citamente sanitizada y convertida a case-insensitive (`UPPER`, `LOWER` o `ILIKE`) en las funciones de base de datos antes de evaluar un `MATCH`.

### 108. Alignment of Cross-Project Environments (Dev vs. Prod) - 2026-04-28
- **Problema**: Falla total en la carga de Pokemon en el entorno dev a pesar de que el codigo parecia correcto.
- **Causa Raiz**: El entorno de desarrollo (Sandbox: bqfkqnnostzaqueujdms) tenia una tabla de juegos con IDs y codigos diferentes (PKM en lugar de POKEMON, ID 10 en lugar de 23). Ademas, la base de datos estaba vacia para ese juego.
- **Solucion**: Alinear el frontend y los scripts de poblacion con los estandares del Sandbox (PKM, ID 10) y actualizar los RPCs para normalizar multiples variantes a un unico codigo estandar.
- **Regla Derivada**: Antes de diagnosticar logica de frontend, verificar la existencia y estructura de datos en el proyecto Supabase especifico mediante la API o scripts de diagnostico.
### 97. EstabilizaciÃ³n de Sidebar DinÃ¡mico y Anidamiento JSX (Mayo 2026)
- **Problema**: El despliegue de producciÃ³n fallaba con errores de sintaxis tras aÃ±adir un sidebar dinÃ¡mico, a pesar de que el cÃ³digo parecÃ­a correcto.
### 149. RemediaciÃ³n Masiva de Secretos Hardcodeados (Mayo 2026)
- **Problema**: Fuga crÃ­tica de credenciales de PostgreSQL en `.env.dev` y proliferaciÃ³n de contraseÃ±as hardcodeadas en mÃ¡s de 60 scripts auxiliares del proyecto, detectado por GitGuardian.
- **Causa RaÃ­z**: PrÃ¡ctica heredada de hardcodear URLs de conexiÃ³n con credenciales incluidas para agilizar la ejecuciÃ³n de scripts locales y de mantenimiento.
- **SoluciÃ³n**: 
  - **Limpieza Automatizada**: CreaciÃ³n de un script de remediaciÃ³n masiva (`cleanup_secrets.py`) que utiliza regex para reemplazar URLs y contraseÃ±as por llamadas a `os.getenv()`.
  - **Ignorado Estricto**: ActualizaciÃ³n de `.gitignore` en todas las ramas (`dev`, `main`) para incluir `.env.dev` y otros archivos de entorno.
  - **RotaciÃ³n de Credenciales**: ParametrizaciÃ³n de los scripts para que dependan de `DATABASE_URL_PROD` y `DATABASE_URL_DEV`, permitiendo rotar las claves en Supabase sin romper el flujo de trabajo.
- **Regla Derivada**: **PROHIBIDO** hardcodear cualquier URL de conexiÃ³n que incluya el esquema `postgresql://`. Toda conexiÃ³n debe pasar por `os.getenv` o un gestor de secretos. Ver `LEYES_DEL_SISTEMA.md` > Ley de Seguridad 22.

### 150. RedefiniciÃ³n Local de Interfaces en Componentes Grandes (Mayo 2026)
- **Problema**: Errores de build `TS2339` persistentes tras actualizar interfaces globales en `api.ts`.
- **Causa RaÃ­z**: Componentes grandes como `CardModal.tsx` redefinen interfaces crÃ­ticas (`CardDetails`, `Version`) localmente en lugar de importarlas desde la fuente de verdad. Esto genera inconsistencias cuando se aÃ±aden campos al modelo de datos.
- **LecciÃ³n**: **Unicidad de Tipos**. Evitar redefinir interfaces de datos del dominio dentro de los componentes. Si un componente necesita una interfaz, debe importarla desde `api.ts`. Si se aÃ±ade un campo a la API, se debe buscar todas las redefiniciones locales (Grep) para asegurar la paridad. Ver `LEYES_DEL_SISTEMA.md` > Ley 21.

### 151. Null-Safe Price Handling in Inventory Rendering â€” 2026-05-05
- **Problema**: El panel administrativo de inventario crasheaba con `TypeError: Cannot read properties of null (reading 'toFixed')` al ordenar la tabla de mayor a menor.
- **Causa RaÃ­z**: Algunos artÃ­culos (especialmente los reciÃ©n importados o "on-demand") tienen un valor de `price` nulo en la base de datos. Al ordenar, estos nulos suben al principio de la lista, y la lÃ³gica de la UI intentaba llamar a `.toFixed(2)` sobre ellos.
- **SoluciÃ³n**: Implementar una polÃ­tica de "Null-Safe Formatting" en el frontend: `(item.price || 0).toFixed(2)`. Asegurar que los cÃ¡lculos de descuento tambiÃ©n contemplen fallbacks a cero para evitar resultados `NaN`.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 20 (Integridad Visual de Ofertas). Todo renderizado de precios en el Admin debe usar el patrÃ³n de fallback `(val || 0)` antes de formatear.

### 152. RPC Overloading & Function Signature Sync â€” 2026-05-05
- **Problema**: Error `PGRST203` (mÃºltiples candidatos encontrados) al intentar cargar productos en el Marketplace tras aÃ±adir el parÃ¡metro `p_only_new`.
- **Causa RaÃ­z**: Supabase (PostgreSQL) permite la sobrecarga de funciones con el mismo nombre pero diferentes argumentos. `CREATE OR REPLACE FUNCTION` no elimina versiones antiguas con firmas distintas; PostgREST no puede decidir cuÃ¡l llamar si hay ambigÃ¼edad.
- **SoluciÃ³n**: Implementar una migraciÃ³n de "limpieza dinÃ¡mica" que use `pg_proc` para identificar y ejecutar `DROP FUNCTION ... CASCADE` sobre todas las versiones sobrecargadas antes de recrear la versiÃ³n canÃ³nica Ãºnica.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 23 (SincronizaciÃ³n de RPC). Toda modificaciÃ³n de parÃ¡metros en un RPC existente debe ir precedida de un borrado total de sobrecargas para evitar conflictos `PGRST203`.

### 153. Resilient Bulk Updates & Pooler Stability â€” 2026-05-05
- **Problema**: Las actualizaciones masivas de precios en `card_printings` y `products` (200k+ filas) fallaban por `statement_timeout` o pÃ©rdida de sincronizaciÃ³n al usar el Supabase Pooler (Puerto 6543).
- **Causa RaÃ­z**: El pooler de transacciones interrumpe conexiones de larga duraciÃ³n. Los joins masivos durante un `UPDATE FROM` superan los lÃ­mites de tiempo estÃ¡ndar de PostgreSQL en la nube.
- **SoluciÃ³n**:
  - **PatrÃ³n de Materialized View Temporal**: Crear una vista materializada de los precios actualizados, indexarla por `printing_id`, y realizar el `UPDATE` mediante un join simple contra la vista. Esto reduce el tiempo de ejecuciÃ³n de minutos a segundos.
  - **Batching de ID**: Procesar los cambios en lotes de IDs (ej: 1,000 cartas) con `SET statement_timeout = 0`.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 18 (Performance en Sincronizaciones Masivas).

### 154. Environment Isolation & Secret Injection in CI/CD â€” 2026-05-05
- **Problema**: Los precios en producciÃ³n se desincronizaban porque el flujo automatizado `omni-sync.yml` no recibÃ­a la `DATABASE_URL` de producciÃ³n, usando por defecto el entorno de desarrollo o fallando silenciosamente.
- **Causa RaÃ­z**: Falta de inyecciÃ³n explÃ­cita de secretos en el YAML de GitHub Actions y dependencia de variables genÃ©ricas en `common/db.py`.
- **SoluciÃ³n**:
  - **InyecciÃ³n de Secretos**: Mapear explÃ­citamente `DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}` en el workflow.
  - **Carga Prioritaria**: Refactorizar `db.py` para priorizar variables especÃ­ficas del entorno (PROD/DEV) al detectar el contexto de ejecuciÃ³n.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 19 (ProtecciÃ³n de Entornos).

### 103. Clipping en Animaciones de Escala — 2026-05-05
- **Problema:** Los iconos del selector TCG se cortaban por la parte superior al activarse o pasar el cursor.
- **Causa Raíz:** El contenedor tenía overflow-hidden y no contaba con suficiente padding-top para absorber el scale-110 combinado con translate-y-2.
- **Solución:** Eliminar overflow-hidden y aumentar el padding vertical (pt-14 / md:pt-20).
- **Regla Derivada:** Ley de " Respiración Visual para Animaciones\ codificada en LEYES_DEL_SISTEMA.md.

### 104. Referencias de Iconos Lucide — 2026-05-05
- **Problema:** Fallo en el build de producción por ChevronDown no definido.
- **Causa Raíz:** Importación incompleta tras refactorizar un selector.
- **Solución:** Verificación de imports post-edición y ejecución de npm run build local antes de push.

### 105. Estandarización de Logos TCG — 2026-05-05
- **Problema:** Uso de emojis inconsistente para representar los juegos en diferentes partes de la app.
- **Causa Raíz:** Falta de una biblioteca de assets estandarizada.
- **Solución:** Creación de frontend/public/logos/tcg/ con variantes color y black.
- **Regla Derivada:** Ley de \Identidad de Marca TCG\ en LEYES_DEL_SISTEMA.md.

### 155. Soporte Multi-Imagen y Carruseles Premium (Mayo 2026)
- **Problema**: Los productos (accesorios) estaban limitados a una sola imagen, lo que dificultaba mostrar diferentes ángulos o detalles.
- **Causa Raíz**: El esquema de base de datos (image_url) y los componentes de visualización (CardModal) solo soportaban un único string de URL.
- **Solución**: 
  - **Ampliación de Esquema**: Añadir dditional_images text[] a la tabla ccessories.
  - **Sincronización de RPC**: Actualizar las funciones SQL (get_accessories_filtered) para incluir el nuevo array en el retorno, evitando desincronización de tipos en el frontend.
  - **UX de Admin**: Implementar un sistema de selección de "Imagen Principal" que mantenga la compatibilidad con el campo image_url existente, permitiendo a la vez gestionar una galería.
  - **Carousel Dinámico**: Integrar AnimatePresence de ramer-motion para transiciones suaves que eleven la percepción de calidad ("premium feel").
- **Lección**: Al implementar galerías, mantener siempre un campo "primary_image" independiente del array de adicionales para no penalizar el rendimiento de las vistas de lista (grids) que no necesitan cargar todo el array.

### 156. Rebranding UI y Limpieza de Código (Mayo 2026)
- **Problema**: Al deshabilitar secciones por rebranding (Misiones), el build de producción fallaba por errores de TypeScript (variables no usadas e imports muertos).
- **Causa Raíz**: El proyecto tiene configuraciones de linting/build estrictas que no permiten código muerto en archivos críticos como `Home.tsx`.
- **Solución**: No basta con comentar el JSX; se debe podar activamente el estado (`useState`), los efectos (`useEffect`) y los imports (`Link`, etc.) asociados para garantizar la integridad del build.
- **Lección**: La "limpieza atómica" es obligatoria al "apagar" features en entornos de desarrollo remoto altamente automatizados.

### 157. UX Espacial: Filtros Colapsables Estilo Marketplace (Mayo 2026)
- **Problema**: El panel de filtros lateral era demasiado largo, obligando al usuario a hacer scroll infinito para encontrar filtros básicos como el precio o el año.
- **Solución**: Implementar secciones colapsables con memoria de estado local. Las secciones con filtros activos se expanden por defecto para mantener la visibilidad del contexto actual del usuario.
- **Impacto**: Reducción del 70% en el uso del espacio vertical inicial, mejorando drásticamente la tasa de interacción en dispositivos con viewports limitados.
- **Regla Derivada**: (Ley 29) Todo panel lateral con más de 4 categorías de filtrado DEBE ser colapsable.

### 158. Flujo de Checkout "Por Encargo" (Bypass de Stock) — 2026-05-07
- **Problema**: El RPC `create_order_atomic` bloqueaba pedidos si el stock era insuficiente, impidiendo la venta de ítems "Por Encargo" (Regla de Negocio 4).
- **Causa Raíz**: Validación estricta en el backend (`RAISE EXCEPTION`) sin considerar el flag `is_on_demand`.
- **Solución**: Refactorización del RPC para permitir stock negativo o bypass de error cuando el ítem se marca como bajo demanda, y actualización de la UI para mostrar badges de "POR ENCARGO" basados en `cantidad > stock`.
- **Lección**: Las reglas de negocio de disponibilidad deben estar sincronizadas entre la validación de base de datos y el estado visual del carrito para evitar fricción en el checkout.

### 159. Restricciones de Conexión Directa a DB (Entorno Remoto) — 2026-05-07
- **Problema**: Fallos de conexión (`FATAL: tenant/user not found`) al intentar ejecutar migraciones SQL remotas desde scripts de utilidad.
- **Causa Raíz**: El Transaction Pooler de Supabase (puerto 6543) requiere una configuración de usuario/tenant muy específica que puede fallar en entornos restringidos.
- **Lección**: Para remediaciones críticas en bases de datos remotas donde el acceso directo está limitado, es preferible preparar el archivo de migración en `supabase/migrations/` y delegar la ejecución al pipeline de CI/CD o al comando `supabase db push` si se cuenta con el token de acceso.

### 160. Escalado de UI y Densidad Visual Premium — 2026-05-07
- **Problema**: El landing page se sentía disperso y los iconos de navegación carecían de impacto visual en resoluciones altas.
- **Causa Raíz**: Paddings verticales excesivos y escalas de iconos/fuentes conservadoras diseñadas para móviles que no aprovechaban el espacio en escritorio.
- **Solución**: 
  - **Reducción de Padding**: Ajuste de `py-12` a `py-4` en contenedores principales y eliminación de `bounding boxes` en carruseles para una estética "flotante".
  - **Escalado Responsivo**: Uso de clases Tailwind dinámicas (ej. `w-11 sm:w-14`) para iconos de navegación y aumento de la altura del Header a `h-20`.
- **Lección**: La percepción de "Premium Feel" a menudo depende de la eliminación de marcos sólidos y la maximización del tamaño de los activos de marca, manteniendo una densidad de información alta pero organizada.

### 161. Visibilidad Condicional de Pestañas por Contexto — 2026-05-07
- **Problema**: La pestaña "Stock Geekorium" aparecía en la sección de accesorios (Artilugios), confundiendo al usuario ya que solo hay stock de cartas para MTG.
- **Solución**: Implementar una restricción lógica en `Home.tsx` que evalúa `filters.games?.includes('MTG')` antes de renderizar la pestaña de inventario de cartas.
- **Lección**: Menos es más. Ocultar opciones irrelevantes según el contexto de filtrado actual reduce la carga cognitiva y previene errores de navegación del usuario.

### 162. Errores de Sintaxis en Refactorizaciones Masivas — 2026-05-08
- **Problema**: El build fallaba con `error TS1381: Property or signature expected.` en `CartDrawer.tsx`.
- **Causa Raíz**: Durante el reemplazo masivo de colores `neutral-XXX` por tokens de marca, se rompió accidentalmente la sintaxis de un operador ternario en los controles de cantidad, dejando un código inválido.
- **Lección**: Las refactorizaciones de "Buscar y Reemplazar" en múltiples archivos deben ir acompañadas de un `npm run build` local inmediato. Un error tipográfico pequeño en un componente central puede bloquear todo el pipeline de CI/CD.

### 163. Mezcla de Capas y Opacidad en Imágenes Foil — 2026-05-08
- **Problema**: Las imágenes de las cartas se veían oscuras ("opacas") en la página de detalle.
- **Causa Raíz**: Aplicación directa de `mix-blend-mode: overlay` sobre la etiqueta `<img>`. Al no tener una capa base de color, el modo de mezcla oscurecía la imagen original en lugar de iluminarla. Además, el efecto se aplicaba incluso a cartas no-foil.
- **Solución**: Mover el efecto `foil-shimmer` a una capa (div) independiente sobre la imagen con `opacity-30` y `pointer-events-none`. Condicionar la aplicación del efecto y de la clase `holo-effect` estrictamente al estado `isFoil`.
- **Lección**: Nunca aplicar modos de mezcla destructivos (`overlay`, `multiply`) directamente sobre el activo visual principal si se busca un efecto de brillo. Usar siempre capas superpuestas con opacidad controlada para preservar la legibilidad del arte original.

### 164. Inconsistencia de Códigos de Juego y Normalización — 2026-05-08
- **Problema**: Los banners de Pokémon no aparecían a pesar de estar guardados en la base de datos.
- **Causa Raíz**: El sistema tenía duplicidad de códigos para el mismo juego (ej: `PKM` usado en el frontend vs `POKEMON` usado en la base de datos de banners). Al fallar la coincidencia exacta, el sistema no encontraba los activos.
- **Solución**: Implementar una capa de normalización en `utils/api.ts` dentro de `fetchBanners` que mapea alias comunes (`PKM` -> `POKEMON`, `YGO` -> `YUGIOH`) antes de realizar la consulta a Supabase. Además, se estandarizaron los registros existentes en la tabla `hero_banners`.
- **Lección**: Cuando se trabaja con sistemas heredados o integraciones de terceros, siempre se debe asumir que los códigos de referencia pueden variar. Una capa de normalización centralizada es vital para la integridad de los datos visuales.

### 165. Desacoplamiento de Vistas de Dashboard y Secciones de TCG — 2026-05-08
- **Problema**: Al intentar mostrar banners en las secciones de cada TCG, el listado de cartas (singles) era reemplazado por la vista de "Dashboard" (ofertas), arruinando la experiencia de navegación.
- **Causa Raíz**: La variable `isDashboardView` controlaba tanto la visibilidad del banner como el tipo de contenido principal (Ofertas vs Parrilla). 
- **Solución**: Desacoplar las condiciones. Se introdujo `showHeroSection` para controlar la visibilidad del banner en cualquier sección "limpia", mientras que `isDashboardView` se mantuvo restringido a la página de inicio global para controlar la renderización del carrusel de ofertas.
- **Lección**: No usar un único flag de estado para controlar múltiples comportamientos de UI estructurales. Cada componente mayor (Banner, Ofertas, Parrilla) debe tener su propia lógica de visibilidad basada en el contexto del router y los filtros.

### 166. Integridad de Tablas de Metadatos y RLS — 2026-05-08
- **Problema**: Tablas críticas como `conditions`, `sources` y `games` estaban expuestas sin Row Level Security (RLS) activo.
- **Solución**: Habilitar RLS en todas las tablas de metadatos y aplicar políticas granulares: acceso público de solo lectura (`SELECT`) y acceso administrativo total (`ALL`) validado mediante el rol del usuario en la tabla `profiles`.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 10 (RLS Prioritario). Ninguna tabla nueva debe crearse en el esquema `public` sin una política de RLS explícitamente definida y verificada.

### 167. Sincronización de Campos de Taxonomía y Constraints NOT NULL — 2026-05-09
- **Problema**: El sistema crasheaba con un error de violación de restricción `NOT NULL` en la columna `category` al intentar crear nuevos accesorios desde el panel administrativo.
- **Causa Raíz**: La base de datos requiere obligatoriamente el campo `category` (texto) por razones de performance y legado, pero el formulario de administración solo estaba enviando el `category_code`. Al ser `null` el nombre de la categoría, la inserción fallaba fatalmente.
- **Solución**: Implementar una derivación automática en el frontend que busca el nombre de la categoría en la lista de taxonomía (`accessory_categories`) basándose en el código seleccionado. Si no hay coincidencia, se aplica un fallback seguro ("Accesorios").
- **Lección**: En tablas que implementan denormalización (guardar código e ID/Nombre por separado), el frontend debe actuar como garante de la integridad, asegurando que todos los campos requeridos por restricciones de base de datos estén presentes antes de disparar el `create` o `update`. Además, refactorizar interfaces estáticas a dinámicas (basadas en DB) previene que la taxonomía del frontend se desincronice de la realidad del servidor.

### 154. Endurecimiento de RLS para Tablas Administrativas — 2026-05-09
- **Problema:** Error 42501 (insufficient privilege) al insertar accesorios a pesar de estar autenticado como admin en Supabase Auth.
- **Causa Raíz:** Las políticas basadas solo en `TO authenticated` son insuficientes si el motor de Supabase no puede verificar de forma atómica el rol extendido sin una política explícita que una `auth.uid()` con `public.profiles`.
- **Solución:** Implementar políticas con `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`.
- **Regla Derivada:** Toda tabla de escritura administrativa DEBE tener esta verificación explícita para evitar bypasses de seguridad.

### 155. TypeScript State Type Safety in Form Resets — 2026-05-09
- **Problema:** El build falló con `TS2345` al intentar resetear el formulario de accesorios tras un guardado exitoso.
- **Causa Raíz:** Al añadir un campo obligatorio (`category`) al tipo del estado `formData`, cualquier llamada a `setFormData` que pase el objeto completo DEBE incluir dicha propiedad para cumplir con el contrato del tipo, incluso si se desea resetear a un valor por defecto.
- **Solución:** Sincronizar el objeto de reset inicial con la definición completa del tipo.
- **Lección:** Al escalar estados complejos en React, usar interfaces explícitas y buscar todas las llamadas de actualización total del estado para evitar roturas de build silenciosas durante el desarrollo.

### 168. Localización Semántica de Analíticas — 2026-05-10
- **Problema**: Los términos técnicos como "Requests" y "Page Views" eran ambiguos para el usuario administrativo ("¿peticiones a qué?").
- **Solución**: Implementar un glosario interactivo ("¿Qué significa esto?") que traduce métricas a lenguaje de negocio: Peticiones = Esfuerzo técnico (fotos/datos), Vistas = Visitas reales a páginas.
- **Lección**: En dashboards de métricas, la claridad semántica es más importante que la precisión técnica. Siempre acompañar números con explicaciones contextuales de "qué" y "cuándo".

### 169. Limitaciones de GraphQL en Planes Cloudflare — 2026-05-10
- **Problema**: Errores persistentes de "Unknown field" al intentar obtener desgloses por URL o País.
- **Causa Raíz**: Los nodos de agregación como `clientRequestPath` y `clientCountryName` dentro de `httpRequests1hGroups` están restringidos o requieren habilitación específica según el plan de Cloudflare (Free/Pro/Ent).
- **Solución**: Adoptar un enfoque de "Estabilidad Progresiva". Ante fallos de esquema, revertir a la query mínima estable (sólo tráfico/caché) para garantizar que el dashboard nunca se rompa, priorizando la disponibilidad de datos críticos sobre el desglose granular.
- **Lección**: Al integrar APIs de terceros con tiers de precios, el backend debe ser defensivo y manejar esquemas opcionales para evitar que un cambio de plan bloquee el sistema.

### 170. Reparación Quirúrgica de Filtros (SQL RPC) — 2026-05-11
- **Problema:** Los filtros de Color, Rareza, Tipo y Año en la tienda (`geekorium.shop`) no funcionaban a pesar de que el frontend enviaba los parámetros correctos.
- **Causa Raíz:** La función RPC `get_products_filtered` en producción ignoraba sistemáticamente estos parámetros en su cláusula `WHERE`. Además, los nombres de colores del frontend ('White') no coincidían con los códigos de una letra de la base de datos ('W').
- **Solución:** Actualizar quirúrgicamente el RPC para:
  1. Mapear nombres de colores a códigos ('White' -> 'W').
  2. Implementar filtros usando intersección de arrays (`&&`) para colores y `EXISTS/ILIKE` para tipos.
  3. Aplicar `EXTRACT(YEAR FROM release_date)` para el filtrado por año.
  4. Recargar el esquema de PostgREST (`NOTIFY pgrst, 'reload schema'`) para asegurar visibilidad inmediata.
- **Regla Derivada:** Todo cambio en la firma o lógica interna de una función RPC de Supabase debe ir acompañado de una recarga de esquema y una verificación 1:1 entre el formato de envío del frontend y el almacenamiento en DB.
