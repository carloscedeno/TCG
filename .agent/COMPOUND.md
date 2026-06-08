# ðŸ§  COMPOUND: MigraciÃ³n a pnpm y Aislamiento de Entorno (Junio 2026)

**Date**: 2026-06-04 18:00

## Objective
Erradicar el uso de `npm` para mitigar vulnerabilidades de cadena de suministro y aislar scripts de ciclo de vida.

## Knowledge Codification

### 1. MigraciÃ³n de Gestor de Paquetes (npm -> pnpm)
- **Feature**: Reemplazo de `package-lock.json` por `pnpm-lock.yaml`, y actualizaciÃ³n de `deploy.yml`.
- **Lesson 1**: `pnpm` previene ejecuciÃ³n arbitraria de scripts maliciosos, pero requiere `pnpm approve-builds`.
- **Lesson 2**: `pnpm` revela dependencias peer faltantes que `npm` ocultaba (ej. `workbox-window` requerido por `vite-plugin-pwa`), obligando a instalarlas explÃ­citamente para el build.
- **Lesson 3**: GitHub Actions necesita `uses: pnpm/action-setup@v4` antes de instalar dependencias.

## Technical Validation
- **CI/CD**: `deploy.yml` actualizado y merge a `main` exitoso.
- **Frontend**: Servidor Vite y build (`workbox-window` agregado) funcionando bajo `pnpm`.
- **Scripts**: Sincronizadores auditados y seguros.

---

# ðŸ§  COMPOUND: MigraciÃ³n a pnpm y Aislamiento de Entorno (Junio 2026)

**Date**: 2026-06-04 18:00

## Objective
Erradicar el uso de `npm` para mitigar vulnerabilidades de cadena de suministro y aislar scripts de ciclo de vida.

## Knowledge Codification

### 1. MigraciÃ³n de Gestor de Paquetes (npm -> pnpm)
- **Feature**: Reemplazo de `package-lock.json` por `pnpm-lock.yaml`, y actualizaciÃ³n de `deploy.yml`.
- **Lesson 1**: `pnpm` previene ejecuciÃ³n arbitraria de scripts maliciosos, pero requiere `pnpm approve-builds`.
- **Lesson 2**: `pnpm` revela dependencias peer faltantes que `npm` ocultaba (ej. `workbox-window` requerido por `vite-plugin-pwa`), obligando a instalarlas explÃ­citamente para el build.
- **Lesson 3**: GitHub Actions necesita `uses: pnpm/action-setup@v4` antes de instalar dependencias.

## Technical Validation
- **CI/CD**: `deploy.yml` actualizado y merge a `main` exitoso.
- **Frontend**: Servidor Vite y build (`workbox-window` agregado) funcionando bajo `pnpm`.
- **Scripts**: Sincronizadores auditados y seguros.

---

# ðŸ§  COMPOUND: Inmutabilidad de Precios de Compra y Estabilidad de Filtros de CatÃ¡logo (Mayo 2026)

**Date**: 2026-05-18 16:00

## Objective
Garantizar la inmutabilidad de los precios con descuento al registrar pedidos en la base de datos (`create_order_atomic`) y eliminar la desincronizaciÃ³n de filtros de accesorios en el storefront (`Home.tsx`).

## Knowledge Codification

### 1. Inmutabilidad de Precios en Transacciones de Compra
- **Feature**: RefactorizaciÃ³n del procedimiento almacenado `create_order_atomic` para calcular dinÃ¡micamente `v_real_price` con el descuento activo al momento de insertar en `order_items`.
- **Pattern**: En bases de datos de comercio electrÃ³nico, los Ã­tems de un pedido (`order_items`) deben registrar el precio efectivamente pagado (`price_at_purchase`) en el instante exacto de la transacciÃ³n. Nunca debe guardarse el precio fÃ­sico base si existe un descuento o promociÃ³n activa, ya que esto adultera los reportes financieros y el historial del cliente.
- **Robustez**: Todas las consultas de validaciÃ³n de vigencia de descuentos en PL/pgSQL (`create_order_atomic`, `get_products_filtered`, `get_accessories_filtered`) ahora utilizan `>= CURRENT_DATE` (o truncado por dÃ­a) en lugar de un estricto `> now()`, asegurando que las promociones permanezcan estables y vigentes durante todo el dÃ­a de vencimiento segÃºn la zona horaria del cliente.

### 2. EliminaciÃ³n de Efectos Secundarios Competitivos en SincronizaciÃ³n de URL
- **Feature**: EliminaciÃ³n de un hook `useEffect` redundante en `Home.tsx` que sobrescribÃ­a los parÃ¡metros de bÃºsqueda de la URL con valores por defecto `[undefined, undefined]`.
- **Lesson**: Al sincronizar el estado local de una aplicaciÃ³n SPA con los parÃ¡metros de la URL (`searchParams`), debe existir una Ãºnica fuente de verdad (Single Source of Truth). Tener mÃºltiples hooks observando y modificando las mismas dependencias genera condiciones de carrera y ciclos de actualizaciÃ³n que corrompen la selecciÃ³n del usuario.

## Technical Validation
- **Database**: MigraciÃ³n `20260518195000_fix_create_order_atomic_discounts` aplicada exitosamente en el entorno remoto.
- **Frontend**: SincronizaciÃ³n de filtros y visualizaciÃ³n de ofertas en el catÃ¡logo de accesorios verificada remotamente en `dev.geekorium.shop`.
- **Build & CI**: CompilaciÃ³n limpia y exitosa en la rama `dev`.

---

# ðŸ§  COMPOUND: Hotfix de ProducciÃ³n - RestricciÃ³n NOT NULL en `order_items.product_name` (Mayo 2026)

**Date**: 2026-05-17 19:30


## Objective
Solucionar incidencia crÃ­tica de producciÃ³n donde las compras fallaban con `null value in column "product_name" of relation "order_items" violates not-null constraint`.

## Knowledge Codification

### 1. Invariantes del Esquema de Base de Datos vs RPC DinÃ¡micos
- **Feature**: RefactorizaciÃ³n de la migraciÃ³n de `create_order_atomic` para recuperar explÃ­citamente `name`, `printing_id`, `finish` y `set_code` desde las tablas de catÃ¡logo (`products` y `accessories`).
- **Lesson**: Al escribir y refactorizar procedimientos almacenados en PL/pgSQL, es mandatorio inspeccionar previamente las restricciones de columna de la base de datos (e.g. `NOT NULL`, `CHECK`). Cualquier columna obligatoria en la tabla destino debe ser explÃ­citamente asignada o tener un `COALESCE` robusto con un valor por defecto.
- **Pattern**: En sistemas de comercio electrÃ³nico, los Ã­tems de un pedido (`order_items`) deben capturar y congelar los metadatos descriptivos en el instante de la compra (nombre del producto, precio, acabado, ediciÃ³n) para preservar la inmutabilidad del historial y las facturas ante futuras modificaciones o borrados del catÃ¡logo.

## Technical Validation
- **Database**: MigraciÃ³n `20260517233000_fix_create_order_atomic_product_name.sql` aplicada y verificada en producciÃ³n.
- **Unit Tests**: 100% exitosos en `main` y `dev`.
- **Frontend Build**: CompilaciÃ³n exitosa en ambas ramas.

---

# ðŸ§  COMPOUND: CorrecciÃ³n de Atomicidad y Deadlocks en Transacciones de Orden (Mayo 2026)

**Date**: 2026-05-17 17:20

## Objective

Resolver bloqueos de concurrencia (deadlocks) y cuellos de botella de atomicidad en el RPC `create_order_atomic` durante picos de trÃ¡fico en el checkout.

## Knowledge Codification

### 1. OrdenaciÃ³n CanÃ³nica para PrevenciÃ³n de Deadlocks
- **Feature**: RefactorizaciÃ³n del RPC `create_order_atomic` para ordenar los Ã­tems entrantes por su identificador (`printing_id` o `accessory_id`) antes de realizar la validaciÃ³n y reserva de stock.
- **Pattern**: En bases de datos relacionales, cuando mÃºltiples transacciones concurrentes actualizan el mismo conjunto de registros en diferente orden, se producen deadlocks de exclusiÃ³n mutua. El ordenamiento canÃ³nico (ej. `ORDER BY id`) garantiza que todas las transacciones adquieran los bloqueos de fila exactamente en la misma secuencia, eliminando la posibilidad de interbloqueos.

### 2. GestiÃ³n de Bloqueos Selectivos (`FOR UPDATE`)
- **Feature**: Reemplazo de bloqueos de tabla pesados por cursores y `SELECT ... FOR UPDATE` a nivel de fila individual durante la iteraciÃ³n de reserva de stock.
- **Lesson**: El uso incondicional de bloqueos de tabla o la falta de bloqueos explÃ­citos a nivel de fila durante lecturas-para-escritura en funciones PL/pgSQL genera condiciones de carrera o bloqueos masivos que degradan el rendimiento de la aplicaciÃ³n en producciÃ³n.

## Technical Validation
- **Database**: MigraciÃ³n `20260517211800_fix_create_order_atomic_status.sql` aplicada con Ã©xito.
- **Unit Tests**: 28 passed.
- **Frontend Build**: Success con 0 errores y exit code 0.

---

# ðŸ§  COMPOUND: GestiÃ³n de Descripciones y UX Premium (Mayo 2026)

**Date**: 2026-05-14 17:35

## Objective

Restaurar la visibilidad de descripciones en el catÃ¡logo y torneos, y mejorar drÃ¡sticamente la experiencia de ediciÃ³n administrativa y navegaciÃ³n.

## Knowledge Codification

### 1. Modal de EdiciÃ³n Full vs Inline Editing

- **Feature**: Reemplazo de la ediciÃ³n inline en `CatalogPage.tsx` por un componente `EditProductModal.tsx` de pantalla completa.
- **Pattern**: Para objetos complejos (TCG Products), la ediciÃ³n modal es superior porque permite gestionar galerÃ­as de imÃ¡genes, descripciones largas y metadatos sin romper el flujo visual de la tabla maestra.
- **Lesson**: El diseÃ±o inline falla cuando el nÃºmero de campos supera los 5-6 o cuando hay inputs multilÃ­nea.

### 2. SPA Navigation & Scroll Management

- **Feature**: ImplementaciÃ³n de `ScrollToTop.tsx` global en `App.tsx`.
- **Lesson**: En aplicaciones React, es obligatorio resetear el scroll (`window.scrollTo(0, 0)`) en cada cambio de ruta para evitar que el usuario aterrice en el "footer" al entrar a un detalle de producto desde una lista larga.
- **Rule**: Cada nueva aplicaciÃ³n SPA debe incluir un `ScrollToTop` de serie.

### 3. RedirecciÃ³n Directa vs Vista Previa

- **UX**: EliminaciÃ³n del modal de vista previa rÃ¡pida en favor de la navegaciÃ³n directa a la pÃ¡gina de detalle espectacular (`CardDetail.tsx`).
- **Optimization**: Esto simplifica la lÃ³gica del frontend y asegura que el usuario siempre vea la mejor versiÃ³n del producto con todos sus metadatos (descripciÃ³n, variantes, carrusel).

## Technical Validation

- **Frontend Build**: Success (tras limpieza de variables TS6133).
- **Git Status**: Pushed to `dev`.
- **UX Audit**: Verificado el reset de scroll y la carga de descripciones en `dev.geekorium.shop`.

---

# ðŸ§  COMPOUND: SincronizaciÃ³n de CatÃ¡logo y RemediaciÃ³n de ImportaciÃ³n Masiva (v63)

**Date**: 2026-05-13 11:30

## Objective

Resolver fallos en la carga masiva de inventario mediante la sincronizaciÃ³n de metadatos faltantes y el endurecimiento de la lÃ³gica de upsert en la base de datos.

## Knowledge Codification

### 1. RemediaciÃ³n AutomÃ¡tica de CatÃ¡logo (Scryfall Sync)

- **Feature**: Creados scripts de utilidad (`fetch_missing_cards.py`) que utilizan IDs de Scryfall para parchar automÃ¡ticamente el catÃ¡logo maestro cuando se detectan sets o cartas faltantes.
- **Rule**: Ninguna importaciÃ³n de inventario debe fallar por restricciones de llave forÃ¡nea si el ID de Scryfall es vÃ¡lido; el sistema debe ser capaz de auto-abastecerse de metadatos.

### 2. Endurecimiento de Upsert (SQL Constraints)

- **Pattern**: Uso de `ON CONFLICT ON CONSTRAINT products_printing_id_condition_finish_key` en lugar de targets de columnas genÃ©ricos.
- **Lesson**: Esto previene ambigÃ¼edades en tablas con columnas que permiten nulos (`finish`) o donde existen mÃºltiples Ã­ndices parciales.

### 3. Integridad Visual de Tokens y Sets Especiales

- **Optimization**: Los tokens (sets terminados en `C`, `Tokens`) ahora se registran correctamente vinculÃ¡ndolos a sus juegos correspondientes (`MTG`), asegurando que las imÃ¡genes y rarezas sean visibles en el storefront.

## Technical Validation

- **Frontend Build**: Success.
- **Database**: 24 productos fallidos cargados exitosamente tras el parche de catÃ¡logo.
- **Unit Tests**: 28 Passed.

---

# ðŸ§  COMPOUND: Bulk Catalog Import & Validation Hardening

**Date**: 2026-05-12 17:45

## Objective

Implement a high-performance bulk import system for the accessory catalog, bypassing image requirements and standardizing category ingestion.

## Knowledge Codification

### 1. Catalog Import Architecture (Edge Function)

- **Feature**: Added `catalog` import type to `tcg-api`. It maps CSV headers to the `accessories` table and performs batch insertions.
- **Optimization**: Implemented `.trim()` on `category_code` within the Edge Function to prevent foreign key violations caused by hidden whitespace in CSV files.
- **Flexibility**: Updated validation to allow `price: 0.00` for promotional or free items, using `isNaN()` instead of truthy checks.

### 2. Intelligent Auto-mapping (BulkImport.tsx)

- **Pattern**: Implemented a "Catalog Detection" mode. If headers match the system template (`category_code`, `suggested_price`), the UI pre-selects all mappings automatically.
- **Language**: Standardized example data and templates to **English** by default, aligning with international TCG standards while maintaining local currency support.

### 3. Product-Centric UI Integration

- **Component**: Created `BulkImportCatalogModal.tsx` following the "Geeko Noir" design system (GlassCard, Geeko Cyan accents).
- **Placement**: Integrated into `CatalogPage.tsx` as a primary administrative action alongside manual creation.

## Technical Validation

- **Frontend Build**: Success.
- **Git Status**: Pushed to `dev`.
- **Edge Function**: Deployed and verified with a 10-row test file (`TEST_IMPORT_FUNCIONA.csv`).

---


# ðŸ§  COMPOUND: Banner Regression & React "Phantom Zero" Remediation

**Date**: 2026-05-12 16:45

## Objective

Remediate a UI regression where global banners were overwriting game-specific TCG banners, and eliminate "stray 0" artifacts from the product grid.

## Knowledge Codification

### 1. Banner Category Shadowing (Home.tsx)

- **Regression**: In a recent refactor, `gameCode` was being forced to `undefined` when `activeTab === 'catalog'`, causing the `HeroSection` to fallback to global home banners even when a specific TCG was filtered.
- **Fix**: Restored the direct link between `filters.games` and `HeroSection`. The banner logic now respects the selected TCG regardless of the active viewing mode (Cartas vs Accesorios).
- **Rule**: Never override state-derived props with hardcoded defaults in the top-level page unless a specific view explicitly forbids it.

### 2. The "Phantom Zero" React Anti-pattern

- **Discovery**: In React, `{number && <Component />}` evaluates to `0` and renders it if the number is `0`.
- **Lesson**: Transitioned components to `{!!number && <Component />}` or `number > 0 && <Component />`.
- **Reference**: Added to `.agent/lessons_learned.md` as Lesson #155.

## Technical Validation

- **Frontend Build**: Success.
- **Git Status**: Clean.
- **TCG Testing**: MTG and PokÃ©mon banners verified via browser subagent.
- **Unit Tests**: 28 Passed.

---


# ðŸ§  COMPOUND: Unified Cart & Discount Synchronization

**Date**: 2026-05-11 22:00

## Objective

Finalize the unified cart architecture to ensure cards and accessories are handled consistently, with real-time discount synchronization across authenticated and guest sessions.

## Knowledge Codification

### 1. Unified Cart Mapping (RPC Trust)

- **Standard**: The frontend `fetchCart` now trusts the `get_user_cart` RPC as the single source of truth for all cart item metadata and price calculations.
- **Bypass**: Removed complex client-side normalization and fallback queries in `api.ts` to favor server-side consistency.

### 2. Guest Discount Parity

- **Pattern**: Guest cart processing in `api.ts` now mirrors the backend's discount logic.
- **Rule**: Prices for accessories and cards in local storage are dynamically recalculated based on active offers (`discount_percentage` and expiration dates) to prevent pricing drift.

### 3. Detail Fetching Hierarchy

- **Hierarchy**: When fetching product details by UUID, always check the `accessories` table BEFORE falling back to the Edge Function (Scryfall/Cards). 
- **Logging**: Added diagnostic logging to distinguish between store-local inventory (Accessories) and global catalog data (Cards), resolving 404 console errors.

## Technical Validation

- **Frontend Build**: Success.
- **E2E Verification**: Confirmed via browser subagent (Auth & Guest flows).
- **Console Audit**: Zero 404s for accessory details.

---


# ðŸ§  COMPOUND: E2E Checkout Remediation & "Por Encargo" Workflow

**Date**: 2026-05-07 00:10

## Objective

Remediate the E2E checkout process by implementing "Por Encargo" logic to bypass strict stock validation and provide clear UI feedback.

## Knowledge Codification

### 1. The "On-Demand" Bypass Pattern

- **Pattern**: Instead of blocking orders with `RAISE EXCEPTION` when stock is low, the system now accepts the order and flags `order_items.is_on_demand = true`.
- **Rule**: Stock can be decremented to 0 (floor) or allowed to go negative depending on the specific product type tracking needs.

### 2. Contextual UI Feedback

- **UI**: Cyan badges (`geeko-cyan`) with black text are used for "POR ENCARGO" labels to ensure high visibility against the dark theme.
- **Badge logic**: `quantity > stock` is the definitive trigger for the "On-Demand" state in the UI.

### 3. Operational WhatsApp Flow

- **Rule**: Every WhatsApp order message MUST identify if it contains on-demand items via a header and per-item markers to alert the sales team of needed sourcing.

## Technical Validation

- **Frontend Build**: Success.
- **Unit Tests**: 28 Passed.
- **Database**: Migration 20260507120000 prepared for remote deployment.


## 2026-05-22 â€” Arreglo del Flujo Visual y Base de Datos para Descuentos

**QuÃ© pasÃ³:** El administrador reportÃ³ que al asignar un descuento a un Ã­tem, el precio en la base de datos se corrompÃ­a y la UI no mostraba la rebaja. Luego reportÃ³ que al arreglarlo, el catÃ¡logo desapareciÃ³ y la ficha de producto no aplicaba el descuento si no habÃ­a fecha lÃ­mite.
**Lo que cambiÃ³:**
- lessons_learned.md â†’ LecciÃ³n N: LÃ³gica de Descuentos, Fechas NULL y Funciones Duplicadas (PostgREST 300).
- rontend/src/utils/api.ts â†’ isDiscountActive acepta ahora fechas nulas y getCardDetails calcula dinÃ¡micamente el precio con base en el descuento activo.
- supabase/ â†’ EliminaciÃ³n de triggers destructivos de descuentos, limpieza de sobrecarga de funciones y correcciÃ³n de lÃ³gica de NULL date.

## 2026-05-24 â€” SincronizaciÃ³n de Base de Datos DEV y OptimizaciÃ³n de PDF

**QuÃ© pasÃ³:** El frontend de DEV fallaba con errores 400 y 404 en el panel de administraciÃ³n de Ã³rdenes debido a una desincronizaciÃ³n entre la base de datos DEV y las recientes migraciones de esquema (order_items). Se aplicaron manualmente las migraciones pendientes en el proyecto de DEV usando el MCP de Supabase. Luego, se intentÃ³ inyectar collector_number en una consulta GraphQL sobre la tabla products, lo cual provocÃ³ un error 400 ya que dicha columna no existe en esa tabla (reside en card_printings). Se limpiaron las proyecciones y se optimizÃ³ el PDF de recibos para mostrar el cÃ³digo de ediciÃ³n y la foliaciÃ³n.
**Lo que cambiÃ³:**
- lessons_learned.md -> Lecciones #171 (Multi-entorno y DEV DB) y #172 (Proyecciones GraphQL)
- rontend/src/pages/Admin/OrdersPage.tsx -> Ajuste de queries (sin collector_number) y mejora en el HTML del PDF.
- rontend/src/pages/OrderTrackingPage.tsx -> SincronizaciÃ³n de queries.
- supabase/migrations/20260524150000_add_missing_order_items_columns.sql -> MigraciÃ³n aÃ±adida formalmente.
**Artefacto creado:** MigraciÃ³n SQL y PDF receipt mejorado.
**Regla derivada:** No asumir que DEV y PROD tienen el mismo DDL en Supabase. Aplicar migraciones explÃ­citamente. Nunca pedir campos "ciegamente" en Supabase RPC sin verificar information_schema.

## 2026-05-24 ï¿½ Sincronï¿½a de Filtros Frontend-Backend

**Quï¿½ pasï¿½:** Reparamos la desconexiï¿½n entre la UI de React y las RPC de Supabase que provocaba que los filtros visuales (precio, preventa, descuento, otros) no tuvieran efecto real en el catï¿½logo.
**Lo que cambiï¿½:**
- .agent/lessons_learned.md -> Lecciï¿½n #173 (Frontend Filters Disconnected from Backend RPCs)
- .agent/AGENTS.md -> Nueva feature documentada.
- rontend/src/pages/Home.tsx -> Removido cap de precio en isDefaultFilter y mapeado type_line.
- rontend/src/components/Card/Card.tsx -> Ocultada rareza en Sealed Products.
**Artefacto creado:** scripts/apply_rpc_fixes.py -> Script para inyectar los flags p_only_discount, p_only_presale y p_games (OTHERS) en las consultas SQL de producciï¿½n/dev.
**Regla derivada:** Validar que los contratos backend (SQL/RPC) estï¿½n listos para recibir parï¿½metros antes de implementar switches visuales que modifiquen la URL del catï¿½logo.

## 2026-05-27 â€” ResoluciÃ³n de Bugs en Filtros de CatÃ¡logo y Carga Masiva

**QuÃ© pasÃ³:** 
1. Durante la carga masiva (Bulk Import) de accesorios, faltaba la columna game_id, por lo que todos los productos se cargaron como GenÃ©ricos (game_id = NULL).
2. Se arreglÃ³ el script de importaciÃ³n para asignar el ID del juego correcto basado en el nombre.
3. El usuario reportÃ³ que la pestaÃ±a 'OTROS' en el UI mostraba productos de Magic/Digimon. Se descubriÃ³ un bug en get_accessories_filtered donde p_game_code = 'OTHERS' evaluaba a p_game_id IS NULL y anulaba el filtro completo, devolviendo todo el catÃ¡logo.

**Lo que cambiÃ³:**
- lessons_learned.md â†’ LecciÃ³n #6 agregada sobre el manejo de NULL explÃ­cito en RPCs.
- catalogo_formateado_para_importar.csv -> Generado de nuevo con IDs de juego.
- supabase/migrations/20260527000000_fix_accessories_others_filter.sql -> Fix aplicado.

**Regla derivada:**
Siempre proveer un caso de evaluaciÃ³n estricto en sentencias SQL cuando el sistema espera filtrar registros por IS NULL como un valor vÃ¡lido en lugar de como la ausencia del filtro.


## 2026-05-27 - Sincronizacion y Denormalizacion de Precios Masivos

**Que paso:** El script de actualizacion masiva de precios perdia datos en las tablas temporales y fallaba la denormalizacion final por un timeout de PostgreSQL.
**Lo que cambio:**
- lessons_learned.md -> Leccion #174: Timeout y Tablas Temporales.
- scripts/sync_cardkingdom_api.py -> ON COMMIT PRESERVE ROWS y SET statement_timeout = 30min.
- scripts/nightly_guardian.py -> Anadida capacidad de enviar alertas de error por correo (smtplib).
- rontend/src/pages/Admin/AdminDashboard.tsx -> Anadido semaforo de Salud de Sincronizacion.

## 2026-05-28 â€” Entornos de Base de Datos y SanitizaciÃ³n de ImÃ¡genes

**QuÃ© pasÃ³:** Se requerÃ­a sanitizar los nombres de los productos para hacer match con nombres de archivos de imagen subidos localmente. Inicialmente se limpiaron los dos puntos (`:`) pero se ejecutÃ³ errÃ³neamente en el entorno de producciÃ³n (`main`) en lugar del entorno en uso por el cliente (`dev`). Posteriormente se rectificÃ³ conectÃ¡ndose a `dev` vÃ­a MCP, y se ampliÃ³ la limpieza para abarcar TODOS los caracteres incompatibles con el sistema de archivos de Windows (e.g. `/`, `"`).
**Lo que cambiÃ³:**
- `lessons_learned.md` â†’ LecciÃ³n #175 (ValidaciÃ³n de entornos Supabase)
- `lessons_learned.md` â†’ LecciÃ³n #176 (SanitizaciÃ³n completa de caracteres de Windows)
- `DocumentaciÃ³n/catalogo_formateado_para_importar.csv` â†’ Limpiado de caracteres invÃ¡lidos de SO
- Base de datos (`dev`) â†’ Tabla `accessories` limpiada de caracteres invÃ¡lidos de SO

## 2026-05-28 â€” Filtros de Precios y UX

**QuÃ© pasÃ³:** Se arreglÃ³ un bug en la UX del filtro de precios de la vista principal que impedÃ­a dejar los campos en blanco y evaluar precios en 0.
**Lo que cambiÃ³:**
- `frontend/src/pages/Home.tsx` â†’ Permitir `undefined` en el estado del rango de precios.
- `frontend/src/utils/api.ts` â†’ Refactor de `params.price || null` a validaciÃ³n estricta `!== undefined`.
- `lessons_learned.md` â†’ LecciÃ³n aÃ±adida sobre estado de variables numÃ©ricas opcionales.

## 2026-06-01 â€” Entornos y Bugs de Cortocircuito en RPC

**QuÃ© pasÃ³:** Hubo una confusiÃ³n crÃ­tica entre entornos debido a que un archivo local `.env` tenÃ­a la variable `VITE_ENVIRONMENT=development` pero apuntaba a la base de datos de PROD. Esto llevÃ³ a modificar PROD en lugar de DEV. Adicionalmente, se descubriÃ³ un grave bug en la RPC `get_accessories_filtered` donde el paso de `p_game_id IS NULL` junto a un `OR` sin aislamiento causaba un cortocircuito lÃ³gico que devolvÃ­a todo el catÃ¡logo al usar la categorÃ­a "Otros".
**Lo que cambiÃ³:**
- `lessons_learned.md` â†’ LecciÃ³n #177 agregada con detalles sobre la validaciÃ³n de entornos y el manejo estricto de parÃ¡metros de filtrado en RPCs con PostgreSQL.
- `AGENTS.md` â†’ Se agregÃ³ una regla crÃ­tica forzando la verificaciÃ³n canÃ³nica de entornos (comparando explÃ­citamente IDs de proyectos Supabase) y prohibiendo confiar ciegamente en nombres de variables `.env` locales.
- `.env` y `frontend/.env` â†’ Refactorizados para contener etiquetas explÃ­citas separadas para `DEV_` y `PROD_`.
- `bqfkqnnostzaqueujdms` (DEV) â†’ FunciÃ³n `get_accessories_filtered` reescrita para separar `p_game_code = 'OTHERS'` del comportamiento por defecto cuando el filtro es NULL.
**Regla derivada:** JamÃ¡s asumir entornos por nombres de variables locales (ej. `development` en un archivo no garantiza que la BD sea el sandbox). SIEMPRE confirmar el ID del proyecto Supabase (DEV=`bqfkqnnostzaqueujdms`, PROD=`sxuotvogwvmxuvwbsscv`).


## 2026-06-02 ï¿½ Funciones Sobrecargadas y Despliegues Manuales

**Quï¿½ pasï¿½:** Un error de tipo PGRST203 colapsï¿½ la tienda de Producciï¿½n porque una actualizaciï¿½n de SQL cambiï¿½ el orden de los argumentos booleanos, creando una funciï¿½n sobrecargada.
**Lo que cambiï¿½:**
- lessons_learned.md -> Lecciï¿½n #178 (Funciones sobrecargadas y Cloudflare)
- LEYES_DEL_SISTEMA.md -> Leyes 34 y 35 (Respetar orden de firmas SQL y Sincronizaciï¿½n manual en Cloudflare)
**Regla derivada:** LEY 34 y LEY 35 agregadas.


## 2026-06-02 ï¿½ Bug en Filtro Cruzado de Categorï¿½as

**Quï¿½ pasï¿½:** El filtro cruzado de categorï¿½as ('Otros') devolvï¿½a 'SIN RESULTADOS' a pesar de haber inventario activo.
**Lo que cambiï¿½:**
- `lessons_learned.md` -> Lecciï¿½n #179: Uso correcto de category vs category_code.
- `LEYES_DEL_SISTEMA.md` -> Agregada la Ley 36.
**Regla derivada:** Diferenciaciï¿½n estricta entre bï¿½squeda ILIKE (category) y MATCH exacto (category_code).


## 2026-06-04 - Fix URL Edge Function y Resiliencia de Fallback

**Quï¿½ pasï¿½:** El usuario reportï¿½ mï¿½ltiples errores rojos en la consola de Producciï¿½n. Se investigï¿½ y se concluyï¿½ que muchos eran producto de una extensiï¿½n de Chrome (Jam.dev), pero ademï¿½s se corrigiï¿½ un 404 proveniente de la Edge Function.
**Lo que cambiï¿½:**
- rontend/src/utils/api.ts -> Modificada etchCardDetails para usar getApiUrl al invocar la Edge Function.
- lessons_learned.md -> Lecciï¿½n #180 (Construcciï¿½n Correcta de URL para Edge Functions).
**Regla derivada:** LEY 37: Centralizaciï¿½n en la construcciï¿½n de endpoints API en el frontend.

## 2026-06-07 — UI y APIs externas

**Qué pasó:** 
1. Implementamos el módulo `PriceUpdateHistory` en el Dashboard. Descubrimos que insertarlo directamente interrumpe el grid principal. Se movió a un esquema Modal.
2. La Action de Sincronización de Scryfall en Python empezó a fallar con `HTTPError: 400 Bad Request`.
**Lo que cambió:**
- `AdminDashboard.tsx` & `PriceUpdateHistory.tsx` → Se adoptó un patrón de Modal disparado por un botón del Grid para no romper la visual.
- `load_mtgs_sets_from_scryfall.py` → Se agregaron headers de `User-Agent`.
- `lessons_learned.md` → Lección #37 (Modales vs Componentes Inline) y Lección #38 (Scryfall HTTP 400).

## 2026-06-04 — Mejoras Visuales en Detalle de Producto

**Qué pasó:** Se integró un carrusel de imágenes y se corrigió el recorte de texto para productos con múltiples imágenes en el frontend.
**Lo que cambió:**
- CardDetail.tsx -> Implementación de Carrusel y arreglos layout Flexbox
- lessons_learned.md -> Lección #181 (Supabase Storage RLS Concurrency)



## 2026-06-05 â€” ReparaciÃ³n de AnalÃ­ticas y Banner Fantasma

**QuÃ© pasÃ³:** El usuario reportÃ³ que el Admin Dashboard mostraba 'SincronizaciÃ³n Retrasada' continuamente a menos que se hiciera un Hard Refresh. Adicionalmente, el panel de mÃ©tricas de Cloudflare devolvÃ­a error 500 por 'Admin endpoint not found'.
**Lo que cambiÃ³:**
- `supabase/functions/api/index.ts` â†’ Rutas normalizadas con `includes()` para Cloudflare Analytics.
- `frontend/src/pages/Admin/AdminDashboard.tsx` â†’ Implementado Cache-busting dinÃ¡mico en el query de polling de fecha. Agregada la exclusiÃ³n de nulos.
- **DB:** Creado `idx_card_printings_updated_at` para prevenir table scans que bloqueaban las peticiones de fetchStats.
- `.agent/lessons_learned.md` â†’ LecciÃ³n #36 (Cache Busting y Edge Function Proxys)



## 2026-06-08 — Upgrade del Flujo de Desarrollo (Graphify & Context)

**Qué pasó:** El usuario reportó pérdida de contexto, búsquedas innecesarias que gastan tokens, instalaciones locales no deseadas, y falta de pruebas. 
**Lo que cambió:**
- .agent/workflows/prehook.md → Reescrito para incluir Graphify, SESSION_STATE, Context Budget Protocol y Spec-First.
- .agent/SESSION_STATE.md → Creado como archivo de estado persistente entre sesiones.
- .agent/lessons_learned.md → Lección #182 agregada sobre el Context Budget Protocol y el uso de Graphify.
- .agent/AGENTS.md → Agregada la feature del Dev Workflow Upgrade.
- .git/hooks/post-commit → Hook instalado para automatizar graphify update tras cada commit en rontend/src.
**Artefacto creado:** Graphify Knowledge Graph (graphify-out/).
**Regla derivada:** Siempre leer SESSION_STATE.md al inicio. Buscar en el grafo con graphify query antes de usar grep. Tareas grandes requieren un mini-spec antes de codificar.

## 2026-06-08 — Upgrade del Flujo de Desarrollo (Graphify & Context)

**Qué pasó:** El usuario reportó pérdida de contexto, búsquedas innecesarias que gastan tokens, instalaciones locales no deseadas, y falta de pruebas.
**Lo que cambió:**
- .agent/workflows/prehook.md → Reescrito para incluir Graphify, SESSION_STATE, Context Budget Protocol y Spec-First.
- .agent/SESSION_STATE.md → Creado como archivo de estado persistente entre sesiones.
- .agent/lessons_learned.md → Lección #182 agregada sobre el Context Budget Protocol y el uso de Graphify.
- .agent/AGENTS.md → Agregada la feature del Dev Workflow Upgrade.
- .git/hooks/post-commit → Hook instalado para automatizar graphify update tras cada commit en rontend/src.
**Artefacto creado:** Graphify Knowledge Graph (graphify-out/).
**Regla derivada:** Siempre leer SESSION_STATE.md al inicio. Buscar en el grafo con graphify query antes de usar grep. Tareas grandes requieren un mini-spec antes de codificar.

## 2026-06-08 — Integración de UX de Perfil, Avatares y Checkout Autofill

**Qué pasó:** El usuario reportó problemas con la página de Perfil, fallos silenciosos al guardar configuraciones, y un bug donde los pedidos no aparecían en el historial. Además, se pidió prellenar el checkout con los datos del perfil y añadir soporte para fotos de perfil.
**Lo que cambió:**
- `Profile.tsx` → Se reemplazó el header manual por el `<Header />` global para mantener la navegación. Se eliminó la sección estática "Financial Intelligence".
- **DB:** Se añadió una política RLS `Users can update own profile` en `public.profiles` (estaba fallando silenciosamente) y se creó un bucket `avatars` con su respectiva columna `avatar_url`.
- `OrdersList.tsx` → Se removió el filtro `.is('deleted_at', null)` que causaba error ya que la columna no existía en `orders`.
- `CheckoutPage.tsx` → Se añadió autocompletado de datos desde el perfil.
- `ProfileSettingsModal.tsx` & `api.ts` → Soporte para subir imágenes al bucket `avatars`.
**Regla derivada:** Validar las columnas existentes antes de usar `.is()` en la DB. Al usar RLS, verificar que exista política UPDATE, de lo contrario devuelve "éxito" pero modifica 0 filas.
