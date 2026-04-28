# ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Â  TCG Hub - Developer Knowledge Base (Lessons Learned)

Este documento registra los desafÃƒÆ’Ã‚Â­os tÃƒÆ’Ã‚Â©cnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.

## ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â  Entorno y Dependencias

### 1. Conflictos de VersiÃƒÆ’Ã‚Â³n en CI/CD (GitHub Actions)

- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.
- **Causa**: Versiones muy recientes de librerÃƒÆ’Ã‚Â­as a veces tardan horas/dÃƒÆ’Ã‚Â­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **Causa**: Versiones muy recientes de librerÃ­as a veces tardan horas/dÃ­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **LecciÃƒÂ³n**:
  - Sincronizar la versiÃ³n de Python del runner (3.12) con la local.
  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.

### 143. SincronizaciÃ³n SKU-Aware
- **Problema**: Los scripts de sincronizaciÃ³n con CardKingdom tenÃ­an errores de mapeo en sets modernos.
- **Causa**: El uso de campos descriptivos ambiguos en lugar de identificadores Ãºnicos.
- **LecciÃ³n**: Los scripts de sincronizaciÃ³n con CardKingdom deben priorizar el SKU (`[F]SET-NNNN`) sobre el campo `variation` para sets modernos y tokens para garantizar un mapeo 100% exacto de acabados y coleccionistas.

### 144. ResoluciÃ³n DinÃ¡mica de Juegos
- **Problema**: Errores en el frontend al intentar cargar datos de juegos debido a IDs cambiantes entre entornos.
- **Causa**: Hardcoding de IDs de bases de datos seriales.
- **LecciÃ³n**: Evitar hardcoding de IDs de bases de datos seriales en el frontend. En entornos de desarrollo, Magic: The Gathering puede ser ID 1, mientras que en producciÃ³n es ID 22. Se implementÃ³ una resoluciÃ³n dinÃ¡mica en `api.ts` basada en el nombre del juego o su cÃ³digo (`MTG`).

## ðŸ—„ Base de Datos y Supabase

### 2. "Precios Invisibles" (AgregaciÃ³n Fallida)

- **Problema**: El script de sincronizaciÃ³n insertaba precios pero no se reflejaban en la UI.
- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requerÃ­a un `condition_id` vÃ¡lido. Los inserts manuales omitÃ­an estos campos, dejando los precios en un limbo.
- **LecciÃ³n**: Todo script de ingesta de precios debe incluir:
  - `timestamp`: ISO string (UTC).
  - `condition_id`: ID numÃƒÆ’Ã‚Â©rico correspondiente (ej: 16 para Near Mint).
  - `is_foil`: Booleano explÃƒÆ’Ã‚Â­cito.

### 3. Timeouts en Filtros (Performance)

- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.
- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin ÃƒÆ’Ã‚Â­ndices.
- **LecciÃƒÆ’Ã‚Â³n**:
  - **ÃƒÆ’Ã¯Â¿Â½ndices CrÃƒÆ’Ã‚Â­ticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.
  - **Estrategia de Consulta**: Para tablas masivas, es mÃƒÆ’Ã‚Â¡s rÃƒÆ’Ã‚Â¡pido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.

## ÃƒÂ°Ã…Â¸Ã…â€™Ã¯Â¿Â½ Frontend y API

### 4. Coherencia en el Fallback de Supabase

- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".
- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estÃƒÆ’Ã‚Â¡ndar de Postgres) que no existe en esta estructura especÃƒÆ’Ã‚Â­fica.
- **LecciÃƒÆ’Ã‚Â³n**: Mantener mapeos de nombres de columnas idÃƒÆ’Ã‚Â©nticos entre la respuesta del API local y el cÃƒÆ’Ã‚Â³digo de fallback de Supabase.
- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.
- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.
- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.

### 5. Counting Strategy & Timeouts

- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).
- **LecciÃƒÆ’Ã‚Â³n**:
  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinÃƒÆ’Ã‚Â¡micos donde el planificador de Postgres ya tiene estadÃƒÆ’Ã‚Â­sticas.
  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginaciÃƒÆ’Ã‚Â³n con "Infinite Scroll" o botones de "Siguiente".

## ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€šÂ¬ Despliegue y CI/CD

### 6. TypeScript Strict Build (TS6133)

- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.
- **Causa**: ConfiguraciÃƒÆ’Ã‚Â³n de `tsconfig.json` con `noUnusedParameters: true`.
- **LecciÃƒÆ’Ã‚Â³n**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilaciÃƒÆ’Ã‚Â³n exitosa.

### 7. Variables de Entorno en GitHub Actions

- **Problema**: El frontend funcionaba localmente pero en producciÃƒÆ’Ã‚Â³n los dropdowns (Sets) estaban vacÃƒÆ’Ã‚Â­os y las bÃƒÆ’Ã‚Âºsquedas fallaban.
- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvÃƒÆ’Ã‚Â­a 404).
- **LecciÃƒÆ’Ã‚Â³n**:
  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.
  - **Resiliencia de Fallback**: Todo endpoint crÃƒÆ’Ã‚Â­tico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no estÃƒÆ’Ã‚Â¡ definido.

---

## ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Â  Frontend y UX

### 8. UX de Autocompletado vs. BÃƒÆ’Ã‚Âºsqueda Activa (Feb 2026)

- **Problema**: Al implementar el autocompletado, el `debounce` automÃƒÆ’Ã‚Â¡tico disparaba la bÃƒÆ’Ã‚Âºsqueda principal cada vez que el usuario escribÃƒÆ’Ã‚Â­a, recargando resultados innecesariamente.
- **LecciÃƒÆ’Ã‚Â³n**: **Desacoplar siempre el input de bÃƒÆ’Ã‚Âºsqueda del trigger de bÃƒÆ’Ã‚Âºsqueda.**
  - El input solo actualiza el estado local para sugerencias.
  - La bÃƒÆ’Ã‚Âºsqueda principal (`activeSearchQuery`) solo se actualiza mediante acciÃƒÆ’Ã‚Â³n explÃƒÆ’Ã‚Â­cita (`Enter` o click en sugerencia).
- **SoluciÃƒÆ’Ã‚Â³n**: Se refactorizÃƒÆ’Ã‚Â³ el frontend para separar `query` (input) de `activeSearchQuery` (fetch).

### 9. Timeout en Queries con DISTINCT ON (Feb 2026)

- **Problema**: `DISTINCT ON (card_name)` + `ORDER BY` con JOIN (`s.release_date`) causaba timeout (Error 500) sin ÃƒÆ’Ã‚Â­ndices especÃƒÆ’Ã‚Â­ficos para esa combinaciÃƒÆ’Ã‚Â³n.
- **LecciÃƒÆ’Ã‚Â³n**: **ÃƒÆ’Ã¯Â¿Â½ndices obligatorios para Sort/Filter.**
  - Si usas `DISTINCT ON (columna)`, DEBE haber un ÃƒÆ’Ã‚Â­ndice en `(columna)`.
  - Si filtras con `ILIKE`, DEBE haber ÃƒÆ’Ã‚Â­ndice `GIN` con `pg_trgm`.
  - Verificar siempre con `EXPLAIN ANALYZE` en datos con volumetrÃƒÆ’Ã‚Â­a real.

### 10. NO Usar Queries DinÃƒÆ’Ã‚Â¡micas para Vistas Principales de Tablas Grandes (Feb 2026)

- **Problema**: A pesar de ÃƒÆ’Ã‚Â­ndices correctos, `DISTINCT ON` sobre 80,000+ filas con Joins y RLS activo sigue siendo demasiado pesado.
- **LecciÃƒÆ’Ã‚Â³n Definitiva: USAR VISTA MATERIALIZADA.**
  - Si deduplicar o agregar de tabla principal grande (>10k filas): pre-calcular en `MATERIALIZED VIEW`.
  - Usar `SECURITY DEFINER` en la funciÃƒÆ’Ã‚Â³n RPC para saltar overhead de RLS si la vista ya contiene datos pÃƒÆ’Ã‚Âºblicos filtrados.

### 11. CardModal ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Nunca Filtrar all_versions al Cambiar Printing (Feb 2026)

- **Problema**: Al cambiar el printing seleccionado, la lista de versiones desaparecÃƒÆ’Ã‚Â­a si la respuesta de la API para ese printing no incluÃƒÆ’Ã‚Â­a todas las versiones.
- **LecciÃƒÆ’Ã‚Â³n**: Preservar siempre el array `all_versions` en el estado del frontend al navegar entre printings. Nunca re-derivarlo de la respuesta parcial de un printing individual.

### 12. Soporte Foil Virtual ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Entidades Virtuales No En DB (Feb 2026)

- **Problema**: Intentar buscar registros de cartas foil como entidades separadas en la DB fallaba.
- **LecciÃƒÆ’Ã‚Â³n**: Las cartas foil son **entradas virtuales** generadas por la Edge Function `tcg-api` cuando `prices.usd_foil IS NOT NULL`. No existen como filas separadas en `card_printings`. Nunca hacer migrations que asuman lo contrario.

### 13. DFC (Double-Faced Cards) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Links y Flip de Imagen (Feb 2026)

- **Problema**: Los links de CardKingdom para DFCs fallaban porque incluÃƒÆ’Ã‚Â­an el nombre de ambas caras (`//`). Las imÃƒÆ’Ã‚Â¡genes DFC no flippeaban.
- **LecciÃƒÆ’Ã‚Â³n**:
  - **Links**: Usar solo `card_faces[0].name` (cara frontal) para bÃƒÆ’Ã‚Âºsquedas en CardKingdom.
  - **Flip**: Detectar DFC por `card_faces?.length > 1`. Implementar toggle de imagen client-side.
  - **Fallback Frontend**: Si `image_uris` es null, usar `card_faces[0].image_uris` como fallback.

### 14. Precios: Siempre Parsear como Number (Feb 2026)

- **Problema**: `toFixed()` crasheaba cuando el precio venÃƒÆ’Ã‚Â­a como string o null de la API.
- **LecciÃƒÆ’Ã‚Â³n**: Siempre convertir: `const price = Number(rawPrice)`. Verificar `isNaN(price)` antes de formatear. Mostrar `S/P` si null/undefined.

### 145. AlineaciÃ³n de ParÃ¡metros RPC y SincronizaciÃ³n de URL (Abril 2026)
- **Problema**: El buscador y los filtros de la tienda dejaron de funcionar tras una refactorizaciÃ³n de nombres de variables en el frontend.
- **Causa RaÃz**: 
  1. Desajuste entre los nombres de parÃ¡metros esperados por la base de datos de producciÃ³n (`game_filter`, `rarity_filter`) y los enviados por el frontend (`game_code`, `rarities`).
  2. El componente `Home.tsx` no sincronizaba el estado de bÃºsqueda (`q`) desde la URL cuando el usuario navegaba o usaba sugerencias de la cabecera.
  3. Al aplicar filtros, la URL se sobrescribÃa por completo en lugar de mezclarse con los parÃ¡metros existentes (borrando el tÃ©rmino de bÃºsqueda).
- **LecciÃ³n**: 
  - **VerificaciÃ³n de Firma**: Siempre verificar la firma exacta de la funciÃ³n en la base de datos de producciÃ³n antes de cambiar nombres de parÃ¡metros en `api.ts`.
  - **URL como Source of Truth**: El estado del frontend debe seguir a la URL (One-Way Data Flow). Implementar efectos robustos que lean de `searchParams` y actualicen el estado interno.
  - **Mezcla de ParÃ¡metros**: Usar `new URLSearchParams(searchParams)` para conservar el estado existente al aplicar nuevos filtros.
  - **Soporte de UX**: Asegurar que la tecla `Enter` en formularios de bÃºsqueda "confirme" la acciÃ³n y actualice la URL para disparar el fetch.

---

## ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Â¨ DiseÃƒÆ’Ã‚Â±o y Branding

### 15. Restricciones de ItÃƒÆ’Ã‚Â¡licas por SecciÃƒÆ’Ã‚Â³n ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Spec Geekorium (Feb 2026)

- **Problema**: Clase `italic` aparecÃƒÆ’Ã‚Â­a en headings de secciones donde la spec lo prohÃƒÆ’Ã‚Â­be explÃƒÆ’Ã‚Â­citamente.
- **Causa RaÃƒÆ’Ã‚Â­z**: El diseÃƒÆ’Ã‚Â±ador estableciÃƒÆ’Ã‚Â³ que `font-web-titles` (Daito/Roboto Slab) no debe usarse en itÃƒÆ’Ã‚Â¡lica en secciones de contenido informativo (Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã‚Â³mo comprar?, Ayuda). Solo se permite italic en tÃƒÆ’Ã‚Â­tulos de marca/admin.
- **SoluciÃƒÆ’Ã‚Â³n**: Remover `italic` de `Home.tsx` L581 (Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã‚Â³mo comprar?) y `HelpPage.tsx` L28 (Ãƒâ€šÃ‚Â¿AÃƒÆ’Ã‚Âºn tienes dudas?).
- **Regla Derivada**: Al implementar headings con `font-web-titles`, verificar si la secciÃƒÆ’Ã‚Â³n estÃƒÆ’Ã‚Â¡ en la lista de restricciones de la spec. La lista actual: secciÃƒÆ’Ã‚Â³n `Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã‚Â³mo comprar?` y secciÃƒÆ’Ã‚Â³n de Ayuda.

### 16. Tokens de Color de Marca: Incluir Todas las Variantes del Spec (Feb 2026)

- **Problema**: El token `#523176` (variante tÃƒÆ’Ã‚Â©cnica morada) estaba en la spec pero no definido en `index.css` como CSS variable.
- **Causa RaÃƒÆ’Ã‚Â­z**: Al implementar la paleta inicial se omitiÃƒÆ’Ã‚Â³ esta variante por considerarla secundaria.
- **SoluciÃƒÆ’Ã‚Â³n**: Agregar `--color-geeko-violet-deep: #523176` al bloque `@theme` de `index.css`.
- **Regla Derivada**: Al adoptar un nuevo spec de diseÃƒÆ’Ã‚Â±o, mapear **todas** las variantes de color del documento al sistema de tokens, incluso si no se usan inmediatamente. Pendiente usarlo en: bordes de cartas Lorcana, sellos de cera, accents de sets especÃƒÆ’Ã‚Â­ficos.

---

## ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Âª Testing

### 17. Patch Target Correcto para Servicios con `supabase_admin` (Feb 2026)

- **Problema**: `test_collection_import.py` fallaba con `AttributeError: module does not have the attribute 'supabase'`.
- **Causa RaÃƒÆ’Ã‚Â­z**: El service `collection_service.py` fue refactorizado para usar `supabase_admin = get_supabase_admin()` en lugar de `supabase`. Los tests seguÃƒÆ’Ã‚Â­an mockeando el atributo viejo.
- **SoluciÃƒÆ’Ã‚Â³n**: Cambiar el patch target en los fixtures de `'api.services.collection_service.supabase'` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ `'api.services.collection_service.supabase_admin'`.
- **Regla Derivada**: Cuando un servicio renombra su variable de cliente de Supabase, buscar y actualizar TODOS los tests que la mockean. Usar `grep_search` con `patch(` + el mÃƒÆ’Ã‚Â³dulo para detectarlos.

### 18. Lazy Imports en Servicios ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ CÃƒÆ’Ã‚Â³mo Parchearlos (Feb 2026)

- **Problema**: `patch('src.api.services.collection_service.MatcherService')` fallaba porque `MatcherService` se importa dentro del cuerpo de la funciÃƒÆ’Ã‚Â³n (`from .matcher_service import MatcherService`), no al nivel del mÃƒÆ’Ã‚Â³dulo.
- **Causa RaÃƒÆ’Ã‚Â­z**: Los lazy imports (dentro de la funciÃƒÆ’Ã‚Â³n) no crean atributos en el namespace del mÃƒÆ’Ã‚Â³dulo que los contiene, por lo que no son patcheables desde ahÃƒÆ’Ã‚Â­.
- **SoluciÃƒÆ’Ã‚Â³n**: Parchear en el mÃƒÆ’Ã‚Â³dulo **fuente**, no en el mÃƒÆ’Ã‚Â³dulo importador: `patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock)`.
- **Regla Derivada**: Si una clase/funciÃƒÆ’Ã‚Â³n se importa con `from .modulo import Clase` dentro de una funciÃƒÆ’Ã‚Â³n, siempre parchear en `modulo.Clase`, no en `servicio_importador.Clase`.

### 19. Mock Chain para `ValuationService` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Two-Step Query (Feb 2026)

- **Problema**: `test_valuation_calculation_logic` afirmaba `store_price == 100.0` pero obtenÃƒÆ’Ã‚Â­a `1.0`.
- **Causa RaÃƒÆ’Ã‚Â­z**: El test pasaba `{'source': 'geekorium', 'price_usd': 100.0}` pero el servicio NO usa el campo `source` ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ hace primero un query a la tabla `sources` para obtener un mapa `{source_id ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ source_code}`, luego itera `price_history` buscando `source_id` (entero).
- **SoluciÃƒÆ’Ã‚Â³n**: Reescribir el mock como un `table_side_effect` que retorna datos distintos por tabla: `sources` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ mapa de IDs, `price_history` ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ filas con `source_id` (int), no `source` (str).
- **Regla Derivada**: Antes de escribir mocks para servicios, leer su implementaciÃƒÆ’Ã‚Â³n para identificar el flujo exacto de queries. Los servicios con lookups de tablas de referencia (como `sources`, `conditions`) requieren mocks de mÃƒÆ’Ã‚Âºltiples tablas.

### 20. Reemplazo Exhaustivo de Colores Heredados al Refactorizar UI (Feb 2026)

- **Problema**: Tras remover la clase `italic` en `HelpPage.tsx` para ajustarse a una regla tipogrÃƒÆ’Ã‚Â¡fica nueva, se revelaron clases utilitarias de color heredadas (`bg-[#f4e4bc]`, `text-black`, `bg-[#25D366]`) que desentonaban con el nuevo spec.
- **Causa RaÃƒÆ’Ã‚Â­z**: RefactorizaciÃƒÆ’Ã‚Â³n local "quirÃƒÆ’Ã‚Âºrgica" (solo tocar `italic`) en componentes sin auditar si su paleta general sigue el nuevo "DiseÃƒÆ’Ã‚Â±o Fix".
- **SoluciÃƒÆ’Ã‚Â³n**: Reemplazo masivo de colores heredados en el componente modificado. Beige (`#f4e4bc`) a Primario (`#373266`), Negro (`text-black`) a Blanco (`#FFFFFF`), y Verde (`#25D366`) a Cyan (`geeko-cyan` / `#00AEB4`). AdemÃƒÆ’Ã‚Â¡s se debiÃƒÆ’Ã‚Â³ re-aÃƒÆ’Ã‚Â±adir `font-web-titles` porque el `<h3/>` carecÃƒÆ’Ã‚Â­a de familia tipogrÃƒÆ’Ã‚Â¡fica tras quitar la itÃƒÆ’Ã‚Â¡lica.
- **Regla Derivada**: Siempre que se modifique un componente heredado ("legacy") para ajustarlo a nuevas reglas de brand, auditar TODO el componente. Eliminar colores *hardcoded* obsoletos y aplicar los nuevos tokens de marca. Validar que no perder clases como `italic` descubra la falta de clases estructurales como familias de fuentes (`font-web-titles`).

### 21. Fallbacks Visuales en Vistas Combinadas de DB (Feb 2026)

- **Problema**: Las imÃƒÆ’Ã‚Â¡genes de las cartas no se mostraban en el Grid ("Imagen No Disponible"), a pesar de existir imÃƒÆ’Ã‚Â¡genes en la base de datos de Scryfall.
- **Causa RaÃƒÆ’Ã‚Â­z**: El endpoint RPC `get_products_filtered` retornaba directamente la columna `image_url` de la tabla `products`, la cual puede ser nula dependiendo del formato de importaciÃƒÆ’Ã‚Â³n, en lugar de considerar el fallback a la tabla unida `card_printings`.
- **SoluciÃƒÆ’Ã‚Â³n**: Refactorizar la proyecciÃƒÆ’Ã‚Â³n SQL para incluir `COALESCE(p.image_url, cp.image_url) as image_url`.
- **Regla Derivada**: Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.

### 22. Validaciones Locales Estrictas (Feb 2026)

- **Problema**: Formularios sin validaciÃƒÂ³n previa enviaban datos inconsistentes (ej. formato de telÃƒÂ©fono errÃƒÂ³neo) al equipo de soporte.
- **SoluciÃƒÂ³n / LecciÃƒÂ³n**: Validar clide-side formatos especÃƒÂ­ficos (ej. venezolanos 04), rechazar letras en cÃƒÂ©dula (
eplace(/\D/g, '')), y forzar longitud en campos de texto antes de habilitar el pago.
- **Regla Derivada**: Todo input vital para el pago/contacto fÃƒÂ­sico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.

### 23. BÃƒÆ’Ã‚Âºsqueda y ValidaciÃƒÆ’Ã‚Â³n de Stock en SQL (Feb 2026)

- **Problema**: El carrito permitÃƒÆ’Ã‚Â­a agregar mÃƒÆ’Ã‚Â¡s cartas de las que habÃƒÆ’Ã‚Â­a en stock si se hacÃƒÆ’Ã‚Â­an mÃƒÆ’Ã‚Âºltiples clicks o llamadas al RPC dd_to_cart. AdemÃƒÆ’Ã‚Â¡s, la bÃƒÆ’Ã‚Âºsqueda global a veces no priorizaba coincidencias exactas.
- **Causa RaÃƒÆ’Ã‚Â­z**: El control de stock no totalizaba las cantidades previas del mismo item en el carrito antes de comparar con el stock mÃƒÆ’Ã‚Â¡ximo.
- **SoluciÃƒÆ’Ã‚Â³n**: Refactorizar dd_to_cart sumando quantity + v_current_qty > v_stock y lanzando un error. Ajustar get_products_filtered con un ORDER BY que priorice strings idÃƒÆ’Ã‚Â©nticos (p.name ILIKE ).
- **Regla Derivada**: Todo control de inventario en el backend debe ser calculable (suma del estado actual + intento) y rechazar transacciones a nivel SQL, y las funciones de bÃƒÆ’Ã‚Âºsqueda deben devolver coincidencias exactas primero.

### 24. Resolviendo TipografÃƒÆ’Ã‚Â­as en UI EspecÃƒÆ’Ã‚Â­fica (Feb 2026)

- **Problema**: El diseÃƒÆ’Ã‚Â±o UI requerÃƒÆ’Ã‚Â­a mapeos hiperespecÃƒÆ’Ã‚Â­ficos de tipografÃƒÆ’Ã‚Â­as (Daito para tÃƒÆ’Ã‚Â­tulos, Bogue para precios, Rubik para cuerpo) en base a mockups donde no bastaba heredar la tipografÃƒÆ’Ã‚Â­a general.
- **Causa RaÃƒÆ’Ã‚Â­z**: Las clases CSS como ont-sans no sobreescribÃƒÆ’Ã‚Â­an correctamente la jerarquÃƒÆ’Ã‚Â­a necesaria si el componente padre tenÃƒÆ’Ã‚Â­a otra.
- **SoluciÃƒÆ’Ã‚Â³n**: Aplicar clases nominales directas en Tailwind (ont-web-titles, ont-titles, ont-sans) a los subnodos del texto en los componentes y remover tags italic que forzaban el fallback del font.
- **Regla Derivada**: La fidelidad 1:1 de PRD UI requiere aplicar clases tipogrÃƒÆ’Ã‚Â¡ficas explÃƒÆ’Ã‚Â­citas en el nivel mÃƒÆ’Ã‚Â¡s bajo (hojas) del nodo del DOM y evitar modificadores de estilo globales (como italic o bold general) que rompan el font-face de UI.

### [Guest Checkout & Inventory Pattern] ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-02-27

- **Problema:** Riesgo de doble venta en un e-commerce de productos ÃƒÆ’Ã‚Âºnicos (trading cards) cuando los pagos son asÃƒÆ’Ã‚Â­ncronos (Zelle/Pago MÃƒÆ’Ã‚Â³vil) y los usuarios no tienen cuenta.
- **Causa RaÃƒÆ’Ã‚Â­z:** Falta de un estado intermedio que bloquee el inventario temporalmente mientras el pago ocurre off-platform.
- **SoluciÃƒÆ’Ã‚Â³n:** Implementar un estado de orden `pending_payment` que reduce el `reserved_stock` inmediatamente mediante un RPC atÃƒÆ’Ã‚Â³mico de Supabase, acompaÃƒÆ’Ã‚Â±ado de un Job/RPC que cancela las ÃƒÆ’Ã‚Â³rdenes expiradas (superan 24 hrs sin validaciÃƒÆ’Ã‚Â³n) y devuelve el stock. Uso de URLs ÃƒÆ’Ã‚Âºnicas (`/order/:id`) para que invitados suban su comprobante.
- **Regla Derivada:** Todo cambio de estado de `orders` debe evaluarse en el RPC `update_order_status` para gestionar `reserved_stock` vs `stock` dinÃƒÆ’Ã‚Â¡micamente y de forma atÃƒÆ’Ã‚Â³mica.

### 2. ValidaciÃƒÂ³n y Reserva Diferida - 2026-03-01

- **Problema:** Exigir comprobantes upfront choca con la realidad del stock fÃƒÂ­sico desfasado.
- **Causa RaÃƒÂ­z:** El proceso asumÃƒÂ­a que el stock del e-commerce siempre era 100% exacto respecto a la tienda fÃƒÂ­sica.
- **SoluciÃƒÂ³n:** Romper el pago y la verificaciÃƒÂ³n en 2 pasos. Reservar el stock primero (pending_verification), y pagar despuÃƒÂ©s (awaiting_payment).
- **Regla Derivada:** Cualquier estado que cambie a cancelled/returned desde active debe liberar el stock inmediatamente para evitar desajustes remanentes.

### 3. Evitar Bloqueos de UI por Fugas de InteracciÃƒÆ’Ã‚Â³n - 2026-03-01

- **Problema:** Un modal (CardModal) que se cierra al agregar al carrito funcionaba bien en testing local pero dejaba la UI colgada (timeout por capa transparente superpuesta) en pruebas E2E en ProducciÃƒÆ’Ã‚Â³n.
- **Causa RaÃƒÆ’Ã‚Â­z:** El modal tenÃƒÆ’Ã‚Â­a lÃƒÆ’Ã‚Â³gica condicional que solo lo cerraba si se pasaba un prop onAddToCartSuccess. En flujos donde este prop faltaba, la promesa colgaba visualmente porque esperaba al callback para cerrarse.
- **SoluciÃƒÆ’Ã‚Â³n:** Consolidar el cierre del modal (onClose()) para que siempre ocurra de manera incondicional, independiente de callbacks extra.
- **Regla Derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales a nivel del componente que las renderiza, no deben depender de hooks inyectados opcionales.

### 10. TypeError: reduce is not a function en ProducciÃƒÆ’Ã‚Â³n ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-02

- **Problema:** La aplicaciÃƒÆ’Ã‚Â³n fallaba en producciÃƒÆ’Ã‚Â³n al navegar a /profile con un error Uncaught TypeError: s.reduce is not a function.
- **Causa RaÃƒÆ’Ã‚Â­z:** Respuestas de la API que devuelven objetos vacÃƒÆ’Ã‚Â­os o
ull en lugares donde se espera un arreglo (ej. cartItems, collection). React Context o servicios no estaban garantizando un valor fallback de arreglo estable.
- **SoluciÃƒÆ’Ã‚Â³n:** ImplementaciÃƒÆ’Ã‚Â³n masiva de protecciones Array.isArray(data) ? data : [] antes de cualquier llamada a .reduce(), .map() o .filter().
- **Regla Derivada:** **Defensive Data Handling**. Prohibido usar mÃƒÆ’Ã‚Â©todos de arreglo sobre datos de API sin validaciÃƒÆ’Ã‚Â³n previa con Array.isArray(). Codificado en AGENTS.md y PRD_MASTER.md.

### 64. Redundancia CrÃƒÂ­tica en Historial de Precios Ã¢â‚¬â€� 2026-03-02

- **Problema:** La base de datos alcanzÃƒÂ³ 1.42 GB (lÃƒÂ­mite plan 1.1 GB) debido a la tabla 'price_history'.
- **Causa RaÃƒÂ­z:** Scrapers guardaban el precio diario de 30,000+ cartas incluso si el precio no variaba, generando un 95% de redundancia.
- **SoluciÃƒÂ³n:** DeduplicaciÃƒÂ³n tÃƒÂ©cnica e implementaciÃƒÂ³n de lÃƒÂ³gica diferencial en 'sync_cardkingdom_api.py'.

### 65. IntegraciÃƒÂ³n de ManaBox y PriorizaciÃƒÂ³n de Scryfall ID (Marzo 2026)

- **Problema**: La importaciÃƒÂ³n por nombre/set puede fallar en cartas con nombres similares o mÃƒÂºltiples versiones (promos, showcase).
- **SoluciÃƒÂ³n**: Implementar una detecciÃƒÂ³n automÃƒÂ¡tica de encabezados en el frontend (ManaBox ID, Scryfall ID) y priorizar la bÃƒÂºsqueda por scryfall_id en el backend. Esto garantiza una precisiÃƒÂ³n del 100% y evita el mapeo manual.
- **NormalizaciÃƒÂ³n**: Las condiciones de ManaBox (e.g.
ear_mint, lightly_played) deben normalizarse en el backend a cÃƒÂ³digos internos (NM, LP) para mantener la integridad de la base de datos.
- **UX**: Una pre-visualizaciÃƒÂ³n que use los mismos ÃƒÂ­ndices de mapeo que la lÃƒÂ³gica de parseo evita confusiones visuales en el proceso de importaciÃƒÂ³n.

### 66. Soporte de FoliaciÃƒÂ³n (Finish) y AgregaciÃƒÂ³n en Lotes (Marzo 2026)

- **Problema**: Errores `ON CONFLICT` al intentar importar la misma carta en versiÃƒÂ³n Foil y Non-Foil en un mismo lote, y fallos de visualizaciÃƒÂ³n de precios/stock para versiones foil.
- **Causa RaÃƒÂ­z**: La restricciÃƒÂ³n de unicidad en la tabla `products` no incluÃƒÂ­a la columna `finish`. AdemÃƒÂ¡s, la lÃƒÂ³gica de importaciÃƒÂ³n no consolidaba duplicados dentro del mismo batch antes de enviarlos a la DB.
- **SoluciÃƒÂ³n**:
  - **DB**: Agregar columna `finish` y actualizar la restricciÃƒÂ³n ÃƒÂºnica a `(printing_id, condition, finish)`.
  - **Edge Function**: Implementar un diccionario de agregaciÃƒÂ³n en el `tcg-api` que sume cantidades de filas idÃƒÂ©nticas (mismo printing+condition+finish) antes del `upsert`.
  - **Vistas**: Actualizar `products_with_prices` para incluir la columna `finish` y asegurar que el frontend reciba este metadato.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/LEYES_DEL_SISTEMA.md) -> Regla de Negocio 3 (AgregaciÃƒÂ³n en Lotes).

### 67. Fuentes Locales Sin Archivo = 404 Silencioso en Build â€” 2026-03-03

- **Problema**: La app en produccion generaba `GET /fonts/Daito.woff2 404` en la consola del navegador.
- **Causa Raiz**: Declaraciones `@font-face` en `index.css` referenciaban archivos con `url('/fonts/...')` que nunca existieron en `frontend/public/fonts/`. El build de Vite compila sin errores aunque los archivos no existan.
- **Solucion**: Eliminar `@font-face` locales e importar `Cinzel` y `Cinzel Decorative` de Google Fonts como fallbacks premium.
- **Regla Derivada**: Toda fuente en `@font-face` con `url('/fonts/...')` DEBE tener su archivo fisico. Si no esta disponible, usar Google Fonts. Documentar el original como comentario en el CSS.

### 18. Toggle Variant UI y CardKingdom Pricing

- **Problema:** Los botones de variante Foil/Normal quedaban habilitados sin stock disponible (o no funcionales), y el precio 'Mercado Externo' (MKT) fusionaba foil y normal mostrando el mismo valor para ambas versiones.
- **Causa RaÃƒÂ­z:** La UI dependÃƒÂ­a del atributo disabled basado en la *ausencia* de datos, pero no comprobaba stock === 0. AdemÃƒÂ¡s, pi.ts usaba genericamente vg_market_price_usd para variantes sintÃƒÂ©ticas sin bifurcar adecuadamente entre prices.usd y prices.usd_foil.
- **SoluciÃƒÂ³n:** Implementar renderizado condicional ({condition && <button>}) u ocultamiento via JS para variantes inexistentes, aÃƒÂ±adir validaciÃƒÂ³n disabled={(stock || 0) === 0} para variantes existentes pero agotadas. En pi.ts, asignar prices.usd a nonfoil y prices.usd_foil a foil explÃƒÂ­citamente al expandir el objeto ll_versions.
- **Regla Derivada:** UI de variantes en E-commerce fÃƒÂ­sico: Si no existe variante, oculta el UI. Si existe pero no hay stock, deshabilita la UI (opacity-50). Los precios externos siempre deben extraer las propiedades separadas (usd vs usd_foil) del provider base.

### 67. ConfiguraciÃƒÂ³n de Pydantic v2 (SettingsConfigDict)

- **Problema**: pydantic-settings generaba errores (como Config error o validaciÃƒÂ³n fallida) al intentar heredar de BaseSettings y usar una clase interna Config.
- **Causa RaÃƒÂ­z**: Con la introducciÃƒÂ³n de Pydantic v2, la declaraciÃƒÂ³n de configuraciÃƒÂ³n mediante subclases Config quedÃƒÂ³ obsoleta a favor de model_config.
- **SoluciÃƒÂ³n**: Usar model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8') dentro de la clase Settings.
- **Regla Derivada**: Siempre actualizar los esquemas de configuraciÃƒÂ³n a las convenciones de Pydantic v2 para garantizar soporte continuo y evitar problemas con pytest y builds.

### 68. EnvÃƒÂ­o AsÃƒÂ­ncrono de Correos en FastAPI

- **Problema**: Realizar el envÃƒÂ­o de correos (ej: servidor SMTP) de manera sÃƒÂ­ncrona dentro del path operator del carrito de compras introducÃƒÂ­a latencias inaceptables en la respuesta (checkout), degradando la experiencia de usuario.
- **Causa RaÃƒÂ­z**: La operaciÃƒÂ³n de red con SMTP bloquea el hilo principal si no se delega a una tarea de fondo.
- **SoluciÃƒÂ³n**: Delegar el envÃƒÂ­o a tareas asÃƒÂ­ncronas no bloqueantes. En este caso se empleÃƒÂ³ syncio.create_task() (tambiÃƒÂ©n se puede usar BackgroundTasks de FastAPI) para despachar correos (al cliente y admin) inmediatamente antes de devolver la respuesta 200 OK.
- **Regla Derivada**: Cualquier integraciÃƒÂ³n con servicios externos de notificaciones en rutas sensibles debe ser wait de una tarea en fondo o despachado asÃƒÂ­ncronamente para mantener latencias < 500ms.

### 23. Prioridad de IntenciÃƒÂ³n del Usuario sobre DocumentaciÃƒÂ³n EstÃƒÂ¡tica Ã¢â‚¬â€� 2026-03-05

- **Problema:** El PRD y otros documentos de diseÃƒÂ±o especificaban vincular el botÃƒÂ³n de correo a una landing de Mailchimp, pero el usuario reportÃƒÂ³ esto como un error.
- **Causa RaÃƒÂ­z:** DocumentaciÃƒÂ³n de diseÃƒÂ±o obsoleta que no fue actualizada tras cambios en la estrategia de marketing del cliente.
- **SoluciÃƒÂ³n:** Priorizar la comunicaciÃƒÂ³n directa del usuario sobre lo escrito en docs/. Implementar `mailto:info@geekorium.shop` directamente.
- **Regla Derivada:** En caso de contradicciÃƒÂ³n entre un documento `docs/*.md` y una instrucciÃƒÂ³n directa del usuario en el chat, el chat siempre tiene la razÃƒÂ³n. Marcar la discrepancia en el log para futura actualizaciÃƒÂ³n de docs.

### 24. JerarquÃ­a de ConfiguraciÃ³n SMTP (Mar 2026)

- **Problema**: Los correos no se enviaban porque las credenciales estaban en frontend/.env pero el backend las buscaba en la raÃ­z.
- **LecciÃ³n**: Los operativos backend (FastAPI/Python) suelen buscar el archivo .env en la raÃ­z del proyecto. Las configuraciones compartidas o crÃ­ticas de backend deben centralizarse allÃ­ para ser accesibles.

### 25. Seguridad de Secretos en ProducciÃ³n (Mar 2026)

- **Problema**: Hardcodear secretos en .env es un riesgo de seguridad en producciÃ³n.
- **LecciÃ³n**: Implementar validaciÃ³n en pydantic.BaseSettings (usando model_post_init) para asegurar que variables como SMTP_PASSWORD se provean via entorno del sistema y no vÃ­a archivo fÃ­sico en modo production.

### 27. OptimizaciÃ³n de Storage y DecisiÃ³n de Ocultar Features (Mar 2026)

- **Problema**: El flujo de carga de comprobantes de pago disparaba el uso de cuota de Supabase Storage de forma acelerada.
- **Causa RaÃ­z**: Carga de archivos binarios (imÃ¡genes) en cada transacciÃ³n, lo que podrÃ­a agotar la cuota gratuita/pagada sin un valor de negocio crÃ­tico inmediato (ya existe flujo WhatsApp).
- **LecciÃ³n**: En proyectos con restricciones de cuota, es mejor ocultar features de alto consumo de storage ("payment-proofs") y delegar la validaciÃ³n al canal asistido (WhatsApp) que ya se utiliza para el cierre de venta.
- **AcciÃ³n**: Se comentÃ³ el componente de carga en `OrderTrackingPage.tsx` y se eliminÃ³ la migraciÃ³n de creaciÃ³n del bucket.

### 28. Checkout AtÃ³mico y Desacoplamiento de Schema (Mar 2026)

- **Problema**: El flujo de checkout fallaba silenciosamente ("Orden no encontrada") a pesar de que el carrito se vaciaba.
- **Causa RaÃ­z**: El RPC `create_order_atomic` intentaba insertar un valor en la columna `product_name` de `order_items`, la cual no existÃ­a en el schema de producciÃ³n. El admin funcionaba porque usaba un JOIN dinÃ¡mico, ocultando la inconsistencia.
- **SoluciÃ³n**: Se aÃ±adiÃ³ la columna `product_name` a `order_items` para persistir el nombre del producto en el momento de la compra (snapshotting) y se habilitaron permisos pÃºblicos (anon/authenticated) para el rastreo.
- **Regla Derivada**: En flujos atÃ³micos (RPC), cualquier error de schema en una sub-tabla cancela toda la transacciÃ³n. Siempre verificar que las columnas usadas en el RPC existan en todas las tablas afectadas.

### 29. Hosting para E-commerce: Cloudflare Pages vs. GitHub Pages (Mar 2026)

- **Problema**: GitHub Pages prohÃ­be explÃ­citamente el uso comercial en su capa gratuita, lo que pone en riesgo sitios de venta directa como Geekorium.
- **SoluciÃ³n**: Migrar a **Cloudflare Pages**.
- **LecciÃ³n**: Cloudflare Pages permite oficialmente uso comercial en su plan gratuito y ofrece ancho de banda ilimitado, eliminando riesgos de costos por trÃ¡fico de imÃ¡genes pesadas (cartas TCG).
- **SPA Routing**: Cloudflare usa un archivo `_redirects` en `public/` con la regla `/* /index.html 200` para manejar rutas de React de forma nativa.

### 30. Estrategia de Branching y CI/CD (Mar 2026)

- **Problema**: Desplegar directamente desde `main` sin un entorno de previsualizaciÃ³n aumenta el riesgo de errores en producciÃ³n.
- **LecciÃ³n**: Adoptar un modelo de `dev` (Preview) y `main` (Production).
- **Flujo**: Cloudflare Pages genera despliegues automÃ¡ticos para cada rama. Los cambios se validan en la URL de preview de `dev` antes de ser incorporados a `main` vÃ­a Pull Request para el despliegue final.

### 31. Cloudflare Pages vs. Workers para Frontend â€” 2026-03-07

- **Problema:** ConfusiÃ³n en el dashboard de Cloudflare al intentar desplegar un frontend de React usando la secciÃ³n de "Workers".
- **LecciÃ³n:** Los **Workers** son para lÃ³gica serverless (scripts), mientras que **Pages** es la herramienta diseÃ±ada para hosting de sitios estÃ¡ticos (Vite, React). Siempre usar la pestaÃ±a "Pages" para el despliegue del frontend.

### 32. SEO Condicional vÃ­a Variables de Entorno de Vite â€” 2026-03-07

- **Problema:** Necesidad de activar SEO (meta tags y robots) solo en la rama de producciÃ³n (`main`) y ocultar el sitio en desarrollo/preview (`dev`).
- **SoluciÃ³n:** Usar placeholders `%VITE_SEO_...%` y `%VITE_ROBOTS%` en `index.html`.
- **ConfiguraciÃ³n:**
  - **Prod:** `VITE_ROBOTS=index, follow`
  - **Dev/Preview:** `VITE_ROBOTS=noindex, nofollow`
- **Ventaja:** Permite inyectar SEO real solo en el dominio productivo sin aÃ±adir dependencias pesadas de React.

### 33. Root Directory en Estructuras Monorepo/Subcarpetas â€” 2026-03-07

- **Problema:** El build fallaba en Cloudflare porque intentaba buscar `package.json` en la raÃ­z del repo.
- **LecciÃ³n:** En proyectos donde el frontend reside en una subcarpeta (ej: `/frontend`), es OBLIGATORIO configurar el **Root Directory** en el dashboard de Cloudflare para que el proceso de build se ejecute en el contexto correcto.

### 34. Conflicto de Auto-detecciÃ³n (Vite vs. VitePress) en Cloudflare â€” 2026-03-07

- **Problema:** Cloudflare Pages intentaba usar un preset de "VitePress" en lugar de "Vite" debido a la presencia de archivos de documentaciÃ³n o nombres similares, lo que resultaba en errores 404 por rutas de assets incorrectas.
- **SoluciÃ³n:** Configurar explÃ­citamente el **Framework Preset** como **"None"** en el dashboard de Cloudflare. Esto obliga al sistema a usar solo el comando de build (`npm run build`) y el directorio de salida (`dist`) especificado, sin suposiciones de frameworks adicionales.

### 35. SPA Routing: `404.html` vs `_redirects` en Cloudflare Pages â€” 2026-03-07

- **Problema:** El uso de un archivo `_redirects` con la regla `/* /index.html 200` puede generar advertencias de "Redirect Loop" en el dashboard de Cloudflare si se combina con redirecciones de dominio (ej. HTTP -> HTTPS).
- **SoluciÃ³n:** El mÃ©todo mÃ¡s robusto para SPAs en Cloudflare Pages es la estrategia de **`404.html` fallback**. Al copiar el `index.html` generado al archivo `404.html` durante el build, Cloudflare servirÃ¡ la aplicaciÃ³n para cualquier ruta no encontrada, permitiendo que el router de React tome el control sin generar avisos de bucle.

### 36. GestiÃ³n de Multi-entorno de Base de Datos (Supabase) â€” 2026-03-07

- **Problema**: Riesgo de contaminar datos de producciÃ³n o romper el schema productivo durante el desarrollo de nuevas features.
- **SoluciÃ³n**: Segregar bases de datos usando proyectos independientes de Supabase vinculados a las ramas de Cloudflare.
- **LecciÃ³n**: La mejor forma de manejar mÃºltiples bases de datos en un SPA desplegado en Cloudflare Pages es mediante **Environment Overrides**. Al configurar variables como `VITE_SUPABASE_URL` de forma distinta para los entornos de "Production" y "Preview", la aplicaciÃ³n se conecta automÃ¡ticamente al proyecto de Supabase correcto basado en el branch desde el que se desplegÃ³.
- **Edge Functions**: Es crÃ­tico recordar que las Edge Functions y sus secretos deben sincronizarse manualmente (o vÃ­a CLI link) en ambos proyectos, ya que son entornos aislados.

### 37. Restricciones de Despliegue en GitHub Environments â€” 2026-03-07

- **Problema**: El despliegue de la rama `dev` fallaba con "Branch is not allowed to deploy due to environment protection rules".
- **Causa RaÃ­z**: Los repositorios de GitHub con "Environments" (ej: `github-pages`) suelen restringir los despliegues solo a `main` por defecto en la secciÃ³n "Deployment branches and tags".
- **SoluciÃ³n**: Ajustar la configuraciÃ³n del Environment en GitHub Settings para permitir todas las ramas ("No restriction") o aÃ±adir explÃ­citamente la rama `dev`.
- **LecciÃ³n**: Al habilitar un nuevo entorno de hosting (como GitHub Pages para `dev`), el primer despliegue fallarÃ¡ si no se actualizan los permisos de rama en el Dashboard de GitHub.

### 38. RefactorizaciÃ³n de IDs de Proyecto Supabase â€” 2026-03-07

- **Problema**: El uso de IDs de Supabase hardcodeados en URLs de Edge Functions impedÃ­a que la rama `dev` conectara con su propia instancia de base de datos.
- **SoluciÃ³n**: Reemplazar todos los IDs estÃ¡ticos por la variable de entorno `VITE_SUPABASE_PROJECT_ID`.
- **LecciÃ³n**: Para sistemas multi-entorno, el ID del proyecto debe tratarse como un secreto dinÃ¡mico inyectado por el hoster, igual que la URL y la Anon Key. Esto garantiza que el frontend siempre hable con el backend correcto segÃºn su origen.

### 39. PriorizaciÃ³n de Card Kingdom sobre Goldfish (Marzo 2026)

- **Problema**: Inconsistencias de precios por uso de mÃºltiples fuentes de mercado externo sin una jerarquÃ­a clara.
- **DecisiÃ³n**: Card Kingdom es ahora la fuente de verdad Ãºnica para precios de mercado externo. Se eliminÃ³ el uso de la tabla `aggregated_prices` (Goldfish).
- **LecciÃ³n**: Mantener sistemas de fallback complejos a fuentes de datos obsoletas introduce "ruido" en la valoraciÃ³n y dificulta el debugging. La simplicidad de una sola fuente (CK) mejora la fiabilidad.
- **ImplementaciÃ³n**: Si el precio de la tienda (`Geekorium`) es nulo, el sistema siempre debe recurrir al precio actual de Card Kingdom (`price_history`).

### 40. Limpieza de Selects en Supabase (Frontend & Backend) â€” Marzo 2026

- **Problema**: Al realizar cambios en la lÃ³gica de negocio (como remover una tabla), es fÃ¡cil olvidar limpiar los strings de `select()` en el frontend (`api.ts`) o backend.
- **LecciÃ³n**: Los errores de "Property X does not exist" en el frontend suelen deberse a proyecciones incompletas en la llamada de Supabase. Siempre verificar que todos los campos necesarios (incluyendo `stock`, `is_foil`, etc.) estÃ©n presentes en el string de `select` tras una refactorizaciÃ³n.
- **AcciÃ³n**: Se restaurÃ³ la columna `stock` en `fetchCardDetails` que se habÃ­a omitido accidentalmente durante la limpieza de Goldfish.

### 41. SimplificaciÃƒÂ³n de Precios y Reversa de Branding (Marzo 2026)

- **Problema**: Estrategia de precios confusa que mezclaba mÃƒÂºltiples fuentes y condiciones. Intento errÃƒÂ³neo de "limpiar" el branding de Geekorium.
- **Causa RaÃƒÂ­z**: El usuario aclarÃƒÂ³ que la prioridad era usar **Card Kingdom NM** como fuente ÃƒÂºnica de verdad para los precios de Geekorium, y que el branding original debe conservarse intacto.
- **SoluciÃƒÂ³n**:
  - Refactorizar lÃƒÂ³gica de precios en `ValuationService`, Edge Functions y DB para filtrar estrictamente por 'NM' de Card Kingdom.
  - Revertir cualquier cambio en el nombre de la marca ("Geekorium", "Geekorium El Emporio") en el frontend y servicios de email.
- **LecciÃƒÂ³n**: La simplicidad en los precios agiliza la operaciÃƒÂ³n. Nunca asumir que el branding debe "profesionalizarse" si el usuario no lo pide; respetar la identidad establecida es crÃƒÂ­tico.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Regla 1 (Precios de Geekorium): Solo precios NM de Card Kingdom.
392:
393: ### 42. High-Performance SQL Bulk Updates (Marzo 2026)
394:
395: - **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.

### 42. High-Performance SQL Bulk Updates (Marzo 2026)

- **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.
- **Causa RaÃƒÂ­z**: Nested loops over the target table and the subquery for every row.
- **SoluciÃƒÂ³n**: Use `UPDATE FROM` with a Common Table Expression (CTE). Pre-calculate all prices in memory and join them to the target table in a single pass.
- **Regla Derivada**: Bulk metadata updates in Supabase must use the `CTE + UPDATE FROM` pattern.

### 43. Defensive API Path Normalization (Marzo 2026)

- **Problema**: Edge Functions returning 400 or 500 errors intermittently due to unexpected URL prefixes (e.g., `/functions/v1/api/`) or trailing slashes added by some clients/proxies.
- **SoluciÃƒÂ³n**: Implement a robust "strip and normalized" loop at the start of the Edge Function to remove multiple prefixes and standardize endpoints to a base path (e.g., `/api/sets`).
- **Regla Derivada**: Edge Functions must be agnostic to deployment-specific URL prefixes.

### 44. ConexiÃƒÂ³n Segura a Supabase Pooler (Marzo 2026)

- **Problema**: "Connection timed out" o "Host not found" al intentar conectar scripts de Python externos a la DB de producciÃƒÂ³n.
- **Causa**: Intentar usar el host del dashboard o la IP directa que puede estar bloqueada o rotada.
- **SoluciÃƒÂ³n**: Usar el **Transaction Pooler** (Puerto 5432 o 6543). El host debe ser `[region].pooler.supabase.com` y el usuario DEBE incluir el Project Ref (`postgres.[project-ref]`).
- **LecciÃƒÂ³n**: Siempre configurar el `DATABASE_URL` con el pooler para scripts de mantenimiento masivo de larga duraciÃƒÂ³n.

### 45. Estrategia de Batched Updates para DenormalizaciÃƒÂ³n (Marzo 2026)

- **Problema**: Actualizar columnas denormalizadas (`avg_market_price_usd`) en una tabla de 200k+ registros fallaba consistentemente por `statement timeout`.
- **Causa**: El planificador de Postgres intentaba un Sequential Scan masivo con subconsultas correlacionadas.
- **SoluciÃƒÂ³n**: Implementar un script de Python que procese la tabla por IDs primarios en lotes (ej. 1,000 registros). Esto libera el bloqueo de tabla entre lotes y evita que el proceso supere el lÃƒÂ­mite de tiempo de una transacciÃƒÂ³n individual.
- **LecciÃ³n**: Si una migraciÃ³n SQL tarda mÃ¡s de 30s en Postgres de Supabase, no forzar el timeout; mover la lÃ³gica a un batch script externo.

### 46. Correct Denormalization Level (Per-Printing vs. Per-Card) â€” 2026-03-10

- **Problema**: Al denormalizar precios (`avg_market_price_usd`) en la tabla `cards`, todas las versiones de una carta (ej. Pandemonium de *Exodus* vs. *The List*) mostraban el mismo precio, perdiendo la precisiÃ³n por versiÃ³n.
- **Causa RaÃ­z**: Una carta (`card_id`) puede tener mÃºltiples impresiones (`printing_id`) con precios drÃ¡sticamente diferentes. Denormalizar a nivel de carta colapsa esta distinciÃ³n.
- **SoluciÃ³n**: Mover la columna denormalizada a `card_printings`. Actualizar Materialized Views y RPCs para unir por `printing_id` en lugar de `card_id` cuando se trate de precios.
- **Regla Derivada**: Nunca denormalizar datos que varÃ­an por ediciÃ³n/acabado en la tabla maestra de cartas; usar siempre la tabla de impresiones.

### 48. Zero-Error Supabase Security Advisor (Mar 2026)

- **Problema**: Supabase Security Advisor reportaba mÃºltiples vulnerabilidades de RLS y riesgos en vistas con `SECURITY DEFINER`.
- **Causa**: Tablas de metadatos (sets, cards) y de usuario (orders, carts) carecÃ­an de polÃ­ticas de seguridad explÃ­citas, exponiendo datos de negocio o de clientes. Vistas recreadas sin `security_invoker = true` bypassaban el RLS.
- **SoluciÃ³n**:
  - Habilitar RLS en **todas** las tablas pÃºblicas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
  - Definir polÃ­ticas granulares: `SELECT` pÃºblico para metadatos (cards, sets) y `Owner-Only` para datos sensibles (user_watchlist, user_addresses) usando `auth.uid()`.
  - Configurar vistas con `security_invoker = true` para asegurar que respeten los permisos del usuario que consulta.
- **LecciÃ³n**: Un estado de "Zero Errors" en el Security Advisor no solo es una mÃ©trica de cumplimiento, sino una garantÃ­a de que el acceso a datos estÃ¡ controlado por polÃ­ticas y no por la configuraciÃ³n por defecto del motor.

441: ### 49. RLS Policies for Guest Checkout (Mar 2026)
442:
443: - **Problema**: Habilitar RLS en tablas de carrito (`carts`, `cart_items`) y pedidos (`orders`) rompe el flujo de "Guest Checkout" si se restringe el acceso solo a usuarios autenticados.
444: - **Causa**: Los usuarios anÃ³nimos (`anon`) necesitan interactuar temporalmente con sus propios datos sin una sesiÃ³n de Supabase Auth persistente.
445: - **SoluciÃ³n**: Implementar polÃ­ticas permitiendo `INSERT` a `anon` y `SELECT` basado en el `id` del carrito o pedido si el usuario posee la referencia (ej: ID en localStorage). Para `orders`, permitir `SELECT` pÃºblico pero restringido por ID para seguimiento.
446: - **Regla Derivada**: Siempre validar que las polÃ­ticas de RLS no bloqueen flujos de usuarios no autenticados vitales para la conversiÃ³n de venta.
447:
448: ### 50. Branding Asset Synchronization & Consistency (Mar 2026)
449:
450: - **Problema**: Discrepancia entre los archivos de diseÃ±o en `docs/logos/` y los assets servidos en `frontend/public/branding/`, resultando en logotipos desactualizados o inconsistentes.
451: - **Causa**: Falta de un flujo de sincronizaciÃ³n definido; los componentes de React referenciaban archivos antiguos (ej: `Logo.jpg` en lugar de `Logo.png`).
452: - **SoluciÃ³n**:
453:   - Establecer `docs/logos/` como la fuente de verdad.
454:   - Sincronizar manualmente (o vÃ­a script) a `frontend/public/branding/`.
455:   - Refactorizar todos los componentes frontend (`Footer`, `Home`, `WelcomeModal`, `HelpPage`, `LegalPage`) para usar el nuevo path y extensiÃ³n.
456:   - Actualizar `index.html` para el favicon y apple-touch-icon.
457: - **LecciÃ³n**: La identidad visual debe tratarse como cÃ³digo; cualquier cambio en el "Source of Truth" de diseÃ±o requiere una auditorÃ­a de referencias en todo el frontend para garantizar la integridad visual de la marca.

### 51. Fallback Matching by Collector Number (CardKingdom Sync) â€” 2026-03-11

- **Problema**: El script de sincronizaciÃ³n de CardKingdom fallaba al actualizar precios para ediciones especiales (ej. TMNT, PZA) debido a IDs de Scryfall faltantes o discrepantes.
- **Causa RaÃ­z**: No siempre hay un mapeo 1:1 de `scryfall_id` en el catÃ¡logo de CardKingdom para sets promocionales o de colaboraciÃ³n.
- **SoluciÃ³n**: Implementar una lÃ³gica de respaldo (fallback) que extraiga el `collector_number` del SKU de CardKingdom (ej. "TMT-0017" -> "17") y realice el match combinando `set_name` + `collector_number`.
- **Regla Derivada**: Todo script de sincronizaciÃ³n de precios externo debe tener un mÃ©todo de match de respaldo basado en metadatos fÃ­sicos (set + nÃºmero) si el ID Ãºnico del proveedor falla.

### 52. UnificaciÃ³n de Archivos de Entorno (.env) â€” 2026-03-11

- **Problema**: Discrepancias de llaves (especialmente `SUPABASE_SERVICE_ROLE_KEY`) y corrupciÃ³n de archivos debido a mÃºltiples archivos `.env` (raÃ­z y frontend/).
- **Causa RaÃ­z**: DesincronizaciÃ³n manual entre archivos y herramientas (Vite vs Python) buscando configuraciones en lugares distintos.
- **SoluciÃ³n**: Centralizar todas las variables en un Ãºnico `.env` en la raÃ­z. Configurar Vite con `envDir: '../'` para leer desde la raÃ­z.
- **LecciÃ³n**: En monorepos pequeÃ±os o proyectos con subcarpetas, un solo archivo de entorno en la raÃ­z garantiza que todos los servicios (Frontend, API, Scripts) operen sobre la misma "fuente de verdad".

### 53. GestiÃ³n de Procesos HuÃ©rfanos en SincronizaciÃ³n â€” 2026-03-11

- **Problema**: Errores intermitentes de `Invalid API Key` o falta de actualizaciÃ³n de datos a pesar de aplicar correcciones en el cÃ³digo y el `.env`.
- **Causa RaÃ­z**: Procesos de Python persistentes en segundo plano que mantienen versiones obsoletas de las variables de entorno o que bloquean conexiones a la base de datos.
- **SoluciÃ³n**: Antes de reintentar sincronizaciones crÃ­ticas tras cambios en la configuraciÃ³n, es obligatorio listar y terminar procesos huÃ©rfanos (`Stop-Process -Name python -Force`).
- **Regla Derivada**: (Codificada en LEYES_DEL_SISTEMA.md) Todo cambio estructural en configuraciÃ³n requiere un reinicio limpio de servicios y procesos de mantenimiento.

### 54. Robustez en Scripts de DiagnÃ³stico (Supabase SQL vs API) â€” 2026-03-11

- **Problema**: Scripts de diagnÃ³stico rÃ¡pido fallan por `APIError` al intentar realizar joins complejos (`table.select('*, cards(name)')`).
- **Causa RaÃ­z**: Restricciones de aliasing en la API PostgREST o desconfiguraciÃ³n momentÃ¡nea de relaciones en el cliente Python.
- **SoluciÃ³n**: Para verificaciones manuales rÃ¡pidas, preferir consultas SQL directas vÃ­a `psycopg2` o realizar selecciones simples de IDs y resolver relaciones programÃ¡ticamente.
- **LecciÃ³n**: La simplicidad en el diagnÃ³stico previene falsos negativos causados por la propia herramienta de prueba.

### 55. Variables SEO de Vite No Reemplazadas en ProducciÃ³n â€” 2026-03-11

- **Problema**: El tab del navegador mostraba literalmente `%VITE_SEO_TITLE%` en producciÃ³n (`geekorium.shop`).
- **Causa RaÃ­z**: Los placeholders `%VITE_*%` en `index.html` solo son reemplazados por Vite durante el build si la variable estÃ¡ definida como env var en ese momento. Las variables `VITE_SEO_TITLE`, `VITE_SEO_DESCRIPTION`, `VITE_SEO_KEYWORDS`, `VITE_SEO_IMAGE` y `VITE_APP_URL` nunca fueron configuradas en el dashboard de Cloudflare Pages â†’ Environment Variables â†’ Production.
- **SoluciÃ³n**: Hardcodear los valores SEO estÃ¡ticos directamente en `frontend/index.html`. Mantener solo `%VITE_ROBOTS%` como placeholder (para controlar indexaciÃ³n por entorno: `index, follow` en prod, `noindex, nofollow` en dev).
- **Variables faltantes descubiertas en Cloudflare**: `VITE_SUPABASE_PROJECT_ID` y `VITE_ROBOTS`.
- **Regla Derivada**: Auditar `index.html` en cada setup de proyecto nuevo. Todo `%VITE_*%` que no estÃ© en el dashboard del hosting es un bug silencioso. Las metas SEO estÃ¡ticas (tÃ­tulo, descripciÃ³n de marca) deben hardcodearse; las dinÃ¡micas por entorno (robots, URL canÃ³nica) se parametrizan.
- **Google Search Console**: Para que Google indexe un sitio nuevo, NO basta con tener `robots: index, follow`. Se requiere verificar el dominio en GSC (via registro TXT en DNS de Cloudflare) y enviar el sitemap manualmente. Sin esto, el crawl puede tardar semanas o no ocurrir.

### 56. Error de "Migration Mismatch" en Supabase CI/CD (GitHub Actions) â€” 2026-03-11

- **Problema**: El pipeline `supabase/setup` en GitHub Actions fallaba con "Migration mismatch" al intentar hacer push o reset a la base de datos de Preview.
- **Causa RaÃ­z**: Borrar o renombrar archivos de migraciÃ³n localmente no elimina sus registros histÃ³ricos de la DB remota en Supabase (`supabase_migrations.schema_migrations`). El CLI detecta esta divergencia y aborta.
- **SoluciÃ³n**: Ir al SQL Editor del proyecto Supabase remoto y hacer `DELETE FROM supabase_migrations.schema_migrations WHERE version = 'VERSION_HUERFANA';` para alinear la DB con los archivos locales antes de re-ejecutar el pipeline.
- **Regla Derivada**: Nunca eliminar scripts de migraciÃ³n que ya se ejecutaron en un entorno alojado, a menos que tambiÃ©n se purgue su huella en la tabla interna de Supabase o se haga un reset completo desde cero.

### 57. Sobrecritura Incompleta en Patrones de Fallback API a Supabase â€” 2026-03-11

- **Problema**: Una carta Foil obtenÃ­a el precio de `$5.99` (precio Normal) en lugar de `$59.99` (precio Foil) en el frontend.
- **Causa RaÃ­z**: En `api.ts`, una respuesta exitosa pero incompleta desde FastAPI llenaba la propiedad `data.all_versions` con objetos sin `finish` ni `avg_market_price_foil_usd`. Aunque se detectaba que faltaba data (`apiVersionsLackFinishData`), la lÃ³gica saltaba el *query de Supabase fallback* porque la condiciÃ³n original era `if (!data.all_versions || data.all_versions.length === 0)`.
- **SoluciÃ³n**: Cuando se detecta data incompleta (e.g., `apiVersionsLackFinishData`), es obligatorio vaciar el atributo base explÃ­citamente (`data.all_versions = []` o `delete data.all_versions`) antes del chequeo condicional del fallback para forzar la re-evaluaciÃ³n estructurada desde la base de datos directa.
- **Regla Derivada**: En patrones donde un API proxy falla/devuelve data parcial y el frontend tiene un fallback directo a la DB de Supabase, la data parcial errÃ³nea DEBE purgarse por completo en memoria. Mezclar las respuestas (`{...baseData, ...data}`) sin purgar provoca cortocircuitos lÃ³gicos en la UI.

### 58. Unicidad FÃ­sica y React Keys en RPCs de Inventario â€” 2026-03-11

- **Problema**: El frontend mostraba duplicados exactos (ej. 2 cartas idÃ©nticas) o sobreescribÃ­a variantes al renderizar resultados de bÃºsqueda si no habÃ­a distinciÃ³n entre foil y nonfoil en la respuesta del RPC `get_products_filtered`.
- **Causa RaÃ­z**: En la tabla `products`, las variantes Foil y Nonfoil del mismo `printing_id` estÃ¡n separadas. Sin embargo, si el RPC no retorna la columna `finish`, el frontend las mapeaba ambas usando unicÃ¡mente `printing_id` como React Key, causando advertencias de UI de claves duplicadas, sobreescritura de cartas, y perdiendo el estado visual "Foil".
- **SoluciÃ³n**: Asegurarse de que el RPC recupere la columna `finish` (`LOWER(COALESCE(p.finish, 'nonfoil')) as finish`) y utilizarla en el frontend para generar un React Key Ãºnico (`${printing_id}-${finish}`). Adicionalmente, pasar `is_foil` explicitamente al componente derivÃ¡ndolo de `finish`.
- **Regla Derivada**: Todo RPC que retorne listas de inventario fÃ­sico TCG debe siempre exponer y proyectar los diferenciadores fÃ­sicos (ej. `finish`, `condition`) al frontend para garantizar unicidad garantizada en las visualizaciones de React y posibilitar lÃ³gica UI condicional.

### 59. Recarga de CachÃ© PostgREST y Precios Ramificados en RPCs â€” 2026-03-11

- **Problema**: Tras aÃ±adir la columna `finish` al RPC `get_products_filtered` en la base de datos de producciÃ³n mediante un script SQL directo, el frontend seguÃ­a recibiendo la respuesta antigua (sin `finish`) y mostrando precios incorrectos para las versiones Foil.
- **Causa RaÃ­z**:
  1. PostgREST (la capa API de Supabase) mantiene un cachÃ© del schema de la base de datos. Los cambios directos en funciones SQL no invalidan este cachÃ© automÃ¡ticamente, lo que provoca que la API siga retornando la firma antigua de la funciÃ³n.
  2. Inicialmente, no se considerÃ³ que el precio a mostrar (*market price*) debe ramificarse dependiendo del *finish*. La consulta SQL usaba `avg_market_price_usd` de forma genÃ©rica para todas las variantes.
- **SoluciÃ³n**:
  1. Ejecutar `NOTIFY pgrst, 'reload schema';` inmediatamente despuÃ©s de alterar una funciÃ³n SQL cruda.
  2. Modificar el RPC para que el precio devuelto dependa inteligentemente de la variante fÃ­sica que se va a imprimir en esa fila: `COALESCE(CASE WHEN LOWER(p.finish) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)`.
- **Regla Derivada**: Al desarrollar RPCs unificados de inventario TCG, la proyecciÃ³n de la propiedad `price` no puede ser plana; **debe** ramificarse evaluando las banderas fÃ­sicas (`finish`, y en el futuro `condition` o `language`). AdemÃ¡s, cualquier parche SQL *hotfix* aplicado en vivo sobre Supabase requiere estrictamente recargar la capa API HTTP (`NOTIFY pgrst, 'reload schema'`).

### 60. Uso de Supabase CLI en Windows (npx) â€” 2026-03-12

- **Problema**: El comando `supabase` falla con `CommandNotFoundException` si no estÃ¡ en el PATH global del sistema.
- **SoluciÃ³n**: Usar siempre `npx supabase` para invocar el CLI local. Para despliegues remotos, es obligatorio incluir el flag `--project-ref [ID]` para evitar ambigÃ¼edades si el enlace local (`.supabase/config`) no estÃ¡ sincronizado.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla TÃ©cnica (Herramientas CLI).

### 61. SincronizaciÃ³n de Edge Functions Duplicadas â€” 2026-03-12

- **Problema**: Desplegar una funciÃ³n corregida (ej. `api`) no solucionaba el problema en todas las partes del sitio (ej. Admin o Import) porque existÃ­a otra funciÃ³n idÃ©ntica con distinto nombre (`tcg-api`) desplegada previamente.
- **LecciÃ³n**: Durante fases de transiciÃ³n o refactorizaciÃ³n de nombres de funciones, es Mandatorio sincronizar el cÃ³digo en ambas carpetas (`api/` y `tcg-api/`) antes del despliegue para garantizar consistencia en todo el ecosistema.
- **Regla Derivada**: Evitar la fragmentaciÃ³n de lÃ³gica compartida; si dos Edge Functions hacen lo mismo, deben eliminarse o mantenerse estrictamente en espejo hasta la migraciÃ³n total.

### 62. LÃ³gica de Pedidos "Por Encargo" (Stock 0) â€” 2026-03-12

- **Problema**: El sistema bloqueaba la venta de cartas sin stock fÃ­sico, limitando el e-commerce solo a lo disponible en preventa o inventario actual.
- **SoluciÃ³n**:
  - **Bypassing**: Modificar RPC `add_to_cart` para ignorar la validaciÃ³n de `stock_actual` si el producto permite pedidos on-demand.
  - **CreaciÃ³n On-the-fly**: Si una variante (Foil/NM) no existe en la tabla `products`, el RPC debe crearla con stock 0 en lugar de fallar, permitiendo que el usuario la "encargue".
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 4 (Soporte Por Encargo).

### 68. Discrepancia de Stock "8 fuera / 1 dentro" (Marzo 2026)

- **Problema**: El buscador mostraba stock disponible, pero el modal mostraba "Por encargo".
- **Causa RaÃ­z**: Uso de IDs sintÃ©ticos en el frontend (`uuid-foil`, `uuid-nonfoil`) que no coincidÃ­an con el `printing_id` real al consultar el stock por RPC.
- **SoluciÃ³n**: Refactorizar `api.ts` para extraer el base UUID (stripping suffixes) antes de filtrar el resultado del RPC de stock.
- **LecciÃ³n**: Las llaves de React y los IDs de navegaciÃ³n pueden ser sintÃ©ticos para garantizar unicidad visual, pero los queries de datos de negocio (stock, precio) DEBEN trabajar sobre el ID canÃ³nico de la base de datos.
- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `fetchCardDetails` ahora normaliza los IDs antes del mapeo de stock.

### 23. Prioridad de Precios: Mercado vs Inventario â€” 2026-03-12

- **Problema**: Cartas en stock mostraban precio de $0.00 o "---" en el modal, aunque en la bÃºsqueda se veÃ­a el precio correcto ($24.99).
- **Causa RaÃ­z**: En `api.ts`, la lÃ³gica de mezcla de datos de inventario usaba el operador `??` (nullish coalescing), lo que permitÃ­a que un valor de `0` en la tabla `products` (precio no seteado manualmente) sobrescribiera el `market_price` de la tabla `card_printings`.
- **SoluciÃ³n**: Refactorizar la lÃ³gica en `fetchCardDetails` para validar que el precio de inventario sea estrictamente mayor a 0 antes de usarlo como override.
- **LecciÃ³n**: Un precio de `0` en el inventario debe tratarse pedagÃ³gicamente como "sin precio manual" (fallback al mercado), no como "precio gratis". La lÃ³gica de negocio debe ser consistente entre el listado (`get_products_filtered` RPC) y el detalle (`api.ts`).
- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `finalPrice` ahora valida `Number(exactProd.price) > 0`.

### 69. UnificaciÃ³n de Credenciales SMTP y SincronizaciÃ³n de Edge Functions â€” 2026-03-12

- **Problema**: El envÃ­o de correos fallaba silenciosamente tras cambios en la configuraciÃ³n debido a discrepancias en los nombres de variables de entorno entre las funciones `api` (`SMTP_USERNAME`) y `tcg-api` (`SMTP_USER`).
- **Causa RaÃ­z**: FragmentaciÃ³n de cÃ³digo entre funciones duplicadas que realizan tareas similares y falta de logs de diagnÃ³stico para la carga de secretos de Supabase.
- **SoluciÃ³n**:
  - Unificar los nombres de variables a `SMTP_USERNAME` y `SMTP_PASSWORD` en todas las Edge Functions.
  - Sincronizar la lÃ³gica de envÃ­o de notificaciones entre `api/index.ts` y `tcg-api/index.ts`.
  - AÃ±adir logs de consola explÃ­citos (`SMTP credentials loaded: true/false`) para facilitar el debugging en el dashboard de Supabase.
- **Regla Derivada**: Las variables de entorno para infraestructuras compartidas (SMTP, API Keys) deben seguir un esquema de nombrado Ãºnico en todo el proyecto. Cualquier cambio en una Edge Function "espejo" debe replicarse inmediatamente en la otra.

### 70. Price Fallback Chain & Starred Collector Numbers â€” 2026-03-12
- **Problema:** Cartas en stock mostraban "S/P" (Sin Precio) a pesar de tener datos de mercado en otras versiones.
- **Causa RaÃ­z:** Existencia de versiones duplicadas (con "â˜…" en el nÃºmero de coleccionista) que carecÃ­an de metadatos de precio, mientras que la versiÃ³n base sÃ­ los tenÃ­a. El buscador devolvÃ­a la versiÃ³n sin precio.
- **SoluciÃ³n:**
  1. Refactorizar el RPC `get_products_filtered` con una cadena de fallback: `Market(Finish) -> Market(Nonfoil) -> Market(Foil) -> Store Price -> 0`.
  2. Ejecutar un script de correcciÃ³n de datos para copiar precios de versiones base a versiones starred.
- **Regla Derivada:** Todo RPC de inventario debe implementar fallbacks de precio entre acabados (finish) para mitigar falta de metadata especÃ­fica.
### 71. LÃ³gica de DetecciÃ³n de Foil y RemediaciÃ³n Masiva (Marzo 2026)

- **Problema**: El sistema importaba casi todas las cartas como "Foil", incluso tierras duales de 3ED que no existen en ese acabado.
- **Causa RaÃ­z**:
  1. **Bug en Edge Function**: La lÃ³gica `finish.toLowerCase().includes('foil')` devolvÃ­a true para "nonfoil" porque contiene la palabra "foil".
  2. **Data Inconsistente**: Miles de registros en `products` heredaron este error, ensuciando el inventario y la visualizaciÃ³n.
- **SoluciÃ³n**:
  - **CÃ³digo**: Refactorizar a `(finish === 'foil' || (finish.includes('foil') && !finish.includes('nonfoil')))` para exclusividad.
  - **DB**: Script PL/pgSQL masivo que:
    - Identifica cartas marcadas como `foil` que no soportan ese acabado segÃƒÂºn `card_printings`.
    - Fusiona el stock con la versiÃ³n `nonfoil` si existe, o renombra la entrada en place.
    - Actualiza `order_items` y `cart_items` para mantener integridad referencial antes de borrar registros duplicados.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance y Datos). Las correcciones de finish deben considerar la tabla unida `card_printings`.
### 72. Ultra-Performance Filtering via Single-Table Denormalization (March 2026)

- **Problema**: Timeouts (500) y latencia alta en filtros complejos (Color, Tipo, Rareza) sobre tablas de 200k+ registros con mÃºltiples joins.
- **Causa RaÃ­z**: La ejecuciÃ³n de joins dinÃ¡micos en Supabase/PostgREST es costosa. Los Ã­ndices en tablas relacionales no siempre compensan el overhead del planificador de Postgres en queries muy ramificadas.
- **SoluciÃ³n**: **Extrema DenormalizaciÃ³n**. Mover metadatos crÃ­ticos (`release_date`, `colors`, `set_name`, `type_line`) directamente a la tabla `products`. RediseÃ±ar el RPC `get_products_filtered` para que sea un query de una sola tabla (`FROM products`).
- **SincronizaciÃ³n**: Usar un trigger `BEFORE INSERT OR UPDATE` en la tabla destino para poblar los datos, y triggers `AFTER UPDATE` en las tablas fuente para "tocar" los registros relacionados y forzar la sincronizaciÃ³n sin recursiÃ³n infinita.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance). Si una query con Joins supera los 200ms, denormalizar metadatos a la tabla principal.

### 73. Frontend Request Cancellation with AbortController (March 2026)

- **Problema**: "Race conditions" visuales y sobrecarga del servidor al mover sliders de filtros (Precio/AÃ±o) rÃ¡pidamente. El servidor procesaba peticiones que el usuario ya no necesitaba.
- **Causa RaÃ­z**: Cada cambio en el estado disparaba un `fetch` asÃ­ncrono. Sin cancelaciÃ³n, las respuestas podÃ­an llegar desordenadas o acumularse en el backend.
- **SoluciÃ³n**: Implementar `AbortController` en el hook `useEffect` de data fetching.
- **PatrÃ³n**:

```typescript
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, [filters]);
```

- **Regla Derivada**: Todo component de bÃºsqueda/filtrado masivo DEBE implementar `AbortController` para gestionar el ciclo de vida de las peticiones de red.
### 74. Robust Foil Matching & Finishes Array (March 2026)

- **Problema**: Cartas importadas como foil eran guardadas como non-foil por el RPC `bulk_import_inventory`, resultando en visualizaciÃ³n y precios incorrectos (ej. "Wan Shi Tong, Librarian").
- **Causa RaÃ­z**:
  1. El RPC priorizaba el match por la columna `is_foil`, ignorando el array `finishes` usado por sets modernos (Avatar, etc.).
  2. Fallback de Scryfall: Algunas versiones (starred collector numbers) no tienen metadata de precio foil, causando confusiÃ³n en el matching si no hay una jerarquÃ­a clara.
- **SoluciÃ³n**:
  - **Backend**: Actualizar RPC para que considere `requested_finish` vs (`is_foil` OR `finishes` array) con prioridad sobre la fecha de lanzamiento.
  - **Frontend**: Implementar una heurÃ­stica de validaciÃ³n en `BulkImport.tsx` que detecta precios altos ($ > 50) en cartas marcadas como non-foil, lanzando un aviso de confirmaciÃ³n.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 6 (ImportaciÃ³n Robusta).
### 75. Non-Automatic Joins in Supabase Client â€” 2026-03-13
- **Problema**: `Could not find a relationship between 'orders' and 'profiles' in the schema cache` al intentar un join simple.
- **Causa**: Supabase PostgREST no detecta relaciones automÃ¡ticas si los campos no tienen foreign keys explÃ­citas en el schema real de Postgres o si hay ambigÃ¼edades en la cachÃ© del cliente.
- **SoluciÃ³n**: Evitar joins forzados si no son necesarios. Para `orders`, los datos del comprador ya estÃ¡n denormalizados en `guest_info` o `shipping_address`. Usar esos campos directamente es mÃ¡s resiliente.
- **Regla Derivada**: No asumir que `select('*, table(*)')` funcionarÃ¡ siempre; verificar foreign keys en el schema antes de intentar joins profundos.

### 76. Email Priority in Orders â€” 2026-03-13
- **Problema**: El admin mostraba "N/A" en el correo del comprador.
- **Causa**: Se buscaba en `orders.user_email` (columna inexistente) o se intentaba unir con `profiles` (que no guarda emails en esta arquitectura).
- **SoluciÃ³n**: La jerarquÃ­a de email correcta es: `guest_info.email` -> `shipping_address.email`.
- **Regla Derivada**: Para Ã³rdenes de invitados y usuarios registrados, el email de contacto seguro reside en los metadatos de envÃ­o/invitado.

### 77. Inventory Zero-Price Integrity Sweep â€” 2026-03-13
- **Problema**: Productos "On-Demand" o con errores de importaciÃ³n terminaban con precio $0.00 en el carrito.
- **Causa**: Falta de validaciÃ³n reactiva en el momento de la inserciÃ³n o desincronizaciÃ³n con el mercado.
- **SoluciÃ³n**: Implementar barridos (sweeps) automÃ¡ticos que busquen precios 0 y los reparen consultando `card_printings`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla 7 (PrevenciÃ³n de Zero-Price).

### 78. RemociÃ³n Proactiva de Funcionalidades "On-Hold" (Marzo 2026)

- **Problema**: El inicio de sesiÃ³n social (Google, Discord, Microsoft) fue solicitado para ser ocultado o puesto en "hold" para simplificar la experiencia de usuario inicial.
- **LecciÃ³n**: Cuando una funcionalidad secundaria se pone en pausa por decisiÃ³n del usuario, no basta con comentarla si genera advertencias de lint o aumenta el peso muerto del cÃ³digo. Es preferible removerla limpiamente de la UI y los componentes asociados, manteniendo el estado de autenticaciÃ³n core intacto.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 8 (Simplicidad y Foco). Funcionalidades en hold deben ser removidas de la vista activa para evitar ruido visual y tÃ©cnico.
- âœ… **Visibilidad Condicional de Carrito**: El botÃ³n "AÃ±adir al carrito" ahora estÃ¡ oculto por defecto en la vista general (grid/list) y solo es visible en el modal de detalles, mejorando la estÃ©tica de navegaciÃ³n masiva.
- âœ… **Filtrado de Stock Robusto (Multi-capa)**: ImplementaciÃ³n de limpieza de Ã­tems agotados directamente en `api.ts` y componentes de detalle. EliminaciÃ³n completa de versiones "Por Encargo" ($0.00) en el flujo de vista de stock.
- âœ… **Ocultamiento de SecciÃ³n Archivo**: Removida la pestaÃ±a de histÃ³rico para simplificar la UX. El sistema ahora opera exclusivamente sobre el inventario vivo (Marketplace).

### 79. Component Prop Drilling for Visibility Control (March 2026)

- **Problema**: Necesidad de implementar un patrÃ³n de `showElement` prop con un valor por defecto.
- **ImplementaciÃ³n**:
  - `CardProps` ahora incluye `showCartButton?: boolean = false`.
  - Los padres (`CardGrid`) propagan este prop.
  - El modal de detalle (`CardModal`) lo ignora o lo fuerza a `true`, manteniendo la funcionalidad aislada.
- **LecciÃ³n**: Al rediseÃ±ar visibilidad de componentes compartidos, usar props booleanos explÃ­citos en lugar de lÃ³gicas globales de estado si el cambio es puramente de visualizaciÃ³n contextual. Esto permite mayor flexibilidad sin efectos secundarios en otras partes de la app.
### 25. Ocultamiento de Features vs. EliminaciÃ³n (Marzo 2026)

- **Problema**: El sistema de "Archivo" confundÃ­a a los usuarios reciÃ©n registrados.
- **Causa RaÃ­z**: Presencia de una funcionalidad de referencia histÃ³rica en un sitio de venta directa.
- **LecciÃ³n**: Para cambios de UX rÃ¡pidos bajo presiÃ³n, ocultar el punto de entrada (`tabs`) y forzar el estado inicial (`activeTab`) es mÃ¡s seguro y rÃ¡pido que eliminar cÃ³digo de fondo.
- **ImplementaciÃ³n**: En `Home.tsx`, forzar `activeTab: 'marketplace'`, retornar `null` en el botÃ³n de toggle e ignorar el parÃ¡metro URL `?tab=reference`.
- **Integridad**: Mantener una rama de referencia (`v1.0-productiva`) antes de apagar funcionalidades importantes garantiza la reversibilidad total sin miedo a perder cÃ³digo legado.

### 81. AlineaciÃ³n de IDs de Fuentes de Precios (Marzo 2026)

- **Problema**: Discrepancias en el historial de precios debido a mÃºltiples IDs (`1`, `21`) asignados a la misma fuente (Card Kingdom) en diferentes etapas del desarrollo.
- **Causa RaÃ­z**: Inconsistencia en scripts de raspado (scrapers) iniciales que no compartÃ­an una tabla de referencia de fuentes.
- **SoluciÃ³n**: Estandarizar IDs de fuentes crÃ­ticas: **16 para TCGplayer** y **17 para Card Kingdom**. Ejecutar scripts de alineaciÃ³n (`align_everything.py`) para migrar registros histÃ³ricos al ID oficial y consolidar las tablas `sources` y `price_sources`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 1. Todo script de sincronizaciÃ³n debe usar el ID 17 para Card Kingdom de forma hardcodeada o mediante lookup en la tabla de referencia oficial.


### 82. Storefront Caching & Pricing Updates (April 2026)
- **Problema**: El inventario (products) fue actualizado exitosamente para eliminar productos con precio .00, pero la grilla en la tienda seguÃ­a mostrando .00.
- **Causa RaÃ­z**: La visualizaciÃ³n principal del frontend depende de la Vista Materializada mv_unique_cards, la cual se alimenta de la tabla de catÃ¡logo card_printings, no del inventario directo.
- **SoluciÃ³n**: Para que un ajuste de mercado se refleje visualmente, el script debe actualizar la columna de precios denormalizada en card_printings y luego ejecutar explÃ­citamente REFRESH MATERIALIZED VIEW mv_unique_cards;.
- **Regla Derivada**: Todo update de pricing que deba verse en frontend requiere refrescar la vista materializada como Ãºltimo paso obligatorio.

### 83. Integridad en Egresos Masivos (Abril 2026)
- **Problema**: Riesgo de inconsistencia de stock al procesar archivos CSV con filas duplicadas o cantidades que exceden el stock disponible en un entorno multi-transaccional.
- **Causa RaÃ­z**: Si no se agrupan las cantidades por "Printing + Condition + Finish" antes de comparar con la DB, dos filas pequeÃ±as podrÃ­an pasar la validaciÃ³n individualmente pero fallar la resta combinada, o generar errores de restricciÃ³n.
- **SoluciÃ³n**: 
- **AgregaciÃ³n Previa**: El RPC de validaciÃ³n (`preview_bulk_egress`) y ejecuciÃ³n debe usar un CTE para sumar todas las cantidades del lote por nodo fÃ­sico antes de evaluar el stock.
  - **Aborto Transaccional**: La operaciÃ³n de egreso debe ser atÃ³mica (una sola funciÃ³n RPC). Si una sola carta del lote falla la validaciÃ³n de stock final (stock - pedido < 0), se debe lanzar una excepciÃ³n para revertir el lote completo, evitando estados de inventario parciales.
- **Regla Derivada**: Todo proceso de baja de inventario debe registrarse obligatoriamente en `inventory_logs` con un motivo explÃ­cito para auditorÃ­a administrativa.

### 84. Frictionless WhatsApp Checkout (April 2026)
- **Concept**: Reducing a 2-step checkout to a single form by using "safe defaults" (CÃ©dula, Address, etc.) for required backend fields while focusing the UI on Name, WhatsApp, and Email.
- **UI Logic**: Use of a dynamic "Confirm & Pay" button that remains disabled (grey) until the 3 mandatory fields are valid, then turns green with a glow effect.
- **Notification**: Email is mandatory as it's the primary channel for automated order confirmation, complementary to the manual WhatsApp flow.

### 85. Branding & "Secret" Access (April 2026)
- **Pattern**: Hiding "Login" buttons from the public view during BETA to prioritize conversion and reduce unauthorized support requests.
- **Implementation**: Providing a "Secret Link" (`/geeko-login`) for the internal team instead of a UI-hidden button.
- **UX**: Updating the restricted route handler (`AdminRoute`) to provide a helpful "Restricted Access" screen with a link to the secret login, improving internal use while keeping public users away.

### 86. WhatsApp Itemized Order Detail â€” Regression Risk (April 2026)
- **Problema**: After a UX simplification session (April 6), the WhatsApp redirect message was reduced to aggregate counts ("Normal: 5, Foil: 2"), losing the per-card breakdown. This blocked operational review of orders.
- **Causa RaÃ­z**: Frictionless checkout improvements over-simplified the WA message to reduce message length, inadvertently removing data needed by the store team.
- **SoluciÃ³n**: Restore the itemized format: `â€¢ Qty x Name [SET] [FINISH] - $Total`. Cap at 40 items and append an overflow note directing to email for full detail.
- **Regla Derivada**: The WhatsApp message is the PRIMARY operational channel for the Geekorium team. It MUST always include a per-card breakdown. Simplification of the checkout form must NEVER simplify the order detail sent to the store.

### 87. PDF Receipt via New Window (No Library) (April 2026)
- **Problema**: `window.print()` called on the main checkout page produced an unstyled browser print of the entire app UI, not a real comprobante.
- **SoluciÃ³n**: `generateReceiptHTML()` in `CheckoutSuccessPage.tsx` produces a standalone, self-contained HTML document (with Google Fonts, full CSS branding, item table, and status badge) opened via `window.open()`. The receipt page auto-fires `window.print()` on load.
- **PatrÃ³n**: Pass all data needed for the receipt (`customerInfo`, `items`, `total`, `orderId`) through React Router's `navigate()` state. No DB round-trip needed on the success page.
- **Regla Derivada**: For lightweight, one-time document generation in a React SPA, prefer the new-window HTML approach over PDF libraries (jsPDF, react-pdf). It requires zero npm dependencies and produces a print-ready, fully branded document.

### 88. AtÃ³mica EliminaciÃ³n de Ã�tems e Inventario (Abril 2026)
- **Problema**: Eliminar un Ã­tem de un pedido requiere actualizar el total y restaurar el stock fÃ­sico simÃºltaneamente para evitar discrepancias.
- **Causa RaÃ­z**: LÃ³gica distribuida en el frontend puede fallar si la conexiÃ³n se interrumpe entre llamadas.
- **SoluciÃ³n**: Crear una funciÃ³n RPC `delete_order_item_v1` que maneje: 1. VerificaciÃ³n de estado de orden, 2. Incremento de stock en `products`, 3. RecÃ¡lculo de `total_amount`, 4. EliminaciÃ³n de la fila en `order_items`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 6 (Integridad Global). Operaciones cruzadas entre Pedidos e Inventario deben ser atÃ³micas vÃ­a SQL.

### 89. UI-Based Confirmation vs Browser Native (Abril 2026)
- **Problema**: El uso de `window.confirm()` en entornos de producciÃ³n puede ser bloqueado o auto-cancelado por el navegador si se detectan mÃºltiples re-renders o interferencias de eventos, resultando en botones que "no hacen nada".
- **Causa RaÃ­z**: El log de consola mostraba "User clicked CANCEL" instantÃ¡neamente sin que el usuario interactuara.
- **SoluciÃ³n**: Implementar un estado de confirmaciÃ³n en lÃ­nea (`confirmingItemId`). Al pulsar la acciÃ³n, el botÃ³n cambia a un set de iconos "Confirmar [Check] / Cancelar [X]".
- **Ventaja**: Evita bloqueos de scripts del navegador, es mÃ¡s rÃ¡pido y coherente con el lenguaje visual de la app (Rose-Neon).
- **Regla Derivada**: Preferir estados de confirmaciÃ³n "Inline" para acciones destructivas en el panel administrativo para garantizar robustez ante polÃ­ticas de seguridad de navegadores modernos.

### 90. Touch-First Visibility vs Desktop-Only Hover (April 2026)
- **Problem**: Critical actions (like "Add to Cart") were hidden behind a hover state (`opacity-0 group-hover:opacity-100`). This made the feature inaccessible on smartphones, tablets, and POS touchscreens.
- **Solution**: Switch to **Permanent Visibility**. Important CTA (Call to Action) buttons should always be visible (at least partially) or have a very clear visual affordance that doesn't rely on mouse pointers.
- **Improved UX**: Use a "Pulse" or subtle expansion animation on hover for *desktop enrichment*, but ensure the base state is usable for touch.

### 91. React.memo Custom Comparison Pitfalls (April 2026)
- **Problem**: A component (`Card.tsx`) refused to show a new button even when the parent passed `showCartButton={true}`.
- **Causa RaÃ­z**: The `React.memo` second argument (comparison function) was manually listing props to watch (`card_id`, `price`, etc.) but was **omitting** `showCartButton`. React saw the props changed, but the manual check said "nothing important changed", blocking the re-render.
- **LecciÃ³n**: Avoid manual prop comparison in `React.memo` unless strictly necessary for performance. If used, it MUST include every prop that affects the visual output. When in doubt, let React's default shallow comparison handle it.

### 92. Implicit 'any' in Production Builds (April 2026)

- **Problema**: El servidor de desarrollo (`npm run dev`) funcionaba perfectamente, pero la compilaciÃ³n de producciÃ³n (`npm run build`) fallaba con `error TS7006: Parameter 'm' implicitly has an 'any' type`.
- **Causa**: La configuraciÃ³n de TypeScript en modo estricto para producciÃ³n prohÃ­be el uso de `any` implÃ­cito en parÃ¡metros de funciones (especialmente en `.map()`, `.filter()`).
- **LecciÃ³n**: Nunca omitir el tipado en funciones de transformaciÃ³n de datos en `utils/api.ts`. Un simple `(m: any)` permite que el build pase y asegura que el despliegue no se bloquee.

### 93. OptimizaciÃ³n de Rendimiento en Carrito de Invitados (Abril 2026)

- **Problema**: Usuarios no logueados experimentaban un retraso de varios segundos al editar el carrito.
- **Causa**: La funciÃ³n `fetchCart` realizaba peticiones secuenciales (individuales) a Supabase por cada Ã­tem. Un carrito de 15 Ã­tems disparaba ~30-45 queries.
- **SoluciÃ³n**: **Batch Fetching**. Agrupar todos los IDs de impresiÃ³n, realizar una Ãºnica consulta `.in()` para metadatos y una Ãºnica llamada RPC para stock/precios vivos. Esto reduce la complejidad de $O(N)$ a $O(1)$ viajes de red.
- **Mapeo de Datos**: Al usar batch fetching, es crÃ­tico asegurar que el objeto retornado mantenga la estructura esperada por los componentes (nested `products` object). Se debe corregir el mapeo en `CartContext` para soportar tanto datos planos como anidados.

### 94. Schema Discrepancies en CI/CD y Error 42P10 (Abril 2026)

- **Problema**: El script de importaciÃ³n de Supabase fallaba en GitHub Actions con el error `postgrest.exceptions.APIError: {'code': '42P10', 'message': 'there is no unique or exclusion constraint matching the ON CONFLICT specification'}`.
- **Causa**: El script intentaba un `upsert` usando `on_conflict='game_id,set_code'`. El entorno local de desarrollo sÃ­ poseÃ­a esa restricciÃ³n explÃ­cita de clave compuesta, pero la base de datos remota de producciÃ³n solo tenÃ­a implementado un `UNIQUE(set_code)`. PostgREST arrojaba excepciÃ³n de esquema inmediatamente al no hallar correspondencia exacta a las columnas especificadas.
- **SoluciÃ³n**: ProgramaciÃ³n defensiva en scripts de BD multi-entorno utilizando fallbacks dinÃ¡micos (Ej: atrapar especÃ­ficamente el cÃ³digo `'42P10'` en el bloque de excepciones y re-ejecutar el `upsert` haciendo un "Fallback" a `on_conflict='set_code'`).
### 95. Gatillos de SincronizaciÃ³n y Visibilidad de Inventario (Abril 2026)

- **Problema**: Nuevas ediciones importadas exitosamente (ej: Strixhaven) no eran visibles en el inventario a pesar de tener stock y pertenecer al juego correcto (`MTG`).
- **Causa RaÃ­z**:
  1. El frontend requiere `type_line` y `colors` para renderizar las cartas; si son nulos, la carta se omite.
  2. La funciÃ³n de base de datos `sync_product_metadata` (gatillo en `products`) omitÃ­a estos campos en su clÃ¡usula `SELECT INTO`, por lo que nunca se poblaban automÃ¡ticamente desde el catÃ¡logo.
- **SoluciÃ³n**:
  - Actualizar el trigger de PostgreSQL para incluir `type_line`, `colors` y `release_date` (usando `COALESCE` para preservar datos manuales si existen).
  - Forzar una sincronizaciÃ³n masiva ("Touch" update) de los productos afectados.
- **Regla Derivada**: Todo gatillo de sincronizaciÃ³n denormalizada entre el catÃ¡logo maestro y el inventario DEBE incluir la totalidad de los campos crÃ­ticos para la UI del frontend.

### 96. CardKingdom SKU-Based Mapping (April 2026)

- **Problema**: La sincronizaciÃ³n de precios para Strixhaven fallaba o se contaminaba con ediciones antiguas debido a que el campo `variation` de CK estaba vacÃ­o para sets modernos.
- **Causa RaÃ­z**: El catÃ¡logo de CardKingdom para sets modernos (Strixhaven, Tokens, etc.) incrusta el nÃºmero de coleccionista y el acabado directamente en el SKU (`[F]SET-NNNN`), no en los campos de metadatos tradicionales.
- **LecciÃ³n**:
  - **Foil Detection**: El prefijo `F` en el SKU es la fuente Ãºnica de verdad para detectar versiones Foil.
  - **Collector mapping**: Extraer el nÃºmero del SKU sustrayendo ceros a la izquierda.
  - **Prioridad de EdiciÃ³n**: Al mapear por cÃ³digo de set (ej: `soa`), priorizar manualmente ediciones primarias ("Secrets of Strixhaven") sobre aliases o sub-sets para evitar oscilaciones de precios.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 7.

### 97. High-Performance Batch SQL Updates (April 2026)

- **Problema**: Actualizar >25,000 precios mediante `executemany` (mÃºltiples `UPDATE` individuales) sobre un pooler (puerto 6543) excedÃ­a los 90 minutos de ejecuciÃ³n.
- **Causa RaÃ­z**: Latencia de red acumulada y round-trip por cada fila, sumado al overhead del gestor de conexiones por cada transacciÃ³n individual.
- **SoluciÃ³n**: **VALUES Table Pattern**. Agrupar los cambios en chunks (ej: 2,000 filas) y ejecutar un solo `UPDATE target_table SET col = v.new_val FROM (VALUES (...), (...)) AS v(id, new_val) WHERE target_table.id = v.id`.
- **Resultado**: El tiempo de ejecuciÃ³n bajÃ³ de >90 minutos a **63 segundos** para 47,000 actualizaciones.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 18.

### 98. RPC Overload and Frontend Consistency (April 2026)

- **Problema**: El checkout fallaba en producciÃ³n con el error "Function not found" a pesar de existir localmente y en el dashboard.
- **Causa RaÃ­z**: Un script de limpieza de sobrecargas (`drop_order_overloads.py`) eliminÃ³ la versiÃ³n exacta que el frontend llamaba (con `p_cart_id`). PostgREST no hace fallback automÃ¡tico si la firma es ambigÃ¼a o falta un parÃ¡metro requerido.
- **LecciÃ³n**:
    - **ProtecciÃ³n de Firmas**: Nunca eliminar sobrecargas de funciones crÃ­ticas sin verificar la versiÃ³n exacta que el frontend (especialmente en producciÃ³n) estÃ¡ llamando.
    - **Resilient RPC Pattern**: Restaurar funciones con `DEFAULT NULL` en parÃ¡metros nuevos para mantener compatibilidad con callers antiguos (Edge Functions) y nuevos (Frontend).
- **Regla Derivada**: Toda actualizaciÃ³n de firma de RPC en producciÃ³n debe ser retrocompatible o desplegarse simultÃ¡neamente con el frontend.

### 145. Polymorphic Order Integrity (Accessories) â€” 2026-04-23
- **Problema**: Los pedidos mixtos (cartas + accesorios) fallaban en el checkout porque el sistema solo esperaba `product_id`.
- **Causa RaÃ­z**: La tabla `order_items` usa claves forÃ¡neas separadas y mutuamente excluyentes para accesorios y productos. El frontend enviaba IDs en campos inconsistentes dependiendo del origen (carrito de invitados vs logueados).
- **SoluciÃ³n**: Refactorizar el RPC `create_order_atomic` para manejar `product_id` y `accessory_id` de forma polimÃ³rfica con recuperaciÃ³n de ID defensiva.
- **Regla Derivada**: Todo Ã­tem de orden debe pasar por un mapeador de IDs en el frontend antes de enviarse al RPC, asegurando que se identifique correctamente si es un producto base o un accesorio.

### 146. Guest Tracking RLS & 406 Errors â€” 2026-04-23
- **Problema**: El rastreo de pedidos para invitados devolvÃ­a "0 rows" o `406 Not Acceptable`.
- **Causa RaÃ­z**: RLS habilitado sin polÃ­ticas que permitieran al rol `anon` leer pedidos por ID. PostgREST devuelve 406 si el usuario no tiene permisos de `SELECT` sobre las columnas solicitadas.
- **SoluciÃ³n**: Conceder `GRANT SELECT` a `anon` y `authenticated` en `orders` y `order_items`, y crear una polÃ­tica pÃºblica `FOR SELECT USING (true)` (el acceso se limita de facto por el conocimiento del UUID de la orden).
- **Regla Derivada**: El flujo de "Guest Checkout" requiere que las tablas de Ã³rdenes sean legibles por el rol `anon` mediante polÃ­ticas de RLS que permitan el acceso por ID.

### 147. PostgREST Schema Cache Latency â€” 2026-04-24
- **Problema**: Tras ejecutar migraciones SQL (especialmente `DROP` y `CREATE OR REPLACE FUNCTION`), el frontend sigue recibiendo errores 404 o firmas de funciÃ³n antiguas.
- **Causa RaÃ­z**: La capa API de Supabase (PostgREST) mantiene un cachÃ© del esquema que no siempre se invalida instantÃ¡neamente ante cambios DDL directos vÃ­a SQL Editor.
- **LecciÃ³n**: Al realizar cambios crÃ­ticos en funciones RPC que el frontend consume, es una buena prÃ¡ctica ejecutar `NOTIFY pgrst, 'reload schema';` o realizar un cambio menor en el esquema (como un comentario `COMMENT ON FUNCTION ...`) para forzar la invalidaciÃ³n del cachÃ©.

### 148. Inclusive Filtering for Generic Accessories â€” 2026-04-24
- **Problema**: Los accesorios "GenÃ©ricos" (como fundas, cajas o dados) desaparecÃ­an de la tienda cuando el usuario seleccionaba un juego especÃ­fico (MTG, PKM), a pesar de ser compatibles con todos.
- **Causa RaÃ­z**: El filtro SQL `a.game_id = p_game_id` excluÃ­a filas donde `game_id` es NULL (productos genÃ©ricos).
- **SoluciÃ³n**: Implementar una lÃ³gica de filtrado inclusiva: `WHERE (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL)`. Esto asegura que los productos especÃ­ficos del juego Y los genÃ©ricos aparezcan siempre.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 9. Los productos sin ID de juego se consideran universales y deben aparecer en todos los contextos de filtrado de juego.

### 149. Admin UI Alignment & State Sync â€” 2026-04-24
- **Problema**: DesalineaciÃ³n visual en tablas administrativas tras aÃ±adir nuevas columnas (`is_active`, `game_id`), causando que los datos no coincidan con sus encabezados.
- **LecciÃ³n**: Al expandir tablas complejas en React, evitar el uso de Ã­ndices de array para renderizar columnas. Usar un mapeo explÃ­cito de celdas por nombre de propiedad y asegurar que el nÃºmero de etiquetas `<th/>` sea idÃ©ntico al de `<td/>` en cada fila para evitar "drift" visual.

### 150. Dynamic Game Mapping in Bulk Imports â€” 2026-04-24
- **Problema**: Los scripts de importaciÃ³n masiva fallaban con errores de llave forÃ¡nea (`accessories_game_id_fkey`) al intentar insertar IDs de juegos que no existÃ­an en el entorno de destino (ej: ID 6 para Digimon).
- **SoluciÃ³n**: No usar IDs hardcodeados en scripts de importaciÃ³n. Usar subconsultas dinÃ¡micas: `(SELECT game_id FROM games WHERE game_name ILIKE '...' LIMIT 1)`.
- **Regla Derivada**: Todo script de utilidad de carga masiva debe resolver IDs de tablas de referencia dinÃ¡micamente mediante el nombre o cÃ³digo de la entidad.

### 151. Defensive Optional Chaining for Polymorphic Data â€” 2026-04-24
- **Problema**: El componente `CardModal` y `CardDetail` crasheaban con `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` al abrir accesorios en el catÃ¡logo.
- **Causa RaÃ­z**: El campo `set_code` no existe para accesorios. El componente asumÃ­a que todos los productos son cartas TCG y llamaba `.toUpperCase()` directamente sin verificar null/undefined.
- **SoluciÃ³n**: Usar optional chaining en todos los `string.toUpperCase()` sobre datos de API: `set_code?.toUpperCase()`. Enriquecer la respuesta de `fetchCardDetails` para accesorios con campos placeholder (`set_code: category`, `collector_number: 'ACC'`).
- **Regla Derivada**: **Nunca** llamar mÃ©todos de string directamente sobre propiedades de datos de API. Siempre usar `?.` o validar con un guard antes. Aplica especialmente cuando la misma vista renderiza tipos de datos polimÃ³rficos (cartas, accesorios).

### 152. Polymorphic UI: Separate Layouts for Different Product Types â€” 2026-04-24
- **Problema**: El `CardModal`, diseÃ±ado para cartas TCG, mostraba informaciÃ³n irrelevante (FOIL/NONFOIL toggle, "EDICIÃ“N / IMPRESIONES", legalidad de formatos, CardKingdom link) cuando se abrÃ­a un accesorio como una caja de Gundam o snacks.
- **Causa RaÃ­z**: Reutilizar el mismo layout de carta para todos los tipos de productos es un anti-patrÃ³n cuando las entidades tienen caracterÃ­sticas fundamentalmente diferentes.
- **SoluciÃ³n**: Condicionar el layout completo con `details?.is_accessory`. Cuando es `true`, renderizar un layout alternativo limpio: imagen centrada, nombre, categorÃ­a, badge de stock prominente, precio simple ("Precio"), y CTA de carrito. Cuando es `false`, usar el layout original de carta con todas sus secciones.
- **Regla Derivada**: En plataformas de e-commerce polimÃ³rficas (cartas + accesorios), el modal/detalle debe detectar el tipo de producto y renderizar el layout apropiado. No intentar ocultar secciones con condicionales dispersos; mejor separar los branches de rendering completos.

### 153. JSX Fragment Nesting in Ternary Conditionals â€” 2026-04-24
- **Problema**: Al refactorizar un componente grande (CardModal) para agregar un branch ternario complejo, mÃºltiples errores de TypeScript surgieron: "JSX element has no corresponding closing tag", "Expected closing tag for JSX fragment".
- **Causa RaÃ­z**: Al dividir el rendering existente en dos branches de un ternario (accesorio vs carta), es fÃ¡cil perder el `<>` de apertura del fragment en el branch `else`, y los `</div>` de cierre previos al fragment quedan "huÃ©rfanos".
- **SoluciÃ³n**:
  1. Usar `tsc --noEmit` para verificar JSX antes de `npm run build`.
  2. Al agregar un ternario que envuelve mÃºltiples elementos, aÃ±adir explÃ­citamente `<>` y `</>` para el branch que lo necesita.
  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir lÃ­neas separadas).
- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ lÃ­neas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.

  2. Al agregar un ternario que envuelve múltiples elementos, añadir explícitamente `<>` y `</>` para el branch que lo necesita.
  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir líneas separadas).
- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ líneas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.

### 154. CartContext Flattening vs CartDrawer Nested Fields — 2026-04-24
- **Problema**: Los ítems del carrito mostraban `$0.00` individualmente en `CartDrawer`, aunque el SUBTOTAL total era correcto.
- **Causa Raíz**: `CartContext.refreshCart()` aplana los datos del RPC `get_user_cart` en campos de primer nivel (`item.price`, `item.name`, `item.image_url`, `item.set_code`). Sin embargo, `CartDrawer` leía la estructura anidada antigua (`item.products?.price`), que no existe en el state aplanado — resultando en `undefined → $0.00`.
- **Por qué el SUBTOTAL funcionaba**: La lógica del subtotal ya tenía el fallback correcto `(item.products?.price || item.price || 0)`, pero la línea de display por ítem no.
- **Solución**: Actualizar `CartDrawer` para leer los campos planos primero con el nested como fallback: `item.price || item.products?.price || 0`. Aplicar el mismo patrón a `name`, `image_url`, `set_code` e `is_foil`.
- **Regla Derivada**: Cuando `CartContext` cambia la forma del state (de nested a flat), TODOS los consumidores (`CartDrawer`, `CheckoutPage`, etc.) deben actualizarse simultáneamente. El patrón seguro es siempre usar `item.price || item.products?.price` para soportar ambas formas durante transiciones.

### 101. Rigor de TypeScript en CI/CD (Variables no usadas) — 2026-04-25
- **Problema:** El build falló múltiples veces en el servidor de despliegue debido a variables declaradas pero no usadas (`TS6133`).
- **Causa Raíz:** El entorno local (VS Code/Dev) era más permisivo que el pipeline de producción/dev del servidor.
- **Solución:** Limpieza quirúrgica de imports y variables no usadas. No asumir que si "funciona en local" pasará el build del servidor.
- **Regla Derivada:** Realizar un `npm run build` local antes de cada push para detectar errores de tipado estricto.

### 102. Sincronización URL-Estado para Navegación Reactiva — 2026-04-25
- **Problema:** El menú cambiaba la URL pero el catálogo no se actualizaba ni cambiaba de pestaña.
- **Causa Raíz:** El componente principal (`Home.tsx`) solo leía los `searchParams` en el montaje inicial.
- **Solución:** Implementar un `useEffect` que escuche `searchParams` y sincronice el estado local (`activeTab`, `filters`).
- **Regla Derivada:** Cualquier navegación basada en URL en una SPA requiere sincronización reactiva del estado interno para disparar nuevos fetches de datos.

### 103. Resolución de Ambigüedad en PostgREST (PGRST203) — 2026-04-26
- **Problema:** La API de Supabase fallaba al llamar a una función RPC con error de múltiples candidatos.
- **Causa Raíz:** Redefinir funciones sin borrar versiones anteriores con firmas similares crea sobrecarga ambigua.
- **Solución:** Limpieza profunda usando un bloque PL/pgSQL que recorre los OIDs de las funciones duplicadas.
- **Regla Derivada:** Siempre incluir DROP FUNCTION IF EXISTS con la firma exacta antes de recrear RPCs.

### 104. Auditoría de Datos de Referencia (Lookups) — 2026-04-26
- **Problema:** Duplicidad de registros en la tabla games y fallos en el filtrado.
- **Causa Raíz:** Insertar nuevos juegos sin verificar existencia de registros previos (ej: PTCG vs PKM).
- **Solución:** Unificación de registros, actualización de llaves foráneas y estandarización de códigos.
- **Regla Derivada:** Antes de expandir un catálogo maestro, auditar la tabla actual para mapear IDs existentes.

### 105. Centralización de Mapeos de Negocio en Frontend — 2026-04-26
- **Problema:** Filtrado inconsistente donde Pokémon mostraba Digimon.
- **Causa Raíz:** Mapeos de códigos a nombres dispersos y desincronizados entre componentes.
- **Solución:** Centralizar objetos de mapeo (gameMap, gameMapInv) a nivel global en el componente.
- **Regla Derivada:** Nunca usar Strings mágicos para mapeos de negocio; centralizar en constantes unificadas.

### 106. Strict Filtering for Polymorphic Catalogs (MTG vs. Generic) - 2026-04-27
- **Problema:** Al filtrar productos (accesorios) por un juego especÃ­fico (ej. MTG), el catÃ¡logo mostraba Ã­tems de MTG mezclados con Ã­tems genÃ©ricos (forros universales, snacks) que no tenÃ­an juego asignado (game_id IS NULL).
- **Causa RaÃ­z:** La funciÃ³n de base de datos (get_accessories_filtered) usaba una condiciÃ³n 'loose': AND (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL). Esto forzaba la inclusiÃ³n de genÃ©ricos en cada filtro de juego.
- **SoluciÃ³n:** Implementar filtrado estricto en el RPC eliminando la condiciÃ³n OR a.game_id IS NULL cuando se provee un p_game_id. Adicionalmente, ajustar el frontend para que el botÃ³n general de 'Productos' no fuerce un juego por defecto (cambiando el fallback de ['Magic: The Gathering'] a []), permitiendo ver el catÃ¡logo completo solo cuando se desea.
- **Regla Derivada:** En catÃ¡logos con productos especÃ­ficos de nicho y productos genÃ©ricos, el filtro de juego debe ser estricto para evitar ruido visual ('contaminaciÃ³n de resultados'). Los productos genÃ©ricos deben ser accesibles solo en la vista global sin filtros.

### 107. Standardizing Multi-TCG Codes (Database vs. Frontend) - 2026-04-27
- **Problema**: Los productos de Pokemon y One Piece no aparecian en la tienda despues de ser agregados desde el panel de administracion.
- **Causa Raiz**: El panel de administracion usaba una funcion (upsert_product_inventory) que guardaba el ID numerico del juego (ej: '23') o nombres largos en la columna game. El buscador esperaba codigos cortos (PKM, OPC).
- **Solucion**: Estandarizacion de codigos a 3-4 letras (MTG, PKM, OPC) en todos los RPCs de produccion.
- **Regla Derivada**: Prohibido el uso de IDs numericos o nombres largos para nuevos registros en la columna 'game'.

### 48. Sensibilidad de MayÃºsculas y Nombres en Filtros SQL (get_products_filtered) â€” 2026-04-27
- **Problema:** Los productos de nuevas expansiones (como Strixhaven) no aparecÃ­an en el catÃ¡logo al usar los filtros de la tienda a pesar de estar correctamente insertados.
- **Causa RaÃ­z:** El cÃ³digo de la expansiÃ³n se guardaba en la base de datos en minÃºsculas (`sos`), pero el frontend y la lÃ³gica del RPC realizaban bÃºsquedas o comparaciones usando mayÃºsculas o nombres completos (ej. `['Secrets of Strixhaven']` frente a `'sos'`). Como PostgreSQL es estricto en sus comparaciones de texto con `ANY` o `=`, las coincidencias fallaban silenciosamente devolviendo arreglos vacÃ­os.
- **SoluciÃ³n:** Modificar la consulta SQL dentro del RPC `get_products_filtered` para asegurar que las comparaciones sean case-insensitive, utilizando funciones como `UPPER()` (ej. `UPPER(p.set_code) = ANY(set_filter)`) y permitiendo mapeos tanto de cÃ³digo de set como de nombre (ej. `p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter)`). AdemÃ¡s, se estandarizÃ³ la resoluciÃ³n del ID de juego internamente.
- **Regla Derivada:** LEYES_DEL_SISTEMA.md > Toda consulta de filtrado de texto o cÃ³digos provenientes de URLs o interfaces debe ser explÃ­citamente sanitizada y convertida a case-insensitive (`UPPER`, `LOWER` o `ILIKE`) en las funciones de base de datos antes de evaluar un `MATCH`.

### 108. Alignment of Cross-Project Environments (Dev vs. Prod) - 2026-04-28
- **Problema**: Falla total en la carga de Pokemon en el entorno dev a pesar de que el codigo parecia correcto.
- **Causa Raiz**: El entorno de desarrollo (Sandbox: bqfkqnnostzaqueujdms) tenia una tabla de juegos con IDs y codigos diferentes (PKM en lugar de POKEMON, ID 10 en lugar de 23). Ademas, la base de datos estaba vacia para ese juego.
- **Solucion**: Alinear el frontend y los scripts de poblacion con los estandares del Sandbox (PKM, ID 10) y actualizar los RPCs para normalizar multiples variantes a un unico codigo estandar.
- **Regla Derivada**: Antes de diagnosticar logica de frontend, verificar la existencia y estructura de datos en el proyecto Supabase especifico mediante la API o scripts de diagnostico.
