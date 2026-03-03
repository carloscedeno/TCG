# ðŸ§  TCG Hub - Developer Knowledge Base (Lessons Learned)

Este documento registra los desafÃ­os tÃ©cnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.

## ðŸ›  Entorno y Dependencias

### 1. Conflictos de VersiÃ³n en CI/CD (GitHub Actions)

- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.
- **Causa**: Versiones muy recientes de librerÃ­as a veces tardan horas/dÃ­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **LecciÃ³n**:
  - Sincronizar la versiÃ³n de Python del runner (3.12) con la local.
  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.

## ðŸ—„ï¸� Base de Datos y Supabase

### 2. "Precios Invisibles" (AgregaciÃ³n Fallida)

- **Problema**: El script de sincronizaciÃ³n insertaba precios pero no se reflejaban en la UI.
- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requerÃ­a un `condition_id` vÃ¡lido. Los inserts manuales omitÃ­an estos campos, dejando los precios en un limbo.
- **LecciÃ³n**: Todo script de ingesta de precios debe incluir:
  - `timestamp`: ISO string (UTC).
  - `condition_id`: ID numÃ©rico correspondiente (ej: 16 para Near Mint).
  - `is_foil`: Booleano explÃ­cito.

### 3. Timeouts en Filtros (Performance)

- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.
- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin Ã­ndices.
- **LecciÃ³n**:
  - **Ã�ndices CrÃ­ticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.
  - **Estrategia de Consulta**: Para tablas masivas, es mÃ¡s rÃ¡pido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.

## ðŸŒ� Frontend y API

### 4. Coherencia en el Fallback de Supabase

- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".
- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estÃ¡ndar de Postgres) que no existe en esta estructura especÃ­fica.
- **LecciÃ³n**: Mantener mapeos de nombres de columnas idÃ©nticos entre la respuesta del API local y el cÃ³digo de fallback de Supabase.
- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.
- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.
- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.

### 5. Counting Strategy & Timeouts

- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).
- **LecciÃ³n**:
  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinÃ¡micos donde el planificador de Postgres ya tiene estadÃ­sticas.
  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginaciÃ³n con "Infinite Scroll" o botones de "Siguiente".

## ðŸš€ Despliegue y CI/CD

### 6. TypeScript Strict Build (TS6133)

- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.
- **Causa**: ConfiguraciÃ³n de `tsconfig.json` con `noUnusedParameters: true`.
- **LecciÃ³n**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilaciÃ³n exitosa.

### 7. Variables de Entorno en GitHub Actions

- **Problema**: El frontend funcionaba localmente pero en producciÃ³n los dropdowns (Sets) estaban vacÃ­os y las bÃºsquedas fallaban.
- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvÃ­a 404).
- **LecciÃ³n**:
  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.
  - **Resiliencia de Fallback**: Todo endpoint crÃ­tico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no estÃ¡ definido.

---

## ðŸ§  Frontend y UX

### 8. UX de Autocompletado vs. BÃºsqueda Activa (Feb 2026)

- **Problema**: Al implementar el autocompletado, el `debounce` automÃ¡tico disparaba la bÃºsqueda principal cada vez que el usuario escribÃ­a, recargando resultados innecesariamente.
- **LecciÃ³n**: **Desacoplar siempre el input de bÃºsqueda del trigger de bÃºsqueda.**
  - El input solo actualiza el estado local para sugerencias.
  - La bÃºsqueda principal (`activeSearchQuery`) solo se actualiza mediante acciÃ³n explÃ­cita (`Enter` o click en sugerencia).
- **SoluciÃ³n**: Se refactorizÃ³ el frontend para separar `query` (input) de `activeSearchQuery` (fetch).

### 9. Timeout en Queries con DISTINCT ON (Feb 2026)

- **Problema**: `DISTINCT ON (card_name)` + `ORDER BY` con JOIN (`s.release_date`) causaba timeout (Error 500) sin Ã­ndices especÃ­ficos para esa combinaciÃ³n.
- **LecciÃ³n**: **Ã�ndices obligatorios para Sort/Filter.**
  - Si usas `DISTINCT ON (columna)`, DEBE haber un Ã­ndice en `(columna)`.
  - Si filtras con `ILIKE`, DEBE haber Ã­ndice `GIN` con `pg_trgm`.
  - Verificar siempre con `EXPLAIN ANALYZE` en datos con volumetrÃ­a real.

### 10. NO Usar Queries DinÃ¡micas para Vistas Principales de Tablas Grandes (Feb 2026)

- **Problema**: A pesar de Ã­ndices correctos, `DISTINCT ON` sobre 80,000+ filas con Joins y RLS activo sigue siendo demasiado pesado.
- **LecciÃ³n Definitiva: USAR VISTA MATERIALIZADA.**
  - Si deduplicar o agregar de tabla principal grande (>10k filas): pre-calcular en `MATERIALIZED VIEW`.
  - Usar `SECURITY DEFINER` en la funciÃ³n RPC para saltar overhead de RLS si la vista ya contiene datos pÃºblicos filtrados.

### 11. CardModal â€” Nunca Filtrar all_versions al Cambiar Printing (Feb 2026)

- **Problema**: Al cambiar el printing seleccionado, la lista de versiones desaparecÃ­a si la respuesta de la API para ese printing no incluÃ­a todas las versiones.
- **LecciÃ³n**: Preservar siempre el array `all_versions` en el estado del frontend al navegar entre printings. Nunca re-derivarlo de la respuesta parcial de un printing individual.

### 12. Soporte Foil Virtual â€” Entidades Virtuales No En DB (Feb 2026)

- **Problema**: Intentar buscar registros de cartas foil como entidades separadas en la DB fallaba.
- **LecciÃ³n**: Las cartas foil son **entradas virtuales** generadas por la Edge Function `tcg-api` cuando `prices.usd_foil IS NOT NULL`. No existen como filas separadas en `card_printings`. Nunca hacer migrations que asuman lo contrario.

### 13. DFC (Double-Faced Cards) â€” Links y Flip de Imagen (Feb 2026)

- **Problema**: Los links de CardKingdom para DFCs fallaban porque incluÃ­an el nombre de ambas caras (`//`). Las imÃ¡genes DFC no flippeaban.
- **LecciÃ³n**:
  - **Links**: Usar solo `card_faces[0].name` (cara frontal) para bÃºsquedas en CardKingdom.
  - **Flip**: Detectar DFC por `card_faces?.length > 1`. Implementar toggle de imagen client-side.
  - **Fallback Frontend**: Si `image_uris` es null, usar `card_faces[0].image_uris` como fallback.

### 14. Precios: Siempre Parsear como Number (Feb 2026)

- **Problema**: `toFixed()` crasheaba cuando el precio venÃ­a como string o null de la API.
- **LecciÃ³n**: Siempre convertir: `const price = Number(rawPrice)`. Verificar `isNaN(price)` antes de formatear. Mostrar `S/P` si null/undefined.

---

## ðŸŽ¨ DiseÃ±o y Branding

### 15. Restricciones de ItÃ¡licas por SecciÃ³n â€” Spec Geekorium (Feb 2026)

- **Problema**: Clase `italic` aparecÃ­a en headings de secciones donde la spec lo prohÃ­be explÃ­citamente.
- **Causa RaÃ­z**: El diseÃ±ador estableciÃ³ que `font-web-titles` (Daito/Roboto Slab) no debe usarse en itÃ¡lica en secciones de contenido informativo (Â¿CÃ³mo comprar?, Ayuda). Solo se permite italic en tÃ­tulos de marca/admin.
- **SoluciÃ³n**: Remover `italic` de `Home.tsx` L581 (Â¿CÃ³mo comprar?) y `HelpPage.tsx` L28 (Â¿AÃºn tienes dudas?).
- **Regla Derivada**: Al implementar headings con `font-web-titles`, verificar si la secciÃ³n estÃ¡ en la lista de restricciones de la spec. La lista actual: secciÃ³n `Â¿CÃ³mo comprar?` y secciÃ³n de Ayuda.

### 16. Tokens de Color de Marca: Incluir Todas las Variantes del Spec (Feb 2026)

- **Problema**: El token `#523176` (variante tÃ©cnica morada) estaba en la spec pero no definido en `index.css` como CSS variable.
- **Causa RaÃ­z**: Al implementar la paleta inicial se omitiÃ³ esta variante por considerarla secundaria.
- **SoluciÃ³n**: Agregar `--color-geeko-violet-deep: #523176` al bloque `@theme` de `index.css`.
- **Regla Derivada**: Al adoptar un nuevo spec de diseÃ±o, mapear **todas** las variantes de color del documento al sistema de tokens, incluso si no se usan inmediatamente. Pendiente usarlo en: bordes de cartas Lorcana, sellos de cera, accents de sets especÃ­ficos.

---

## ðŸ§ª Testing

### 17. Patch Target Correcto para Servicios con `supabase_admin` (Feb 2026)

- **Problema**: `test_collection_import.py` fallaba con `AttributeError: module does not have the attribute 'supabase'`.
- **Causa RaÃ­z**: El service `collection_service.py` fue refactorizado para usar `supabase_admin = get_supabase_admin()` en lugar de `supabase`. Los tests seguÃ­an mockeando el atributo viejo.
- **SoluciÃ³n**: Cambiar el patch target en los fixtures de `'api.services.collection_service.supabase'` â†’ `'api.services.collection_service.supabase_admin'`.
- **Regla Derivada**: Cuando un servicio renombra su variable de cliente de Supabase, buscar y actualizar TODOS los tests que la mockean. Usar `grep_search` con `patch(` + el mÃ³dulo para detectarlos.

### 18. Lazy Imports en Servicios â€” CÃ³mo Parchearlos (Feb 2026)

- **Problema**: `patch('src.api.services.collection_service.MatcherService')` fallaba porque `MatcherService` se importa dentro del cuerpo de la funciÃ³n (`from .matcher_service import MatcherService`), no al nivel del mÃ³dulo.
- **Causa RaÃ­z**: Los lazy imports (dentro de la funciÃ³n) no crean atributos en el namespace del mÃ³dulo que los contiene, por lo que no son patcheables desde ahÃ­.
- **SoluciÃ³n**: Parchear en el mÃ³dulo **fuente**, no en el mÃ³dulo importador: `patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock)`.
- **Regla Derivada**: Si una clase/funciÃ³n se importa con `from .modulo import Clase` dentro de una funciÃ³n, siempre parchear en `modulo.Clase`, no en `servicio_importador.Clase`.

### 19. Mock Chain para `ValuationService` â€” Two-Step Query (Feb 2026)

- **Problema**: `test_valuation_calculation_logic` afirmaba `store_price == 100.0` pero obtenÃ­a `1.0`.
- **Causa RaÃ­z**: El test pasaba `{'source': 'geekorium', 'price_usd': 100.0}` pero el servicio NO usa el campo `source` â€” hace primero un query a la tabla `sources` para obtener un mapa `{source_id â†’ source_code}`, luego itera `price_history` buscando `source_id` (entero).
- **SoluciÃ³n**: Reescribir el mock como un `table_side_effect` que retorna datos distintos por tabla: `sources` â†’ mapa de IDs, `price_history` â†’ filas con `source_id` (int), no `source` (str).
- **Regla Derivada**: Antes de escribir mocks para servicios, leer su implementaciÃ³n para identificar el flujo exacto de queries. Los servicios con lookups de tablas de referencia (como `sources`, `conditions`) requieren mocks de mÃºltiples tablas.

### 20. Reemplazo Exhaustivo de Colores Heredados al Refactorizar UI (Feb 2026)

- **Problema**: Tras remover la clase `italic` en `HelpPage.tsx` para ajustarse a una regla tipogrÃ¡fica nueva, se revelaron clases utilitarias de color heredadas (`bg-[#f4e4bc]`, `text-black`, `bg-[#25D366]`) que desentonaban con el nuevo spec.
- **Causa RaÃ­z**: RefactorizaciÃ³n local "quirÃºrgica" (solo tocar `italic`) en componentes sin auditar si su paleta general sigue el nuevo "DiseÃ±o Fix".
- **SoluciÃ³n**: Reemplazo masivo de colores heredados en el componente modificado. Beige (`#f4e4bc`) a Primario (`#373266`), Negro (`text-black`) a Blanco (`#FFFFFF`), y Verde (`#25D366`) a Cyan (`geeko-cyan` / `#00AEB4`). AdemÃ¡s se debiÃ³ re-aÃ±adir `font-web-titles` porque el `<h3/>` carecÃ­a de familia tipogrÃ¡fica tras quitar la itÃ¡lica.
- **Regla Derivada**: Siempre que se modifique un componente heredado ("legacy") para ajustarlo a nuevas reglas de brand, auditar TODO el componente. Eliminar colores *hardcoded* obsoletos y aplicar los nuevos tokens de marca. Validar que no perder clases como `italic` descubra la falta de clases estructurales como familias de fuentes (`font-web-titles`).

### 21. Fallbacks Visuales en Vistas Combinadas de DB (Feb 2026)

- **Problema**: Las imÃ¡genes de las cartas no se mostraban en el Grid ("Imagen No Disponible"), a pesar de existir imÃ¡genes en la base de datos de Scryfall.
- **Causa RaÃ­z**: El endpoint RPC `get_products_filtered` retornaba directamente la columna `image_url` de la tabla `products`, la cual puede ser nula dependiendo del formato de importaciÃ³n, en lugar de considerar el fallback a la tabla unida `card_printings`.
- **SoluciÃ³n**: Refactorizar la proyecciÃ³n SQL para incluir `COALESCE(p.image_url, cp.image_url) as image_url`.
- **Regla Derivada**: Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.

### 22. Validaciones Locales Estrictas (Feb 2026)

- **Problema**: Formularios sin validación previa enviaban datos inconsistentes (ej. formato de teléfono erróneo) al equipo de soporte.
- **Solución / Lección**: Validar clide-side formatos específicos (ej. venezolanos 04), rechazar letras en cédula (
eplace(/\D/g, '')), y forzar longitud en campos de texto antes de habilitar el pago.
- **Regla Derivada**: Todo input vital para el pago/contacto físico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.

### 23. BÃºsqueda y ValidaciÃ³n de Stock en SQL (Feb 2026)

- **Problema**: El carrito permitÃ­a agregar mÃ¡s cartas de las que habÃ­a en stock si se hacÃ­an mÃºltiples clicks o llamadas al RPC dd_to_cart. AdemÃ¡s, la bÃºsqueda global a veces no priorizaba coincidencias exactas.
- **Causa RaÃ­z**: El control de stock no totalizaba las cantidades previas del mismo item en el carrito antes de comparar con el stock mÃ¡ximo.
- **SoluciÃ³n**: Refactorizar dd_to_cart sumando quantity + v_current_qty > v_stock y lanzando un error. Ajustar get_products_filtered con un ORDER BY que priorice strings idÃ©nticos (p.name ILIKE ).
- **Regla Derivada**: Todo control de inventario en el backend debe ser calculable (suma del estado actual + intento) y rechazar transacciones a nivel SQL, y las funciones de bÃºsqueda deben devolver coincidencias exactas primero.

### 24. Resolviendo TipografÃ­as en UI EspecÃ­fica (Feb 2026)

- **Problema**: El diseÃ±o UI requerÃ­a mapeos hiperespecÃ­ficos de tipografÃ­as (Daito para tÃ­tulos, Bogue para precios, Rubik para cuerpo) en base a mockups donde no bastaba heredar la tipografÃ­a general.
- **Causa RaÃ­z**: Las clases CSS como ont-sans no sobreescribÃ­an correctamente la jerarquÃ­a necesaria si el componente padre tenÃ­a otra.
- **SoluciÃ³n**: Aplicar clases nominales directas en Tailwind (ont-web-titles, ont-titles, ont-sans) a los subnodos del texto en los componentes y remover tags italic que forzaban el fallback del font.
- **Regla Derivada**: La fidelidad 1:1 de PRD UI requiere aplicar clases tipogrÃ¡ficas explÃ­citas en el nivel mÃ¡s bajo (hojas) del nodo del DOM y evitar modificadores de estilo globales (como italic o bold general) que rompan el font-face de UI.

### [Guest Checkout & Inventory Pattern] â€” 2026-02-27

- **Problema:** Riesgo de doble venta en un e-commerce de productos Ãºnicos (trading cards) cuando los pagos son asÃ­ncronos (Zelle/Pago MÃ³vil) y los usuarios no tienen cuenta.
- **Causa RaÃ­z:** Falta de un estado intermedio que bloquee el inventario temporalmente mientras el pago ocurre off-platform.
- **SoluciÃ³n:** Implementar un estado de orden `pending_payment` que reduce el `reserved_stock` inmediatamente mediante un RPC atÃ³mico de Supabase, acompaÃ±ado de un Job/RPC que cancela las Ã³rdenes expiradas (superan 24 hrs sin validaciÃ³n) y devuelve el stock. Uso de URLs Ãºnicas (`/order/:id`) para que invitados suban su comprobante.
- **Regla Derivada:** Todo cambio de estado de `orders` debe evaluarse en el RPC `update_order_status` para gestionar `reserved_stock` vs `stock` dinÃ¡micamente y de forma atÃ³mica.

### 2. Validación y Reserva Diferida - 2026-03-01

- **Problema:** Exigir comprobantes upfront choca con la realidad del stock físico desfasado.
- **Causa Raíz:** El proceso asumía que el stock del e-commerce siempre era 100% exacto respecto a la tienda física.
- **Solución:** Romper el pago y la verificación en 2 pasos. Reservar el stock primero (pending_verification), y pagar después (awaiting_payment).
- **Regla Derivada:** Cualquier estado que cambie a cancelled/returned desde active debe liberar el stock inmediatamente para evitar desajustes remanentes.

### 3. Evitar Bloqueos de UI por Fugas de InteracciÃ³n - 2026-03-01

- **Problema:** Un modal (CardModal) que se cierra al agregar al carrito funcionaba bien en testing local pero dejaba la UI colgada (timeout por capa transparente superpuesta) en pruebas E2E en ProducciÃ³n.
- **Causa RaÃ­z:** El modal tenÃ­a lÃ³gica condicional que solo lo cerraba si se pasaba un prop onAddToCartSuccess. En flujos donde este prop faltaba, la promesa colgaba visualmente porque esperaba al callback para cerrarse.
- **SoluciÃ³n:** Consolidar el cierre del modal (onClose()) para que siempre ocurra de manera incondicional, independiente de callbacks extra.
- **Regla Derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales a nivel del componente que las renderiza, no deben depender de hooks inyectados opcionales.

### 10. TypeError: reduce is not a function en ProducciÃ³n â€” 2026-03-02

- **Problema:** La aplicaciÃ³n fallaba en producciÃ³n al navegar a /profile con un error Uncaught TypeError: s.reduce is not a function.
- **Causa RaÃ­z:** Respuestas de la API que devuelven objetos vacÃ­os o
ull en lugares donde se espera un arreglo (ej. cartItems, collection). React Context o servicios no estaban garantizando un valor fallback de arreglo estable.
- **SoluciÃ³n:** ImplementaciÃ³n masiva de protecciones Array.isArray(data) ? data : [] antes de cualquier llamada a .reduce(), .map() o .filter().
- **Regla Derivada:** **Defensive Data Handling**. Prohibido usar mÃ©todos de arreglo sobre datos de API sin validaciÃ³n previa con Array.isArray(). Codificado en AGENTS.md y PRD_MASTER.md.

### 64. Redundancia Crítica en Historial de Precios — 2026-03-02

- **Problema:** La base de datos alcanzó 1.42 GB (límite plan 1.1 GB) debido a la tabla 'price_history'.
- **Causa Raíz:** Scrapers guardaban el precio diario de 30,000+ cartas incluso si el precio no variaba, generando un 95% de redundancia.
- **Solución:** Deduplicación técnica e implementación de lógica diferencial en 'sync_cardkingdom_api.py'.

### 65. Integración de ManaBox y Priorización de Scryfall ID (Marzo 2026)

- **Problema**: La importación por nombre/set puede fallar en cartas con nombres similares o múltiples versiones (promos, showcase).
- **Solución**: Implementar una detección automática de encabezados en el frontend (ManaBox ID, Scryfall ID) y priorizar la búsqueda por scryfall_id en el backend. Esto garantiza una precisión del 100% y evita el mapeo manual.
- **Normalización**: Las condiciones de ManaBox (e.g.
ear_mint, lightly_played) deben normalizarse en el backend a códigos internos (NM, LP) para mantener la integridad de la base de datos.
- **UX**: Una pre-visualización que use los mismos índices de mapeo que la lógica de parseo evita confusiones visuales en el proceso de importación.

### 66. Soporte de Foliación (Finish) y Agregación en Lotes (Marzo 2026)

- **Problema**: Errores `ON CONFLICT` al intentar importar la misma carta en versión Foil y Non-Foil en un mismo lote, y fallos de visualización de precios/stock para versiones foil.
- **Causa Raíz**: La restricción de unicidad en la tabla `products` no incluía la columna `finish`. Además, la lógica de importación no consolidaba duplicados dentro del mismo batch antes de enviarlos a la DB.
- **Solución**:
  - **DB**: Agregar columna `finish` y actualizar la restricción única a `(printing_id, condition, finish)`.
  - **Edge Function**: Implementar un diccionario de agregación en el `tcg-api` que sume cantidades de filas idénticas (mismo printing+condition+finish) antes del `upsert`.
  - **Vistas**: Actualizar `products_with_prices` para incluir la columna `finish` y asegurar que el frontend reciba este metadato.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/LEYES_DEL_SISTEMA.md) -> Regla de Negocio 3 (Agregación en Lotes).
