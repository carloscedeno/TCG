# 🧠 TCG Hub - Developer Knowledge Base (Lessons Learned)

Este documento registra los desafíos técnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.

## 🛠 Entorno y Dependencias

### 1. Conflictos de Versión en CI/CD (GitHub Actions)

- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.
- **Causa**: Versiones muy recientes de librerías a veces tardan horas/días en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **Lección**:
  - Sincronizar la versión de Python del runner (3.12) con la local.
  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.

## 🗄️ Base de Datos y Supabase

### 2. "Precios Invisibles" (Agregación Fallida)

- **Problema**: El script de sincronización insertaba precios pero no se reflejaban en la UI.
- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requería un `condition_id` válido. Los inserts manuales omitían estos campos, dejando los precios en un limbo.
- **Lección**: Todo script de ingesta de precios debe incluir:
  - `timestamp`: ISO string (UTC).
  - `condition_id`: ID numérico correspondiente (ej: 16 para Near Mint).
  - `is_foil`: Booleano explícito.

### 3. Timeouts en Filtros (Performance)

- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.
- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin índices.
- **Lección**:
  - **Índices Críticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.
  - **Estrategia de Consulta**: Para tablas masivas, es más rápido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.

## 🌐 Frontend y API

### 4. Coherencia en el Fallback de Supabase

- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".
- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estándar de Postgres) que no existe en esta estructura específica.
- **Lección**: Mantener mapeos de nombres de columnas idénticos entre la respuesta del API local y el código de fallback de Supabase.
- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.
- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.
- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.

### 5. Counting Strategy & Timeouts

- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).
- **Lección**:
  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinámicos donde el planificador de Postgres ya tiene estadísticas.
  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginación con "Infinite Scroll" o botones de "Siguiente".

## 🚀 Despliegue y CI/CD

### 6. TypeScript Strict Build (TS6133)

- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.
- **Causa**: Configuración de `tsconfig.json` con `noUnusedParameters: true`.
- **Lección**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilación exitosa.

### 7. Variables de Entorno en GitHub Actions

- **Problema**: El frontend funcionaba localmente pero en producción los dropdowns (Sets) estaban vacíos y las búsquedas fallaban.
- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvía 404).
- **Lección**:
  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.
  - **Resiliencia de Fallback**: Todo endpoint crítico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no está definido.

---

## 🧠 Frontend y UX

### 8. UX de Autocompletado vs. Búsqueda Activa (Feb 2026)

- **Problema**: Al implementar el autocompletado, el `debounce` automático disparaba la búsqueda principal cada vez que el usuario escribía, recargando resultados innecesariamente.
- **Lección**: **Desacoplar siempre el input de búsqueda del trigger de búsqueda.**
  - El input solo actualiza el estado local para sugerencias.
  - La búsqueda principal (`activeSearchQuery`) solo se actualiza mediante acción explícita (`Enter` o click en sugerencia).
- **Solución**: Se refactorizó el frontend para separar `query` (input) de `activeSearchQuery` (fetch).

### 9. Timeout en Queries con DISTINCT ON (Feb 2026)

- **Problema**: `DISTINCT ON (card_name)` + `ORDER BY` con JOIN (`s.release_date`) causaba timeout (Error 500) sin índices específicos para esa combinación.
- **Lección**: **Índices obligatorios para Sort/Filter.**
  - Si usas `DISTINCT ON (columna)`, DEBE haber un índice en `(columna)`.
  - Si filtras con `ILIKE`, DEBE haber índice `GIN` con `pg_trgm`.
  - Verificar siempre con `EXPLAIN ANALYZE` en datos con volumetría real.

### 10. NO Usar Queries Dinámicas para Vistas Principales de Tablas Grandes (Feb 2026)

- **Problema**: A pesar de índices correctos, `DISTINCT ON` sobre 80,000+ filas con Joins y RLS activo sigue siendo demasiado pesado.
- **Lección Definitiva: USAR VISTA MATERIALIZADA.**
  - Si deduplicar o agregar de tabla principal grande (>10k filas): pre-calcular en `MATERIALIZED VIEW`.
  - Usar `SECURITY DEFINER` en la función RPC para saltar overhead de RLS si la vista ya contiene datos públicos filtrados.

### 11. CardModal — Nunca Filtrar all_versions al Cambiar Printing (Feb 2026)

- **Problema**: Al cambiar el printing seleccionado, la lista de versiones desaparecía si la respuesta de la API para ese printing no incluía todas las versiones.
- **Lección**: Preservar siempre el array `all_versions` en el estado del frontend al navegar entre printings. Nunca re-derivarlo de la respuesta parcial de un printing individual.

### 12. Soporte Foil Virtual — Entidades Virtuales No En DB (Feb 2026)

- **Problema**: Intentar buscar registros de cartas foil como entidades separadas en la DB fallaba.
- **Lección**: Las cartas foil son **entradas virtuales** generadas por la Edge Function `tcg-api` cuando `prices.usd_foil IS NOT NULL`. No existen como filas separadas en `card_printings`. Nunca hacer migrations que asuman lo contrario.

### 13. DFC (Double-Faced Cards) — Links y Flip de Imagen (Feb 2026)

- **Problema**: Los links de CardKingdom para DFCs fallaban porque incluían el nombre de ambas caras (`//`). Las imágenes DFC no flippeaban.
- **Lección**:
  - **Links**: Usar solo `card_faces[0].name` (cara frontal) para búsquedas en CardKingdom.
  - **Flip**: Detectar DFC por `card_faces?.length > 1`. Implementar toggle de imagen client-side.
  - **Fallback Frontend**: Si `image_uris` es null, usar `card_faces[0].image_uris` como fallback.

### 14. Precios: Siempre Parsear como Number (Feb 2026)

- **Problema**: `toFixed()` crasheaba cuando el precio venía como string o null de la API.
- **Lección**: Siempre convertir: `const price = Number(rawPrice)`. Verificar `isNaN(price)` antes de formatear. Mostrar `S/P` si null/undefined.

---

## 🎨 Diseño y Branding

### 15. Restricciones de Itálicas por Sección — Spec Geekorium (Feb 2026)

- **Problema**: Clase `italic` aparecía en headings de secciones donde la spec lo prohíbe explícitamente.
- **Causa Raíz**: El diseñador estableció que `font-web-titles` (Daito/Roboto Slab) no debe usarse en itálica en secciones de contenido informativo (¿Cómo comprar?, Ayuda). Solo se permite italic en títulos de marca/admin.
- **Solución**: Remover `italic` de `Home.tsx` L581 (¿Cómo comprar?) y `HelpPage.tsx` L28 (¿Aún tienes dudas?).
- **Regla Derivada**: Al implementar headings con `font-web-titles`, verificar si la sección está en la lista de restricciones de la spec. La lista actual: sección `¿Cómo comprar?` y sección de Ayuda.

### 16. Tokens de Color de Marca: Incluir Todas las Variantes del Spec (Feb 2026)

- **Problema**: El token `#523176` (variante técnica morada) estaba en la spec pero no definido en `index.css` como CSS variable.
- **Causa Raíz**: Al implementar la paleta inicial se omitió esta variante por considerarla secundaria.
- **Solución**: Agregar `--color-geeko-violet-deep: #523176` al bloque `@theme` de `index.css`.
- **Regla Derivada**: Al adoptar un nuevo spec de diseño, mapear **todas** las variantes de color del documento al sistema de tokens, incluso si no se usan inmediatamente. Pendiente usarlo en: bordes de cartas Lorcana, sellos de cera, accents de sets específicos.

---

## 🧪 Testing

### 17. Patch Target Correcto para Servicios con `supabase_admin` (Feb 2026)

- **Problema**: `test_collection_import.py` fallaba con `AttributeError: module does not have the attribute 'supabase'`.
- **Causa Raíz**: El service `collection_service.py` fue refactorizado para usar `supabase_admin = get_supabase_admin()` en lugar de `supabase`. Los tests seguían mockeando el atributo viejo.
- **Solución**: Cambiar el patch target en los fixtures de `'api.services.collection_service.supabase'` → `'api.services.collection_service.supabase_admin'`.
- **Regla Derivada**: Cuando un servicio renombra su variable de cliente de Supabase, buscar y actualizar TODOS los tests que la mockean. Usar `grep_search` con `patch(` + el módulo para detectarlos.

### 18. Lazy Imports en Servicios — Cómo Parchearlos (Feb 2026)

- **Problema**: `patch('src.api.services.collection_service.MatcherService')` fallaba porque `MatcherService` se importa dentro del cuerpo de la función (`from .matcher_service import MatcherService`), no al nivel del módulo.
- **Causa Raíz**: Los lazy imports (dentro de la función) no crean atributos en el namespace del módulo que los contiene, por lo que no son patcheables desde ahí.
- **Solución**: Parchear en el módulo **fuente**, no en el módulo importador: `patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock)`.
- **Regla Derivada**: Si una clase/función se importa con `from .modulo import Clase` dentro de una función, siempre parchear en `modulo.Clase`, no en `servicio_importador.Clase`.

### 19. Mock Chain para `ValuationService` — Two-Step Query (Feb 2026)

- **Problema**: `test_valuation_calculation_logic` afirmaba `store_price == 100.0` pero obtenía `1.0`.
- **Causa Raíz**: El test pasaba `{'source': 'geekorium', 'price_usd': 100.0}` pero el servicio NO usa el campo `source` — hace primero un query a la tabla `sources` para obtener un mapa `{source_id → source_code}`, luego itera `price_history` buscando `source_id` (entero).
- **Solución**: Reescribir el mock como un `table_side_effect` que retorna datos distintos por tabla: `sources` → mapa de IDs, `price_history` → filas con `source_id` (int), no `source` (str).
- **Regla Derivada**: Antes de escribir mocks para servicios, leer su implementación para identificar el flujo exacto de queries. Los servicios con lookups de tablas de referencia (como `sources`, `conditions`) requieren mocks de múltiples tablas.

### 20. Reemplazo Exhaustivo de Colores Heredados al Refactorizar UI (Feb 2026)

- **Problema**: Tras remover la clase `italic` en `HelpPage.tsx` para ajustarse a una regla tipográfica nueva, se revelaron clases utilitarias de color heredadas (`bg-[#f4e4bc]`, `text-black`, `bg-[#25D366]`) que desentonaban con el nuevo spec.
- **Causa Raíz**: Refactorización local "quirúrgica" (solo tocar `italic`) en componentes sin auditar si su paleta general sigue el nuevo "Diseño Fix".
- **Solución**: Reemplazo masivo de colores heredados en el componente modificado. Beige (`#f4e4bc`) a Primario (`#373266`), Negro (`text-black`) a Blanco (`#FFFFFF`), y Verde (`#25D366`) a Cyan (`geeko-cyan` / `#00AEB4`). Además se debió re-añadir `font-web-titles` porque el `<h3/>` carecía de familia tipográfica tras quitar la itálica.
- **Regla Derivada**: Siempre que se modifique un componente heredado ("legacy") para ajustarlo a nuevas reglas de brand, auditar TODO el componente. Eliminar colores *hardcoded* obsoletos y aplicar los nuevos tokens de marca. Validar que no perder clases como `italic` descubra la falta de clases estructurales como familias de fuentes (`font-web-titles`).

### 21. Fallbacks Visuales en Vistas Combinadas de DB (Feb 2026)

- **Problema**: Las imágenes de las cartas no se mostraban en el Grid ("Imagen No Disponible"), a pesar de existir imágenes en la base de datos de Scryfall.
- **Causa Raíz**: El endpoint RPC `get_products_filtered` retornaba directamente la columna `image_url` de la tabla `products`, la cual puede ser nula dependiendo del formato de importación, en lugar de considerar el fallback a la tabla unida `card_printings`.
- **Solución**: Refactorizar la proyección SQL para incluir `COALESCE(p.image_url, cp.image_url) as image_url`.
- **Regla Derivada**: Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.


### 22. Validaciones Locales Estrictas (Feb 2026)

- **Problema**: Formularios sin validaci�n previa enviaban datos inconsistentes (ej. formato de tel�fono err�neo) al equipo de soporte.
- **Soluci�n / Lecci�n**: Validar clide-side formatos espec�ficos (ej. venezolanos 04), rechazar letras en c�dula (eplace(/\D/g, '')), y forzar longitud en campos de texto antes de habilitar el pago.
- **Regla Derivada**: Todo input vital para el pago/contacto f�sico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.

### 23. Búsqueda y Validación de Stock en SQL (Feb 2026)
- **Problema**: El carrito permitía agregar más cartas de las que había en stock si se hacían múltiples clicks o llamadas al RPC dd_to_cart. Además, la búsqueda global a veces no priorizaba coincidencias exactas.
- **Causa Raíz**: El control de stock no totalizaba las cantidades previas del mismo item en el carrito antes de comparar con el stock máximo.
- **Solución**: Refactorizar dd_to_cart sumando quantity + v_current_qty > v_stock y lanzando un error. Ajustar get_products_filtered con un ORDER BY que priorice strings idénticos (p.name ILIKE ).
- **Regla Derivada**: Todo control de inventario en el backend debe ser calculable (suma del estado actual + intento) y rechazar transacciones a nivel SQL, y las funciones de búsqueda deben devolver coincidencias exactas primero.

### 24. Resolviendo Tipografías en UI Específica (Feb 2026)
- **Problema**: El diseño UI requería mapeos hiperespecíficos de tipografías (Daito para títulos, Bogue para precios, Rubik para cuerpo) en base a mockups donde no bastaba heredar la tipografía general.
- **Causa Raíz**: Las clases CSS como ont-sans no sobreescribían correctamente la jerarquía necesaria si el componente padre tenía otra.
- **Solución**: Aplicar clases nominales directas en Tailwind (ont-web-titles, ont-titles, ont-sans) a los subnodos del texto en los componentes y remover tags italic que forzaban el fallback del font.
- **Regla Derivada**: La fidelidad 1:1 de PRD UI requiere aplicar clases tipográficas explícitas en el nivel más bajo (hojas) del nodo del DOM y evitar modificadores de estilo globales (como italic o bold general) que rompan el font-face de UI.


### [Guest Checkout & Inventory Pattern] — 2026-02-27
- **Problema:** Riesgo de doble venta en un e-commerce de productos únicos (trading cards) cuando los pagos son asíncronos (Zelle/Pago Móvil) y los usuarios no tienen cuenta.
- **Causa Raíz:** Falta de un estado intermedio que bloquee el inventario temporalmente mientras el pago ocurre off-platform.
- **Solución:** Implementar un estado de orden `pending_payment` que reduce el `reserved_stock` inmediatamente mediante un RPC atómico de Supabase, acompañado de un Job/RPC que cancela las órdenes expiradas (superan 24 hrs sin validación) y devuelve el stock. Uso de URLs únicas (`/order/:id`) para que invitados suban su comprobante.
- **Regla Derivada:** Todo cambio de estado de `orders` debe evaluarse en el RPC `update_order_status` para gestionar `reserved_stock` vs `stock` dinámicamente y de forma atómica.

### 2. Validaci�n y Reserva Diferida - 2026-03-01
- **Problema:** Exigir comprobantes upfront choca con la realidad del stock f�sico desfasado.
- **Causa Ra�z:** El proceso asum�a que el stock del e-commerce siempre era 100% exacto respecto a la tienda f�sica.
- **Soluci�n:** Romper el pago y la verificaci�n en 2 pasos. Reservar el stock primero (pending_verification), y pagar despu�s (awaiting_payment).
- **Regla Derivada:** Cualquier estado que cambie a cancelled/returned desde active debe liberar el stock inmediatamente para evitar desajustes remanentes.

### 3. Evitar Bloqueos de UI por Fugas de Interacción - 2026-03-01
- **Problema:** Un modal (CardModal) que se cierra al agregar al carrito funcionaba bien en testing local pero dejaba la UI colgada (timeout por capa transparente superpuesta) en pruebas E2E en Producción.
- **Causa Raíz:** El modal tenía lógica condicional que solo lo cerraba si se pasaba un prop onAddToCartSuccess. En flujos donde este prop faltaba, la promesa colgaba visualmente porque esperaba al callback para cerrarse.
- **Solución:** Consolidar el cierre del modal (onClose()) para que siempre ocurra de manera incondicional, independiente de callbacks extra.
- **Regla Derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales a nivel del componente que las renderiza, no deben depender de hooks inyectados opcionales.
