# Ã°Å¸Â§Â  TCG Hub - Developer Knowledge Base (Lessons Learned)

Este documento registra los desafÃƒÂ­os tÃƒÂ©cnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.

## Ã°Å¸â€ºÂ  Entorno y Dependencias

### 1. Conflictos de VersiÃƒÂ³n en CI/CD (GitHub Actions)

- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.
- **Causa**: Versiones muy recientes de librerÃƒÂ­as a veces tardan horas/dÃƒÂ­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **LecciÃƒÂ³n**:
  - Sincronizar la versiÃƒÂ³n de Python del runner (3.12) con la local.
  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.

## Ã°Å¸â€”â€žÃ¯Â¸ï¿½ Base de Datos y Supabase

### 2. "Precios Invisibles" (AgregaciÃƒÂ³n Fallida)

- **Problema**: El script de sincronizaciÃƒÂ³n insertaba precios pero no se reflejaban en la UI.
- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requerÃƒÂ­a un `condition_id` vÃƒÂ¡lido. Los inserts manuales omitÃƒÂ­an estos campos, dejando los precios en un limbo.
- **LecciÃƒÂ³n**: Todo script de ingesta de precios debe incluir:
  - `timestamp`: ISO string (UTC).
  - `condition_id`: ID numÃƒÂ©rico correspondiente (ej: 16 para Near Mint).
  - `is_foil`: Booleano explÃƒÂ­cito.

### 3. Timeouts en Filtros (Performance)

- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.
- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin ÃƒÂ­ndices.
- **LecciÃƒÂ³n**:
  - **Ãƒï¿½ndices CrÃƒÂ­ticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.
  - **Estrategia de Consulta**: Para tablas masivas, es mÃƒÂ¡s rÃƒÂ¡pido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.

## Ã°Å¸Å’ï¿½ Frontend y API

### 4. Coherencia en el Fallback de Supabase

- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".
- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estÃƒÂ¡ndar de Postgres) que no existe en esta estructura especÃƒÂ­fica.
- **LecciÃƒÂ³n**: Mantener mapeos de nombres de columnas idÃƒÂ©nticos entre la respuesta del API local y el cÃƒÂ³digo de fallback de Supabase.
- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.
- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.
- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.

### 5. Counting Strategy & Timeouts

- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).
- **LecciÃƒÂ³n**:
  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinÃƒÂ¡micos donde el planificador de Postgres ya tiene estadÃƒÂ­sticas.
  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginaciÃƒÂ³n con "Infinite Scroll" o botones de "Siguiente".

## Ã°Å¸Å¡â‚¬ Despliegue y CI/CD

### 6. TypeScript Strict Build (TS6133)

- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.
- **Causa**: ConfiguraciÃƒÂ³n de `tsconfig.json` con `noUnusedParameters: true`.
- **LecciÃƒÂ³n**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilaciÃƒÂ³n exitosa.

### 7. Variables de Entorno en GitHub Actions

- **Problema**: El frontend funcionaba localmente pero en producciÃƒÂ³n los dropdowns (Sets) estaban vacÃƒÂ­os y las bÃƒÂºsquedas fallaban.
- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvÃƒÂ­a 404).
- **LecciÃƒÂ³n**:
  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.
  - **Resiliencia de Fallback**: Todo endpoint crÃƒÂ­tico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no estÃƒÂ¡ definido.

---

## Ã°Å¸Â§Â  Frontend y UX

### 8. UX de Autocompletado vs. BÃƒÂºsqueda Activa (Feb 2026)

- **Problema**: Al implementar el autocompletado, el `debounce` automÃƒÂ¡tico disparaba la bÃƒÂºsqueda principal cada vez que el usuario escribÃƒÂ­a, recargando resultados innecesariamente.
- **LecciÃƒÂ³n**: **Desacoplar siempre el input de bÃƒÂºsqueda del trigger de bÃƒÂºsqueda.**
  - El input solo actualiza el estado local para sugerencias.
  - La bÃƒÂºsqueda principal (`activeSearchQuery`) solo se actualiza mediante acciÃƒÂ³n explÃƒÂ­cita (`Enter` o click en sugerencia).
- **SoluciÃƒÂ³n**: Se refactorizÃƒÂ³ el frontend para separar `query` (input) de `activeSearchQuery` (fetch).

### 9. Timeout en Queries con DISTINCT ON (Feb 2026)

- **Problema**: `DISTINCT ON (card_name)` + `ORDER BY` con JOIN (`s.release_date`) causaba timeout (Error 500) sin ÃƒÂ­ndices especÃƒÂ­ficos para esa combinaciÃƒÂ³n.
- **LecciÃƒÂ³n**: **Ãƒï¿½ndices obligatorios para Sort/Filter.**
  - Si usas `DISTINCT ON (columna)`, DEBE haber un ÃƒÂ­ndice en `(columna)`.
  - Si filtras con `ILIKE`, DEBE haber ÃƒÂ­ndice `GIN` con `pg_trgm`.
  - Verificar siempre con `EXPLAIN ANALYZE` en datos con volumetrÃƒÂ­a real.

### 10. NO Usar Queries DinÃƒÂ¡micas para Vistas Principales de Tablas Grandes (Feb 2026)

- **Problema**: A pesar de ÃƒÂ­ndices correctos, `DISTINCT ON` sobre 80,000+ filas con Joins y RLS activo sigue siendo demasiado pesado.
- **LecciÃƒÂ³n Definitiva: USAR VISTA MATERIALIZADA.**
  - Si deduplicar o agregar de tabla principal grande (>10k filas): pre-calcular en `MATERIALIZED VIEW`.
  - Usar `SECURITY DEFINER` en la funciÃƒÂ³n RPC para saltar overhead de RLS si la vista ya contiene datos pÃƒÂºblicos filtrados.

### 11. CardModal Ã¢â‚¬â€� Nunca Filtrar all_versions al Cambiar Printing (Feb 2026)

- **Problema**: Al cambiar el printing seleccionado, la lista de versiones desaparecÃƒÂ­a si la respuesta de la API para ese printing no incluÃƒÂ­a todas las versiones.
- **LecciÃƒÂ³n**: Preservar siempre el array `all_versions` en el estado del frontend al navegar entre printings. Nunca re-derivarlo de la respuesta parcial de un printing individual.

### 12. Soporte Foil Virtual Ã¢â‚¬â€� Entidades Virtuales No En DB (Feb 2026)

- **Problema**: Intentar buscar registros de cartas foil como entidades separadas en la DB fallaba.
- **LecciÃƒÂ³n**: Las cartas foil son **entradas virtuales** generadas por la Edge Function `tcg-api` cuando `prices.usd_foil IS NOT NULL`. No existen como filas separadas en `card_printings`. Nunca hacer migrations que asuman lo contrario.

### 13. DFC (Double-Faced Cards) Ã¢â‚¬â€� Links y Flip de Imagen (Feb 2026)

- **Problema**: Los links de CardKingdom para DFCs fallaban porque incluÃƒÂ­an el nombre de ambas caras (`//`). Las imÃƒÂ¡genes DFC no flippeaban.
- **LecciÃƒÂ³n**:
  - **Links**: Usar solo `card_faces[0].name` (cara frontal) para bÃƒÂºsquedas en CardKingdom.
  - **Flip**: Detectar DFC por `card_faces?.length > 1`. Implementar toggle de imagen client-side.
  - **Fallback Frontend**: Si `image_uris` es null, usar `card_faces[0].image_uris` como fallback.

### 14. Precios: Siempre Parsear como Number (Feb 2026)

- **Problema**: `toFixed()` crasheaba cuando el precio venÃƒÂ­a como string o null de la API.
- **LecciÃƒÂ³n**: Siempre convertir: `const price = Number(rawPrice)`. Verificar `isNaN(price)` antes de formatear. Mostrar `S/P` si null/undefined.

---

## Ã°Å¸Å½Â¨ DiseÃƒÂ±o y Branding

### 15. Restricciones de ItÃƒÂ¡licas por SecciÃƒÂ³n Ã¢â‚¬â€� Spec Geekorium (Feb 2026)

- **Problema**: Clase `italic` aparecÃƒÂ­a en headings de secciones donde la spec lo prohÃƒÂ­be explÃƒÂ­citamente.
- **Causa RaÃƒÂ­z**: El diseÃƒÂ±ador estableciÃƒÂ³ que `font-web-titles` (Daito/Roboto Slab) no debe usarse en itÃƒÂ¡lica en secciones de contenido informativo (Ã‚Â¿CÃƒÂ³mo comprar?, Ayuda). Solo se permite italic en tÃƒÂ­tulos de marca/admin.
- **SoluciÃƒÂ³n**: Remover `italic` de `Home.tsx` L581 (Ã‚Â¿CÃƒÂ³mo comprar?) y `HelpPage.tsx` L28 (Ã‚Â¿AÃƒÂºn tienes dudas?).
- **Regla Derivada**: Al implementar headings con `font-web-titles`, verificar si la secciÃƒÂ³n estÃƒÂ¡ en la lista de restricciones de la spec. La lista actual: secciÃƒÂ³n `Ã‚Â¿CÃƒÂ³mo comprar?` y secciÃƒÂ³n de Ayuda.

### 16. Tokens de Color de Marca: Incluir Todas las Variantes del Spec (Feb 2026)

- **Problema**: El token `#523176` (variante tÃƒÂ©cnica morada) estaba en la spec pero no definido en `index.css` como CSS variable.
- **Causa RaÃƒÂ­z**: Al implementar la paleta inicial se omitiÃƒÂ³ esta variante por considerarla secundaria.
- **SoluciÃƒÂ³n**: Agregar `--color-geeko-violet-deep: #523176` al bloque `@theme` de `index.css`.
- **Regla Derivada**: Al adoptar un nuevo spec de diseÃƒÂ±o, mapear **todas** las variantes de color del documento al sistema de tokens, incluso si no se usan inmediatamente. Pendiente usarlo en: bordes de cartas Lorcana, sellos de cera, accents de sets especÃƒÂ­ficos.

---

## Ã°Å¸Â§Âª Testing

### 17. Patch Target Correcto para Servicios con `supabase_admin` (Feb 2026)

- **Problema**: `test_collection_import.py` fallaba con `AttributeError: module does not have the attribute 'supabase'`.
- **Causa RaÃƒÂ­z**: El service `collection_service.py` fue refactorizado para usar `supabase_admin = get_supabase_admin()` en lugar de `supabase`. Los tests seguÃƒÂ­an mockeando el atributo viejo.
- **SoluciÃƒÂ³n**: Cambiar el patch target en los fixtures de `'api.services.collection_service.supabase'` Ã¢â€ â€™ `'api.services.collection_service.supabase_admin'`.
- **Regla Derivada**: Cuando un servicio renombra su variable de cliente de Supabase, buscar y actualizar TODOS los tests que la mockean. Usar `grep_search` con `patch(` + el mÃƒÂ³dulo para detectarlos.

### 18. Lazy Imports en Servicios Ã¢â‚¬â€� CÃƒÂ³mo Parchearlos (Feb 2026)

- **Problema**: `patch('src.api.services.collection_service.MatcherService')` fallaba porque `MatcherService` se importa dentro del cuerpo de la funciÃƒÂ³n (`from .matcher_service import MatcherService`), no al nivel del mÃƒÂ³dulo.
- **Causa RaÃƒÂ­z**: Los lazy imports (dentro de la funciÃƒÂ³n) no crean atributos en el namespace del mÃƒÂ³dulo que los contiene, por lo que no son patcheables desde ahÃƒÂ­.
- **SoluciÃƒÂ³n**: Parchear en el mÃƒÂ³dulo **fuente**, no en el mÃƒÂ³dulo importador: `patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock)`.
- **Regla Derivada**: Si una clase/funciÃƒÂ³n se importa con `from .modulo import Clase` dentro de una funciÃƒÂ³n, siempre parchear en `modulo.Clase`, no en `servicio_importador.Clase`.

### 19. Mock Chain para `ValuationService` Ã¢â‚¬â€� Two-Step Query (Feb 2026)

- **Problema**: `test_valuation_calculation_logic` afirmaba `store_price == 100.0` pero obtenÃƒÂ­a `1.0`.
- **Causa RaÃƒÂ­z**: El test pasaba `{'source': 'geekorium', 'price_usd': 100.0}` pero el servicio NO usa el campo `source` Ã¢â‚¬â€� hace primero un query a la tabla `sources` para obtener un mapa `{source_id Ã¢â€ â€™ source_code}`, luego itera `price_history` buscando `source_id` (entero).
- **SoluciÃƒÂ³n**: Reescribir el mock como un `table_side_effect` que retorna datos distintos por tabla: `sources` Ã¢â€ â€™ mapa de IDs, `price_history` Ã¢â€ â€™ filas con `source_id` (int), no `source` (str).
- **Regla Derivada**: Antes de escribir mocks para servicios, leer su implementaciÃƒÂ³n para identificar el flujo exacto de queries. Los servicios con lookups de tablas de referencia (como `sources`, `conditions`) requieren mocks de mÃƒÂºltiples tablas.

### 20. Reemplazo Exhaustivo de Colores Heredados al Refactorizar UI (Feb 2026)

- **Problema**: Tras remover la clase `italic` en `HelpPage.tsx` para ajustarse a una regla tipogrÃƒÂ¡fica nueva, se revelaron clases utilitarias de color heredadas (`bg-[#f4e4bc]`, `text-black`, `bg-[#25D366]`) que desentonaban con el nuevo spec.
- **Causa RaÃƒÂ­z**: RefactorizaciÃƒÂ³n local "quirÃƒÂºrgica" (solo tocar `italic`) en componentes sin auditar si su paleta general sigue el nuevo "DiseÃƒÂ±o Fix".
- **SoluciÃƒÂ³n**: Reemplazo masivo de colores heredados en el componente modificado. Beige (`#f4e4bc`) a Primario (`#373266`), Negro (`text-black`) a Blanco (`#FFFFFF`), y Verde (`#25D366`) a Cyan (`geeko-cyan` / `#00AEB4`). AdemÃƒÂ¡s se debiÃƒÂ³ re-aÃƒÂ±adir `font-web-titles` porque el `<h3/>` carecÃƒÂ­a de familia tipogrÃƒÂ¡fica tras quitar la itÃƒÂ¡lica.
- **Regla Derivada**: Siempre que se modifique un componente heredado ("legacy") para ajustarlo a nuevas reglas de brand, auditar TODO el componente. Eliminar colores *hardcoded* obsoletos y aplicar los nuevos tokens de marca. Validar que no perder clases como `italic` descubra la falta de clases estructurales como familias de fuentes (`font-web-titles`).

### 21. Fallbacks Visuales en Vistas Combinadas de DB (Feb 2026)

- **Problema**: Las imÃƒÂ¡genes de las cartas no se mostraban en el Grid ("Imagen No Disponible"), a pesar de existir imÃƒÂ¡genes en la base de datos de Scryfall.
- **Causa RaÃƒÂ­z**: El endpoint RPC `get_products_filtered` retornaba directamente la columna `image_url` de la tabla `products`, la cual puede ser nula dependiendo del formato de importaciÃƒÂ³n, en lugar de considerar el fallback a la tabla unida `card_printings`.
- **SoluciÃƒÂ³n**: Refactorizar la proyecciÃƒÂ³n SQL para incluir `COALESCE(p.image_url, cp.image_url) as image_url`.
- **Regla Derivada**: Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.

### 22. Validaciones Locales Estrictas (Feb 2026)

- **Problema**: Formularios sin validaciÃ³n previa enviaban datos inconsistentes (ej. formato de telÃ©fono errÃ³neo) al equipo de soporte.
- **SoluciÃ³n / LecciÃ³n**: Validar clide-side formatos especÃ­ficos (ej. venezolanos 04), rechazar letras en cÃ©dula (
eplace(/\D/g, '')), y forzar longitud en campos de texto antes de habilitar el pago.
- **Regla Derivada**: Todo input vital para el pago/contacto fÃ­sico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.

### 23. BÃƒÂºsqueda y ValidaciÃƒÂ³n de Stock en SQL (Feb 2026)

- **Problema**: El carrito permitÃƒÂ­a agregar mÃƒÂ¡s cartas de las que habÃƒÂ­a en stock si se hacÃƒÂ­an mÃƒÂºltiples clicks o llamadas al RPC dd_to_cart. AdemÃƒÂ¡s, la bÃƒÂºsqueda global a veces no priorizaba coincidencias exactas.
- **Causa RaÃƒÂ­z**: El control de stock no totalizaba las cantidades previas del mismo item en el carrito antes de comparar con el stock mÃƒÂ¡ximo.
- **SoluciÃƒÂ³n**: Refactorizar dd_to_cart sumando quantity + v_current_qty > v_stock y lanzando un error. Ajustar get_products_filtered con un ORDER BY que priorice strings idÃƒÂ©nticos (p.name ILIKE ).
- **Regla Derivada**: Todo control de inventario en el backend debe ser calculable (suma del estado actual + intento) y rechazar transacciones a nivel SQL, y las funciones de bÃƒÂºsqueda deben devolver coincidencias exactas primero.

### 24. Resolviendo TipografÃƒÂ­as en UI EspecÃƒÂ­fica (Feb 2026)

- **Problema**: El diseÃƒÂ±o UI requerÃƒÂ­a mapeos hiperespecÃƒÂ­ficos de tipografÃƒÂ­as (Daito para tÃƒÂ­tulos, Bogue para precios, Rubik para cuerpo) en base a mockups donde no bastaba heredar la tipografÃƒÂ­a general.
- **Causa RaÃƒÂ­z**: Las clases CSS como ont-sans no sobreescribÃƒÂ­an correctamente la jerarquÃƒÂ­a necesaria si el componente padre tenÃƒÂ­a otra.
- **SoluciÃƒÂ³n**: Aplicar clases nominales directas en Tailwind (ont-web-titles, ont-titles, ont-sans) a los subnodos del texto en los componentes y remover tags italic que forzaban el fallback del font.
- **Regla Derivada**: La fidelidad 1:1 de PRD UI requiere aplicar clases tipogrÃƒÂ¡ficas explÃƒÂ­citas en el nivel mÃƒÂ¡s bajo (hojas) del nodo del DOM y evitar modificadores de estilo globales (como italic o bold general) que rompan el font-face de UI.

### [Guest Checkout & Inventory Pattern] Ã¢â‚¬â€� 2026-02-27

- **Problema:** Riesgo de doble venta en un e-commerce de productos ÃƒÂºnicos (trading cards) cuando los pagos son asÃƒÂ­ncronos (Zelle/Pago MÃƒÂ³vil) y los usuarios no tienen cuenta.
- **Causa RaÃƒÂ­z:** Falta de un estado intermedio que bloquee el inventario temporalmente mientras el pago ocurre off-platform.
- **SoluciÃƒÂ³n:** Implementar un estado de orden `pending_payment` que reduce el `reserved_stock` inmediatamente mediante un RPC atÃƒÂ³mico de Supabase, acompaÃƒÂ±ado de un Job/RPC que cancela las ÃƒÂ³rdenes expiradas (superan 24 hrs sin validaciÃƒÂ³n) y devuelve el stock. Uso de URLs ÃƒÂºnicas (`/order/:id`) para que invitados suban su comprobante.
- **Regla Derivada:** Todo cambio de estado de `orders` debe evaluarse en el RPC `update_order_status` para gestionar `reserved_stock` vs `stock` dinÃƒÂ¡micamente y de forma atÃƒÂ³mica.

### 2. ValidaciÃ³n y Reserva Diferida - 2026-03-01

- **Problema:** Exigir comprobantes upfront choca con la realidad del stock fÃ­sico desfasado.
- **Causa RaÃ­z:** El proceso asumÃ­a que el stock del e-commerce siempre era 100% exacto respecto a la tienda fÃ­sica.
- **SoluciÃ³n:** Romper el pago y la verificaciÃ³n en 2 pasos. Reservar el stock primero (pending_verification), y pagar despuÃ©s (awaiting_payment).
- **Regla Derivada:** Cualquier estado que cambie a cancelled/returned desde active debe liberar el stock inmediatamente para evitar desajustes remanentes.

### 3. Evitar Bloqueos de UI por Fugas de InteracciÃƒÂ³n - 2026-03-01

- **Problema:** Un modal (CardModal) que se cierra al agregar al carrito funcionaba bien en testing local pero dejaba la UI colgada (timeout por capa transparente superpuesta) en pruebas E2E en ProducciÃƒÂ³n.
- **Causa RaÃƒÂ­z:** El modal tenÃƒÂ­a lÃƒÂ³gica condicional que solo lo cerraba si se pasaba un prop onAddToCartSuccess. En flujos donde este prop faltaba, la promesa colgaba visualmente porque esperaba al callback para cerrarse.
- **SoluciÃƒÂ³n:** Consolidar el cierre del modal (onClose()) para que siempre ocurra de manera incondicional, independiente de callbacks extra.
- **Regla Derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales a nivel del componente que las renderiza, no deben depender de hooks inyectados opcionales.

### 10. TypeError: reduce is not a function en ProducciÃƒÂ³n Ã¢â‚¬â€� 2026-03-02

- **Problema:** La aplicaciÃƒÂ³n fallaba en producciÃƒÂ³n al navegar a /profile con un error Uncaught TypeError: s.reduce is not a function.
- **Causa RaÃƒÂ­z:** Respuestas de la API que devuelven objetos vacÃƒÂ­os o
ull en lugares donde se espera un arreglo (ej. cartItems, collection). React Context o servicios no estaban garantizando un valor fallback de arreglo estable.
- **SoluciÃƒÂ³n:** ImplementaciÃƒÂ³n masiva de protecciones Array.isArray(data) ? data : [] antes de cualquier llamada a .reduce(), .map() o .filter().
- **Regla Derivada:** **Defensive Data Handling**. Prohibido usar mÃƒÂ©todos de arreglo sobre datos de API sin validaciÃƒÂ³n previa con Array.isArray(). Codificado en AGENTS.md y PRD_MASTER.md.

### 64. Redundancia CrÃ­tica en Historial de Precios â€” 2026-03-02

- **Problema:** La base de datos alcanzÃ³ 1.42 GB (lÃ­mite plan 1.1 GB) debido a la tabla 'price_history'.
- **Causa RaÃ­z:** Scrapers guardaban el precio diario de 30,000+ cartas incluso si el precio no variaba, generando un 95% de redundancia.
- **SoluciÃ³n:** DeduplicaciÃ³n tÃ©cnica e implementaciÃ³n de lÃ³gica diferencial en 'sync_cardkingdom_api.py'.

### 65. IntegraciÃ³n de ManaBox y PriorizaciÃ³n de Scryfall ID (Marzo 2026)

- **Problema**: La importaciÃ³n por nombre/set puede fallar en cartas con nombres similares o mÃºltiples versiones (promos, showcase).
- **SoluciÃ³n**: Implementar una detecciÃ³n automÃ¡tica de encabezados en el frontend (ManaBox ID, Scryfall ID) y priorizar la bÃºsqueda por scryfall_id en el backend. Esto garantiza una precisiÃ³n del 100% y evita el mapeo manual.
- **NormalizaciÃ³n**: Las condiciones de ManaBox (e.g.
ear_mint, lightly_played) deben normalizarse en el backend a cÃ³digos internos (NM, LP) para mantener la integridad de la base de datos.
- **UX**: Una pre-visualizaciÃ³n que use los mismos Ã­ndices de mapeo que la lÃ³gica de parseo evita confusiones visuales en el proceso de importaciÃ³n.

### 66. Soporte de FoliaciÃ³n (Finish) y AgregaciÃ³n en Lotes (Marzo 2026)

- **Problema**: Errores `ON CONFLICT` al intentar importar la misma carta en versiÃ³n Foil y Non-Foil en un mismo lote, y fallos de visualizaciÃ³n de precios/stock para versiones foil.
- **Causa RaÃ­z**: La restricciÃ³n de unicidad en la tabla `products` no incluÃ­a la columna `finish`. AdemÃ¡s, la lÃ³gica de importaciÃ³n no consolidaba duplicados dentro del mismo batch antes de enviarlos a la DB.
- **SoluciÃ³n**:
  - **DB**: Agregar columna `finish` y actualizar la restricciÃ³n Ãºnica a `(printing_id, condition, finish)`.
  - **Edge Function**: Implementar un diccionario de agregaciÃ³n en el `tcg-api` que sume cantidades de filas idÃ©nticas (mismo printing+condition+finish) antes del `upsert`.
  - **Vistas**: Actualizar `products_with_prices` para incluir la columna `finish` y asegurar que el frontend reciba este metadato.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/LEYES_DEL_SISTEMA.md) -> Regla de Negocio 3 (AgregaciÃ³n en Lotes).

### 67. Fuentes Locales Sin Archivo = 404 Silencioso en Build — 2026-03-03

- **Problema**: La app en produccion generaba `GET /fonts/Daito.woff2 404` en la consola del navegador.
- **Causa Raiz**: Declaraciones `@font-face` en `index.css` referenciaban archivos con `url('/fonts/...')` que nunca existieron en `frontend/public/fonts/`. El build de Vite compila sin errores aunque los archivos no existan.
- **Solucion**: Eliminar `@font-face` locales e importar `Cinzel` y `Cinzel Decorative` de Google Fonts como fallbacks premium.
- **Regla Derivada**: Toda fuente en `@font-face` con `url('/fonts/...')` DEBE tener su archivo fisico. Si no esta disponible, usar Google Fonts. Documentar el original como comentario en el CSS.

### 18. Toggle Variant UI y CardKingdom Pricing

- **Problema:** Los botones de variante Foil/Normal quedaban habilitados sin stock disponible (o no funcionales), y el precio 'Mercado Externo' (MKT) fusionaba foil y normal mostrando el mismo valor para ambas versiones.
- **Causa RaÃ­z:** La UI dependÃ­a del atributo disabled basado en la *ausencia* de datos, pero no comprobaba stock === 0. AdemÃ¡s, pi.ts usaba genericamente vg_market_price_usd para variantes sintÃ©ticas sin bifurcar adecuadamente entre prices.usd y prices.usd_foil.
- **SoluciÃ³n:** Implementar renderizado condicional ({condition && <button>}) u ocultamiento via JS para variantes inexistentes, aÃ±adir validaciÃ³n disabled={(stock || 0) === 0} para variantes existentes pero agotadas. En pi.ts, asignar prices.usd a nonfoil y prices.usd_foil a foil explÃ­citamente al expandir el objeto ll_versions.
- **Regla Derivada:** UI de variantes en E-commerce fÃ­sico: Si no existe variante, oculta el UI. Si existe pero no hay stock, deshabilita la UI (opacity-50). Los precios externos siempre deben extraer las propiedades separadas (usd vs usd_foil) del provider base.

### 67. ConfiguraciÃ³n de Pydantic v2 (SettingsConfigDict)

- **Problema**: pydantic-settings generaba errores (como Config error o validaciÃ³n fallida) al intentar heredar de BaseSettings y usar una clase interna Config.
- **Causa RaÃ­z**: Con la introducciÃ³n de Pydantic v2, la declaraciÃ³n de configuraciÃ³n mediante subclases Config quedÃ³ obsoleta a favor de model_config.
- **SoluciÃ³n**: Usar model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8') dentro de la clase Settings.
- **Regla Derivada**: Siempre actualizar los esquemas de configuraciÃ³n a las convenciones de Pydantic v2 para garantizar soporte continuo y evitar problemas con pytest y builds.

### 68. EnvÃ­o AsÃ­ncrono de Correos en FastAPI

- **Problema**: Realizar el envÃ­o de correos (ej: servidor SMTP) de manera sÃ­ncrona dentro del path operator del carrito de compras introducÃ­a latencias inaceptables en la respuesta (checkout), degradando la experiencia de usuario.
- **Causa RaÃ­z**: La operaciÃ³n de red con SMTP bloquea el hilo principal si no se delega a una tarea de fondo.
- **SoluciÃ³n**: Delegar el envÃ­o a tareas asÃ­ncronas no bloqueantes. En este caso se empleÃ³ syncio.create_task() (tambiÃ©n se puede usar BackgroundTasks de FastAPI) para despachar correos (al cliente y admin) inmediatamente antes de devolver la respuesta 200 OK.
- **Regla Derivada**: Cualquier integraciÃ³n con servicios externos de notificaciones en rutas sensibles debe ser wait de una tarea en fondo o despachado asÃ­ncronamente para mantener latencias < 500ms.

### 23. Prioridad de IntenciÃ³n del Usuario sobre DocumentaciÃ³n EstÃ¡tica â€” 2026-03-05

- **Problema:** El PRD y otros documentos de diseÃ±o especificaban vincular el botÃ³n de correo a una landing de Mailchimp, pero el usuario reportÃ³ esto como un error.
- **Causa RaÃ­z:** DocumentaciÃ³n de diseÃ±o obsoleta que no fue actualizada tras cambios en la estrategia de marketing del cliente.
- **SoluciÃ³n:** Priorizar la comunicaciÃ³n directa del usuario sobre lo escrito en docs/. Implementar `mailto:info@geekorium.shop` directamente.
- **Regla Derivada:** En caso de contradicciÃ³n entre un documento `docs/*.md` y una instrucciÃ³n directa del usuario en el chat, el chat siempre tiene la razÃ³n. Marcar la discrepancia en el log para futura actualizaciÃ³n de docs.

### 24. Jerarquía de Configuración SMTP (Mar 2026)

- **Problema**: Los correos no se enviaban porque las credenciales estaban en frontend/.env pero el backend las buscaba en la raíz.
- **Lección**: Los operativos backend (FastAPI/Python) suelen buscar el archivo .env en la raíz del proyecto. Las configuraciones compartidas o críticas de backend deben centralizarse allí para ser accesibles.

### 25. Seguridad de Secretos en Producción (Mar 2026)

- **Problema**: Hardcodear secretos en .env es un riesgo de seguridad en producción.
- **Lección**: Implementar validación en pydantic.BaseSettings (usando model_post_init) para asegurar que variables como SMTP_PASSWORD se provean via entorno del sistema y no vía archivo físico en modo production.

### 27. Optimización de Storage y Decisión de Ocultar Features (Mar 2026)

- **Problema**: El flujo de carga de comprobantes de pago disparaba el uso de cuota de Supabase Storage de forma acelerada.
- **Causa Raíz**: Carga de archivos binarios (imágenes) en cada transacción, lo que podría agotar la cuota gratuita/pagada sin un valor de negocio crítico inmediato (ya existe flujo WhatsApp).
- **Lección**: En proyectos con restricciones de cuota, es mejor ocultar features de alto consumo de storage ("payment-proofs") y delegar la validación al canal asistido (WhatsApp) que ya se utiliza para el cierre de venta.
- **Acción**: Se comentó el componente de carga en `OrderTrackingPage.tsx` y se eliminó la migración de creación del bucket.

### 28. Checkout Atómico y Desacoplamiento de Schema (Mar 2026)

- **Problema**: El flujo de checkout fallaba silenciosamente ("Orden no encontrada") a pesar de que el carrito se vaciaba.
- **Causa Raíz**: El RPC `create_order_atomic` intentaba insertar un valor en la columna `product_name` de `order_items`, la cual no existía en el schema de producción. El admin funcionaba porque usaba un JOIN dinámico, ocultando la inconsistencia.
- **Solución**: Se añadió la columna `product_name` a `order_items` para persistir el nombre del producto en el momento de la compra (snapshotting) y se habilitaron permisos públicos (anon/authenticated) para el rastreo.
- **Regla Derivada**: En flujos atómicos (RPC), cualquier error de schema en una sub-tabla cancela toda la transacción. Siempre verificar que las columnas usadas en el RPC existan en todas las tablas afectadas.

### 29. Hosting para E-commerce: Cloudflare Pages vs. GitHub Pages (Mar 2026)

- **Problema**: GitHub Pages prohíbe explícitamente el uso comercial en su capa gratuita, lo que pone en riesgo sitios de venta directa como Geekorium.
- **Solución**: Migrar a **Cloudflare Pages**.
- **Lección**: Cloudflare Pages permite oficialmente uso comercial en su plan gratuito y ofrece ancho de banda ilimitado, eliminando riesgos de costos por tráfico de imágenes pesadas (cartas TCG).
- **SPA Routing**: Cloudflare usa un archivo `_redirects` en `public/` con la regla `/* /index.html 200` para manejar rutas de React de forma nativa.

### 30. Estrategia de Branching y CI/CD (Mar 2026)

- **Problema**: Desplegar directamente desde `main` sin un entorno de previsualización aumenta el riesgo de errores en producción.
- **Lección**: Adoptar un modelo de `dev` (Preview) y `main` (Production).
- **Flujo**: Cloudflare Pages genera despliegues automáticos para cada rama. Los cambios se validan en la URL de preview de `dev` antes de ser incorporados a `main` vía Pull Request para el despliegue final.

### 31. Cloudflare Pages vs. Workers para Frontend — 2026-03-07

- **Problema:** Confusión en el dashboard de Cloudflare al intentar desplegar un frontend de React usando la sección de "Workers".
- **Lección:** Los **Workers** son para lógica serverless (scripts), mientras que **Pages** es la herramienta diseñada para hosting de sitios estáticos (Vite, React). Siempre usar la pestaña "Pages" para el despliegue del frontend.

### 32. SEO Condicional vía Variables de Entorno de Vite — 2026-03-07

- **Problema:** Necesidad de activar SEO (meta tags y robots) solo en la rama de producción (`main`) y ocultar el sitio en desarrollo/preview (`dev`).
- **Solución:** Usar placeholders `%VITE_SEO_...%` y `%VITE_ROBOTS%` en `index.html`.
- **Configuración:**
  - **Prod:** `VITE_ROBOTS=index, follow`
  - **Dev/Preview:** `VITE_ROBOTS=noindex, nofollow`
- **Ventaja:** Permite inyectar SEO real solo en el dominio productivo sin añadir dependencias pesadas de React.

### 33. Root Directory en Estructuras Monorepo/Subcarpetas — 2026-03-07

- **Problema:** El build fallaba en Cloudflare porque intentaba buscar `package.json` en la raíz del repo.
- **Lección:** En proyectos donde el frontend reside en una subcarpeta (ej: `/frontend`), es OBLIGATORIO configurar el **Root Directory** en el dashboard de Cloudflare para que el proceso de build se ejecute en el contexto correcto.

### 34. Conflicto de Auto-detección (Vite vs. VitePress) en Cloudflare — 2026-03-07

- **Problema:** Cloudflare Pages intentaba usar un preset de "VitePress" en lugar de "Vite" debido a la presencia de archivos de documentación o nombres similares, lo que resultaba en errores 404 por rutas de assets incorrectas.
- **Solución:** Configurar explícitamente el **Framework Preset** como **"None"** en el dashboard de Cloudflare. Esto obliga al sistema a usar solo el comando de build (`npm run build`) y el directorio de salida (`dist`) especificado, sin suposiciones de frameworks adicionales.

### 35. SPA Routing: `404.html` vs `_redirects` en Cloudflare Pages — 2026-03-07

- **Problema:** El uso de un archivo `_redirects` con la regla `/* /index.html 200` puede generar advertencias de "Redirect Loop" en el dashboard de Cloudflare si se combina con redirecciones de dominio (ej. HTTP -> HTTPS).
- **Solución:** El método más robusto para SPAs en Cloudflare Pages es la estrategia de **`404.html` fallback**. Al copiar el `index.html` generado al archivo `404.html` durante el build, Cloudflare servirá la aplicación para cualquier ruta no encontrada, permitiendo que el router de React tome el control sin generar avisos de bucle.

### 36. Gestión de Multi-entorno de Base de Datos (Supabase) — 2026-03-07

- **Problema**: Riesgo de contaminar datos de producción o romper el schema productivo durante el desarrollo de nuevas features.
- **Solución**: Segregar bases de datos usando proyectos independientes de Supabase vinculados a las ramas de Cloudflare.
- **Lección**: La mejor forma de manejar múltiples bases de datos en un SPA desplegado en Cloudflare Pages es mediante **Environment Overrides**. Al configurar variables como `VITE_SUPABASE_URL` de forma distinta para los entornos de "Production" y "Preview", la aplicación se conecta automáticamente al proyecto de Supabase correcto basado en el branch desde el que se desplegó.
- **Edge Functions**: Es crítico recordar que las Edge Functions y sus secretos deben sincronizarse manualmente (o vía CLI link) en ambos proyectos, ya que son entornos aislados.

### 37. Restricciones de Despliegue en GitHub Environments — 2026-03-07

- **Problema**: El despliegue de la rama `dev` fallaba con "Branch is not allowed to deploy due to environment protection rules".
- **Causa Raíz**: Los repositorios de GitHub con "Environments" (ej: `github-pages`) suelen restringir los despliegues solo a `main` por defecto en la sección "Deployment branches and tags".
- **Solución**: Ajustar la configuración del Environment en GitHub Settings para permitir todas las ramas ("No restriction") o añadir explícitamente la rama `dev`.
- **Lección**: Al habilitar un nuevo entorno de hosting (como GitHub Pages para `dev`), el primer despliegue fallará si no se actualizan los permisos de rama en el Dashboard de GitHub.

### 38. Refactorización de IDs de Proyecto Supabase — 2026-03-07

- **Problema**: El uso de IDs de Supabase hardcodeados en URLs de Edge Functions impedía que la rama `dev` conectara con su propia instancia de base de datos.
- **Solución**: Reemplazar todos los IDs estáticos por la variable de entorno `VITE_SUPABASE_PROJECT_ID`.
- **Lección**: Para sistemas multi-entorno, el ID del proyecto debe tratarse como un secreto dinámico inyectado por el hoster, igual que la URL y la Anon Key. Esto garantiza que el frontend siempre hable con el backend correcto según su origen.

### 39. Priorización de Card Kingdom sobre Goldfish (Marzo 2026)

- **Problema**: Inconsistencias de precios por uso de múltiples fuentes de mercado externo sin una jerarquía clara.
- **Decisión**: Card Kingdom es ahora la fuente de verdad única para precios de mercado externo. Se eliminó el uso de la tabla `aggregated_prices` (Goldfish).
- **Lección**: Mantener sistemas de fallback complejos a fuentes de datos obsoletas introduce "ruido" en la valoración y dificulta el debugging. La simplicidad de una sola fuente (CK) mejora la fiabilidad.
- **Implementación**: Si el precio de la tienda (`Geekorium`) es nulo, el sistema siempre debe recurrir al precio actual de Card Kingdom (`price_history`).

### 40. Limpieza de Selects en Supabase (Frontend & Backend) — Marzo 2026

- **Problema**: Al realizar cambios en la lógica de negocio (como remover una tabla), es fácil olvidar limpiar los strings de `select()` en el frontend (`api.ts`) o backend.
- **Lección**: Los errores de "Property X does not exist" en el frontend suelen deberse a proyecciones incompletas en la llamada de Supabase. Siempre verificar que todos los campos necesarios (incluyendo `stock`, `is_foil`, etc.) estén presentes en el string de `select` tras una refactorización.
- **Acción**: Se restauró la columna `stock` en `fetchCardDetails` que se había omitido accidentalmente durante la limpieza de Goldfish.

### 41. SimplificaciÃ³n de Precios y Reversa de Branding (Marzo 2026)

- **Problema**: Estrategia de precios confusa que mezclaba mÃºltiples fuentes y condiciones. Intento errÃ³neo de "limpiar" el branding de Geekorium.
- **Causa RaÃ­z**: El usuario aclarÃ³ que la prioridad era usar **Card Kingdom NM** como fuente Ãºnica de verdad para los precios de Geekorium, y que el branding original debe conservarse intacto.
- **SoluciÃ³n**:
  - Refactorizar lÃ³gica de precios en `ValuationService`, Edge Functions y DB para filtrar estrictamente por 'NM' de Card Kingdom.
  - Revertir cualquier cambio en el nombre de la marca ("Geekorium", "Geekorium El Emporio") en el frontend y servicios de email.
- **LecciÃ³n**: La simplicidad en los precios agiliza la operaciÃ³n. Nunca asumir que el branding debe "profesionalizarse" si el usuario no lo pide; respetar la identidad establecida es crÃ­tico.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Regla 1 (Precios de Geekorium): Solo precios NM de Card Kingdom.
