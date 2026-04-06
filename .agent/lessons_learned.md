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
392:
393: ### 42. High-Performance SQL Bulk Updates (Marzo 2026)
394:
395: - **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.

### 42. High-Performance SQL Bulk Updates (Marzo 2026)

- **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.
- **Causa RaÃ­z**: Nested loops over the target table and the subquery for every row.
- **SoluciÃ³n**: Use `UPDATE FROM` with a Common Table Expression (CTE). Pre-calculate all prices in memory and join them to the target table in a single pass.
- **Regla Derivada**: Bulk metadata updates in Supabase must use the `CTE + UPDATE FROM` pattern.

### 43. Defensive API Path Normalization (Marzo 2026)

- **Problema**: Edge Functions returning 400 or 500 errors intermittently due to unexpected URL prefixes (e.g., `/functions/v1/api/`) or trailing slashes added by some clients/proxies.
- **SoluciÃ³n**: Implement a robust "strip and normalized" loop at the start of the Edge Function to remove multiple prefixes and standardize endpoints to a base path (e.g., `/api/sets`).
- **Regla Derivada**: Edge Functions must be agnostic to deployment-specific URL prefixes.

### 44. ConexiÃ³n Segura a Supabase Pooler (Marzo 2026)

- **Problema**: "Connection timed out" o "Host not found" al intentar conectar scripts de Python externos a la DB de producciÃ³n.
- **Causa**: Intentar usar el host del dashboard o la IP directa que puede estar bloqueada o rotada.
- **SoluciÃ³n**: Usar el **Transaction Pooler** (Puerto 5432 o 6543). El host debe ser `[region].pooler.supabase.com` y el usuario DEBE incluir el Project Ref (`postgres.[project-ref]`).
- **LecciÃ³n**: Siempre configurar el `DATABASE_URL` con el pooler para scripts de mantenimiento masivo de larga duraciÃ³n.

### 45. Estrategia de Batched Updates para DenormalizaciÃ³n (Marzo 2026)

- **Problema**: Actualizar columnas denormalizadas (`avg_market_price_usd`) en una tabla de 200k+ registros fallaba consistentemente por `statement timeout`.
- **Causa**: El planificador de Postgres intentaba un Sequential Scan masivo con subconsultas correlacionadas.
- **SoluciÃ³n**: Implementar un script de Python que procese la tabla por IDs primarios en lotes (ej. 1,000 registros). Esto libera el bloqueo de tabla entre lotes y evita que el proceso supere el lÃ­mite de tiempo de una transacciÃ³n individual.
- **Lección**: Si una migración SQL tarda más de 30s en Postgres de Supabase, no forzar el timeout; mover la lógica a un batch script externo.

### 46. Correct Denormalization Level (Per-Printing vs. Per-Card) — 2026-03-10

- **Problema**: Al denormalizar precios (`avg_market_price_usd`) en la tabla `cards`, todas las versiones de una carta (ej. Pandemonium de *Exodus* vs. *The List*) mostraban el mismo precio, perdiendo la precisión por versión.
- **Causa Raíz**: Una carta (`card_id`) puede tener múltiples impresiones (`printing_id`) con precios drásticamente diferentes. Denormalizar a nivel de carta colapsa esta distinción.
- **Solución**: Mover la columna denormalizada a `card_printings`. Actualizar Materialized Views y RPCs para unir por `printing_id` en lugar de `card_id` cuando se trate de precios.
- **Regla Derivada**: Nunca denormalizar datos que varían por edición/acabado en la tabla maestra de cartas; usar siempre la tabla de impresiones.

### 48. Zero-Error Supabase Security Advisor (Mar 2026)

- **Problema**: Supabase Security Advisor reportaba múltiples vulnerabilidades de RLS y riesgos en vistas con `SECURITY DEFINER`.
- **Causa**: Tablas de metadatos (sets, cards) y de usuario (orders, carts) carecían de políticas de seguridad explícitas, exponiendo datos de negocio o de clientes. Vistas recreadas sin `security_invoker = true` bypassaban el RLS.
- **Solución**:
  - Habilitar RLS en **todas** las tablas públicas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
  - Definir políticas granulares: `SELECT` público para metadatos (cards, sets) y `Owner-Only` para datos sensibles (user_watchlist, user_addresses) usando `auth.uid()`.
  - Configurar vistas con `security_invoker = true` para asegurar que respeten los permisos del usuario que consulta.
- **Lección**: Un estado de "Zero Errors" en el Security Advisor no solo es una métrica de cumplimiento, sino una garantía de que el acceso a datos está controlado por políticas y no por la configuración por defecto del motor.

441: ### 49. RLS Policies for Guest Checkout (Mar 2026)
442:
443: - **Problema**: Habilitar RLS en tablas de carrito (`carts`, `cart_items`) y pedidos (`orders`) rompe el flujo de "Guest Checkout" si se restringe el acceso solo a usuarios autenticados.
444: - **Causa**: Los usuarios anónimos (`anon`) necesitan interactuar temporalmente con sus propios datos sin una sesión de Supabase Auth persistente.
445: - **Solución**: Implementar políticas permitiendo `INSERT` a `anon` y `SELECT` basado en el `id` del carrito o pedido si el usuario posee la referencia (ej: ID en localStorage). Para `orders`, permitir `SELECT` público pero restringido por ID para seguimiento.
446: - **Regla Derivada**: Siempre validar que las políticas de RLS no bloqueen flujos de usuarios no autenticados vitales para la conversión de venta.
447:
448: ### 50. Branding Asset Synchronization & Consistency (Mar 2026)
449:
450: - **Problema**: Discrepancia entre los archivos de diseño en `docs/logos/` y los assets servidos en `frontend/public/branding/`, resultando en logotipos desactualizados o inconsistentes.
451: - **Causa**: Falta de un flujo de sincronización definido; los componentes de React referenciaban archivos antiguos (ej: `Logo.jpg` en lugar de `Logo.png`).
452: - **Solución**:
453:   - Establecer `docs/logos/` como la fuente de verdad.
454:   - Sincronizar manualmente (o vía script) a `frontend/public/branding/`.
455:   - Refactorizar todos los componentes frontend (`Footer`, `Home`, `WelcomeModal`, `HelpPage`, `LegalPage`) para usar el nuevo path y extensión.
456:   - Actualizar `index.html` para el favicon y apple-touch-icon.
457: - **Lección**: La identidad visual debe tratarse como código; cualquier cambio en el "Source of Truth" de diseño requiere una auditoría de referencias en todo el frontend para garantizar la integridad visual de la marca.

### 51. Fallback Matching by Collector Number (CardKingdom Sync) — 2026-03-11

- **Problema**: El script de sincronización de CardKingdom fallaba al actualizar precios para ediciones especiales (ej. TMNT, PZA) debido a IDs de Scryfall faltantes o discrepantes.
- **Causa Raíz**: No siempre hay un mapeo 1:1 de `scryfall_id` en el catálogo de CardKingdom para sets promocionales o de colaboración.
- **Solución**: Implementar una lógica de respaldo (fallback) que extraiga el `collector_number` del SKU de CardKingdom (ej. "TMT-0017" -> "17") y realice el match combinando `set_name` + `collector_number`.
- **Regla Derivada**: Todo script de sincronización de precios externo debe tener un método de match de respaldo basado en metadatos físicos (set + número) si el ID único del proveedor falla.

### 52. Unificación de Archivos de Entorno (.env) — 2026-03-11

- **Problema**: Discrepancias de llaves (especialmente `SUPABASE_SERVICE_ROLE_KEY`) y corrupción de archivos debido a múltiples archivos `.env` (raíz y frontend/).
- **Causa Raíz**: Desincronización manual entre archivos y herramientas (Vite vs Python) buscando configuraciones en lugares distintos.
- **Solución**: Centralizar todas las variables en un único `.env` en la raíz. Configurar Vite con `envDir: '../'` para leer desde la raíz.
- **Lección**: En monorepos pequeños o proyectos con subcarpetas, un solo archivo de entorno en la raíz garantiza que todos los servicios (Frontend, API, Scripts) operen sobre la misma "fuente de verdad".

### 53. Gestión de Procesos Huérfanos en Sincronización — 2026-03-11

- **Problema**: Errores intermitentes de `Invalid API Key` o falta de actualización de datos a pesar de aplicar correcciones en el código y el `.env`.
- **Causa Raíz**: Procesos de Python persistentes en segundo plano que mantienen versiones obsoletas de las variables de entorno o que bloquean conexiones a la base de datos.
- **Solución**: Antes de reintentar sincronizaciones críticas tras cambios en la configuración, es obligatorio listar y terminar procesos huérfanos (`Stop-Process -Name python -Force`).
- **Regla Derivada**: (Codificada en LEYES_DEL_SISTEMA.md) Todo cambio estructural en configuración requiere un reinicio limpio de servicios y procesos de mantenimiento.

### 54. Robustez en Scripts de Diagnóstico (Supabase SQL vs API) — 2026-03-11

- **Problema**: Scripts de diagnóstico rápido fallan por `APIError` al intentar realizar joins complejos (`table.select('*, cards(name)')`).
- **Causa Raíz**: Restricciones de aliasing en la API PostgREST o desconfiguración momentánea de relaciones en el cliente Python.
- **Solución**: Para verificaciones manuales rápidas, preferir consultas SQL directas vía `psycopg2` o realizar selecciones simples de IDs y resolver relaciones programáticamente.
- **Lección**: La simplicidad en el diagnóstico previene falsos negativos causados por la propia herramienta de prueba.

### 55. Variables SEO de Vite No Reemplazadas en Producción — 2026-03-11

- **Problema**: El tab del navegador mostraba literalmente `%VITE_SEO_TITLE%` en producción (`geekorium.shop`).
- **Causa Raíz**: Los placeholders `%VITE_*%` en `index.html` solo son reemplazados por Vite durante el build si la variable está definida como env var en ese momento. Las variables `VITE_SEO_TITLE`, `VITE_SEO_DESCRIPTION`, `VITE_SEO_KEYWORDS`, `VITE_SEO_IMAGE` y `VITE_APP_URL` nunca fueron configuradas en el dashboard de Cloudflare Pages → Environment Variables → Production.
- **Solución**: Hardcodear los valores SEO estáticos directamente en `frontend/index.html`. Mantener solo `%VITE_ROBOTS%` como placeholder (para controlar indexación por entorno: `index, follow` en prod, `noindex, nofollow` en dev).
- **Variables faltantes descubiertas en Cloudflare**: `VITE_SUPABASE_PROJECT_ID` y `VITE_ROBOTS`.
- **Regla Derivada**: Auditar `index.html` en cada setup de proyecto nuevo. Todo `%VITE_*%` que no esté en el dashboard del hosting es un bug silencioso. Las metas SEO estáticas (título, descripción de marca) deben hardcodearse; las dinámicas por entorno (robots, URL canónica) se parametrizan.
- **Google Search Console**: Para que Google indexe un sitio nuevo, NO basta con tener `robots: index, follow`. Se requiere verificar el dominio en GSC (via registro TXT en DNS de Cloudflare) y enviar el sitemap manualmente. Sin esto, el crawl puede tardar semanas o no ocurrir.

### 56. Error de "Migration Mismatch" en Supabase CI/CD (GitHub Actions) — 2026-03-11

- **Problema**: El pipeline `supabase/setup` en GitHub Actions fallaba con "Migration mismatch" al intentar hacer push o reset a la base de datos de Preview.
- **Causa Raíz**: Borrar o renombrar archivos de migración localmente no elimina sus registros históricos de la DB remota en Supabase (`supabase_migrations.schema_migrations`). El CLI detecta esta divergencia y aborta.
- **Solución**: Ir al SQL Editor del proyecto Supabase remoto y hacer `DELETE FROM supabase_migrations.schema_migrations WHERE version = 'VERSION_HUERFANA';` para alinear la DB con los archivos locales antes de re-ejecutar el pipeline.
- **Regla Derivada**: Nunca eliminar scripts de migración que ya se ejecutaron en un entorno alojado, a menos que también se purgue su huella en la tabla interna de Supabase o se haga un reset completo desde cero.

### 57. Sobrecritura Incompleta en Patrones de Fallback API a Supabase — 2026-03-11

- **Problema**: Una carta Foil obtenía el precio de `$5.99` (precio Normal) en lugar de `$59.99` (precio Foil) en el frontend.
- **Causa Raíz**: En `api.ts`, una respuesta exitosa pero incompleta desde FastAPI llenaba la propiedad `data.all_versions` con objetos sin `finish` ni `avg_market_price_foil_usd`. Aunque se detectaba que faltaba data (`apiVersionsLackFinishData`), la lógica saltaba el *query de Supabase fallback* porque la condición original era `if (!data.all_versions || data.all_versions.length === 0)`.
- **Solución**: Cuando se detecta data incompleta (e.g., `apiVersionsLackFinishData`), es obligatorio vaciar el atributo base explícitamente (`data.all_versions = []` o `delete data.all_versions`) antes del chequeo condicional del fallback para forzar la re-evaluación estructurada desde la base de datos directa.
- **Regla Derivada**: En patrones donde un API proxy falla/devuelve data parcial y el frontend tiene un fallback directo a la DB de Supabase, la data parcial errónea DEBE purgarse por completo en memoria. Mezclar las respuestas (`{...baseData, ...data}`) sin purgar provoca cortocircuitos lógicos en la UI.

### 58. Unicidad Física y React Keys en RPCs de Inventario — 2026-03-11

- **Problema**: El frontend mostraba duplicados exactos (ej. 2 cartas idénticas) o sobreescribía variantes al renderizar resultados de búsqueda si no había distinción entre foil y nonfoil en la respuesta del RPC `get_products_filtered`.
- **Causa Raíz**: En la tabla `products`, las variantes Foil y Nonfoil del mismo `printing_id` están separadas. Sin embargo, si el RPC no retorna la columna `finish`, el frontend las mapeaba ambas usando unicámente `printing_id` como React Key, causando advertencias de UI de claves duplicadas, sobreescritura de cartas, y perdiendo el estado visual "Foil".
- **Solución**: Asegurarse de que el RPC recupere la columna `finish` (`LOWER(COALESCE(p.finish, 'nonfoil')) as finish`) y utilizarla en el frontend para generar un React Key único (`${printing_id}-${finish}`). Adicionalmente, pasar `is_foil` explicitamente al componente derivándolo de `finish`.
- **Regla Derivada**: Todo RPC que retorne listas de inventario físico TCG debe siempre exponer y proyectar los diferenciadores físicos (ej. `finish`, `condition`) al frontend para garantizar unicidad garantizada en las visualizaciones de React y posibilitar lógica UI condicional.

### 59. Recarga de Caché PostgREST y Precios Ramificados en RPCs — 2026-03-11

- **Problema**: Tras añadir la columna `finish` al RPC `get_products_filtered` en la base de datos de producción mediante un script SQL directo, el frontend seguía recibiendo la respuesta antigua (sin `finish`) y mostrando precios incorrectos para las versiones Foil.
- **Causa Raíz**:
  1. PostgREST (la capa API de Supabase) mantiene un caché del schema de la base de datos. Los cambios directos en funciones SQL no invalidan este caché automáticamente, lo que provoca que la API siga retornando la firma antigua de la función.
  2. Inicialmente, no se consideró que el precio a mostrar (*market price*) debe ramificarse dependiendo del *finish*. La consulta SQL usaba `avg_market_price_usd` de forma genérica para todas las variantes.
- **Solución**:
  1. Ejecutar `NOTIFY pgrst, 'reload schema';` inmediatamente después de alterar una función SQL cruda.
  2. Modificar el RPC para que el precio devuelto dependa inteligentemente de la variante física que se va a imprimir en esa fila: `COALESCE(CASE WHEN LOWER(p.finish) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)`.
- **Regla Derivada**: Al desarrollar RPCs unificados de inventario TCG, la proyección de la propiedad `price` no puede ser plana; **debe** ramificarse evaluando las banderas físicas (`finish`, y en el futuro `condition` o `language`). Además, cualquier parche SQL *hotfix* aplicado en vivo sobre Supabase requiere estrictamente recargar la capa API HTTP (`NOTIFY pgrst, 'reload schema'`).

### 60. Uso de Supabase CLI en Windows (npx) — 2026-03-12

- **Problema**: El comando `supabase` falla con `CommandNotFoundException` si no está en el PATH global del sistema.
- **Solución**: Usar siempre `npx supabase` para invocar el CLI local. Para despliegues remotos, es obligatorio incluir el flag `--project-ref [ID]` para evitar ambigüedades si el enlace local (`.supabase/config`) no está sincronizado.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla Técnica (Herramientas CLI).

### 61. Sincronización de Edge Functions Duplicadas — 2026-03-12

- **Problema**: Desplegar una función corregida (ej. `api`) no solucionaba el problema en todas las partes del sitio (ej. Admin o Import) porque existía otra función idéntica con distinto nombre (`tcg-api`) desplegada previamente.
- **Lección**: Durante fases de transición o refactorización de nombres de funciones, es Mandatorio sincronizar el código en ambas carpetas (`api/` y `tcg-api/`) antes del despliegue para garantizar consistencia en todo el ecosistema.
- **Regla Derivada**: Evitar la fragmentación de lógica compartida; si dos Edge Functions hacen lo mismo, deben eliminarse o mantenerse estrictamente en espejo hasta la migración total.

### 62. Lógica de Pedidos "Por Encargo" (Stock 0) — 2026-03-12

- **Problema**: El sistema bloqueaba la venta de cartas sin stock físico, limitando el e-commerce solo a lo disponible en preventa o inventario actual.
- **Solución**:
  - **Bypassing**: Modificar RPC `add_to_cart` para ignorar la validación de `stock_actual` si el producto permite pedidos on-demand.
  - **Creación On-the-fly**: Si una variante (Foil/NM) no existe en la tabla `products`, el RPC debe crearla con stock 0 en lugar de fallar, permitiendo que el usuario la "encargue".
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 4 (Soporte Por Encargo).

### 68. Discrepancia de Stock "8 fuera / 1 dentro" (Marzo 2026)

- **Problema**: El buscador mostraba stock disponible, pero el modal mostraba "Por encargo".
- **Causa Raíz**: Uso de IDs sintéticos en el frontend (`uuid-foil`, `uuid-nonfoil`) que no coincidían con el `printing_id` real al consultar el stock por RPC.
- **Solución**: Refactorizar `api.ts` para extraer el base UUID (stripping suffixes) antes de filtrar el resultado del RPC de stock.
- **Lección**: Las llaves de React y los IDs de navegación pueden ser sintéticos para garantizar unicidad visual, pero los queries de datos de negocio (stock, precio) DEBEN trabajar sobre el ID canónico de la base de datos.
- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `fetchCardDetails` ahora normaliza los IDs antes del mapeo de stock.

### 23. Prioridad de Precios: Mercado vs Inventario — 2026-03-12

- **Problema**: Cartas en stock mostraban precio de $0.00 o "---" en el modal, aunque en la búsqueda se veía el precio correcto ($24.99).
- **Causa Raíz**: En `api.ts`, la lógica de mezcla de datos de inventario usaba el operador `??` (nullish coalescing), lo que permitía que un valor de `0` en la tabla `products` (precio no seteado manualmente) sobrescribiera el `market_price` de la tabla `card_printings`.
- **Solución**: Refactorizar la lógica en `fetchCardDetails` para validar que el precio de inventario sea estrictamente mayor a 0 antes de usarlo como override.
- **Lección**: Un precio de `0` en el inventario debe tratarse pedagógicamente como "sin precio manual" (fallback al mercado), no como "precio gratis". La lógica de negocio debe ser consistente entre el listado (`get_products_filtered` RPC) y el detalle (`api.ts`).
- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `finalPrice` ahora valida `Number(exactProd.price) > 0`.

### 69. Unificación de Credenciales SMTP y Sincronización de Edge Functions — 2026-03-12

- **Problema**: El envío de correos fallaba silenciosamente tras cambios en la configuración debido a discrepancias en los nombres de variables de entorno entre las funciones `api` (`SMTP_USERNAME`) y `tcg-api` (`SMTP_USER`).
- **Causa Raíz**: Fragmentación de código entre funciones duplicadas que realizan tareas similares y falta de logs de diagnóstico para la carga de secretos de Supabase.
- **Solución**:
  - Unificar los nombres de variables a `SMTP_USERNAME` y `SMTP_PASSWORD` en todas las Edge Functions.
  - Sincronizar la lógica de envío de notificaciones entre `api/index.ts` y `tcg-api/index.ts`.
  - Añadir logs de consola explícitos (`SMTP credentials loaded: true/false`) para facilitar el debugging en el dashboard de Supabase.
- **Regla Derivada**: Las variables de entorno para infraestructuras compartidas (SMTP, API Keys) deben seguir un esquema de nombrado único en todo el proyecto. Cualquier cambio en una Edge Function "espejo" debe replicarse inmediatamente en la otra.

### 70. Price Fallback Chain & Starred Collector Numbers — 2026-03-12
- **Problema:** Cartas en stock mostraban "S/P" (Sin Precio) a pesar de tener datos de mercado en otras versiones.
- **Causa Raíz:** Existencia de versiones duplicadas (con "★" en el número de coleccionista) que carecían de metadatos de precio, mientras que la versión base sí los tenía. El buscador devolvía la versión sin precio.
- **Solución:**
  1. Refactorizar el RPC `get_products_filtered` con una cadena de fallback: `Market(Finish) -> Market(Nonfoil) -> Market(Foil) -> Store Price -> 0`.
  2. Ejecutar un script de corrección de datos para copiar precios de versiones base a versiones starred.
- **Regla Derivada:** Todo RPC de inventario debe implementar fallbacks de precio entre acabados (finish) para mitigar falta de metadata específica.
### 71. Lógica de Detección de Foil y Remediación Masiva (Marzo 2026)

- **Problema**: El sistema importaba casi todas las cartas como "Foil", incluso tierras duales de 3ED que no existen en ese acabado.
- **Causa Raíz**:
  1. **Bug en Edge Function**: La lógica `finish.toLowerCase().includes('foil')` devolvía true para "nonfoil" porque contiene la palabra "foil".
  2. **Data Inconsistente**: Miles de registros en `products` heredaron este error, ensuciando el inventario y la visualización.
- **Solución**:
  - **Código**: Refactorizar a `(finish === 'foil' || (finish.includes('foil') && !finish.includes('nonfoil')))` para exclusividad.
  - **DB**: Script PL/pgSQL masivo que:
    - Identifica cartas marcadas como `foil` que no soportan ese acabado segÃºn `card_printings`.
    - Fusiona el stock con la versión `nonfoil` si existe, o renombra la entrada en place.
    - Actualiza `order_items` y `cart_items` para mantener integridad referencial antes de borrar registros duplicados.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance y Datos). Las correcciones de finish deben considerar la tabla unida `card_printings`.
### 72. Ultra-Performance Filtering via Single-Table Denormalization (March 2026)

- **Problema**: Timeouts (500) y latencia alta en filtros complejos (Color, Tipo, Rareza) sobre tablas de 200k+ registros con múltiples joins.
- **Causa Raíz**: La ejecución de joins dinámicos en Supabase/PostgREST es costosa. Los índices en tablas relacionales no siempre compensan el overhead del planificador de Postgres en queries muy ramificadas.
- **Solución**: **Extrema Denormalización**. Mover metadatos críticos (`release_date`, `colors`, `set_name`, `type_line`) directamente a la tabla `products`. Rediseñar el RPC `get_products_filtered` para que sea un query de una sola tabla (`FROM products`).
- **Sincronización**: Usar un trigger `BEFORE INSERT OR UPDATE` en la tabla destino para poblar los datos, y triggers `AFTER UPDATE` en las tablas fuente para "tocar" los registros relacionados y forzar la sincronización sin recursión infinita.
- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance). Si una query con Joins supera los 200ms, denormalizar metadatos a la tabla principal.

### 73. Frontend Request Cancellation with AbortController (March 2026)

- **Problema**: "Race conditions" visuales y sobrecarga del servidor al mover sliders de filtros (Precio/Año) rápidamente. El servidor procesaba peticiones que el usuario ya no necesitaba.
- **Causa Raíz**: Cada cambio en el estado disparaba un `fetch` asíncrono. Sin cancelación, las respuestas podían llegar desordenadas o acumularse en el backend.
- **Solución**: Implementar `AbortController` en el hook `useEffect` de data fetching.
- **Patrón**:

```typescript
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, [filters]);
```

- **Regla Derivada**: Todo component de búsqueda/filtrado masivo DEBE implementar `AbortController` para gestionar el ciclo de vida de las peticiones de red.
### 74. Robust Foil Matching & Finishes Array (March 2026)

- **Problema**: Cartas importadas como foil eran guardadas como non-foil por el RPC `bulk_import_inventory`, resultando en visualización y precios incorrectos (ej. "Wan Shi Tong, Librarian").
- **Causa Raíz**:
  1. El RPC priorizaba el match por la columna `is_foil`, ignorando el array `finishes` usado por sets modernos (Avatar, etc.).
  2. Fallback de Scryfall: Algunas versiones (starred collector numbers) no tienen metadata de precio foil, causando confusión en el matching si no hay una jerarquía clara.
- **Solución**:
  - **Backend**: Actualizar RPC para que considere `requested_finish` vs (`is_foil` OR `finishes` array) con prioridad sobre la fecha de lanzamiento.
  - **Frontend**: Implementar una heurística de validación en `BulkImport.tsx` que detecta precios altos ($ > 50) en cartas marcadas como non-foil, lanzando un aviso de confirmación.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 6 (Importación Robusta).
### 75. Non-Automatic Joins in Supabase Client — 2026-03-13
- **Problema**: `Could not find a relationship between 'orders' and 'profiles' in the schema cache` al intentar un join simple.
- **Causa**: Supabase PostgREST no detecta relaciones automáticas si los campos no tienen foreign keys explícitas en el schema real de Postgres o si hay ambigüedades en la caché del cliente.
- **Solución**: Evitar joins forzados si no son necesarios. Para `orders`, los datos del comprador ya están denormalizados en `guest_info` o `shipping_address`. Usar esos campos directamente es más resiliente.
- **Regla Derivada**: No asumir que `select('*, table(*)')` funcionará siempre; verificar foreign keys en el schema antes de intentar joins profundos.

### 76. Email Priority in Orders — 2026-03-13
- **Problema**: El admin mostraba "N/A" en el correo del comprador.
- **Causa**: Se buscaba en `orders.user_email` (columna inexistente) o se intentaba unir con `profiles` (que no guarda emails en esta arquitectura).
- **Solución**: La jerarquía de email correcta es: `guest_info.email` -> `shipping_address.email`.
- **Regla Derivada**: Para órdenes de invitados y usuarios registrados, el email de contacto seguro reside en los metadatos de envío/invitado.

### 77. Inventory Zero-Price Integrity Sweep — 2026-03-13
- **Problema**: Productos "On-Demand" o con errores de importación terminaban con precio $0.00 en el carrito.
- **Causa**: Falta de validación reactiva en el momento de la inserción o desincronización con el mercado.
- **Solución**: Implementar barridos (sweeps) automáticos que busquen precios 0 y los reparen consultando `card_printings`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla 7 (Prevención de Zero-Price).

### 78. Remoción Proactiva de Funcionalidades "On-Hold" (Marzo 2026)

- **Problema**: El inicio de sesión social (Google, Discord, Microsoft) fue solicitado para ser ocultado o puesto en "hold" para simplificar la experiencia de usuario inicial.
- **Lección**: Cuando una funcionalidad secundaria se pone en pausa por decisión del usuario, no basta con comentarla si genera advertencias de lint o aumenta el peso muerto del código. Es preferible removerla limpiamente de la UI y los componentes asociados, manteniendo el estado de autenticación core intacto.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 8 (Simplicidad y Foco). Funcionalidades en hold deben ser removidas de la vista activa para evitar ruido visual y técnico.
- ✅ **Visibilidad Condicional de Carrito**: El botón "Añadir al carrito" ahora está oculto por defecto en la vista general (grid/list) y solo es visible en el modal de detalles, mejorando la estética de navegación masiva.
- ✅ **Filtrado de Stock Robusto (Multi-capa)**: Implementación de limpieza de ítems agotados directamente en `api.ts` y componentes de detalle. Eliminación completa de versiones "Por Encargo" ($0.00) en el flujo de vista de stock.
- ✅ **Ocultamiento de Sección Archivo**: Removida la pestaña de histórico para simplificar la UX. El sistema ahora opera exclusivamente sobre el inventario vivo (Marketplace).

### 79. Component Prop Drilling for Visibility Control (March 2026)

- **Problema**: Necesidad de implementar un patrón de `showElement` prop con un valor por defecto.
- **Implementación**:
  - `CardProps` ahora incluye `showCartButton?: boolean = false`.
  - Los padres (`CardGrid`) propagan este prop.
  - El modal de detalle (`CardModal`) lo ignora o lo fuerza a `true`, manteniendo la funcionalidad aislada.
- **Lección**: Al rediseñar visibilidad de componentes compartidos, usar props booleanos explícitos en lugar de lógicas globales de estado si el cambio es puramente de visualización contextual. Esto permite mayor flexibilidad sin efectos secundarios en otras partes de la app.
### 25. Ocultamiento de Features vs. Eliminación (Marzo 2026)

- **Problema**: El sistema de "Archivo" confundía a los usuarios recién registrados.
- **Causa Raíz**: Presencia de una funcionalidad de referencia histórica en un sitio de venta directa.
- **Lección**: Para cambios de UX rápidos bajo presión, ocultar el punto de entrada (`tabs`) y forzar el estado inicial (`activeTab`) es más seguro y rápido que eliminar código de fondo.
- **Implementación**: En `Home.tsx`, forzar `activeTab: 'marketplace'`, retornar `null` en el botón de toggle e ignorar el parámetro URL `?tab=reference`.
- **Integridad**: Mantener una rama de referencia (`v1.0-productiva`) antes de apagar funcionalidades importantes garantiza la reversibilidad total sin miedo a perder código legado.

### 81. Alineación de IDs de Fuentes de Precios (Marzo 2026)

- **Problema**: Discrepancias en el historial de precios debido a múltiples IDs (`1`, `21`) asignados a la misma fuente (Card Kingdom) en diferentes etapas del desarrollo.
- **Causa Raíz**: Inconsistencia en scripts de raspado (scrapers) iniciales que no compartían una tabla de referencia de fuentes.
- **Solución**: Estandarizar IDs de fuentes críticas: **16 para TCGplayer** y **17 para Card Kingdom**. Ejecutar scripts de alineación (`align_everything.py`) para migrar registros históricos al ID oficial y consolidar las tablas `sources` y `price_sources`.
- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 1. Todo script de sincronización debe usar el ID 17 para Card Kingdom de forma hardcodeada o mediante lookup en la tabla de referencia oficial.


### 82. Storefront Caching & Pricing Updates (April 2026)
- **Problema**: El inventario (products) fue actualizado exitosamente para eliminar productos con precio .00, pero la grilla en la tienda seguía mostrando .00.
- **Causa Raíz**: La visualización principal del frontend depende de la Vista Materializada mv_unique_cards, la cual se alimenta de la tabla de catálogo card_printings, no del inventario directo.
- **Solución**: Para que un ajuste de mercado se refleje visualmente, el script debe actualizar la columna de precios denormalizada en card_printings y luego ejecutar explícitamente REFRESH MATERIALIZED VIEW mv_unique_cards;.
- **Regla Derivada**: Todo update de pricing que deba verse en frontend requiere refrescar la vista materializada como último paso obligatorio.

### 83. Integridad en Egresos Masivos (Abril 2026)
- **Problema**: Riesgo de inconsistencia de stock al procesar archivos CSV con filas duplicadas o cantidades que exceden el stock disponible en un entorno multi-transaccional.
- **Causa Raíz**: Si no se agrupan las cantidades por "Printing + Condition + Finish" antes de comparar con la DB, dos filas pequeñas podrían pasar la validación individualmente pero fallar la resta combinada, o generar errores de restricción.
- **Solución**: 
- **Agregación Previa**: El RPC de validación (`preview_bulk_egress`) y ejecución debe usar un CTE para sumar todas las cantidades del lote por nodo físico antes de evaluar el stock.
  - **Aborto Transaccional**: La operación de egreso debe ser atómica (una sola función RPC). Si una sola carta del lote falla la validación de stock final (stock - pedido < 0), se debe lanzar una excepción para revertir el lote completo, evitando estados de inventario parciales.
- **Regla Derivada**: Todo proceso de baja de inventario debe registrarse obligatoriamente en `inventory_logs` con un motivo explícito para auditoría administrativa.

### 84. Frictionless WhatsApp Checkout (April 2026)
- **Concept**: Reducing a 2-step checkout to a single form by using "safe defaults" (Cédula, Address, etc.) for required backend fields while focusing the UI on Name, WhatsApp, and Email.
- **UI Logic**: Use of a dynamic "Confirm & Pay" button that remains disabled (grey) until the 3 mandatory fields are valid, then turns green with a glow effect.
- **Notification**: Email is mandatory as it's the primary channel for automated order confirmation, complementary to the manual WhatsApp flow.

### 85. Branding & "Secret" Access (April 2026)
- **Pattern**: Hiding "Login" buttons from the public view during BETA to prioritize conversion and reduce unauthorized support requests.
- **Implementation**: Providing a "Secret Link" (`/geeko-login`) for the internal team instead of a UI-hidden button.
- **UX**: Updating the restricted route handler (`AdminRoute`) to provide a helpful "Restricted Access" screen with a link to the secret login, improving internal use while keeping public users away.
