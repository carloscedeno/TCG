# ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  TCG Hub - Developer Knowledge Base (Lessons Learned)



Este documento registra los desafÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­os tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.



## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Entorno y Dependencias



### 160. MitigaciÃ³n de Vulnerabilidades en npm y Scripts de Build (Junio 2026)
- **Problema**: Riesgo de ataques de cadena de suministro (supply chain attacks) asociados a la ejecuciÃ³n automÃ¡tica de scripts en `npm install`.
- **Causa RaÃ­z**: `npm` permite la ejecuciÃ³n de scripts de ciclo de vida (`postinstall`) sin confirmaciÃ³n explÃ­cita. AdemÃ¡s, dependencias transitivas mal declaradas pueden fallar bajo resoluciÃ³n estricta.
- **SoluciÃ³n**: 
  1. Migrar a `pnpm` y usar `pnpm approve-builds` para autorizar scripts explÃ­citamente (`[ERR_PNPM_IGNORED_BUILDS]`).
  2. Al migrar a `pnpm` (que usa symlinks estrictos), paquetes con dependencias peer ocultas como `vite-plugin-pwa` (que requiere `workbox-window`) fallarÃ¡n en build. Se deben instalar explÃ­citamente (`pnpm add workbox-window`).
- **Regla Derivada**: Prohibido usar `npm`. Toda dependencia se maneja con `pnpm`.


### 160. MitigaciÃ³n de Vulnerabilidades en npm y Scripts de Build (Junio 2026)
- **Problema**: Riesgo de ataques de cadena de suministro (supply chain attacks) asociados a la ejecuciÃ³n automÃ¡tica de scripts en `npm install`.
- **Causa RaÃ­z**: `npm` permite la ejecuciÃ³n de scripts de ciclo de vida (`postinstall`) sin confirmaciÃ³n explÃ­cita. AdemÃ¡s, dependencias transitivas mal declaradas pueden fallar bajo resoluciÃ³n estricta.
- **SoluciÃ³n**: 
  1. Migrar a `pnpm` y usar `pnpm approve-builds` para autorizar scripts explÃ­citamente (`[ERR_PNPM_IGNORED_BUILDS]`).
  2. Al migrar a `pnpm` (que usa symlinks estrictos), paquetes con dependencias peer ocultas como `vite-plugin-pwa` (que requiere `workbox-window`) fallarÃ¡n en build. Se deben instalar explÃ­citamente (`pnpm add workbox-window`).
- **Regla Derivada**: Prohibido usar `npm`. Toda dependencia se maneja con `pnpm`.


### 1. Conflictos de VersiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n en CI/CD (GitHub Actions)



- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.

- **Causa**: Versiones muy recientes de librerÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as a veces tardan horas/dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.

- **Causa**: Versiones muy recientes de librerÃƒÆ’Ã‚Â­as a veces tardan horas/dÃƒÆ’Ã‚Â­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - Sincronizar la versiÃƒÆ’Ã‚Â³n de Python del runner (3.12) con la local.

  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.



### 159. Invariantes de Esquema de Base de Datos vs RPCs DinÃ¡micos (Mayo 2026)
- **Problema**: ViolaciÃ³n inmediata de restricciÃ³n `NOT NULL` en la columna `product_name` de `order_items` al intentar finalizar una compra en producciÃ³n.
- **Causa RaÃ­z**: Durante la refactorizaciÃ³n de funciones atÃ³micas en PL/pgSQL (ej. `create_order_atomic`), las sentencias de inserciÃ³n omitieron mapear todas las columnas requeridas por el esquema de base de datos.
- **SoluciÃ³n**: Al diseÃ±ar o actualizar procedimientos almacenados de Ã³rdenes, recuperar de forma explÃ­cita todos los metadatos descriptivos del catÃ¡logo (`name`, `printing_id`, `finish`, `set_code`) con caÃ­das de respaldo robustas (`COALESCE`) hacia el payload de entrada.
- **LecciÃ³n**: Nunca asumir que las columnas descriptivas de un Ã­tem de orden son opcionales. En un sistema e-commerce resiliente, congelar los metadatos al momento de la transacciÃ³n es un requerimiento innegociable de auditorÃ­a e inmutabilidad.

### 155. El Anti-patrÃƒÂ³n del "Cero Fantasma" en React (Mayo 2026)
- **Problema**: ApariciÃƒÂ³n de dÃƒÂ­gitos "0" literales en la UI, especialmente en esquinas de tarjetas o grids, sin explicaciÃƒÂ³n aparente.
- **Causa RaÃƒÂ­z**: Uso de cortocircuito lÃƒÂ³gico `&&` con variables numÃƒÂ©ricas en JSX (ej: `{stock && <Badge />}`). En JavaScript, `0 && anything` retorna `0`. React renderiza el nÃƒÂºmero `0` como un nodo de texto vÃƒÂ¡lido, a diferencia de `false`, `null` o `undefined`.
- **SoluciÃƒÂ³n**:
    1. **ConversiÃƒÂ³n ExplÃƒÂ­cita**: Usar `!!variable && <Component />` para forzar a booleano.
    2. **ComparaciÃƒÂ³n ExplÃƒÂ­cita**: Usar `variable > 0 && <Component />` si el objetivo es mostrar algo solo cuando hay valor.
    3. **Ternario**: Usar `{variable ? <Component /> : null}`.
- **LecciÃƒÂ³n**: NUNCA usar variables numÃƒÂ©ricas directamente con `&&` en JSX si `0` es un valor posible. Se debe endurecer el tipado y la evaluaciÃƒÂ³n lÃƒÂ³gica en componentes crÃƒÂ­ticos como `Card.tsx` para mantener la limpieza visual de la marca.

### 156. ValidaciÃƒÂ³n de Precios Cero en Importaciones (Mayo 2026)
- **Problema**: La carga masiva rechazaba filas con precio "0.00" indicando "Faltan campos obligatorios".
- **Causa RaÃƒÂ­z**: Uso de validaciÃƒÂ³n `if (!price)` en la Edge Function. En JavaScript, `0` es falsy, por lo que el sistema interpretaba un precio de cero como un campo vacÃƒÂ­o.
- **SoluciÃƒÂ³n**: Cambiar la validaciÃƒÂ³n a `if (isNaN(price))` para permitir explÃƒÂ­citamente el valor `0` mientras se siguen rechazando valores no numÃƒÂ©ricos o nulos.
- **LecciÃƒÂ³n**: Al validar datos financieros, siempre permitir el `0` explÃƒÂ­citamente si tiene sentido para el negocio (promos, regalos, placeholders).

### 158. TypeScript Build Strictness in CI (Mayo 2026)
- **Problema**: Despliegues fallidos en producciÃƒÂ³n debido a variables e imports no utilizados (`TS6133`).
- **Causa RaÃƒÂ­z**: El compilador en entornos de CI (como GitHub Actions o Cloudflare Pages) suele estar configurado con reglas mÃƒÂ¡s estrictas que el entorno de desarrollo local.
- **SoluciÃƒÂ³n**: Eliminar rigurosamente imports y variables no utilizadas antes de cada push. El uso de herramientas de linting local es mandatorio.
- **LecciÃƒÂ³n**: No confiar solo en que "funciona en local"; el build de producciÃƒÂ³n es el juez final.

### 159. SPA Navigation Scroll Behavior (Mayo 2026)
- **Problema**: Al navegar a una nueva pÃƒÂ¡gina (ej: del CatÃƒÂ¡logo al Detalle de Producto), el scroll se mantenÃƒÂ­a en la posiciÃƒÂ³n anterior, forzando al usuario a "subir" manualmente para ver el contenido.
- **Causa RaÃƒÂ­z**: Los navegadores no resetean el scroll automÃƒÂ¡ticamente en aplicaciones Single Page (React) a menos que se implemente explÃƒÂ­citamente.
- **SoluciÃƒÂ³n**: Crear un componente global `ScrollToTop` que escuche cambios en `pathname` y ejecute `window.scrollTo(0, 0)`.
- **LecciÃƒÂ³n**: La gestiÃƒÂ³n del scroll es una parte fundamental de la experiencia de usuario (UX) en aplicaciones modernas de TCG con listados largos.

- **Problema**: Discrepancias de precios entre el carrito de invitados y usuarios registrados, junto con errores 404 al ver detalles de accesorios.
- **Causa RaÃ­z**:
    1. El frontend realizaba cÃ¡lculos de precios y mapeos complejos que no siempre coincidÃ­an con la lÃ³gica del backend (RPC get_user_cart).
    2. La lÃ³gica de bÃºsqueda de detalles por UUID intentaba cargar accesorios desde el endpoint de cartas de la Edge Function, causando 404s.
- **SoluciÃ³n**:
    1. **Confianza en el RPC**: Refactorizar etchCart para usar directamente la respuesta plana del RPC unificado, eliminando lÃ³gica redundante en el cliente.
    2. **Paridad de Descuentos**: Replicar la lÃ³gica de cÃ¡lculo de ofertas (discount_percentage + discount_until) en el procesamiento del carrito de invitados (pi.ts).
    3. **PriorizaciÃ³n de Inventario Local**: Ajustar etchCardDetails para buscar siempre en la tabla ccessories ANTES de recurrir a la Edge Function si el ID es un UUID.
- **LecciÃ³n**: Centralizar la lÃ³gica de precios en la base de datos (RPCs) y asegurar que el frontend sea un reflejo fiel de esos datos. Los accesorios (inventario local) siempre deben tener prioridad de resoluciÃ³n sobre el catÃ¡logo global (Cartas) para evitar fallos de ruta.

### 153. RestauraciÃƒÂ³n de Identidad y Pantone (Mayo 2026)

- **Problema**: El intento de "modernizar" o "neutralizar" el diseÃƒÂ±o mediante un cambio de Pantone (de Geeko Cyan #00D1FF a Electric Blue #0099FF) provocÃƒÂ³ una pÃƒÂ©rdida de identidad visual y fue percibido como un error ("se ve verde").

- **Causa RaÃƒÂ­z**: Sobre-correcciÃƒÂ³n estÃ©tica sin validar contra la marca establecida. El uso de sombras y resplandores en tonos azulados sobre un fondo oscuro puede alterar la percepciÃƒÂ³n del color base si no se usa el valor exacto de la marca.

- **SoluciÃƒÂ³n**: Revertir globalmente a #00D1FF (Geeko Cyan). Restaurar elementos de marca explÃƒÂ­citos (etiqueta "SINGLES", iconos de destellos) que habÃƒÂ­an sido simplificados excesivamente.

- **LecciÃƒÂ³n**: La documentaciÃƒÂ³n visual y los pantallazos de producciÃƒÂ³n (`geekorium.shop`) son la **fuente de verdad absoluta**. Cualquier refactorizaciÃƒÂ³n tipogrÃƒÂ¡fica o de color debe ser validada contra estos antes de darla por finalizada. Evitar la "invenciÃƒÂ³n" de nuevos selectores o disposiciones si el usuario solicita "restaurar lo anterior".



### 148. RemediaciÃƒÂ³n de Flujo "Por Encargo" (Bypass de Stock) Ã¢â‚¬â€� 2026-05-07

- **Problema:** El checkout fallaba con error de "Stock insuficiente" al intentar comprar cartas sin existencia fÃƒÂ­sica, a pesar de que la Regla de Negocio 4 permite pedidos "Por Encargo".

- **Causa RaÃƒÂ­z:** El RPC `create_order_atomic` tenÃƒÂ­a una validaciÃƒÂ³n estricta `IF v_current_stock < quantity THEN RAISE EXCEPTION` que no discriminaba entre productos normales y pedidos on-demand.

- **SoluciÃƒÂ³n:** Implementar un flag `is_on_demand` en la lÃƒÂ³gica de la orden. El frontend detecta `quantity > stock` y envÃƒÂ­a el flag; el RPC usa este flag para saltar la excepciÃƒÂ³n y marcar la lÃƒÂ­nea de pedido correctamente.

- **Regla Derivada:** Todo flujo de checkout atÃƒÂ³mico debe soportar un bypass de validaciÃƒÂ³n de stock si el ÃƒÂ­tem estÃƒÂ¡ marcado como "on-demand" (LecciÃƒÂ³n #148).

### 157. RemediaciÃ³n de Carga Masiva y Gaps de CatÃ¡logo (Mayo 2026)
- **Problema**: Fallos intermitentes en la carga masiva de inventario para sets nuevos o tokens (ej: TM3C, TECC).
- **Causa RaÃ­z**: El sistema asume que el catÃ¡logo maestro (`sets`, `card_printings`) estÃ¡ siempre completo. Las importaciones fallan por violaciones de FK si el set o la impresiÃ³n especÃ­fica no existen previamente. AdemÃ¡s, el uso de `ON CONFLICT` en `products` puede fallar si no se especifica el nombre de la restricciÃ³n Ãºnica (`products_printing_id_condition_finish_key`) en entornos con mÃºltiples Ã­ndices o columnas anulables.
- **SoluciÃ³n**:
    1. **SincronizaciÃ³n Proactiva**: Implementar un paso de "pre-vuelo" que verifique la existencia de IDs de Scryfall y cree los registros faltantes en `sets` y `card_printings` antes de insertar en `products`.
    2. **Endurecimiento de SQL**: Usar `ON CONFLICT ON CONSTRAINT products_printing_id_condition_finish_key` para garantizar una resoluciÃ³n de conflictos atÃ³mica y sin ambigÃ¼edades.
    3. **Mapeo de Precios**: Permitir precios `0.0` (Free/Token) explÃ­citamente sin que el script de sincronizaciÃ³n los descarte como nulos.
- **LecciÃ³n**: Un importador masivo robusto debe ser capaz de auto-remediar el catÃ¡logo maestro usando fuentes externas (Scryfall) si detecta que la base de datos local estÃ¡ desactualizada.



### 143. SincronizaciÃƒÆ’Ã‚Â³n SKU-Aware

- **Problema**: Los scripts de sincronizaciÃƒÆ’Ã‚Â³n con CardKingdom tenÃƒÆ’Ã‚Â­an errores de mapeo en sets modernos.

- **Causa**: El uso de campos descriptivos ambiguos en lugar de identificadores ÃƒÆ’Ã‚Âºnicos.

- **LecciÃƒÆ’Ã‚Â³n**: Los scripts de sincronizaciÃƒÆ’Ã‚Â³n con CardKingdom deben priorizar el SKU (`[F]SET-NNNN`) sobre el campo `variation` para sets modernos y tokens para garantizar un mapeo 100% exacto de acabados y coleccionistas.



### 144. ResoluciÃƒÆ’Ã‚Â³n DinÃƒÆ’Ã‚Â¡mica de Juegos

- **Problema**: Errores en el frontend al intentar cargar datos de juegos debido a IDs cambiantes entre entornos.

- **Causa**: Hardcoding de IDs de bases de datos seriales.

- **LecciÃƒÆ’Ã‚Â³n**: Evitar hardcoding de IDs de bases de datos seriales en el frontend. En entornos de desarrollo, Magic: The Gathering puede ser ID 1, mientras que en producciÃƒÆ’Ã‚Â³n es ID 22. Se implementÃƒÆ’Ã‚Â³ una resoluciÃƒÆ’Ã‚Â³n dinÃƒÆ’Ã‚Â¡mica en `api.ts` basada en el nombre del juego o su cÃƒÆ’Ã‚Â³digo (`MTG`).



## ÃƒÂ°Ã…Â¸Ã¢â‚¬â€�Ã¢â‚¬Å¾ Base de Datos y Supabase



### 2. "Precios Invisibles" (AgregaciÃƒÆ’Ã‚Â³n Fallida)



- **Problema**: El script de sincronizaciÃƒÆ’Ã‚Â³n insertaba precios pero no se reflejaban en la UI.

- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requerÃƒÆ’Ã‚Â­a un `condition_id` vÃƒÆ’Ã‚Â¡lido. Los inserts manuales omitÃƒÆ’Ã‚Â­an estos campos, dejando los precios en un limbo.

- **LecciÃƒÆ’Ã‚Â³n**: Todo script de ingesta de precios debe incluir:

  - `timestamp`: ISO string (UTC).

  - `condition_id`: ID numÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rico correspondiente (ej: 16 para Near Mint).

  - `is_foil`: Booleano explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­cito.



### 3. Timeouts en Filtros (Performance)



- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.

- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndices.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - **ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ndices CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.

  - **Estrategia de Consulta**: Para tablas masivas, es mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡pido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.



## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ Frontend y API



### 4. Coherencia en el Fallback de Supabase



- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".

- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ndar de Postgres) que no existe en esta estructura especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­fica.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Mantener mapeos de nombres de columnas idÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nticos entre la respuesta del API local y el cÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³digo de fallback de Supabase.

- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.

- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.

- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.



### 5. Counting Strategy & Timeouts



- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡micos donde el planificador de Postgres ya tiene estadÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sticas.

  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n con "Infinite Scroll" o botones de "Siguiente".



## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Despliegue y CI/CD



### 6. TypeScript Strict Build (TS6133)



- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.

- **Causa**: ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de `tsconfig.json` con `noUnusedParameters: true`.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n exitosa.



### 7. Variables de Entorno en GitHub Actions



- **Problema**: El frontend funcionaba localmente pero en producciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n los dropdowns (Sets) estaban vacÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­os y las bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsquedas fallaban.

- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a 404).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.

  - **Resiliencia de Fallback**: Todo endpoint crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ definido.



---



## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Frontend y UX



### 8. UX de Autocompletado vs. BÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda Activa (Feb 2026)



- **Problema**: Al implementar el autocompletado, el `debounce` automÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡tico disparaba la bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda principal cada vez que el usuario escribÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a, recargando resultados innecesariamente.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: **Desacoplar siempre el input de bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda del trigger de bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda.**

  - El input solo actualiza el estado local para sugerencias.

  - La bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda principal (`activeSearchQuery`) solo se actualiza mediante acciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­cita (`Enter` o click en sugerencia).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Se refactorizÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ el frontend para separar `query` (input) de `activeSearchQuery` (fetch).



### 9. Timeout en Queries con DISTINCT ON (Feb 2026)



- **Problema**: `DISTINCT ON (card_name)` + `ORDER BY` con JOIN (`s.release_date`) causaba timeout (Error 500) sin ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndices especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficos para esa combinaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: **ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ndices obligatorios para Sort/Filter.**

  - Si usas `DISTINCT ON (columna)`, DEBE haber un ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndice en `(columna)`.

  - Si filtras con `ILIKE`, DEBE haber ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndice `GIN` con `pg_trgm`.

  - Verificar siempre con `EXPLAIN ANALYZE` en datos con volumetrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a real.



### 10. NO Usar Queries DinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡micas para Vistas Principales de Tablas Grandes (Feb 2026)



- **Problema**: A pesar de ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndices correctos, `DISTINCT ON` sobre 80,000+ filas con Joins y RLS activo sigue siendo demasiado pesado.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n Definitiva: USAR VISTA MATERIALIZADA.**

  - Si deduplicar o agregar de tabla principal grande (>10k filas): pre-calcular en `MATERIALIZED VIEW`.

  - Usar `SECURITY DEFINER` en la funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n RPC para saltar overhead de RLS si la vista ya contiene datos pÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºblicos filtrados.



### 11. CardModal ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ Nunca Filtrar all_versions al Cambiar Printing (Feb 2026)



- **Problema**: Al cambiar el printing seleccionado, la lista de versiones desaparecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a si la respuesta de la API para ese printing no incluÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a todas las versiones.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Preservar siempre el array `all_versions` en el estado del frontend al navegar entre printings. Nunca re-derivarlo de la respuesta parcial de un printing individual.



### 12. Soporte Foil Virtual ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ Entidades Virtuales No En DB (Feb 2026)



- **Problema**: Intentar buscar registros de cartas foil como entidades separadas en la DB fallaba.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Las cartas foil son **entradas virtuales** generadas por la Edge Function `tcg-api` cuando `prices.usd_foil IS NOT NULL`. No existen como filas separadas en `card_printings`. Nunca hacer migrations que asuman lo contrario.



### 13. DFC (Double-Faced Cards) ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ Links y Flip de Imagen (Feb 2026)



- **Problema**: Los links de CardKingdom para DFCs fallaban porque incluÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an el nombre de ambas caras (`//`). Las imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes DFC no flippeaban.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - **Links**: Usar solo `card_faces[0].name` (cara frontal) para bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsquedas en CardKingdom.

  - **Flip**: Detectar DFC por `card_faces?.length > 1`. Implementar toggle de imagen client-side.

  - **Fallback Frontend**: Si `image_uris` es null, usar `card_faces[0].image_uris` como fallback.



### 14. Precios: Siempre Parsear como Number (Feb 2026)



- **Problema**: `toFixed()` crasheaba cuando el precio venÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a como string o null de la API.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Siempre convertir: `const price = Number(rawPrice)`. Verificar `isNaN(price)` antes de formatear. Mostrar `S/P` si null/undefined.



### 145. AlineaciÃƒÆ’Ã‚Â³n de ParÃƒÆ’Ã‚Â¡metros RPC y SincronizaciÃƒÆ’Ã‚Â³n de URL (Abril 2026)

- **Problema**: El buscador y los filtros de la tienda dejaron de funcionar tras una refactorizaciÃƒÆ’Ã‚Â³n de nombres de variables en el frontend.

- **Causa RaÃƒÆ’z**: 

  1. Desajuste entre los nombres de parÃƒÆ’Ã‚Â¡metros esperados por la base de datos de producciÃƒÆ’Ã‚Â³n (`game_filter`, `rarity_filter`) y los enviados por el frontend (`game_code`, `rarities`).

  2. El componente `Home.tsx` no sincronizaba el estado de bÃƒÆ’Ã‚Âºsqueda (`q`) desde la URL cuando el usuario navegaba o usaba sugerencias de la cabecera.

  3. Al aplicar filtros, la URL se sobrescribÃƒÆ’a por completo en lugar de mezclarse con los parÃƒÆ’Ã‚Â¡metros existentes (borrando el tÃƒÆ’Ã‚Â©rmino de bÃƒÆ’Ã‚Âºsqueda).

- **LecciÃƒÆ’Ã‚Â³n**: 

  - **VerificaciÃƒÆ’Ã‚Â³n de Firma**: Siempre verificar la firma exacta de la funciÃƒÆ’Ã‚Â³n en la base de datos de producciÃƒÆ’Ã‚Â³n antes de cambiar nombres de parÃƒÆ’Ã‚Â¡metros en `api.ts`.

  - **URL como Source of Truth**: El estado del frontend debe seguir a la URL (One-Way Data Flow). Implementar efectos robustos que lean de `searchParams` y actualicen el estado interno.

  - **Mezcla de ParÃƒÆ’Ã‚Â¡metros**: Usar `new URLSearchParams(searchParams)` para conservar el estado existente al aplicar nuevos filtros.

  - **Soporte de UX**: Asegurar que la tecla `Enter` en formularios de bÃƒÆ’Ã‚Âºsqueda "confirme" la acciÃƒÆ’Ã‚Â³n y actualice la URL para disparar el fetch.



### 146. Linting CrÃƒÆ’Ã‚Â­tico en CI/CD (GitHub Actions)

- **Problema**: El despliegue de producciÃƒÂ³n fallaba con un error de variable no utilizada, a pesar de funcionar localmente.

- **Causa**: `npm run build` en entornos CI suele aplicar reglas de linting mÃƒÂ¡s estrictas (`no-unused-vars`). Componentes con importaciones comentadas o "fantasmas" bloquean el pipeline.

- **LecciÃƒÆ’Ã‚Â³n**: Eliminar siempre las importaciones no utilizadas antes de un push. Si una funcionalidad se comenta temporalmente (ej: botÃƒÂ³n "Explore"), su importaciÃƒÂ³n asociada (ej: `ExternalLink`) debe comentarse o eliminarse tambiÃƒÂ©n.



### 147. Robustez en Consultas Join de Supabase (PostgREST)

- **Problema**: Scripts de backend fallaban con `NoneType` errors al intentar acceder a datos de joins complejos.

- **Causa**: PostgREST puede devolver `null` en objetos anidados si la relaciÃƒÂ³n no existe o si hay ambigÃƒÂ¼edad en el esquema. Acceder directamente como `item['cards']['card_name']` sin validaciÃƒÂ³n previa es peligroso.

- **LecciÃƒÆ’Ã‚Â³n**: Usar siempre `.get()` y validaciÃƒÂ³n defensiva para datos provenientes de joins complejos en Supabase. Implementar fallbacks razonables (ej: `game_code` por defecto a 'MTG') y logging granular para identificar registros huÃƒÂ©rfanos.



---



## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ DiseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o y Branding



### 15. Restricciones de ItÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡licas por SecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ Spec Geekorium (Feb 2026)



- **Problema**: Clase `italic` aparecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a en headings de secciones donde la spec lo prohÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­be explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­citamente.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ador estableciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ que `font-web-titles` (Daito/Roboto Slab) no debe usarse en itÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lica en secciones de contenido informativo (ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo comprar?, Ayuda). Solo se permite italic en tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tulos de marca/admin.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Remover `italic` de `Home.tsx` L581 (ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo comprar?) y `HelpPage.tsx` L28 (ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿AÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºn tienes dudas?).

- **Regla Derivada**: Al implementar headings con `font-web-titles`, verificar si la secciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ en la lista de restricciones de la spec. La lista actual: secciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n `ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo comprar?` y secciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Ayuda.



### 16. Tokens de Color de Marca: Incluir Todas las Variantes del Spec (Feb 2026)



- **Problema**: El token `#523176` (variante tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cnica morada) estaba en la spec pero no definido en `index.css` como CSS variable.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Al implementar la paleta inicial se omitiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ esta variante por considerarla secundaria.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Agregar `--color-geeko-violet-deep: #523176` al bloque `@theme` de `index.css`.

- **Regla Derivada**: Al adoptar un nuevo spec de diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o, mapear **todas** las variantes de color del documento al sistema de tokens, incluso si no se usan inmediatamente. Pendiente usarlo en: bordes de cartas Lorcana, sellos de cera, accents de sets especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficos.



---



## ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª Testing



### 17. Patch Target Correcto para Servicios con `supabase_admin` (Feb 2026)



- **Problema**: `test_collection_import.py` fallaba con `AttributeError: module does not have the attribute 'supabase'`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El service `collection_service.py` fue refactorizado para usar `supabase_admin = get_supabase_admin()` en lugar de `supabase`. Los tests seguÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an mockeando el atributo viejo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Cambiar el patch target en los fixtures de `'api.services.collection_service.supabase'` ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ `'api.services.collection_service.supabase_admin'`.

- **Regla Derivada**: Cuando un servicio renombra su variable de cliente de Supabase, buscar y actualizar TODOS los tests que la mockean. Usar `grep_search` con `patch(` + el mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo para detectarlos.



### 18. Lazy Imports en Servicios ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo Parchearlos (Feb 2026)



- **Problema**: `patch('src.api.services.collection_service.MatcherService')` fallaba porque `MatcherService` se importa dentro del cuerpo de la funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n (`from .matcher_service import MatcherService`), no al nivel del mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Los lazy imports (dentro de la funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n) no crean atributos en el namespace del mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo que los contiene, por lo que no son patcheables desde ahÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Parchear en el mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo **fuente**, no en el mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo importador: `patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock)`.

- **Regla Derivada**: Si una clase/funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n se importa con `from .modulo import Clase` dentro de una funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n, siempre parchear en `modulo.Clase`, no en `servicio_importador.Clase`.



### 19. Mock Chain para `ValuationService` ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ Two-Step Query (Feb 2026)



- **Problema**: `test_valuation_calculation_logic` afirmaba `store_price == 100.0` pero obtenÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a `1.0`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El test pasaba `{'source': 'geekorium', 'price_usd': 100.0}` pero el servicio NO usa el campo `source` ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ hace primero un query a la tabla `sources` para obtener un mapa `{source_id ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ source_code}`, luego itera `price_history` buscando `source_id` (entero).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Reescribir el mock como un `table_side_effect` que retorna datos distintos por tabla: `sources` ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ mapa de IDs, `price_history` ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ filas con `source_id` (int), no `source` (str).

- **Regla Derivada**: Antes de escribir mocks para servicios, leer su implementaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para identificar el flujo exacto de queries. Los servicios con lookups de tablas de referencia (como `sources`, `conditions`) requieren mocks de mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºltiples tablas.



### 20. Reemplazo Exhaustivo de Colores Heredados al Refactorizar UI (Feb 2026)



- **Problema**: Tras remover la clase `italic` en `HelpPage.tsx` para ajustarse a una regla tipogrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡fica nueva, se revelaron clases utilitarias de color heredadas (`bg-[#f4e4bc]`, `text-black`, `bg-[#25D366]`) que desentonaban con el nuevo spec.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: RefactorizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n local "quirÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºrgica" (solo tocar `italic`) en componentes sin auditar si su paleta general sigue el nuevo "DiseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o Fix".

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Reemplazo masivo de colores heredados en el componente modificado. Beige (`#f4e4bc`) a Primario (`#373266`), Negro (`text-black`) a Blanco (`#FFFFFF`), y Verde (`#25D366`) a Cyan (`geeko-cyan` / `#00AEB4`). AdemÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s se debiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ re-aÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±adir `font-web-titles` porque el `<h3/>` carecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a de familia tipogrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡fica tras quitar la itÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lica.

- **Regla Derivada**: Siempre que se modifique un componente heredado ("legacy") para ajustarlo a nuevas reglas de brand, auditar TODO el componente. Eliminar colores *hardcoded* obsoletos y aplicar los nuevos tokens de marca. Validar que no perder clases como `italic` descubra la falta de clases estructurales como familias de fuentes (`font-web-titles`).



### 21. Fallbacks Visuales en Vistas Combinadas de DB (Feb 2026)



- **Problema**: Las imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes de las cartas no se mostraban en el Grid ("Imagen No Disponible"), a pesar de existir imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes en la base de datos de Scryfall.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El endpoint RPC `get_products_filtered` retornaba directamente la columna `image_url` de la tabla `products`, la cual puede ser nula dependiendo del formato de importaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n, en lugar de considerar el fallback a la tabla unida `card_printings`.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Refactorizar la proyecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n SQL para incluir `COALESCE(p.image_url, cp.image_url) as image_url`.

- **Regla Derivada**: Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.



### 22. Validaciones Locales Estrictas (Feb 2026)



- **Problema**: Formularios sin validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n previa enviaban datos inconsistentes (ej. formato de telÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©fono errÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³neo) al equipo de soporte.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n / LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Validar clide-side formatos especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ficos (ej. venezolanos 04), rechazar letras en cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dula (

eplace(/\D/g, '')), y forzar longitud en campos de texto antes de habilitar el pago.

- **Regla Derivada**: Todo input vital para el pago/contacto fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.



### 23. BÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda y ValidaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Stock en SQL (Feb 2026)



- **Problema**: El carrito permitÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a agregar mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s cartas de las que habÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a en stock si se hacÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºltiples clicks o llamadas al RPC dd_to_cart. AdemÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s, la bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda global a veces no priorizaba coincidencias exactas.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El control de stock no totalizaba las cantidades previas del mismo item en el carrito antes de comparar con el stock mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ximo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Refactorizar dd_to_cart sumando quantity + v_current_qty > v_stock y lanzando un error. Ajustar get_products_filtered con un ORDER BY que priorice strings idÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nticos (p.name ILIKE ).

- **Regla Derivada**: Todo control de inventario en el backend debe ser calculable (suma del estado actual + intento) y rechazar transacciones a nivel SQL, y las funciones de bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda deben devolver coincidencias exactas primero.



### 24. Resolviendo TipografÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as en UI EspecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­fica (Feb 2026)



- **Problema**: El diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o UI requerÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a mapeos hiperespecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficos de tipografÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as (Daito para tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tulos, Bogue para precios, Rubik para cuerpo) en base a mockups donde no bastaba heredar la tipografÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a general.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Las clases CSS como ont-sans no sobreescribÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an correctamente la jerarquÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a necesaria si el componente padre tenÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a otra.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Aplicar clases nominales directas en Tailwind (ont-web-titles, ont-titles, ont-sans) a los subnodos del texto en los componentes y remover tags italic que forzaban el fallback del font.

- **Regla Derivada**: La fidelidad 1:1 de PRD UI requiere aplicar clases tipogrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ficas explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­citas en el nivel mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s bajo (hojas) del nodo del DOM y evitar modificadores de estilo globales (como italic o bold general) que rompan el font-face de UI.



### [Guest Checkout & Inventory Pattern] ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ 2026-02-27



- **Problema:** Riesgo de doble venta en un e-commerce de productos ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºnicos (trading cards) cuando los pagos son asÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ncronos (Zelle/Pago MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³vil) y los usuarios no tienen cuenta.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** Falta de un estado intermedio que bloquee el inventario temporalmente mientras el pago ocurre off-platform.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** Implementar un estado de orden `pending_payment` que reduce el `reserved_stock` inmediatamente mediante un RPC atÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mico de Supabase, acompaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ado de un Job/RPC que cancela las ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³rdenes expiradas (superan 24 hrs sin validaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n) y devuelve el stock. Uso de URLs ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºnicas (`/order/:id`) para que invitados suban su comprobante.

- **Regla Derivada:** Todo cambio de estado de `orders` debe evaluarse en el RPC `update_order_status` para gestionar `reserved_stock` vs `stock` dinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡micamente y de forma atÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mica.



### 2. ValidaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n y Reserva Diferida - 2026-03-01



- **Problema:** Exigir comprobantes upfront choca con la realidad del stock fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico desfasado.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** El proceso asumÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a que el stock del e-commerce siempre era 100% exacto respecto a la tienda fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sica.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Romper el pago y la verificaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en 2 pasos. Reservar el stock primero (pending_verification), y pagar despuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s (awaiting_payment).

- **Regla Derivada:** Cualquier estado que cambie a cancelled/returned desde active debe liberar el stock inmediatamente para evitar desajustes remanentes.



### 3. Evitar Bloqueos de UI por Fugas de InteracciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n - 2026-03-01



- **Problema:** Un modal (CardModal) que se cierra al agregar al carrito funcionaba bien en testing local pero dejaba la UI colgada (timeout por capa transparente superpuesta) en pruebas E2E en ProducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** El modal tenÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gica condicional que solo lo cerraba si se pasaba un prop onAddToCartSuccess. En flujos donde este prop faltaba, la promesa colgaba visualmente porque esperaba al callback para cerrarse.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** Consolidar el cierre del modal (onClose()) para que siempre ocurra de manera incondicional, independiente de callbacks extra.

- **Regla Derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales a nivel del componente que las renderiza, no deben depender de hooks inyectados opcionales.



### 10. TypeError: reduce is not a function en ProducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ 2026-03-02



- **Problema:** La aplicaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n fallaba en producciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n al navegar a /profile con un error Uncaught TypeError: s.reduce is not a function.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** Respuestas de la API que devuelven objetos vacÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­os o

ull en lugares donde se espera un arreglo (ej. cartItems, collection). React Context o servicios no estaban garantizando un valor fallback de arreglo estable.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** ImplementaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n masiva de protecciones Array.isArray(data) ? data : [] antes de cualquier llamada a .reduce(), .map() o .filter().

- **Regla Derivada:** **Defensive Data Handling**. Prohibido usar mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©todos de arreglo sobre datos de API sin validaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n previa con Array.isArray(). Codificado en AGENTS.md y PRD_MASTER.md.



### 64. Redundancia CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tica en Historial de Precios ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-02



- **Problema:** La base de datos alcanzÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ 1.42 GB (lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­mite plan 1.1 GB) debido a la tabla 'price_history'.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** Scrapers guardaban el precio diario de 30,000+ cartas incluso si el precio no variaba, generando un 95% de redundancia.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** DeduplicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cnica e implementaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica diferencial en 'sync_cardkingdom_api.py'.



### 65. IntegraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de ManaBox y PriorizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Scryfall ID (Marzo 2026)



- **Problema**: La importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n por nombre/set puede fallar en cartas con nombres similares o mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples versiones (promos, showcase).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar una detecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡tica de encabezados en el frontend (ManaBox ID, Scryfall ID) y priorizar la bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda por scryfall_id en el backend. Esto garantiza una precisiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n del 100% y evita el mapeo manual.

- **NormalizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Las condiciones de ManaBox (e.g.

ear_mint, lightly_played) deben normalizarse en el backend a cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digos internos (NM, LP) para mantener la integridad de la base de datos.

- **UX**: Una pre-visualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n que use los mismos ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndices de mapeo que la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de parseo evita confusiones visuales en el proceso de importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.



### 66. Soporte de FoliaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (Finish) y AgregaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en Lotes (Marzo 2026)



- **Problema**: Errores `ON CONFLICT` al intentar importar la misma carta en versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Foil y Non-Foil en un mismo lote, y fallos de visualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de precios/stock para versiones foil.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: La restricciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de unicidad en la tabla `products` no incluÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a la columna `finish`. AdemÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s, la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n no consolidaba duplicados dentro del mismo batch antes de enviarlos a la DB.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - **DB**: Agregar columna `finish` y actualizar la restricciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnica a `(printing_id, condition, finish)`.

  - **Edge Function**: Implementar un diccionario de agregaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en el `tcg-api` que sume cantidades de filas idÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nticas (mismo printing+condition+finish) antes del `upsert`.

  - **Vistas**: Actualizar `products_with_prices` para incluir la columna `finish` y asegurar que el frontend reciba este metadato.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/LEYES_DEL_SISTEMA.md) -> Regla de Negocio 3 (AgregaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en Lotes).



### 67. Fuentes Locales Sin Archivo = 404 Silencioso en Build ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-03



- **Problema**: La app en produccion generaba `GET /fonts/Daito.woff2 404` en la consola del navegador.

- **Causa Raiz**: Declaraciones `@font-face` en `index.css` referenciaban archivos con `url('/fonts/...')` que nunca existieron en `frontend/public/fonts/`. El build de Vite compila sin errores aunque los archivos no existan.

- **Solucion**: Eliminar `@font-face` locales e importar `Cinzel` y `Cinzel Decorative` de Google Fonts como fallbacks premium.

- **Regla Derivada**: Toda fuente en `@font-face` con `url('/fonts/...')` DEBE tener su archivo fisico. Si no esta disponible, usar Google Fonts. Documentar el original como comentario en el CSS.



### 18. Toggle Variant UI y CardKingdom Pricing



- **Problema:** Los botones de variante Foil/Normal quedaban habilitados sin stock disponible (o no funcionales), y el precio 'Mercado Externo' (MKT) fusionaba foil y normal mostrando el mismo valor para ambas versiones.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** La UI dependÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a del atributo disabled basado en la *ausencia* de datos, pero no comprobaba stock === 0. AdemÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s, pi.ts usaba genericamente vg_market_price_usd para variantes sintÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ticas sin bifurcar adecuadamente entre prices.usd y prices.usd_foil.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Implementar renderizado condicional ({condition && <button>}) u ocultamiento via JS para variantes inexistentes, aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n disabled={(stock || 0) === 0} para variantes existentes pero agotadas. En pi.ts, asignar prices.usd a nonfoil y prices.usd_foil a foil explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente al expandir el objeto ll_versions.

- **Regla Derivada:** UI de variantes en E-commerce fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico: Si no existe variante, oculta el UI. Si existe pero no hay stock, deshabilita la UI (opacity-50). Los precios externos siempre deben extraer las propiedades separadas (usd vs usd_foil) del provider base.



### 67. ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Pydantic v2 (SettingsConfigDict)



- **Problema**: pydantic-settings generaba errores (como Config error o validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n fallida) al intentar heredar de BaseSettings y usar una clase interna Config.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Con la introducciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Pydantic v2, la declaraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n mediante subclases Config quedÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ obsoleta a favor de model_config.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Usar model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8') dentro de la clase Settings.

- **Regla Derivada**: Siempre actualizar los esquemas de configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n a las convenciones de Pydantic v2 para garantizar soporte continuo y evitar problemas con pytest y builds.



### 68. EnvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o AsÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ncrono de Correos en FastAPI



- **Problema**: Realizar el envÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o de correos (ej: servidor SMTP) de manera sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ncrona dentro del path operator del carrito de compras introducÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a latencias inaceptables en la respuesta (checkout), degradando la experiencia de usuario.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: La operaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de red con SMTP bloquea el hilo principal si no se delega a una tarea de fondo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Delegar el envÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o a tareas asÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ncronas no bloqueantes. En este caso se empleÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ syncio.create_task() (tambiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©n se puede usar BackgroundTasks de FastAPI) para despachar correos (al cliente y admin) inmediatamente antes de devolver la respuesta 200 OK.

- **Regla Derivada**: Cualquier integraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n con servicios externos de notificaciones en rutas sensibles debe ser wait de una tarea en fondo o despachado asÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ncronamente para mantener latencias < 500ms.



### 23. Prioridad de IntenciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n del Usuario sobre DocumentaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n EstÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡tica ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-05



- **Problema:** El PRD y otros documentos de diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o especificaban vincular el botÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de correo a una landing de Mailchimp, pero el usuario reportÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ esto como un error.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** DocumentaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o obsoleta que no fue actualizada tras cambios en la estrategia de marketing del cliente.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Priorizar la comunicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n directa del usuario sobre lo escrito en docs/. Implementar `mailto:info@geekorium.shop` directamente.

- **Regla Derivada:** En caso de contradicciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n entre un documento `docs/*.md` y una instrucciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n directa del usuario en el chat, el chat siempre tiene la razÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n. Marcar la discrepancia en el log para futura actualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de docs.



### 24. JerarquÃƒÆ’Ã‚Â­a de ConfiguraciÃƒÆ’Ã‚Â³n SMTP (Mar 2026)



- **Problema**: Los correos no se enviaban porque las credenciales estaban en frontend/.env pero el backend las buscaba en la raÃƒÆ’Ã‚Â­z.

- **LecciÃƒÆ’Ã‚Â³n**: Los operativos backend (FastAPI/Python) suelen buscar el archivo .env en la raÃƒÆ’Ã‚Â­z del proyecto. Las configuraciones compartidas o crÃƒÆ’Ã‚Â­ticas de backend deben centralizarse allÃƒÆ’Ã‚Â­ para ser accesibles.



### 25. Seguridad de Secretos en ProducciÃƒÆ’Ã‚Â³n (Mar 2026)



- **Problema**: Hardcodear secretos en .env es un riesgo de seguridad en producciÃƒÆ’Ã‚Â³n.

- **LecciÃƒÆ’Ã‚Â³n**: Implementar validaciÃƒÆ’Ã‚Â³n en pydantic.BaseSettings (usando model_post_init) para asegurar que variables como SMTP_PASSWORD se provean via entorno del sistema y no vÃƒÆ’Ã‚Â­a archivo fÃƒÆ’Ã‚Â­sico en modo production.



### 27. OptimizaciÃƒÆ’Ã‚Â³n de Storage y DecisiÃƒÆ’Ã‚Â³n de Ocultar Features (Mar 2026)



- **Problema**: El flujo de carga de comprobantes de pago disparaba el uso de cuota de Supabase Storage de forma acelerada.

- **Causa RaÃƒÆ’Ã‚Â­z**: Carga de archivos binarios (imÃƒÆ’Ã‚Â¡genes) en cada transacciÃƒÆ’Ã‚Â³n, lo que podrÃƒÆ’Ã‚Â­a agotar la cuota gratuita/pagada sin un valor de negocio crÃƒÆ’Ã‚Â­tico inmediato (ya existe flujo WhatsApp).

- **LecciÃƒÆ’Ã‚Â³n**: En proyectos con restricciones de cuota, es mejor ocultar features de alto consumo de storage ("payment-proofs") y delegar la validaciÃƒÆ’Ã‚Â³n al canal asistido (WhatsApp) que ya se utiliza para el cierre de venta.

- **AcciÃƒÆ’Ã‚Â³n**: Se comentÃƒÆ’Ã‚Â³ el componente de carga en `OrderTrackingPage.tsx` y se eliminÃƒÆ’Ã‚Â³ la migraciÃƒÆ’Ã‚Â³n de creaciÃƒÆ’Ã‚Â³n del bucket.



### 28. Checkout AtÃƒÆ’Ã‚Â³mico y Desacoplamiento de Schema (Mar 2026)



- **Problema**: El flujo de checkout fallaba silenciosamente ("Orden no encontrada") a pesar de que el carrito se vaciaba.

- **Causa RaÃƒÆ’Ã‚Â­z**: El RPC `create_order_atomic` intentaba insertar un valor en la columna `product_name` de `order_items`, la cual no existÃƒÆ’Ã‚Â­a en el schema de producciÃƒÆ’Ã‚Â³n. El admin funcionaba porque usaba un JOIN dinÃƒÆ’Ã‚Â¡mico, ocultando la inconsistencia.

- **SoluciÃƒÆ’Ã‚Â³n**: Se aÃƒÆ’Ã‚Â±adiÃƒÆ’Ã‚Â³ la columna `product_name` a `order_items` para persistir el nombre del producto en el momento de la compra (snapshotting) y se habilitaron permisos pÃƒÆ’Ã‚Âºblicos (anon/authenticated) para el rastreo.

- **Regla Derivada**: En flujos atÃƒÆ’Ã‚Â³micos (RPC), cualquier error de schema en una sub-tabla cancela toda la transacciÃƒÆ’Ã‚Â³n. Siempre verificar que las columnas usadas en el RPC existan en todas las tablas afectadas.



### 29. Hosting para E-commerce: Cloudflare Pages vs. GitHub Pages (Mar 2026)



- **Problema**: GitHub Pages prohÃƒÆ’Ã‚Â­be explÃƒÆ’Ã‚Â­citamente el uso comercial en su capa gratuita, lo que pone en riesgo sitios de venta directa como Geekorium.

- **SoluciÃƒÆ’Ã‚Â³n**: Migrar a **Cloudflare Pages**.

- **LecciÃƒÆ’Ã‚Â³n**: Cloudflare Pages permite oficialmente uso comercial en su plan gratuito y ofrece ancho de banda ilimitado, eliminando riesgos de costos por trÃƒÆ’Ã‚Â¡fico de imÃƒÆ’Ã‚Â¡genes pesadas (cartas TCG).

- **SPA Routing**: Cloudflare usa un archivo `_redirects` en `public/` con la regla `/* /index.html 200` para manejar rutas de React de forma nativa.



### 30. Estrategia de Branching y CI/CD (Mar 2026)



- **Problema**: Desplegar directamente desde `main` sin un entorno de previsualizaciÃƒÆ’Ã‚Â³n aumenta el riesgo de errores en producciÃƒÆ’Ã‚Â³n.

- **LecciÃƒÆ’Ã‚Â³n**: Adoptar un modelo de `dev` (Preview) y `main` (Production).

- **Flujo**: Cloudflare Pages genera despliegues automÃƒÆ’Ã‚Â¡ticos para cada rama. Los cambios se validan en la URL de preview de `dev` antes de ser incorporados a `main` vÃƒÆ’Ã‚Â­a Pull Request para el despliegue final.



### 31. Cloudflare Pages vs. Workers para Frontend ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema:** ConfusiÃƒÆ’Ã‚Â³n en el dashboard de Cloudflare al intentar desplegar un frontend de React usando la secciÃƒÆ’Ã‚Â³n de "Workers".

- **LecciÃƒÆ’Ã‚Â³n:** Los **Workers** son para lÃƒÆ’Ã‚Â³gica serverless (scripts), mientras que **Pages** es la herramienta diseÃƒÆ’Ã‚Â±ada para hosting de sitios estÃƒÆ’Ã‚Â¡ticos (Vite, React). Siempre usar la pestaÃƒÆ’Ã‚Â±a "Pages" para el despliegue del frontend.



### 32. SEO Condicional vÃƒÆ’Ã‚Â­a Variables de Entorno de Vite ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema:** Necesidad de activar SEO (meta tags y robots) solo en la rama de producciÃƒÆ’Ã‚Â³n (`main`) y ocultar el sitio en desarrollo/preview (`dev`).

- **SoluciÃƒÆ’Ã‚Â³n:** Usar placeholders `%VITE_SEO_...%` y `%VITE_ROBOTS%` en `index.html`.

- **ConfiguraciÃƒÆ’Ã‚Â³n:**

  - **Prod:** `VITE_ROBOTS=index, follow`

  - **Dev/Preview:** `VITE_ROBOTS=noindex, nofollow`

- **Ventaja:** Permite inyectar SEO real solo en el dominio productivo sin aÃƒÆ’Ã‚Â±adir dependencias pesadas de React.



### 33. Root Directory en Estructuras Monorepo/Subcarpetas ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema:** El build fallaba en Cloudflare porque intentaba buscar `package.json` en la raÃƒÆ’Ã‚Â­z del repo.

- **LecciÃƒÆ’Ã‚Â³n:** En proyectos donde el frontend reside en una subcarpeta (ej: `/frontend`), es OBLIGATORIO configurar el **Root Directory** en el dashboard de Cloudflare para que el proceso de build se ejecute en el contexto correcto.



### 34. Conflicto de Auto-detecciÃƒÆ’Ã‚Â³n (Vite vs. VitePress) en Cloudflare ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema:** Cloudflare Pages intentaba usar un preset de "VitePress" en lugar de "Vite" debido a la presencia de archivos de documentaciÃƒÆ’Ã‚Â³n o nombres similares, lo que resultaba en errores 404 por rutas de assets incorrectas.

- **SoluciÃƒÆ’Ã‚Â³n:** Configurar explÃƒÆ’Ã‚Â­citamente el **Framework Preset** como **"None"** en el dashboard de Cloudflare. Esto obliga al sistema a usar solo el comando de build (`npm run build`) y el directorio de salida (`dist`) especificado, sin suposiciones de frameworks adicionales.



### 35. SPA Routing: `404.html` vs `_redirects` en Cloudflare Pages ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema:** El uso de un archivo `_redirects` con la regla `/* /index.html 200` puede generar advertencias de "Redirect Loop" en el dashboard de Cloudflare si se combina con redirecciones de dominio (ej. HTTP -> HTTPS).

- **SoluciÃƒÆ’Ã‚Â³n:** El mÃƒÆ’Ã‚Â©todo mÃƒÆ’Ã‚Â¡s robusto para SPAs en Cloudflare Pages es la estrategia de **`404.html` fallback**. Al copiar el `index.html` generado al archivo `404.html` durante el build, Cloudflare servirÃƒÆ’Ã‚Â¡ la aplicaciÃƒÆ’Ã‚Â³n para cualquier ruta no encontrada, permitiendo que el router de React tome el control sin generar avisos de bucle.



### 36. GestiÃƒÆ’Ã‚Â³n de Multi-entorno de Base de Datos (Supabase) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema**: Riesgo de contaminar datos de producciÃƒÆ’Ã‚Â³n o romper el schema productivo durante el desarrollo de nuevas features.

- **SoluciÃƒÆ’Ã‚Â³n**: Segregar bases de datos usando proyectos independientes de Supabase vinculados a las ramas de Cloudflare.

- **LecciÃƒÆ’Ã‚Â³n**: La mejor forma de manejar mÃƒÆ’Ã‚Âºltiples bases de datos en un SPA desplegado en Cloudflare Pages es mediante **Environment Overrides**. Al configurar variables como `VITE_SUPABASE_URL` de forma distinta para los entornos de "Production" y "Preview", la aplicaciÃƒÆ’Ã‚Â³n se conecta automÃƒÆ’Ã‚Â¡ticamente al proyecto de Supabase correcto basado en el branch desde el que se desplegÃƒÆ’Ã‚Â³.

- **Edge Functions**: Es crÃƒÆ’Ã‚Â­tico recordar que las Edge Functions y sus secretos deben sincronizarse manualmente (o vÃƒÆ’Ã‚Â­a CLI link) en ambos proyectos, ya que son entornos aislados.



### 37. Restricciones de Despliegue en GitHub Environments ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema**: El despliegue de la rama `dev` fallaba con "Branch is not allowed to deploy due to environment protection rules".

- **Causa RaÃƒÆ’Ã‚Â­z**: Los repositorios de GitHub con "Environments" (ej: `github-pages`) suelen restringir los despliegues solo a `main` por defecto en la secciÃƒÆ’Ã‚Â³n "Deployment branches and tags".

- **SoluciÃƒÆ’Ã‚Â³n**: Ajustar la configuraciÃƒÆ’Ã‚Â³n del Environment en GitHub Settings para permitir todas las ramas ("No restriction") o aÃƒÆ’Ã‚Â±adir explÃƒÆ’Ã‚Â­citamente la rama `dev`.

- **LecciÃƒÆ’Ã‚Â³n**: Al habilitar un nuevo entorno de hosting (como GitHub Pages para `dev`), el primer despliegue fallarÃƒÆ’Ã‚Â¡ si no se actualizan los permisos de rama en el Dashboard de GitHub.



### 38. RefactorizaciÃƒÆ’Ã‚Â³n de IDs de Proyecto Supabase ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-07



- **Problema**: El uso de IDs de Supabase hardcodeados en URLs de Edge Functions impedÃƒÆ’Ã‚Â­a que la rama `dev` conectara con su propia instancia de base de datos.

- **SoluciÃƒÆ’Ã‚Â³n**: Reemplazar todos los IDs estÃƒÆ’Ã‚Â¡ticos por la variable de entorno `VITE_SUPABASE_PROJECT_ID`.

- **LecciÃƒÆ’Ã‚Â³n**: Para sistemas multi-entorno, el ID del proyecto debe tratarse como un secreto dinÃƒÆ’Ã‚Â¡mico inyectado por el hoster, igual que la URL y la Anon Key. Esto garantiza que el frontend siempre hable con el backend correcto segÃƒÆ’Ã‚Âºn su origen.



### 39. PriorizaciÃƒÆ’Ã‚Â³n de Card Kingdom sobre Goldfish (Marzo 2026)



- **Problema**: Inconsistencias de precios por uso de mÃƒÆ’Ã‚Âºltiples fuentes de mercado externo sin una jerarquÃƒÆ’Ã‚Â­a clara.

- **DecisiÃƒÆ’Ã‚Â³n**: Card Kingdom es ahora la fuente de verdad ÃƒÆ’Ã‚Âºnica para precios de mercado externo. Se eliminÃƒÆ’Ã‚Â³ el uso de la tabla `aggregated_prices` (Goldfish).

- **LecciÃƒÆ’Ã‚Â³n**: Mantener sistemas de fallback complejos a fuentes de datos obsoletas introduce "ruido" en la valoraciÃƒÆ’Ã‚Â³n y dificulta el debugging. La simplicidad de una sola fuente (CK) mejora la fiabilidad.

- **ImplementaciÃƒÆ’Ã‚Â³n**: Si el precio de la tienda (`Geekorium`) es nulo, el sistema siempre debe recurrir al precio actual de Card Kingdom (`price_history`).



### 40. Limpieza de Selects en Supabase (Frontend & Backend) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Marzo 2026



- **Problema**: Al realizar cambios en la lÃƒÆ’Ã‚Â³gica de negocio (como remover una tabla), es fÃƒÆ’Ã‚Â¡cil olvidar limpiar los strings de `select()` en el frontend (`api.ts`) o backend.

- **LecciÃƒÆ’Ã‚Â³n**: Los errores de "Property X does not exist" en el frontend suelen deberse a proyecciones incompletas en la llamada de Supabase. Siempre verificar que todos los campos necesarios (incluyendo `stock`, `is_foil`, etc.) estÃƒÆ’Ã‚Â©n presentes en el string de `select` tras una refactorizaciÃƒÆ’Ã‚Â³n.

- **AcciÃƒÆ’Ã‚Â³n**: Se restaurÃƒÆ’Ã‚Â³ la columna `stock` en `fetchCardDetails` que se habÃƒÆ’Ã‚Â­a omitido accidentalmente durante la limpieza de Goldfish.



### 41. SimplificaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Precios y Reversa de Branding (Marzo 2026)



- **Problema**: Estrategia de precios confusa que mezclaba mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples fuentes y condiciones. Intento errÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³neo de "limpiar" el branding de Geekorium.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El usuario aclarÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ que la prioridad era usar **Card Kingdom NM** como fuente ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnica de verdad para los precios de Geekorium, y que el branding original debe conservarse intacto.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - Refactorizar lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de precios en `ValuationService`, Edge Functions y DB para filtrar estrictamente por 'NM' de Card Kingdom.

  - Revertir cualquier cambio en el nombre de la marca ("Geekorium", "Geekorium El Emporio") en el frontend y servicios de email.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: La simplicidad en los precios agiliza la operaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n. Nunca asumir que el branding debe "profesionalizarse" si el usuario no lo pide; respetar la identidad establecida es crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tico.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Regla 1 (Precios de Geekorium): Solo precios NM de Card Kingdom.

392:

393: ### 42. High-Performance SQL Bulk Updates (Marzo 2026)

394:

395: - **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.



### 42. High-Performance SQL Bulk Updates (Marzo 2026)



- **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Nested loops over the target table and the subquery for every row.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Use `UPDATE FROM` with a Common Table Expression (CTE). Pre-calculate all prices in memory and join them to the target table in a single pass.

- **Regla Derivada**: Bulk metadata updates in Supabase must use the `CTE + UPDATE FROM` pattern.



### 43. Defensive API Path Normalization (Marzo 2026)



- **Problema**: Edge Functions returning 400 or 500 errors intermittently due to unexpected URL prefixes (e.g., `/functions/v1/api/`) or trailing slashes added by some clients/proxies.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implement a robust "strip and normalized" loop at the start of the Edge Function to remove multiple prefixes and standardize endpoints to a base path (e.g., `/api/sets`).

- **Regla Derivada**: Edge Functions must be agnostic to deployment-specific URL prefixes.



### 44. ConexiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Segura a Supabase Pooler (Marzo 2026)



- **Problema**: "Connection timed out" o "Host not found" al intentar conectar scripts de Python externos a la DB de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **Causa**: Intentar usar el host del dashboard o la IP directa que puede estar bloqueada o rotada.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Usar el **Transaction Pooler** (Puerto 5432 o 6543). El host debe ser `[region].pooler.supabase.com` y el usuario DEBE incluir el Project Ref (`postgres.[project-ref]`).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Siempre configurar el `DATABASE_URL` con el pooler para scripts de mantenimiento masivo de larga duraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.



### 45. Estrategia de Batched Updates para DenormalizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (Marzo 2026)



- **Problema**: Actualizar columnas denormalizadas (`avg_market_price_usd`) en una tabla de 200k+ registros fallaba consistentemente por `statement timeout`.

- **Causa**: El planificador de Postgres intentaba un Sequential Scan masivo con subconsultas correlacionadas.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar un script de Python que procese la tabla por IDs primarios en lotes (ej. 1,000 registros). Esto libera el bloqueo de tabla entre lotes y evita que el proceso supere el lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­mite de tiempo de una transacciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n individual.

- **LecciÃƒÆ’Ã‚Â³n**: Si una migraciÃƒÆ’Ã‚Â³n SQL tarda mÃƒÆ’Ã‚Â¡s de 30s en Postgres de Supabase, no forzar el timeout; mover la lÃƒÆ’Ã‚Â³gica a un batch script externo.



### 46. Correct Denormalization Level (Per-Printing vs. Per-Card) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-10



- **Problema**: Al denormalizar precios (`avg_market_price_usd`) en la tabla `cards`, todas las versiones de una carta (ej. Pandemonium de *Exodus* vs. *The List*) mostraban el mismo precio, perdiendo la precisiÃƒÆ’Ã‚Â³n por versiÃƒÆ’Ã‚Â³n.

- **Causa RaÃƒÆ’Ã‚Â­z**: Una carta (`card_id`) puede tener mÃƒÆ’Ã‚Âºltiples impresiones (`printing_id`) con precios drÃƒÆ’Ã‚Â¡sticamente diferentes. Denormalizar a nivel de carta colapsa esta distinciÃƒÆ’Ã‚Â³n.

- **SoluciÃƒÆ’Ã‚Â³n**: Mover la columna denormalizada a `card_printings`. Actualizar Materialized Views y RPCs para unir por `printing_id` en lugar de `card_id` cuando se trate de precios.

- **Regla Derivada**: Nunca denormalizar datos que varÃƒÆ’Ã‚Â­an por ediciÃƒÆ’Ã‚Â³n/acabado en la tabla maestra de cartas; usar siempre la tabla de impresiones.



### 48. Zero-Error Supabase Security Advisor (Mar 2026)



- **Problema**: Supabase Security Advisor reportaba mÃƒÆ’Ã‚Âºltiples vulnerabilidades de RLS y riesgos en vistas con `SECURITY DEFINER`.

- **Causa**: Tablas de metadatos (sets, cards) y de usuario (orders, carts) carecÃƒÆ’Ã‚Â­an de polÃƒÆ’Ã‚Â­ticas de seguridad explÃƒÆ’Ã‚Â­citas, exponiendo datos de negocio o de clientes. Vistas recreadas sin `security_invoker = true` bypassaban el RLS.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - Habilitar RLS en **todas** las tablas pÃƒÆ’Ã‚Âºblicas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

  - Definir polÃƒÆ’Ã‚Â­ticas granulares: `SELECT` pÃƒÆ’Ã‚Âºblico para metadatos (cards, sets) y `Owner-Only` para datos sensibles (user_watchlist, user_addresses) usando `auth.uid()`.

  - Configurar vistas con `security_invoker = true` para asegurar que respeten los permisos del usuario que consulta.

- **LecciÃƒÆ’Ã‚Â³n**: Un estado de "Zero Errors" en el Security Advisor no solo es una mÃƒÆ’Ã‚Â©trica de cumplimiento, sino una garantÃƒÆ’Ã‚Â­a de que el acceso a datos estÃƒÆ’Ã‚Â¡ controlado por polÃƒÆ’Ã‚Â­ticas y no por la configuraciÃƒÆ’Ã‚Â³n por defecto del motor.



441: ### 49. RLS Policies for Guest Checkout (Mar 2026)

442:

443: - **Problema**: Habilitar RLS en tablas de carrito (`carts`, `cart_items`) y pedidos (`orders`) rompe el flujo de "Guest Checkout" si se restringe el acceso solo a usuarios autenticados.

444: - **Causa**: Los usuarios anÃƒÆ’Ã‚Â³nimos (`anon`) necesitan interactuar temporalmente con sus propios datos sin una sesiÃƒÆ’Ã‚Â³n de Supabase Auth persistente.

445: - **SoluciÃƒÆ’Ã‚Â³n**: Implementar polÃƒÆ’Ã‚Â­ticas permitiendo `INSERT` a `anon` y `SELECT` basado en el `id` del carrito o pedido si el usuario posee la referencia (ej: ID en localStorage). Para `orders`, permitir `SELECT` pÃƒÆ’Ã‚Âºblico pero restringido por ID para seguimiento.

446: - **Regla Derivada**: Siempre validar que las polÃƒÆ’Ã‚Â­ticas de RLS no bloqueen flujos de usuarios no autenticados vitales para la conversiÃƒÆ’Ã‚Â³n de venta.

447:

448: ### 50. Branding Asset Synchronization & Consistency (Mar 2026)

449:

450: - **Problema**: Discrepancia entre los archivos de diseÃƒÆ’Ã‚Â±o en `docs/logos/` y los assets servidos en `frontend/public/branding/`, resultando en logotipos desactualizados o inconsistentes.

451: - **Causa**: Falta de un flujo de sincronizaciÃƒÆ’Ã‚Â³n definido; los componentes de React referenciaban archivos antiguos (ej: `Logo.jpg` en lugar de `Logo.png`).

452: - **SoluciÃƒÆ’Ã‚Â³n**:

453:   - Establecer `docs/logos/` como la fuente de verdad.

454:   - Sincronizar manualmente (o vÃƒÆ’Ã‚Â­a script) a `frontend/public/branding/`.

455:   - Refactorizar todos los componentes frontend (`Footer`, `Home`, `WelcomeModal`, `HelpPage`, `LegalPage`) para usar el nuevo path y extensiÃƒÆ’Ã‚Â³n.

456:   - Actualizar `index.html` para el favicon y apple-touch-icon.

457: - **LecciÃƒÆ’Ã‚Â³n**: La identidad visual debe tratarse como cÃƒÆ’Ã‚Â³digo; cualquier cambio en el "Source of Truth" de diseÃƒÆ’Ã‚Â±o requiere una auditorÃƒÆ’Ã‚Â­a de referencias en todo el frontend para garantizar la integridad visual de la marca.



### 51. Fallback Matching by Collector Number (CardKingdom Sync) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: El script de sincronizaciÃƒÆ’Ã‚Â³n de CardKingdom fallaba al actualizar precios para ediciones especiales (ej. TMNT, PZA) debido a IDs de Scryfall faltantes o discrepantes.

- **Causa RaÃƒÆ’Ã‚Â­z**: No siempre hay un mapeo 1:1 de `scryfall_id` en el catÃƒÆ’Ã‚Â¡logo de CardKingdom para sets promocionales o de colaboraciÃƒÆ’Ã‚Â³n.

- **SoluciÃƒÆ’Ã‚Â³n**: Implementar una lÃƒÆ’Ã‚Â³gica de respaldo (fallback) que extraiga el `collector_number` del SKU de CardKingdom (ej. "TMT-0017" -> "17") y realice el match combinando `set_name` + `collector_number`.

- **Regla Derivada**: Todo script de sincronizaciÃƒÆ’Ã‚Â³n de precios externo debe tener un mÃƒÆ’Ã‚Â©todo de match de respaldo basado en metadatos fÃƒÆ’Ã‚Â­sicos (set + nÃƒÆ’Ã‚Âºmero) si el ID ÃƒÆ’Ã‚Âºnico del proveedor falla.



### 52. UnificaciÃƒÆ’Ã‚Â³n de Archivos de Entorno (.env) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: Discrepancias de llaves (especialmente `SUPABASE_SERVICE_ROLE_KEY`) y corrupciÃƒÆ’Ã‚Â³n de archivos debido a mÃƒÆ’Ã‚Âºltiples archivos `.env` (raÃƒÆ’Ã‚Â­z y frontend/).

- **Causa RaÃƒÆ’Ã‚Â­z**: DesincronizaciÃƒÆ’Ã‚Â³n manual entre archivos y herramientas (Vite vs Python) buscando configuraciones en lugares distintos.

- **SoluciÃƒÆ’Ã‚Â³n**: Centralizar todas las variables en un ÃƒÆ’Ã‚Âºnico `.env` en la raÃƒÆ’Ã‚Â­z. Configurar Vite con `envDir: '../'` para leer desde la raÃƒÆ’Ã‚Â­z.

- **LecciÃƒÆ’Ã‚Â³n**: En monorepos pequeÃƒÆ’Ã‚Â±os o proyectos con subcarpetas, un solo archivo de entorno en la raÃƒÆ’Ã‚Â­z garantiza que todos los servicios (Frontend, API, Scripts) operen sobre la misma "fuente de verdad".



### 53. GestiÃƒÆ’Ã‚Â³n de Procesos HuÃƒÆ’Ã‚Â©rfanos en SincronizaciÃƒÆ’Ã‚Â³n ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: Errores intermitentes de `Invalid API Key` o falta de actualizaciÃƒÆ’Ã‚Â³n de datos a pesar de aplicar correcciones en el cÃƒÆ’Ã‚Â³digo y el `.env`.

- **Causa RaÃƒÆ’Ã‚Â­z**: Procesos de Python persistentes en segundo plano que mantienen versiones obsoletas de las variables de entorno o que bloquean conexiones a la base de datos.

- **SoluciÃƒÆ’Ã‚Â³n**: Antes de reintentar sincronizaciones crÃƒÆ’Ã‚Â­ticas tras cambios en la configuraciÃƒÆ’Ã‚Â³n, es obligatorio listar y terminar procesos huÃƒÆ’Ã‚Â©rfanos (`Stop-Process -Name python -Force`).

- **Regla Derivada**: (Codificada en LEYES_DEL_SISTEMA.md) Todo cambio estructural en configuraciÃƒÆ’Ã‚Â³n requiere un reinicio limpio de servicios y procesos de mantenimiento.



### 54. Robustez en Scripts de DiagnÃƒÆ’Ã‚Â³stico (Supabase SQL vs API) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: Scripts de diagnÃƒÆ’Ã‚Â³stico rÃƒÆ’Ã‚Â¡pido fallan por `APIError` al intentar realizar joins complejos (`table.select('*, cards(name)')`).

- **Causa RaÃƒÆ’Ã‚Â­z**: Restricciones de aliasing en la API PostgREST o desconfiguraciÃƒÆ’Ã‚Â³n momentÃƒÆ’Ã‚Â¡nea de relaciones en el cliente Python.

- **SoluciÃƒÆ’Ã‚Â³n**: Para verificaciones manuales rÃƒÆ’Ã‚Â¡pidas, preferir consultas SQL directas vÃƒÆ’Ã‚Â­a `psycopg2` o realizar selecciones simples de IDs y resolver relaciones programÃƒÆ’Ã‚Â¡ticamente.

- **LecciÃƒÆ’Ã‚Â³n**: La simplicidad en el diagnÃƒÆ’Ã‚Â³stico previene falsos negativos causados por la propia herramienta de prueba.



### 55. Variables SEO de Vite No Reemplazadas en ProducciÃƒÆ’Ã‚Â³n ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: El tab del navegador mostraba literalmente `%VITE_SEO_TITLE%` en producciÃƒÆ’Ã‚Â³n (`geekorium.shop`).

- **Causa RaÃƒÆ’Ã‚Â­z**: Los placeholders `%VITE_*%` en `index.html` solo son reemplazados por Vite durante el build si la variable estÃƒÆ’Ã‚Â¡ definida como env var en ese momento. Las variables `VITE_SEO_TITLE`, `VITE_SEO_DESCRIPTION`, `VITE_SEO_KEYWORDS`, `VITE_SEO_IMAGE` y `VITE_APP_URL` nunca fueron configuradas en el dashboard de Cloudflare Pages ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Environment Variables ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Production.

- **SoluciÃƒÆ’Ã‚Â³n**: Hardcodear los valores SEO estÃƒÆ’Ã‚Â¡ticos directamente en `frontend/index.html`. Mantener solo `%VITE_ROBOTS%` como placeholder (para controlar indexaciÃƒÆ’Ã‚Â³n por entorno: `index, follow` en prod, `noindex, nofollow` en dev).

- **Variables faltantes descubiertas en Cloudflare**: `VITE_SUPABASE_PROJECT_ID` y `VITE_ROBOTS`.

- **Regla Derivada**: Auditar `index.html` en cada setup de proyecto nuevo. Todo `%VITE_*%` que no estÃƒÆ’Ã‚Â© en el dashboard del hosting es un bug silencioso. Las metas SEO estÃƒÆ’Ã‚Â¡ticas (tÃƒÆ’Ã‚Â­tulo, descripciÃƒÆ’Ã‚Â³n de marca) deben hardcodearse; las dinÃƒÆ’Ã‚Â¡micas por entorno (robots, URL canÃƒÆ’Ã‚Â³nica) se parametrizan.

- **Google Search Console**: Para que Google indexe un sitio nuevo, NO basta con tener `robots: index, follow`. Se requiere verificar el dominio en GSC (via registro TXT en DNS de Cloudflare) y enviar el sitemap manualmente. Sin esto, el crawl puede tardar semanas o no ocurrir.



### 56. Error de "Migration Mismatch" en Supabase CI/CD (GitHub Actions) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: El pipeline `supabase/setup` en GitHub Actions fallaba con "Migration mismatch" al intentar hacer push o reset a la base de datos de Preview.

- **Causa RaÃƒÆ’Ã‚Â­z**: Borrar o renombrar archivos de migraciÃƒÆ’Ã‚Â³n localmente no elimina sus registros histÃƒÆ’Ã‚Â³ricos de la DB remota en Supabase (`supabase_migrations.schema_migrations`). El CLI detecta esta divergencia y aborta.

- **SoluciÃƒÆ’Ã‚Â³n**: Ir al SQL Editor del proyecto Supabase remoto y hacer `DELETE FROM supabase_migrations.schema_migrations WHERE version = 'VERSION_HUERFANA';` para alinear la DB con los archivos locales antes de re-ejecutar el pipeline.

- **Regla Derivada**: Nunca eliminar scripts de migraciÃƒÆ’Ã‚Â³n que ya se ejecutaron en un entorno alojado, a menos que tambiÃƒÆ’Ã‚Â©n se purgue su huella en la tabla interna de Supabase o se haga un reset completo desde cero.



### 57. Sobrecritura Incompleta en Patrones de Fallback API a Supabase ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: Una carta Foil obtenÃƒÆ’Ã‚Â­a el precio de `$5.99` (precio Normal) en lugar de `$59.99` (precio Foil) en el frontend.

- **Causa RaÃƒÆ’Ã‚Â­z**: En `api.ts`, una respuesta exitosa pero incompleta desde FastAPI llenaba la propiedad `data.all_versions` con objetos sin `finish` ni `avg_market_price_foil_usd`. Aunque se detectaba que faltaba data (`apiVersionsLackFinishData`), la lÃƒÆ’Ã‚Â³gica saltaba el *query de Supabase fallback* porque la condiciÃƒÆ’Ã‚Â³n original era `if (!data.all_versions || data.all_versions.length === 0)`.

- **SoluciÃƒÆ’Ã‚Â³n**: Cuando se detecta data incompleta (e.g., `apiVersionsLackFinishData`), es obligatorio vaciar el atributo base explÃƒÆ’Ã‚Â­citamente (`data.all_versions = []` o `delete data.all_versions`) antes del chequeo condicional del fallback para forzar la re-evaluaciÃƒÆ’Ã‚Â³n estructurada desde la base de datos directa.

- **Regla Derivada**: En patrones donde un API proxy falla/devuelve data parcial y el frontend tiene un fallback directo a la DB de Supabase, la data parcial errÃƒÆ’Ã‚Â³nea DEBE purgarse por completo en memoria. Mezclar las respuestas (`{...baseData, ...data}`) sin purgar provoca cortocircuitos lÃƒÆ’Ã‚Â³gicos en la UI.



### 58. Unicidad FÃƒÆ’Ã‚Â­sica y React Keys en RPCs de Inventario ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: El frontend mostraba duplicados exactos (ej. 2 cartas idÃƒÆ’Ã‚Â©nticas) o sobreescribÃƒÆ’Ã‚Â­a variantes al renderizar resultados de bÃƒÆ’Ã‚Âºsqueda si no habÃƒÆ’Ã‚Â­a distinciÃƒÆ’Ã‚Â³n entre foil y nonfoil en la respuesta del RPC `get_products_filtered`.

- **Causa RaÃƒÆ’Ã‚Â­z**: En la tabla `products`, las variantes Foil y Nonfoil del mismo `printing_id` estÃƒÆ’Ã‚Â¡n separadas. Sin embargo, si el RPC no retorna la columna `finish`, el frontend las mapeaba ambas usando unicÃƒÆ’Ã‚Â¡mente `printing_id` como React Key, causando advertencias de UI de claves duplicadas, sobreescritura de cartas, y perdiendo el estado visual "Foil".

- **SoluciÃƒÆ’Ã‚Â³n**: Asegurarse de que el RPC recupere la columna `finish` (`LOWER(COALESCE(p.finish, 'nonfoil')) as finish`) y utilizarla en el frontend para generar un React Key ÃƒÆ’Ã‚Âºnico (`${printing_id}-${finish}`). Adicionalmente, pasar `is_foil` explicitamente al componente derivÃƒÆ’Ã‚Â¡ndolo de `finish`.

- **Regla Derivada**: Todo RPC que retorne listas de inventario fÃƒÆ’Ã‚Â­sico TCG debe siempre exponer y proyectar los diferenciadores fÃƒÆ’Ã‚Â­sicos (ej. `finish`, `condition`) al frontend para garantizar unicidad garantizada en las visualizaciones de React y posibilitar lÃƒÆ’Ã‚Â³gica UI condicional.



### 59. Recarga de CachÃƒÆ’Ã‚Â© PostgREST y Precios Ramificados en RPCs ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-11



- **Problema**: Tras aÃƒÆ’Ã‚Â±adir la columna `finish` al RPC `get_products_filtered` en la base de datos de producciÃƒÆ’Ã‚Â³n mediante un script SQL directo, el frontend seguÃƒÆ’Ã‚Â­a recibiendo la respuesta antigua (sin `finish`) y mostrando precios incorrectos para las versiones Foil.

- **Causa RaÃƒÆ’Ã‚Â­z**:

  1. PostgREST (la capa API de Supabase) mantiene un cachÃƒÆ’Ã‚Â© del schema de la base de datos. Los cambios directos en funciones SQL no invalidan este cachÃƒÆ’Ã‚Â© automÃƒÆ’Ã‚Â¡ticamente, lo que provoca que la API siga retornando la firma antigua de la funciÃƒÆ’Ã‚Â³n.

  2. Inicialmente, no se considerÃƒÆ’Ã‚Â³ que el precio a mostrar (*market price*) debe ramificarse dependiendo del *finish*. La consulta SQL usaba `avg_market_price_usd` de forma genÃƒÆ’Ã‚Â©rica para todas las variantes.

- **SoluciÃƒÆ’Ã‚Â³n**:

  1. Ejecutar `NOTIFY pgrst, 'reload schema';` inmediatamente despuÃƒÆ’Ã‚Â©s de alterar una funciÃƒÆ’Ã‚Â³n SQL cruda.

  2. Modificar el RPC para que el precio devuelto dependa inteligentemente de la variante fÃƒÆ’Ã‚Â­sica que se va a imprimir en esa fila: `COALESCE(CASE WHEN LOWER(p.finish) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)`.

- **Regla Derivada**: Al desarrollar RPCs unificados de inventario TCG, la proyecciÃƒÆ’Ã‚Â³n de la propiedad `price` no puede ser plana; **debe** ramificarse evaluando las banderas fÃƒÆ’Ã‚Â­sicas (`finish`, y en el futuro `condition` o `language`). AdemÃƒÆ’Ã‚Â¡s, cualquier parche SQL *hotfix* aplicado en vivo sobre Supabase requiere estrictamente recargar la capa API HTTP (`NOTIFY pgrst, 'reload schema'`).



### 60. Uso de Supabase CLI en Windows (npx) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-12



- **Problema**: El comando `supabase` falla con `CommandNotFoundException` si no estÃƒÆ’Ã‚Â¡ en el PATH global del sistema.

- **SoluciÃƒÆ’Ã‚Â³n**: Usar siempre `npx supabase` para invocar el CLI local. Para despliegues remotos, es obligatorio incluir el flag `--project-ref [ID]` para evitar ambigÃƒÆ’Ã‚Â¼edades si el enlace local (`.supabase/config`) no estÃƒÆ’Ã‚Â¡ sincronizado.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla TÃƒÆ’Ã‚Â©cnica (Herramientas CLI).



### 61. SincronizaciÃƒÆ’Ã‚Â³n de Edge Functions Duplicadas ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-12



- **Problema**: Desplegar una funciÃƒÆ’Ã‚Â³n corregida (ej. `api`) no solucionaba el problema en todas las partes del sitio (ej. Admin o Import) porque existÃƒÆ’Ã‚Â­a otra funciÃƒÆ’Ã‚Â³n idÃƒÆ’Ã‚Â©ntica con distinto nombre (`tcg-api`) desplegada previamente.

- **LecciÃƒÆ’Ã‚Â³n**: Durante fases de transiciÃƒÆ’Ã‚Â³n o refactorizaciÃƒÆ’Ã‚Â³n de nombres de funciones, es Mandatorio sincronizar el cÃƒÆ’Ã‚Â³digo en ambas carpetas (`api/` y `tcg-api/`) antes del despliegue para garantizar consistencia en todo el ecosistema.

- **Regla Derivada**: Evitar la fragmentaciÃƒÆ’Ã‚Â³n de lÃƒÆ’Ã‚Â³gica compartida; si dos Edge Functions hacen lo mismo, deben eliminarse o mantenerse estrictamente en espejo hasta la migraciÃƒÆ’Ã‚Â³n total.



### 62. LÃƒÆ’Ã‚Â³gica de Pedidos "Por Encargo" (Stock 0) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-12



- **Problema**: El sistema bloqueaba la venta de cartas sin stock fÃƒÆ’Ã‚Â­sico, limitando el e-commerce solo a lo disponible en preventa o inventario actual.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - **Bypassing**: Modificar RPC `add_to_cart` para ignorar la validaciÃƒÆ’Ã‚Â³n de `stock_actual` si el producto permite pedidos on-demand.

  - **CreaciÃƒÆ’Ã‚Â³n On-the-fly**: Si una variante (Foil/NM) no existe en la tabla `products`, el RPC debe crearla con stock 0 en lugar de fallar, permitiendo que el usuario la "encargue".

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 4 (Soporte Por Encargo).



### 68. Discrepancia de Stock "8 fuera / 1 dentro" (Marzo 2026)



- **Problema**: El buscador mostraba stock disponible, pero el modal mostraba "Por encargo".

- **Causa RaÃƒÆ’Ã‚Â­z**: Uso de IDs sintÃƒÆ’Ã‚Â©ticos en el frontend (`uuid-foil`, `uuid-nonfoil`) que no coincidÃƒÆ’Ã‚Â­an con el `printing_id` real al consultar el stock por RPC.

- **SoluciÃƒÆ’Ã‚Â³n**: Refactorizar `api.ts` para extraer el base UUID (stripping suffixes) antes de filtrar el resultado del RPC de stock.

- **LecciÃƒÆ’Ã‚Â³n**: Las llaves de React y los IDs de navegaciÃƒÆ’Ã‚Â³n pueden ser sintÃƒÆ’Ã‚Â©ticos para garantizar unicidad visual, pero los queries de datos de negocio (stock, precio) DEBEN trabajar sobre el ID canÃƒÆ’Ã‚Â³nico de la base de datos.

- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `fetchCardDetails` ahora normaliza los IDs antes del mapeo de stock.



### 23. Prioridad de Precios: Mercado vs Inventario ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-12



- **Problema**: Cartas en stock mostraban precio de $0.00 o "---" en el modal, aunque en la bÃƒÆ’Ã‚Âºsqueda se veÃƒÆ’Ã‚Â­a el precio correcto ($24.99).

- **Causa RaÃƒÆ’Ã‚Â­z**: En `api.ts`, la lÃƒÆ’Ã‚Â³gica de mezcla de datos de inventario usaba el operador `??` (nullish coalescing), lo que permitÃƒÆ’Ã‚Â­a que un valor de `0` en la tabla `products` (precio no seteado manualmente) sobrescribiera el `market_price` de la tabla `card_printings`.

- **SoluciÃƒÆ’Ã‚Â³n**: Refactorizar la lÃƒÆ’Ã‚Â³gica en `fetchCardDetails` para validar que el precio de inventario sea estrictamente mayor a 0 antes de usarlo como override.

- **LecciÃƒÆ’Ã‚Â³n**: Un precio de `0` en el inventario debe tratarse pedagÃƒÆ’Ã‚Â³gicamente como "sin precio manual" (fallback al mercado), no como "precio gratis". La lÃƒÆ’Ã‚Â³gica de negocio debe ser consistente entre el listado (`get_products_filtered` RPC) y el detalle (`api.ts`).

- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `finalPrice` ahora valida `Number(exactProd.price) > 0`.



### 69. UnificaciÃƒÆ’Ã‚Â³n de Credenciales SMTP y SincronizaciÃƒÆ’Ã‚Â³n de Edge Functions ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-12



- **Problema**: El envÃƒÆ’Ã‚Â­o de correos fallaba silenciosamente tras cambios en la configuraciÃƒÆ’Ã‚Â³n debido a discrepancias en los nombres de variables de entorno entre las funciones `api` (`SMTP_USERNAME`) y `tcg-api` (`SMTP_USER`).

- **Causa RaÃƒÆ’Ã‚Â­z**: FragmentaciÃƒÆ’Ã‚Â³n de cÃƒÆ’Ã‚Â³digo entre funciones duplicadas que realizan tareas similares y falta de logs de diagnÃƒÆ’Ã‚Â³stico para la carga de secretos de Supabase.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - Unificar los nombres de variables a `SMTP_USERNAME` y `SMTP_PASSWORD` en todas las Edge Functions.

  - Sincronizar la lÃƒÆ’Ã‚Â³gica de envÃƒÆ’Ã‚Â­o de notificaciones entre `api/index.ts` y `tcg-api/index.ts`.

  - AÃƒÆ’Ã‚Â±adir logs de consola explÃƒÆ’Ã‚Â­citos (`SMTP credentials loaded: true/false`) para facilitar el debugging en el dashboard de Supabase.

- **Regla Derivada**: Las variables de entorno para infraestructuras compartidas (SMTP, API Keys) deben seguir un esquema de nombrado ÃƒÆ’Ã‚Âºnico en todo el proyecto. Cualquier cambio en una Edge Function "espejo" debe replicarse inmediatamente en la otra.



### 70. Price Fallback Chain & Starred Collector Numbers ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-12

- **Problema:** Cartas en stock mostraban "S/P" (Sin Precio) a pesar de tener datos de mercado en otras versiones.

- **Causa RaÃƒÆ’Ã‚Â­z:** Existencia de versiones duplicadas (con "ÃƒÂ¢Ã‹Å“Ã¢â‚¬Â¦" en el nÃƒÆ’Ã‚Âºmero de coleccionista) que carecÃƒÆ’Ã‚Â­an de metadatos de precio, mientras que la versiÃƒÆ’Ã‚Â³n base sÃƒÆ’Ã‚Â­ los tenÃƒÆ’Ã‚Â­a. El buscador devolvÃƒÆ’Ã‚Â­a la versiÃƒÆ’Ã‚Â³n sin precio.

- **SoluciÃƒÆ’Ã‚Â³n:**

  1. Refactorizar el RPC `get_products_filtered` con una cadena de fallback: `Market(Finish) -> Market(Nonfoil) -> Market(Foil) -> Store Price -> 0`.

  2. Ejecutar un script de correcciÃƒÆ’Ã‚Â³n de datos para copiar precios de versiones base a versiones starred.

- **Regla Derivada:** Todo RPC de inventario debe implementar fallbacks de precio entre acabados (finish) para mitigar falta de metadata especÃƒÆ’Ã‚Â­fica.

### 71. LÃƒÆ’Ã‚Â³gica de DetecciÃƒÆ’Ã‚Â³n de Foil y RemediaciÃƒÆ’Ã‚Â³n Masiva (Marzo 2026)



- **Problema**: El sistema importaba casi todas las cartas como "Foil", incluso tierras duales de 3ED que no existen en ese acabado.

- **Causa RaÃƒÆ’Ã‚Â­z**:

  1. **Bug en Edge Function**: La lÃƒÆ’Ã‚Â³gica `finish.toLowerCase().includes('foil')` devolvÃƒÆ’Ã‚Â­a true para "nonfoil" porque contiene la palabra "foil".

  2. **Data Inconsistente**: Miles de registros en `products` heredaron este error, ensuciando el inventario y la visualizaciÃƒÆ’Ã‚Â³n.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - **CÃƒÆ’Ã‚Â³digo**: Refactorizar a `(finish === 'foil' || (finish.includes('foil') && !finish.includes('nonfoil')))` para exclusividad.

  - **DB**: Script PL/pgSQL masivo que:

    - Identifica cartas marcadas como `foil` que no soportan ese acabado segÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn `card_printings`.

    - Fusiona el stock con la versiÃƒÆ’Ã‚Â³n `nonfoil` si existe, o renombra la entrada en place.

    - Actualiza `order_items` y `cart_items` para mantener integridad referencial antes de borrar registros duplicados.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance y Datos). Las correcciones de finish deben considerar la tabla unida `card_printings`.

### 72. Ultra-Performance Filtering via Single-Table Denormalization (March 2026)



- **Problema**: Timeouts (500) y latencia alta en filtros complejos (Color, Tipo, Rareza) sobre tablas de 200k+ registros con mÃƒÆ’Ã‚Âºltiples joins.

- **Causa RaÃƒÆ’Ã‚Â­z**: La ejecuciÃƒÆ’Ã‚Â³n de joins dinÃƒÆ’Ã‚Â¡micos en Supabase/PostgREST es costosa. Los ÃƒÆ’Ã‚Â­ndices en tablas relacionales no siempre compensan el overhead del planificador de Postgres en queries muy ramificadas.

- **SoluciÃƒÆ’Ã‚Â³n**: **Extrema DenormalizaciÃƒÆ’Ã‚Â³n**. Mover metadatos crÃƒÆ’Ã‚Â­ticos (`release_date`, `colors`, `set_name`, `type_line`) directamente a la tabla `products`. RediseÃƒÆ’Ã‚Â±ar el RPC `get_products_filtered` para que sea un query de una sola tabla (`FROM products`).

- **SincronizaciÃƒÆ’Ã‚Â³n**: Usar un trigger `BEFORE INSERT OR UPDATE` en la tabla destino para poblar los datos, y triggers `AFTER UPDATE` en las tablas fuente para "tocar" los registros relacionados y forzar la sincronizaciÃƒÆ’Ã‚Â³n sin recursiÃƒÆ’Ã‚Â³n infinita.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance). Si una query con Joins supera los 200ms, denormalizar metadatos a la tabla principal.



### 73. Frontend Request Cancellation with AbortController (March 2026)



- **Problema**: "Race conditions" visuales y sobrecarga del servidor al mover sliders de filtros (Precio/AÃƒÆ’Ã‚Â±o) rÃƒÆ’Ã‚Â¡pidamente. El servidor procesaba peticiones que el usuario ya no necesitaba.

- **Causa RaÃƒÆ’Ã‚Â­z**: Cada cambio en el estado disparaba un `fetch` asÃƒÆ’Ã‚Â­ncrono. Sin cancelaciÃƒÆ’Ã‚Â³n, las respuestas podÃƒÆ’Ã‚Â­an llegar desordenadas o acumularse en el backend.

- **SoluciÃƒÆ’Ã‚Â³n**: Implementar `AbortController` en el hook `useEffect` de data fetching.

- **PatrÃƒÆ’Ã‚Â³n**:



```typescript

useEffect(() => {

  const controller = new AbortController();

  fetchData(controller.signal);

  return () => controller.abort();

}, [filters]);

```



- **Regla Derivada**: Todo component de bÃƒÆ’Ã‚Âºsqueda/filtrado masivo DEBE implementar `AbortController` para gestionar el ciclo de vida de las peticiones de red.

### 74. Robust Foil Matching & Finishes Array (March 2026)



- **Problema**: Cartas importadas como foil eran guardadas como non-foil por el RPC `bulk_import_inventory`, resultando en visualizaciÃƒÆ’Ã‚Â³n y precios incorrectos (ej. "Wan Shi Tong, Librarian").

- **Causa RaÃƒÆ’Ã‚Â­z**:

  1. El RPC priorizaba el match por la columna `is_foil`, ignorando el array `finishes` usado por sets modernos (Avatar, etc.).

  2. Fallback de Scryfall: Algunas versiones (starred collector numbers) no tienen metadata de precio foil, causando confusiÃƒÆ’Ã‚Â³n en el matching si no hay una jerarquÃƒÆ’Ã‚Â­a clara.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - **Backend**: Actualizar RPC para que considere `requested_finish` vs (`is_foil` OR `finishes` array) con prioridad sobre la fecha de lanzamiento.

  - **Frontend**: Implementar una heurÃƒÆ’Ã‚Â­stica de validaciÃƒÆ’Ã‚Â³n en `BulkImport.tsx` que detecta precios altos ($ > 50) en cartas marcadas como non-foil, lanzando un aviso de confirmaciÃƒÆ’Ã‚Â³n.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 6 (ImportaciÃƒÆ’Ã‚Â³n Robusta).

### 75. Non-Automatic Joins in Supabase Client ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-13

- **Problema**: `Could not find a relationship between 'orders' and 'profiles' in the schema cache` al intentar un join simple.

- **Causa**: Supabase PostgREST no detecta relaciones automÃƒÆ’Ã‚Â¡ticas si los campos no tienen foreign keys explÃƒÆ’Ã‚Â­citas en el schema real de Postgres o si hay ambigÃƒÆ’Ã‚Â¼edades en la cachÃƒÆ’Ã‚Â© del cliente.

- **SoluciÃƒÆ’Ã‚Â³n**: Evitar joins forzados si no son necesarios. Para `orders`, los datos del comprador ya estÃƒÆ’Ã‚Â¡n denormalizados en `guest_info` o `shipping_address`. Usar esos campos directamente es mÃƒÆ’Ã‚Â¡s resiliente.

- **Regla Derivada**: No asumir que `select('*, table(*)')` funcionarÃƒÆ’Ã‚Â¡ siempre; verificar foreign keys en el schema antes de intentar joins profundos.



### 76. Email Priority in Orders ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-13

- **Problema**: El admin mostraba "N/A" en el correo del comprador.

- **Causa**: Se buscaba en `orders.user_email` (columna inexistente) o se intentaba unir con `profiles` (que no guarda emails en esta arquitectura).

- **SoluciÃƒÆ’Ã‚Â³n**: La jerarquÃƒÆ’Ã‚Â­a de email correcta es: `guest_info.email` -> `shipping_address.email`.

- **Regla Derivada**: Para ÃƒÆ’Ã‚Â³rdenes de invitados y usuarios registrados, el email de contacto seguro reside en los metadatos de envÃƒÆ’Ã‚Â­o/invitado.



### 77. Inventory Zero-Price Integrity Sweep ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-03-13

- **Problema**: Productos "On-Demand" o con errores de importaciÃƒÆ’Ã‚Â³n terminaban con precio $0.00 en el carrito.

- **Causa**: Falta de validaciÃƒÆ’Ã‚Â³n reactiva en el momento de la inserciÃƒÆ’Ã‚Â³n o desincronizaciÃƒÆ’Ã‚Â³n con el mercado.

- **SoluciÃƒÆ’Ã‚Â³n**: Implementar barridos (sweeps) automÃƒÆ’Ã‚Â¡ticos que busquen precios 0 y los reparen consultando `card_printings`.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla 7 (PrevenciÃƒÆ’Ã‚Â³n de Zero-Price).



### 78. RemociÃƒÆ’Ã‚Â³n Proactiva de Funcionalidades "On-Hold" (Marzo 2026)



- **Problema**: El inicio de sesiÃƒÆ’Ã‚Â³n social (Google, Discord, Microsoft) fue solicitado para ser ocultado o puesto en "hold" para simplificar la experiencia de usuario inicial.

- **LecciÃƒÆ’Ã‚Â³n**: Cuando una funcionalidad secundaria se pone en pausa por decisiÃƒÆ’Ã‚Â³n del usuario, no basta con comentarla si genera advertencias de lint o aumenta el peso muerto del cÃƒÆ’Ã‚Â³digo. Es preferible removerla limpiamente de la UI y los componentes asociados, manteniendo el estado de autenticaciÃƒÆ’Ã‚Â³n core intacto.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 8 (Simplicidad y Foco). Funcionalidades en hold deben ser removidas de la vista activa para evitar ruido visual y tÃƒÆ’Ã‚Â©cnico.

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ **Visibilidad Condicional de Carrito**: El botÃƒÆ’Ã‚Â³n "AÃƒÆ’Ã‚Â±adir al carrito" ahora estÃƒÆ’Ã‚Â¡ oculto por defecto en la vista general (grid/list) y solo es visible en el modal de detalles, mejorando la estÃƒÆ’Ã‚Â©tica de navegaciÃƒÆ’Ã‚Â³n masiva.

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ **Filtrado de Stock Robusto (Multi-capa)**: ImplementaciÃƒÆ’Ã‚Â³n de limpieza de ÃƒÆ’Ã‚Â­tems agotados directamente en `api.ts` y componentes de detalle. EliminaciÃƒÆ’Ã‚Â³n completa de versiones "Por Encargo" ($0.00) en el flujo de vista de stock.

- ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ **Ocultamiento de SecciÃƒÆ’Ã‚Â³n Archivo**: Removida la pestaÃƒÆ’Ã‚Â±a de histÃƒÆ’Ã‚Â³rico para simplificar la UX. El sistema ahora opera exclusivamente sobre el inventario vivo (Marketplace).



### 79. Component Prop Drilling for Visibility Control (March 2026)



- **Problema**: Necesidad de implementar un patrÃƒÆ’Ã‚Â³n de `showElement` prop con un valor por defecto.

- **ImplementaciÃƒÆ’Ã‚Â³n**:

  - `CardProps` ahora incluye `showCartButton?: boolean = false`.

  - Los padres (`CardGrid`) propagan este prop.

  - El modal de detalle (`CardModal`) lo ignora o lo fuerza a `true`, manteniendo la funcionalidad aislada.

- **LecciÃƒÆ’Ã‚Â³n**: Al rediseÃƒÆ’Ã‚Â±ar visibilidad de componentes compartidos, usar props booleanos explÃƒÆ’Ã‚Â­citos en lugar de lÃƒÆ’Ã‚Â³gicas globales de estado si el cambio es puramente de visualizaciÃƒÆ’Ã‚Â³n contextual. Esto permite mayor flexibilidad sin efectos secundarios en otras partes de la app.

### 25. Ocultamiento de Features vs. EliminaciÃƒÆ’Ã‚Â³n (Marzo 2026)



- **Problema**: El sistema de "Archivo" confundÃƒÆ’Ã‚Â­a a los usuarios reciÃƒÆ’Ã‚Â©n registrados.

- **Causa RaÃƒÆ’Ã‚Â­z**: Presencia de una funcionalidad de referencia histÃƒÆ’Ã‚Â³rica en un sitio de venta directa.

- **LecciÃƒÆ’Ã‚Â³n**: Para cambios de UX rÃƒÆ’Ã‚Â¡pidos bajo presiÃƒÆ’Ã‚Â³n, ocultar el punto de entrada (`tabs`) y forzar el estado inicial (`activeTab`) es mÃƒÆ’Ã‚Â¡s seguro y rÃƒÆ’Ã‚Â¡pido que eliminar cÃƒÆ’Ã‚Â³digo de fondo.

- **ImplementaciÃƒÆ’Ã‚Â³n**: En `Home.tsx`, forzar `activeTab: 'marketplace'`, retornar `null` en el botÃƒÆ’Ã‚Â³n de toggle e ignorar el parÃƒÆ’Ã‚Â¡metro URL `?tab=reference`.

- **Integridad**: Mantener una rama de referencia (`v1.0-productiva`) antes de apagar funcionalidades importantes garantiza la reversibilidad total sin miedo a perder cÃƒÆ’Ã‚Â³digo legado.



### 81. AlineaciÃƒÆ’Ã‚Â³n de IDs de Fuentes de Precios (Marzo 2026)



- **Problema**: Discrepancias en el historial de precios debido a mÃƒÆ’Ã‚Âºltiples IDs (`1`, `21`) asignados a la misma fuente (Card Kingdom) en diferentes etapas del desarrollo.

- **Causa RaÃƒÆ’Ã‚Â­z**: Inconsistencia en scripts de raspado (scrapers) iniciales que no compartÃƒÆ’Ã‚Â­an una tabla de referencia de fuentes.

- **SoluciÃƒÆ’Ã‚Â³n**: Estandarizar IDs de fuentes crÃƒÆ’Ã‚Â­ticas: **16 para TCGplayer** y **17 para Card Kingdom**. Ejecutar scripts de alineaciÃƒÆ’Ã‚Â³n (`align_everything.py`) para migrar registros histÃƒÆ’Ã‚Â³ricos al ID oficial y consolidar las tablas `sources` y `price_sources`.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 1. Todo script de sincronizaciÃƒÆ’Ã‚Â³n debe usar el ID 17 para Card Kingdom de forma hardcodeada o mediante lookup en la tabla de referencia oficial.





### 82. Storefront Caching & Pricing Updates (April 2026)

- **Problema**: El inventario (products) fue actualizado exitosamente para eliminar productos con precio .00, pero la grilla en la tienda seguÃƒÆ’Ã‚Â­a mostrando .00.

- **Causa RaÃƒÆ’Ã‚Â­z**: La visualizaciÃƒÆ’Ã‚Â³n principal del frontend depende de la Vista Materializada mv_unique_cards, la cual se alimenta de la tabla de catÃƒÆ’Ã‚Â¡logo card_printings, no del inventario directo.

- **SoluciÃƒÆ’Ã‚Â³n**: Para que un ajuste de mercado se refleje visualmente, el script debe actualizar la columna de precios denormalizada en card_printings y luego ejecutar explÃƒÆ’Ã‚Â­citamente REFRESH MATERIALIZED VIEW mv_unique_cards;.

- **Regla Derivada**: Todo update de pricing que deba verse en frontend requiere refrescar la vista materializada como ÃƒÆ’Ã‚Âºltimo paso obligatorio.



### 83. Integridad en Egresos Masivos (Abril 2026)

- **Problema**: Riesgo de inconsistencia de stock al procesar archivos CSV con filas duplicadas o cantidades que exceden el stock disponible en un entorno multi-transaccional.

- **Causa RaÃƒÆ’Ã‚Â­z**: Si no se agrupan las cantidades por "Printing + Condition + Finish" antes de comparar con la DB, dos filas pequeÃƒÆ’Ã‚Â±as podrÃƒÆ’Ã‚Â­an pasar la validaciÃƒÆ’Ã‚Â³n individualmente pero fallar la resta combinada, o generar errores de restricciÃƒÆ’Ã‚Â³n.

- **SoluciÃƒÆ’Ã‚Â³n**: 

- **AgregaciÃƒÆ’Ã‚Â³n Previa**: El RPC de validaciÃƒÆ’Ã‚Â³n (`preview_bulk_egress`) y ejecuciÃƒÆ’Ã‚Â³n debe usar un CTE para sumar todas las cantidades del lote por nodo fÃƒÆ’Ã‚Â­sico antes de evaluar el stock.

  - **Aborto Transaccional**: La operaciÃƒÆ’Ã‚Â³n de egreso debe ser atÃƒÆ’Ã‚Â³mica (una sola funciÃƒÆ’Ã‚Â³n RPC). Si una sola carta del lote falla la validaciÃƒÆ’Ã‚Â³n de stock final (stock - pedido < 0), se debe lanzar una excepciÃƒÆ’Ã‚Â³n para revertir el lote completo, evitando estados de inventario parciales.

- **Regla Derivada**: Todo proceso de baja de inventario debe registrarse obligatoriamente en `inventory_logs` con un motivo explÃƒÆ’Ã‚Â­cito para auditorÃƒÆ’Ã‚Â­a administrativa.



### 84. Frictionless WhatsApp Checkout (April 2026)

- **Concept**: Reducing a 2-step checkout to a single form by using "safe defaults" (CÃƒÆ’Ã‚Â©dula, Address, etc.) for required backend fields while focusing the UI on Name, WhatsApp, and Email.

- **UI Logic**: Use of a dynamic "Confirm & Pay" button that remains disabled (grey) until the 3 mandatory fields are valid, then turns green with a glow effect.

- **Notification**: Email is mandatory as it's the primary channel for automated order confirmation, complementary to the manual WhatsApp flow.



### 85. Branding & "Secret" Access (April 2026)

- **Pattern**: Hiding "Login" buttons from the public view during BETA to prioritize conversion and reduce unauthorized support requests.

- **Implementation**: Providing a "Secret Link" (`/geeko-login`) for the internal team instead of a UI-hidden button.

- **UX**: Updating the restricted route handler (`AdminRoute`) to provide a helpful "Restricted Access" screen with a link to the secret login, improving internal use while keeping public users away.



### 86. WhatsApp Itemized Order Detail ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ Regression Risk (April 2026)

- **Problema**: After a UX simplification session (April 6), the WhatsApp redirect message was reduced to aggregate counts ("Normal: 5, Foil: 2"), losing the per-card breakdown. This blocked operational review of orders.

- **Causa RaÃƒÆ’Ã‚Â­z**: Frictionless checkout improvements over-simplified the WA message to reduce message length, inadvertently removing data needed by the store team.

- **SoluciÃƒÆ’Ã‚Â³n**: Restore the itemized format: `ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢ Qty x Name [SET] [FINISH] - $Total`. Cap at 40 items and append an overflow note directing to email for full detail.

- **Regla Derivada**: The WhatsApp message is the PRIMARY operational channel for the Geekorium team. It MUST always include a per-card breakdown. Simplification of the checkout form must NEVER simplify the order detail sent to the store.



### 87. PDF Receipt via New Window (No Library) (April 2026)

- **Problema**: `window.print()` called on the main checkout page produced an unstyled browser print of the entire app UI, not a real comprobante.

- **SoluciÃƒÆ’Ã‚Â³n**: `generateReceiptHTML()` in `CheckoutSuccessPage.tsx` produces a standalone, self-contained HTML document (with Google Fonts, full CSS branding, item table, and status badge) opened via `window.open()`. The receipt page auto-fires `window.print()` on load.

- **PatrÃƒÆ’Ã‚Â³n**: Pass all data needed for the receipt (`customerInfo`, `items`, `total`, `orderId`) through React Router's `navigate()` state. No DB round-trip needed on the success page.

- **Regla Derivada**: For lightweight, one-time document generation in a React SPA, prefer the new-window HTML approach over PDF libraries (jsPDF, react-pdf). It requires zero npm dependencies and produces a print-ready, fully branded document.



### 88. AtÃƒÆ’Ã‚Â³mica EliminaciÃƒÆ’Ã‚Â³n de ÃƒÆ’Ã¯Â¿Â½tems e Inventario (Abril 2026)

- **Problema**: Eliminar un ÃƒÆ’Ã‚Â­tem de un pedido requiere actualizar el total y restaurar el stock fÃƒÆ’Ã‚Â­sico simÃƒÆ’Ã‚Âºltaneamente para evitar discrepancias.

- **Causa RaÃƒÆ’Ã‚Â­z**: LÃƒÆ’Ã‚Â³gica distribuida en el frontend puede fallar si la conexiÃƒÆ’Ã‚Â³n se interrumpe entre llamadas.

- **SoluciÃƒÆ’Ã‚Â³n**: Crear una funciÃƒÆ’Ã‚Â³n RPC `delete_order_item_v1` que maneje: 1. VerificaciÃƒÆ’Ã‚Â³n de estado de orden, 2. Incremento de stock en `products`, 3. RecÃƒÆ’Ã‚Â¡lculo de `total_amount`, 4. EliminaciÃƒÆ’Ã‚Â³n de la fila en `order_items`.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 6 (Integridad Global). Operaciones cruzadas entre Pedidos e Inventario deben ser atÃƒÆ’Ã‚Â³micas vÃƒÆ’Ã‚Â­a SQL.



### 89. UI-Based Confirmation vs Browser Native (Abril 2026)

- **Problema**: El uso de `window.confirm()` en entornos de producciÃƒÆ’Ã‚Â³n puede ser bloqueado o auto-cancelado por el navegador si se detectan mÃƒÆ’Ã‚Âºltiples re-renders o interferencias de eventos, resultando en botones que "no hacen nada".

- **Causa RaÃƒÆ’Ã‚Â­z**: El log de consola mostraba "User clicked CANCEL" instantÃƒÆ’Ã‚Â¡neamente sin que el usuario interactuara.

- **SoluciÃƒÆ’Ã‚Â³n**: Implementar un estado de confirmaciÃƒÆ’Ã‚Â³n en lÃƒÆ’Ã‚Â­nea (`confirmingItemId`). Al pulsar la acciÃƒÆ’Ã‚Â³n, el botÃƒÆ’Ã‚Â³n cambia a un set de iconos "Confirmar [Check] / Cancelar [X]".

- **Ventaja**: Evita bloqueos de scripts del navegador, es mÃƒÆ’Ã‚Â¡s rÃƒÆ’Ã‚Â¡pido y coherente con el lenguaje visual de la app (Rose-Neon).

- **Regla Derivada**: Preferir estados de confirmaciÃƒÆ’Ã‚Â³n "Inline" para acciones destructivas en el panel administrativo para garantizar robustez ante polÃƒÆ’Ã‚Â­ticas de seguridad de navegadores modernos.



### 90. Touch-First Visibility vs Desktop-Only Hover (April 2026)

- **Problem**: Critical actions (like "Add to Cart") were hidden behind a hover state (`opacity-0 group-hover:opacity-100`). This made the feature inaccessible on smartphones, tablets, and POS touchscreens.

- **Solution**: Switch to **Permanent Visibility**. Important CTA (Call to Action) buttons should always be visible (at least partially) or have a very clear visual affordance that doesn't rely on mouse pointers.

- **Improved UX**: Use a "Pulse" or subtle expansion animation on hover for *desktop enrichment*, but ensure the base state is usable for touch.



### 91. React.memo Custom Comparison Pitfalls (April 2026)

- **Problem**: A component (`Card.tsx`) refused to show a new button even when the parent passed `showCartButton={true}`.

- **Causa RaÃƒÆ’Ã‚Â­z**: The `React.memo` second argument (comparison function) was manually listing props to watch (`card_id`, `price`, etc.) but was **omitting** `showCartButton`. React saw the props changed, but the manual check said "nothing important changed", blocking the re-render.

- **LecciÃƒÆ’Ã‚Â³n**: Avoid manual prop comparison in `React.memo` unless strictly necessary for performance. If used, it MUST include every prop that affects the visual output. When in doubt, let React's default shallow comparison handle it.



### 92. Implicit 'any' in Production Builds (April 2026)



- **Problema**: El servidor de desarrollo (`npm run dev`) funcionaba perfectamente, pero la compilaciÃƒÆ’Ã‚Â³n de producciÃƒÆ’Ã‚Â³n (`npm run build`) fallaba con `error TS7006: Parameter 'm' implicitly has an 'any' type`.

- **Causa**: La configuraciÃƒÆ’Ã‚Â³n de TypeScript en modo estricto para producciÃƒÆ’Ã‚Â³n prohÃƒÆ’Ã‚Â­be el uso de `any` implÃƒÆ’Ã‚Â­cito en parÃƒÆ’Ã‚Â¡metros de funciones (especialmente en `.map()`, `.filter()`).

- **LecciÃƒÆ’Ã‚Â³n**: Nunca omitir el tipado en funciones de transformaciÃƒÆ’Ã‚Â³n de datos en `utils/api.ts`. Un simple `(m: any)` permite que el build pase y asegura que el despliegue no se bloquee.



### 93. OptimizaciÃƒÆ’Ã‚Â³n de Rendimiento en Carrito de Invitados (Abril 2026)



- **Problema**: Usuarios no logueados experimentaban un retraso de varios segundos al editar el carrito.

- **Causa**: La funciÃƒÆ’Ã‚Â³n `fetchCart` realizaba peticiones secuenciales (individuales) a Supabase por cada ÃƒÆ’Ã‚Â­tem. Un carrito de 15 ÃƒÆ’Ã‚Â­tems disparaba ~30-45 queries.

- **SoluciÃƒÆ’Ã‚Â³n**: **Batch Fetching**. Agrupar todos los IDs de impresiÃƒÆ’Ã‚Â³n, realizar una ÃƒÆ’Ã‚Âºnica consulta `.in()` para metadatos y una ÃƒÆ’Ã‚Âºnica llamada RPC para stock/precios vivos. Esto reduce la complejidad de $O(N)$ a $O(1)$ viajes de red.

- **Mapeo de Datos**: Al usar batch fetching, es crÃƒÆ’Ã‚Â­tico asegurar que el objeto retornado mantenga la estructura esperada por los componentes (nested `products` object). Se debe corregir el mapeo en `CartContext` para soportar tanto datos planos como anidados.



### 94. Schema Discrepancies en CI/CD y Error 42P10 (Abril 2026)



- **Problema**: El script de importaciÃƒÆ’Ã‚Â³n de Supabase fallaba en GitHub Actions con el error `postgrest.exceptions.APIError: {'code': '42P10', 'message': 'there is no unique or exclusion constraint matching the ON CONFLICT specification'}`.

- **Causa**: El script intentaba un `upsert` usando `on_conflict='game_id,set_code'`. El entorno local de desarrollo sÃƒÆ’Ã‚Â­ poseÃƒÆ’Ã‚Â­a esa restricciÃƒÆ’Ã‚Â³n explÃƒÆ’Ã‚Â­cita de clave compuesta, pero la base de datos remota de producciÃƒÆ’Ã‚Â³n solo tenÃƒÆ’Ã‚Â­a implementado un `UNIQUE(set_code)`. PostgREST arrojaba excepciÃƒÆ’Ã‚Â³n de esquema inmediatamente al no hallar correspondencia exacta a las columnas especificadas.

- **SoluciÃƒÆ’Ã‚Â³n**: ProgramaciÃƒÆ’Ã‚Â³n defensiva en scripts de BD multi-entorno utilizando fallbacks dinÃƒÆ’Ã‚Â¡micos (Ej: atrapar especÃƒÆ’Ã‚Â­ficamente el cÃƒÆ’Ã‚Â³digo `'42P10'` en el bloque de excepciones y re-ejecutar el `upsert` haciendo un "Fallback" a `on_conflict='set_code'`).

### 95. Gatillos de SincronizaciÃƒÆ’Ã‚Â³n y Visibilidad de Inventario (Abril 2026)



- **Problema**: Nuevas ediciones importadas exitosamente (ej: Strixhaven) no eran visibles en el inventario a pesar de tener stock y pertenecer al juego correcto (`MTG`).

- **Causa RaÃƒÆ’Ã‚Â­z**:

  1. El frontend requiere `type_line` y `colors` para renderizar las cartas; si son nulos, la carta se omite.

  2. La funciÃƒÆ’Ã‚Â³n de base de datos `sync_product_metadata` (gatillo en `products`) omitÃƒÆ’Ã‚Â­a estos campos en su clÃƒÆ’Ã‚Â¡usula `SELECT INTO`, por lo que nunca se poblaban automÃƒÆ’Ã‚Â¡ticamente desde el catÃƒÆ’Ã‚Â¡logo.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - Actualizar el trigger de PostgreSQL para incluir `type_line`, `colors` y `release_date` (usando `COALESCE` para preservar datos manuales si existen).

  - Forzar una sincronizaciÃƒÆ’Ã‚Â³n masiva ("Touch" update) de los productos afectados.

- **Regla Derivada**: Todo gatillo de sincronizaciÃƒÆ’Ã‚Â³n denormalizada entre el catÃƒÆ’Ã‚Â¡logo maestro y el inventario DEBE incluir la totalidad de los campos crÃƒÆ’Ã‚Â­ticos para la UI del frontend.



### 96. CardKingdom SKU-Based Mapping (April 2026)



- **Problema**: La sincronizaciÃƒÆ’Ã‚Â³n de precios para Strixhaven fallaba o se contaminaba con ediciones antiguas debido a que el campo `variation` de CK estaba vacÃƒÆ’Ã‚Â­o para sets modernos.

- **Causa RaÃƒÆ’Ã‚Â­z**: El catÃƒÆ’Ã‚Â¡logo de CardKingdom para sets modernos (Strixhaven, Tokens, etc.) incrusta el nÃƒÆ’Ã‚Âºmero de coleccionista y el acabado directamente en el SKU (`[F]SET-NNNN`), no en los campos de metadatos tradicionales.

- **LecciÃƒÆ’Ã‚Â³n**:

  - **Foil Detection**: El prefijo `F` en el SKU es la fuente ÃƒÆ’Ã‚Âºnica de verdad para detectar versiones Foil.

  - **Collector mapping**: Extraer el nÃƒÆ’Ã‚Âºmero del SKU sustrayendo ceros a la izquierda.

  - **Prioridad de EdiciÃƒÆ’Ã‚Â³n**: Al mapear por cÃƒÆ’Ã‚Â³digo de set (ej: `soa`), priorizar manualmente ediciones primarias ("Secrets of Strixhaven") sobre aliases o sub-sets para evitar oscilaciones de precios.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 7.



### 97. High-Performance Batch SQL Updates (April 2026)



- **Problema**: Actualizar >25,000 precios mediante `executemany` (mÃƒÆ’Ã‚Âºltiples `UPDATE` individuales) sobre un pooler (puerto 6543) excedÃƒÆ’Ã‚Â­a los 90 minutos de ejecuciÃƒÆ’Ã‚Â³n.

- **Causa RaÃƒÆ’Ã‚Â­z**: Latencia de red acumulada y round-trip por cada fila, sumado al overhead del gestor de conexiones por cada transacciÃƒÆ’Ã‚Â³n individual.

- **SoluciÃƒÆ’Ã‚Â³n**: **VALUES Table Pattern**. Agrupar los cambios en chunks (ej: 2,000 filas) y ejecutar un solo `UPDATE target_table SET col = v.new_val FROM (VALUES (...), (...)) AS v(id, new_val) WHERE target_table.id = v.id`.

- **Resultado**: El tiempo de ejecuciÃƒÆ’Ã‚Â³n bajÃƒÆ’Ã‚Â³ de >90 minutos a **63 segundos** para 47,000 actualizaciones.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 18.



### 98. RPC Overload and Frontend Consistency (April 2026)



- **Problema**: El checkout fallaba en producciÃƒÆ’Ã‚Â³n con el error "Function not found" a pesar de existir localmente y en el dashboard.

- **Causa RaÃƒÆ’Ã‚Â­z**: Un script de limpieza de sobrecargas (`drop_order_overloads.py`) eliminÃƒÆ’Ã‚Â³ la versiÃƒÆ’Ã‚Â³n exacta que el frontend llamaba (con `p_cart_id`). PostgREST no hace fallback automÃƒÆ’Ã‚Â¡tico si la firma es ambigÃƒÆ’Ã‚Â¼a o falta un parÃƒÆ’Ã‚Â¡metro requerido.

- **LecciÃƒÆ’Ã‚Â³n**:

    - **ProtecciÃƒÆ’Ã‚Â³n de Firmas**: Nunca eliminar sobrecargas de funciones crÃƒÆ’Ã‚Â­ticas sin verificar la versiÃƒÆ’Ã‚Â³n exacta que el frontend (especialmente en producciÃƒÆ’Ã‚Â³n) estÃƒÆ’Ã‚Â¡ llamando.

    - **Resilient RPC Pattern**: Restaurar funciones con `DEFAULT NULL` en parÃƒÆ’Ã‚Â¡metros nuevos para mantener compatibilidad con callers antiguos (Edge Functions) y nuevos (Frontend).

- **Regla Derivada**: Toda actualizaciÃƒÆ’Ã‚Â³n de firma de RPC en producciÃƒÆ’Ã‚Â³n debe ser retrocompatible o desplegarse simultÃƒÆ’Ã‚Â¡neamente con el frontend.



### 145. Polymorphic Order Integrity (Accessories) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-23

- **Problema**: Los pedidos mixtos (cartas + accesorios) fallaban en el checkout porque el sistema solo esperaba `product_id`.

- **Causa RaÃƒÆ’Ã‚Â­z**: La tabla `order_items` usa claves forÃƒÆ’Ã‚Â¡neas separadas y mutuamente excluyentes para accesorios y productos. El frontend enviaba IDs en campos inconsistentes dependiendo del origen (carrito de invitados vs logueados).

- **SoluciÃƒÆ’Ã‚Â³n**: Refactorizar el RPC `create_order_atomic` para manejar `product_id` y `accessory_id` de forma polimÃƒÆ’Ã‚Â³rfica con recuperaciÃƒÆ’Ã‚Â³n de ID defensiva.

- **Regla Derivada**: Todo ÃƒÆ’Ã‚Â­tem de orden debe pasar por un mapeador de IDs en el frontend antes de enviarse al RPC, asegurando que se identifique correctamente si es un producto base o un accesorio.



### 146. Guest Tracking RLS & 406 Errors ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-23

- **Problema**: El rastreo de pedidos para invitados devolvÃƒÆ’Ã‚Â­a "0 rows" o `406 Not Acceptable`.

- **Causa RaÃƒÆ’Ã‚Â­z**: RLS habilitado sin polÃƒÆ’Ã‚Â­ticas que permitieran al rol `anon` leer pedidos por ID. PostgREST devuelve 406 si el usuario no tiene permisos de `SELECT` sobre las columnas solicitadas.

- **SoluciÃƒÆ’Ã‚Â³n**: Conceder `GRANT SELECT` a `anon` y `authenticated` en `orders` y `order_items`, y crear una polÃƒÆ’Ã‚Â­tica pÃƒÆ’Ã‚Âºblica `FOR SELECT USING (true)` (el acceso se limita de facto por el conocimiento del UUID de la orden).

- **Regla Derivada**: El flujo de "Guest Checkout" requiere que las tablas de ÃƒÆ’Ã‚Â³rdenes sean legibles por el rol `anon` mediante polÃƒÆ’Ã‚Â­ticas de RLS que permitan el acceso por ID.



### 147. PostgREST Schema Cache Latency ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: Tras ejecutar migraciones SQL (especialmente `DROP` y `CREATE OR REPLACE FUNCTION`), el frontend sigue recibiendo errores 404 o firmas de funciÃƒÆ’Ã‚Â³n antiguas.

- **Causa RaÃƒÆ’Ã‚Â­z**: La capa API de Supabase (PostgREST) mantiene un cachÃƒÆ’Ã‚Â© del esquema que no siempre se invalida instantÃƒÆ’Ã‚Â¡neamente ante cambios DDL directos vÃƒÆ’Ã‚Â­a SQL Editor.

- **LecciÃƒÆ’Ã‚Â³n**: Al realizar cambios crÃƒÆ’Ã‚Â­ticos en funciones RPC que el frontend consume, es una buena prÃƒÆ’Ã‚Â¡ctica ejecutar `NOTIFY pgrst, 'reload schema';` o realizar un cambio menor en el esquema (como un comentario `COMMENT ON FUNCTION ...`) para forzar la invalidaciÃƒÆ’Ã‚Â³n del cachÃƒÆ’Ã‚Â©.



### 148. Inclusive Filtering for Generic Accessories ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: Los accesorios "GenÃƒÆ’Ã‚Â©ricos" (como fundas, cajas o dados) desaparecÃƒÆ’Ã‚Â­an de la tienda cuando el usuario seleccionaba un juego especÃƒÆ’Ã‚Â­fico (MTG, PKM), a pesar de ser compatibles con todos.

- **Causa RaÃƒÆ’Ã‚Â­z**: El filtro SQL `a.game_id = p_game_id` excluÃƒÆ’Ã‚Â­a filas donde `game_id` es NULL (productos genÃƒÆ’Ã‚Â©ricos).

- **SoluciÃƒÆ’Ã‚Â³n**: Implementar una lÃƒÆ’Ã‚Â³gica de filtrado inclusiva: `WHERE (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL)`. Esto asegura que los productos especÃƒÆ’Ã‚Â­ficos del juego Y los genÃƒÆ’Ã‚Â©ricos aparezcan siempre.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 9. Los productos sin ID de juego se consideran universales y deben aparecer en todos los contextos de filtrado de juego.



### 149. Admin UI Alignment & State Sync ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: DesalineaciÃƒÆ’Ã‚Â³n visual en tablas administrativas tras aÃƒÆ’Ã‚Â±adir nuevas columnas (`is_active`, `game_id`), causando que los datos no coincidan con sus encabezados.

- **LecciÃƒÆ’Ã‚Â³n**: Al expandir tablas complejas en React, evitar el uso de ÃƒÆ’Ã‚Â­ndices de array para renderizar columnas. Usar un mapeo explÃƒÆ’Ã‚Â­cito de celdas por nombre de propiedad y asegurar que el nÃƒÆ’Ã‚Âºmero de etiquetas `<th/>` sea idÃƒÆ’Ã‚Â©ntico al de `<td/>` en cada fila para evitar "drift" visual.



### 150. Dynamic Game Mapping in Bulk Imports ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: Los scripts de importaciÃƒÆ’Ã‚Â³n masiva fallaban con errores de llave forÃƒÆ’Ã‚Â¡nea (`accessories_game_id_fkey`) al intentar insertar IDs de juegos que no existÃƒÆ’Ã‚Â­an en el entorno de destino (ej: ID 6 para Digimon).

- **SoluciÃƒÆ’Ã‚Â³n**: No usar IDs hardcodeados en scripts de importaciÃƒÆ’Ã‚Â³n. Usar subconsultas dinÃƒÆ’Ã‚Â¡micas: `(SELECT game_id FROM games WHERE game_name ILIKE '...' LIMIT 1)`.

- **Regla Derivada**: Todo script de utilidad de carga masiva debe resolver IDs de tablas de referencia dinÃƒÆ’Ã‚Â¡micamente mediante el nombre o cÃƒÆ’Ã‚Â³digo de la entidad.



### 151. Defensive Optional Chaining for Polymorphic Data ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: El componente `CardModal` y `CardDetail` crasheaban con `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` al abrir accesorios en el catÃƒÆ’Ã‚Â¡logo.

- **Causa RaÃƒÆ’Ã‚Â­z**: El campo `set_code` no existe para accesorios. El componente asumÃƒÆ’Ã‚Â­a que todos los productos son cartas TCG y llamaba `.toUpperCase()` directamente sin verificar null/undefined.

- **SoluciÃƒÆ’Ã‚Â³n**: Usar optional chaining en todos los `string.toUpperCase()` sobre datos de API: `set_code?.toUpperCase()`. Enriquecer la respuesta de `fetchCardDetails` para accesorios con campos placeholder (`set_code: category`, `collector_number: 'ACC'`).

- **Regla Derivada**: **Nunca** llamar mÃƒÆ’Ã‚Â©todos de string directamente sobre propiedades de datos de API. Siempre usar `?.` o validar con un guard antes. Aplica especialmente cuando la misma vista renderiza tipos de datos polimÃƒÆ’Ã‚Â³rficos (cartas, accesorios).



### 152. Polymorphic UI: Separate Layouts for Different Product Types ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: El `CardModal`, diseÃƒÆ’Ã‚Â±ado para cartas TCG, mostraba informaciÃƒÆ’Ã‚Â³n irrelevante (FOIL/NONFOIL toggle, "EDICIÃƒÆ’Ã¢â‚¬Å“N / IMPRESIONES", legalidad de formatos, CardKingdom link) cuando se abrÃƒÆ’Ã‚Â­a un accesorio como una caja de Gundam o snacks.

- **Causa RaÃƒÆ’Ã‚Â­z**: Reutilizar el mismo layout de carta para todos los tipos de productos es un anti-patrÃƒÆ’Ã‚Â³n cuando las entidades tienen caracterÃƒÆ’Ã‚Â­sticas fundamentalmente diferentes.

- **SoluciÃƒÆ’Ã‚Â³n**: Condicionar el layout completo con `details?.is_accessory`. Cuando es `true`, renderizar un layout alternativo limpio: imagen centrada, nombre, categorÃƒÆ’Ã‚Â­a, badge de stock prominente, precio simple ("Precio"), y CTA de carrito. Cuando es `false`, usar el layout original de carta con todas sus secciones.

- **Regla Derivada**: En plataformas de e-commerce polimÃƒÆ’Ã‚Â³rficas (cartas + accesorios), el modal/detalle debe detectar el tipo de producto y renderizar el layout apropiado. No intentar ocultar secciones con condicionales dispersos; mejor separar los branches de rendering completos.



### 153. JSX Fragment Nesting in Ternary Conditionals ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: Al refactorizar un componente grande (CardModal) para agregar un branch ternario complejo, mÃƒÆ’Ã‚Âºltiples errores de TypeScript surgieron: "JSX element has no corresponding closing tag", "Expected closing tag for JSX fragment".

- **Causa RaÃƒÆ’Ã‚Â­z**: Al dividir el rendering existente en dos branches de un ternario (accesorio vs carta), es fÃƒÆ’Ã‚Â¡cil perder el `<>` de apertura del fragment en el branch `else`, y los `</div>` de cierre previos al fragment quedan "huÃƒÆ’Ã‚Â©rfanos".

- **SoluciÃƒÆ’Ã‚Â³n**:

  1. Usar `tsc --noEmit` para verificar JSX antes de `npm run build`.

  2. Al agregar un ternario que envuelve mÃƒÆ’Ã‚Âºltiples elementos, aÃƒÆ’Ã‚Â±adir explÃƒÆ’Ã‚Â­citamente `<>` y `</>` para el branch que lo necesita.

  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir lÃƒÆ’Ã‚Â­neas separadas).

- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ lÃƒÆ’Ã‚Â­neas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.



  2. Al agregar un ternario que envuelve mÃƒÂºltiples elementos, aÃƒÂ±adir explÃƒÂ­citamente `<>` y `</>` para el branch que lo necesita.

  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir lÃƒÂ­neas separadas).

- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ lÃƒÂ­neas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.



### 154. CartContext Flattening vs CartDrawer Nested Fields Ã¢â‚¬â€� 2026-04-24

- **Problema**: Los ÃƒÂ­tems del carrito mostraban `$0.00` individualmente en `CartDrawer`, aunque el SUBTOTAL total era correcto.

- **Causa RaÃƒÂ­z**: `CartContext.refreshCart()` aplana los datos del RPC `get_user_cart` en campos de primer nivel (`item.price`, `item.name`, `item.image_url`, `item.set_code`). Sin embargo, `CartDrawer` leÃƒÂ­a la estructura anidada antigua (`item.products?.price`), que no existe en el state aplanado Ã¢â‚¬â€� resultando en `undefined Ã¢â€ â€™ $0.00`.

- **Por quÃƒÂ© el SUBTOTAL funcionaba**: La lÃƒÂ³gica del subtotal ya tenÃƒÂ­a el fallback correcto `(item.products?.price || item.price || 0)`, pero la lÃƒÂ­nea de display por ÃƒÂ­tem no.

- **SoluciÃƒÂ³n**: Actualizar `CartDrawer` para leer los campos planos primero con el nested como fallback: `item.price || item.products?.price || 0`. Aplicar el mismo patrÃƒÂ³n a `name`, `image_url`, `set_code` e `is_foil`.

- **Regla Derivada**: Cuando `CartContext` cambia la forma del state (de nested a flat), TODOS los consumidores (`CartDrawer`, `CheckoutPage`, etc.) deben actualizarse simultÃƒÂ¡neamente. El patrÃƒÂ³n seguro es siempre usar `item.price || item.products?.price` para soportar ambas formas durante transiciones.



### 101. Rigor de TypeScript en CI/CD (Variables no usadas) Ã¢â‚¬â€� 2026-04-25

- **Problema:** El build fallÃƒÂ³ mÃƒÂºltiples veces en el servidor de despliegue debido a variables declaradas pero no usadas (`TS6133`).

- **Causa RaÃƒÂ­z:** El entorno local (VS Code/Dev) era mÃƒÂ¡s permisivo que el pipeline de producciÃƒÂ³n/dev del servidor.

- **SoluciÃƒÂ³n:** Limpieza quirÃƒÂºrgica de imports y variables no usadas. No asumir que si "funciona en local" pasarÃƒÂ¡ el build del servidor.

- **Regla Derivada:** Realizar un `npm run build` local antes de cada push para detectar errores de tipado estricto.



### 102. SincronizaciÃƒÂ³n URL-Estado para NavegaciÃƒÂ³n Reactiva Ã¢â‚¬â€� 2026-04-25

- **Problema:** El menÃƒÂº cambiaba la URL pero el catÃƒÂ¡logo no se actualizaba ni cambiaba de pestaÃƒÂ±a.

- **Causa RaÃƒÂ­z:** El componente principal (`Home.tsx`) solo leÃƒÂ­a los `searchParams` en el montaje inicial.

- **SoluciÃƒÂ³n:** Implementar un `useEffect` que escuche `searchParams` y sincronice el estado local (`activeTab`, `filters`).

- **Regla Derivada:** Cualquier navegaciÃƒÂ³n basada en URL en una SPA requiere sincronizaciÃƒÂ³n reactiva del estado interno para disparar nuevos fetches de datos.



### 103. ResoluciÃƒÂ³n de AmbigÃƒÂ¼edad en PostgREST (PGRST203) Ã¢â‚¬â€� 2026-04-26

- **Problema:** La API de Supabase fallaba al llamar a una funciÃƒÂ³n RPC con error de mÃƒÂºltiples candidatos.

- **Causa RaÃƒÂ­z:** Redefinir funciones sin borrar versiones anteriores con firmas similares crea sobrecarga ambigua.

- **SoluciÃƒÂ³n:** Limpieza profunda usando un bloque PL/pgSQL que recorre los OIDs de las funciones duplicadas.

- **Regla Derivada:** Siempre incluir DROP FUNCTION IF EXISTS con la firma exacta antes de recrear RPCs.



### 104. AuditorÃƒÂ­a de Datos de Referencia (Lookups) Ã¢â‚¬â€� 2026-04-26

- **SoluciÃƒÂ³n**: UnificaciÃƒÂ³n de registros, actualizaciÃƒÂ³n de llaves forÃƒÂ¡neas y estandarizaciÃƒÂ³n de cÃƒÂ³digos.

- **Regla Derivada**: Antes de expandir un catÃƒÂ¡logo maestro, auditar la tabla actual para mapear IDs existentes.



### 148. EstabilizaciÃƒÂ³n de Precios Reales y Omni-Sync (Mayo 2026)

- **Problema**: Desajustes de precios "congelados" en producciÃƒÂ³n (ej: $16.99 vs $14.99) y fallas persistentes en los pipelines de GitHub Actions.

- **Causa RaÃƒÂ­z**: 

- **SoluciÃƒÂ³n:** Centralizar objetos de mapeo (gameMap, gameMapInv) a nivel global en el componente.

- **Regla Derivada:** Nunca usar Strings mÃƒÂ¡gicos para mapeos de negocio; centralizar en constantes unificadas.



### 106. Strict Filtering for Polymorphic Catalogs (MTG vs. Generic) - 2026-04-27

- **Causa RaÃƒÂ­z:** La funciÃƒÂ³n de base de datos (get_accessories_filtered) usaba una condiciÃƒÂ³n 'loose': AND (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL). Esto forzaba la inclusiÃƒÂ³n de genÃƒÂ©ricos en cada filtro de juego.

- **SoluciÃƒÂ³n:** Implementar filtrado estricto en el RPC eliminando la condiciÃƒÂ³n OR a.game_id IS NULL cuando se provee un p_game_id. Adicionalmente, ajustar el frontend para que el botÃƒÂ³n general de 'Productos' no fuerce un juego por defecto (cambiando el fallback de ['Magic: The Gathering'] a []), permitiendo ver el catÃƒÂ¡logo completo solo cuando se desea.

- **Regla Derivada:** En catÃƒÂ¡logos con productos especÃƒÂ­ficos de nicho y productos genÃƒÂ©ricos, el filtro de juego debe ser estricto para evitar ruido visual ('contaminaciÃƒÂ³n de resultados'). Los productos genÃƒÂ©ricos deben ser accesibles solo en la vista global sin filtros.



### 107. Standardizing Multi-TCG Codes (Database vs. Frontend) - 2026-04-27

- **SoluciÃƒÆ’Ã‚Â³n:** Modificar la consulta SQL dentro del RPC `get_products_filtered` para asegurar que las comparaciones sean case-insensitive, utilizando funciones como `UPPER()` (ej. `UPPER(p.set_code) = ANY(set_filter)`) y permitiendo mapeos tanto de cÃƒÆ’Ã‚Â³digo de set como de nombre (ej. `p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter)`). AdemÃƒÆ’Ã‚Â¡s, se estandarizÃƒÆ’Ã‚Â³ la resoluciÃƒÆ’Ã‚Â³n del ID de juego internamente.

- **Regla Derivada:** LEYES_DEL_SISTEMA.md > Toda consulta de filtrado de texto o cÃƒÆ’Ã‚Â³digos provenientes de URLs o interfaces debe ser explÃƒÆ’Ã‚Â­citamente sanitizada y convertida a case-insensitive (`UPPER`, `LOWER` o `ILIKE`) en las funciones de base de datos antes de evaluar un `MATCH`.



### 108. Alignment of Cross-Project Environments (Dev vs. Prod) - 2026-04-28

- **Problema**: Falla total en la carga de Pokemon en el entorno dev a pesar de que el codigo parecia correcto.

- **Causa Raiz**: El entorno de desarrollo (Sandbox: bqfkqnnostzaqueujdms) tenia una tabla de juegos con IDs y codigos diferentes (PKM en lugar de POKEMON, ID 10 en lugar de 23). Ademas, la base de datos estaba vacia para ese juego.

- **Solucion**: Alinear el frontend y los scripts de poblacion con los estandares del Sandbox (PKM, ID 10) y actualizar los RPCs para normalizar multiples variantes a un unico codigo estandar.

- **Regla Derivada**: Antes de diagnosticar logica de frontend, verificar la existencia y estructura de datos en el proyecto Supabase especifico mediante la API o scripts de diagnostico.

### 97. EstabilizaciÃƒÂ³n de Sidebar DinÃƒÂ¡mico y Anidamiento JSX (Mayo 2026)

- **Problema**: El despliegue de producciÃƒÂ³n fallaba con errores de sintaxis tras aÃƒÂ±adir un sidebar dinÃƒÂ¡mico, a pesar de que el cÃƒÂ³digo parecÃƒÂ­a correcto.

### 149. RemediaciÃƒÂ³n Masiva de Secretos Hardcodeados (Mayo 2026)

- **Problema**: Fuga crÃƒÂ­tica de credenciales de PostgreSQL en `.env.dev` y proliferaciÃƒÂ³n de contraseÃƒÂ±as hardcodeadas en mÃƒÂ¡s de 60 scripts auxiliares del proyecto, detectado por GitGuardian.

- **Causa RaÃƒÂ­z**: PrÃƒÂ¡ctica heredada de hardcodear URLs de conexiÃƒÂ³n con credenciales incluidas para agilizar la ejecuciÃƒÂ³n de scripts locales y de mantenimiento.

- **SoluciÃƒÂ³n**: 

  - **Limpieza Automatizada**: CreaciÃƒÂ³n de un script de remediaciÃƒÂ³n masiva (`cleanup_secrets.py`) que utiliza regex para reemplazar URLs y contraseÃƒÂ±as por llamadas a `os.getenv()`.

  - **Ignorado Estricto**: ActualizaciÃƒÂ³n de `.gitignore` en todas las ramas (`dev`, `main`) para incluir `.env.dev` y otros archivos de entorno.

  - **RotaciÃƒÂ³n de Credenciales**: ParametrizaciÃƒÂ³n de los scripts para que dependan de `DATABASE_URL_PROD` y `DATABASE_URL_DEV`, permitiendo rotar las claves en Supabase sin romper el flujo de trabajo.

- **Regla Derivada**: **PROHIBIDO** hardcodear cualquier URL de conexiÃƒÂ³n que incluya el esquema `postgresql://`. Toda conexiÃƒÂ³n debe pasar por `os.getenv` o un gestor de secretos. Ver `LEYES_DEL_SISTEMA.md` > Ley de Seguridad 22.



### 150. RedefiniciÃƒÂ³n Local de Interfaces en Componentes Grandes (Mayo 2026)

- **Problema**: Errores de build `TS2339` persistentes tras actualizar interfaces globales en `api.ts`.

- **Causa RaÃƒÂ­z**: Componentes grandes como `CardModal.tsx` redefinen interfaces crÃƒÂ­ticas (`CardDetails`, `Version`) localmente en lugar de importarlas desde la fuente de verdad. Esto genera inconsistencias cuando se aÃƒÂ±aden campos al modelo de datos.

- **LecciÃƒÂ³n**: **Unicidad de Tipos**. Evitar redefinir interfaces de datos del dominio dentro de los componentes. Si un componente necesita una interfaz, debe importarla desde `api.ts`. Si se aÃƒÂ±ade un campo a la API, se debe buscar todas las redefiniciones locales (Grep) para asegurar la paridad. Ver `LEYES_DEL_SISTEMA.md` > Ley 21.



### 151. Null-Safe Price Handling in Inventory Rendering Ã¢â‚¬â€� 2026-05-05

- **Problema**: El panel administrativo de inventario crasheaba con `TypeError: Cannot read properties of null (reading 'toFixed')` al ordenar la tabla de mayor a menor.

- **Causa RaÃƒÂ­z**: Algunos artÃƒÂ­culos (especialmente los reciÃƒÂ©n importados o "on-demand") tienen un valor de `price` nulo en la base de datos. Al ordenar, estos nulos suben al principio de la lista, y la lÃƒÂ³gica de la UI intentaba llamar a `.toFixed(2)` sobre ellos.

- **SoluciÃƒÂ³n**: Implementar una polÃƒÂ­tica de "Null-Safe Formatting" en el frontend: `(item.price || 0).toFixed(2)`. Asegurar que los cÃƒÂ¡lculos de descuento tambiÃƒÂ©n contemplen fallbacks a cero para evitar resultados `NaN`.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 20 (Integridad Visual de Ofertas). Todo renderizado de precios en el Admin debe usar el patrÃƒÂ³n de fallback `(val || 0)` antes de formatear.



### 152. RPC Overloading & Function Signature Sync Ã¢â‚¬â€� 2026-05-05

- **Problema**: Error `PGRST203` (mÃƒÂºltiples candidatos encontrados) al intentar cargar productos en el Marketplace tras aÃƒÂ±adir el parÃƒÂ¡metro `p_only_new`.

- **Causa RaÃƒÂ­z**: Supabase (PostgreSQL) permite la sobrecarga de funciones con el mismo nombre pero diferentes argumentos. `CREATE OR REPLACE FUNCTION` no elimina versiones antiguas con firmas distintas; PostgREST no puede decidir cuÃƒÂ¡l llamar si hay ambigÃƒÂ¼edad.

- **SoluciÃƒÂ³n**: Implementar una migraciÃƒÂ³n de "limpieza dinÃƒÂ¡mica" que use `pg_proc` para identificar y ejecutar `DROP FUNCTION ... CASCADE` sobre todas las versiones sobrecargadas antes de recrear la versiÃƒÂ³n canÃƒÂ³nica ÃƒÂºnica.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 23 (SincronizaciÃƒÂ³n de RPC). Toda modificaciÃƒÂ³n de parÃƒÂ¡metros en un RPC existente debe ir precedida de un borrado total de sobrecargas para evitar conflictos `PGRST203`.



### 153. Resilient Bulk Updates & Pooler Stability Ã¢â‚¬â€� 2026-05-05

- **Problema**: Las actualizaciones masivas de precios en `card_printings` y `products` (200k+ filas) fallaban por `statement_timeout` o pÃƒÂ©rdida de sincronizaciÃƒÂ³n al usar el Supabase Pooler (Puerto 6543).

- **Causa RaÃƒÂ­z**: El pooler de transacciones interrumpe conexiones de larga duraciÃƒÂ³n. Los joins masivos durante un `UPDATE FROM` superan los lÃƒÂ­mites de tiempo estÃƒÂ¡ndar de PostgreSQL en la nube.

- **SoluciÃƒÂ³n**:

  - **PatrÃƒÂ³n de Materialized View Temporal**: Crear una vista materializada de los precios actualizados, indexarla por `printing_id`, y realizar el `UPDATE` mediante un join simple contra la vista. Esto reduce el tiempo de ejecuciÃƒÂ³n de minutos a segundos.

  - **Batching de ID**: Procesar los cambios en lotes de IDs (ej: 1,000 cartas) con `SET statement_timeout = 0`.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 18 (Performance en Sincronizaciones Masivas).



### 154. Environment Isolation & Secret Injection in CI/CD Ã¢â‚¬â€� 2026-05-05

- **Problema**: Los precios en producciÃƒÂ³n se desincronizaban porque el flujo automatizado `omni-sync.yml` no recibÃƒÂ­a la `DATABASE_URL` de producciÃƒÂ³n, usando por defecto el entorno de desarrollo o fallando silenciosamente.

- **Causa RaÃƒÂ­z**: Falta de inyecciÃƒÂ³n explÃƒÂ­cita de secretos en el YAML de GitHub Actions y dependencia de variables genÃƒÂ©ricas en `common/db.py`.

- **SoluciÃƒÂ³n**:

  - **InyecciÃƒÂ³n de Secretos**: Mapear explÃƒÂ­citamente `DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}` en el workflow.

  - **Carga Prioritaria**: Refactorizar `db.py` para priorizar variables especÃƒÂ­ficas del entorno (PROD/DEV) al detectar el contexto de ejecuciÃƒÂ³n.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 19 (ProtecciÃƒÂ³n de Entornos).



### 103. Clipping en Animaciones de Escala â€” 2026-05-05

- **Problema:** Los iconos del selector TCG se cortaban por la parte superior al activarse o pasar el cursor.

- **Causa RaÃ­z:** El contenedor tenÃ­a overflow-hidden y no contaba con suficiente padding-top para absorber el scale-110 combinado con translate-y-2.

- **SoluciÃ³n:** Eliminar overflow-hidden y aumentar el padding vertical (pt-14 / md:pt-20).

- **Regla Derivada:** Ley de " RespiraciÃ³n Visual para Animaciones\ codificada en LEYES_DEL_SISTEMA.md.



### 104. Referencias de Iconos Lucide â€” 2026-05-05

- **Problema:** Fallo en el build de producciÃ³n por ChevronDown no definido.

- **Causa RaÃ­z:** ImportaciÃ³n incompleta tras refactorizar un selector.

- **SoluciÃ³n:** VerificaciÃ³n de imports post-ediciÃ³n y ejecuciÃ³n de npm run build local antes de push.



### 105. EstandarizaciÃ³n de Logos TCG â€” 2026-05-05

- **Problema:** Uso de emojis inconsistente para representar los juegos en diferentes partes de la app.

- **Causa RaÃ­z:** Falta de una biblioteca de assets estandarizada.

- **SoluciÃ³n:** CreaciÃ³n de frontend/public/logos/tcg/ con variantes color y black.

- **Regla Derivada:** Ley de \Identidad de Marca TCG\ en LEYES_DEL_SISTEMA.md.



### 155. Soporte Multi-Imagen y Carruseles Premium (Mayo 2026)

- **Problema**: Los productos (accesorios) estaban limitados a una sola imagen, lo que dificultaba mostrar diferentes Ã¡ngulos o detalles.

- **Causa RaÃ­z**: El esquema de base de datos (image_url) y los componentes de visualizaciÃ³n (CardModal) solo soportaban un Ãºnico string de URL.

- **SoluciÃ³n**: 

  - **AmpliaciÃ³n de Esquema**: AÃ±adir dditional_images text[] a la tabla ccessories.

  - **SincronizaciÃ³n de RPC**: Actualizar las funciones SQL (get_accessories_filtered) para incluir el nuevo array en el retorno, evitando desincronizaciÃ³n de tipos en el frontend.

  - **UX de Admin**: Implementar un sistema de selecciÃ³n de "Imagen Principal" que mantenga la compatibilidad con el campo image_url existente, permitiendo a la vez gestionar una galerÃ­a.

  - **Carousel DinÃ¡mico**: Integrar AnimatePresence de ramer-motion para transiciones suaves que eleven la percepciÃ³n de calidad ("premium feel").

- **LecciÃ³n**: Al implementar galerÃ­as, mantener siempre un campo "primary_image" independiente del array de adicionales para no penalizar el rendimiento de las vistas de lista (grids) que no necesitan cargar todo el array.



### 156. Rebranding UI y Limpieza de CÃ³digo (Mayo 2026)

- **Problema**: Al deshabilitar secciones por rebranding (Misiones), el build de producciÃ³n fallaba por errores de TypeScript (variables no usadas e imports muertos).

- **Causa RaÃ­z**: El proyecto tiene configuraciones de linting/build estrictas que no permiten cÃ³digo muerto en archivos crÃ­ticos como `Home.tsx`.

- **SoluciÃ³n**: No basta con comentar el JSX; se debe podar activamente el estado (`useState`), los efectos (`useEffect`) y los imports (`Link`, etc.) asociados para garantizar la integridad del build.

- **LecciÃ³n**: La "limpieza atÃ³mica" es obligatoria al "apagar" features en entornos de desarrollo remoto altamente automatizados.



### 157. UX Espacial: Filtros Colapsables Estilo Marketplace (Mayo 2026)

- **Problema**: El panel de filtros lateral era demasiado largo, obligando al usuario a hacer scroll infinito para encontrar filtros bÃ¡sicos como el precio o el aÃ±o.

- **SoluciÃ³n**: Implementar secciones colapsables con memoria de estado local. Las secciones con filtros activos se expanden por defecto para mantener la visibilidad del contexto actual del usuario.

- **Impacto**: ReducciÃ³n del 70% en el uso del espacio vertical inicial, mejorando drÃ¡sticamente la tasa de interacciÃ³n en dispositivos con viewports limitados.

- **Regla Derivada**: (Ley 29) Todo panel lateral con mÃ¡s de 4 categorÃ­as de filtrado DEBE ser colapsable.



### 158. Flujo de Checkout "Por Encargo" (Bypass de Stock) â€” 2026-05-07

- **Problema**: El RPC `create_order_atomic` bloqueaba pedidos si el stock era insuficiente, impidiendo la venta de Ã­tems "Por Encargo" (Regla de Negocio 4).

- **Causa RaÃ­z**: ValidaciÃ³n estricta en el backend (`RAISE EXCEPTION`) sin considerar el flag `is_on_demand`.

- **SoluciÃ³n**: RefactorizaciÃ³n del RPC para permitir stock negativo o bypass de error cuando el Ã­tem se marca como bajo demanda, y actualizaciÃ³n de la UI para mostrar badges de "POR ENCARGO" basados en `cantidad > stock`.

- **LecciÃ³n**: Las reglas de negocio de disponibilidad deben estar sincronizadas entre la validaciÃ³n de base de datos y el estado visual del carrito para evitar fricciÃ³n en el checkout.



### 159. Restricciones de ConexiÃ³n Directa a DB (Entorno Remoto) â€” 2026-05-07

- **Problema**: Fallos de conexiÃ³n (`FATAL: tenant/user not found`) al intentar ejecutar migraciones SQL remotas desde scripts de utilidad.

- **Causa RaÃ­z**: El Transaction Pooler de Supabase (puerto 6543) requiere una configuraciÃ³n de usuario/tenant muy especÃ­fica que puede fallar en entornos restringidos.

- **LecciÃ³n**: Para remediaciones crÃ­ticas en bases de datos remotas donde el acceso directo estÃ¡ limitado, es preferible preparar el archivo de migraciÃ³n en `supabase/migrations/` y delegar la ejecuciÃ³n al pipeline de CI/CD o al comando `supabase db push` si se cuenta con el token de acceso.



### 160. Escalado de UI y Densidad Visual Premium â€” 2026-05-07

- **Problema**: El landing page se sentÃ­a disperso y los iconos de navegaciÃ³n carecÃ­an de impacto visual en resoluciones altas.

- **Causa RaÃ­z**: Paddings verticales excesivos y escalas de iconos/fuentes conservadoras diseÃ±adas para mÃ³viles que no aprovechaban el espacio en escritorio.

- **SoluciÃ³n**: 

  - **ReducciÃ³n de Padding**: Ajuste de `py-12` a `py-4` en contenedores principales y eliminaciÃ³n de `bounding boxes` en carruseles para una estÃ©tica "flotante".

  - **Escalado Responsivo**: Uso de clases Tailwind dinÃ¡micas (ej. `w-11 sm:w-14`) para iconos de navegaciÃ³n y aumento de la altura del Header a `h-20`.

- **LecciÃ³n**: La percepciÃ³n de "Premium Feel" a menudo depende de la eliminaciÃ³n de marcos sÃ³lidos y la maximizaciÃ³n del tamaÃ±o de los activos de marca, manteniendo una densidad de informaciÃ³n alta pero organizada.



### 161. Visibilidad Condicional de PestaÃ±as por Contexto â€” 2026-05-07

- **Problema**: La pestaÃ±a "Stock Geekorium" aparecÃ­a en la secciÃ³n de accesorios (Artilugios), confundiendo al usuario ya que solo hay stock de cartas para MTG.

- **SoluciÃ³n**: Implementar una restricciÃ³n lÃ³gica en `Home.tsx` que evalÃºa `filters.games?.includes('MTG')` antes de renderizar la pestaÃ±a de inventario de cartas.

- **LecciÃ³n**: Menos es mÃ¡s. Ocultar opciones irrelevantes segÃºn el contexto de filtrado actual reduce la carga cognitiva y previene errores de navegaciÃ³n del usuario.



### 162. Errores de Sintaxis en Refactorizaciones Masivas â€” 2026-05-08

- **Problema**: El build fallaba con `error TS1381: Property or signature expected.` en `CartDrawer.tsx`.

- **Causa RaÃ­z**: Durante el reemplazo masivo de colores `neutral-XXX` por tokens de marca, se rompiÃ³ accidentalmente la sintaxis de un operador ternario en los controles de cantidad, dejando un cÃ³digo invÃ¡lido.

- **LecciÃ³n**: Las refactorizaciones de "Buscar y Reemplazar" en mÃºltiples archivos deben ir acompaÃ±adas de un `npm run build` local inmediato. Un error tipogrÃ¡fico pequeÃ±o en un componente central puede bloquear todo el pipeline de CI/CD.



### 163. Mezcla de Capas y Opacidad en ImÃ¡genes Foil â€” 2026-05-08

- **Problema**: Las imÃ¡genes de las cartas se veÃ­an oscuras ("opacas") en la pÃ¡gina de detalle.

- **Causa RaÃ­z**: AplicaciÃ³n directa de `mix-blend-mode: overlay` sobre la etiqueta `<img>`. Al no tener una capa base de color, el modo de mezcla oscurecÃ­a la imagen original en lugar de iluminarla. AdemÃ¡s, el efecto se aplicaba incluso a cartas no-foil.

- **SoluciÃ³n**: Mover el efecto `foil-shimmer` a una capa (div) independiente sobre la imagen con `opacity-30` y `pointer-events-none`. Condicionar la aplicaciÃ³n del efecto y de la clase `holo-effect` estrictamente al estado `isFoil`.

- **LecciÃ³n**: Nunca aplicar modos de mezcla destructivos (`overlay`, `multiply`) directamente sobre el activo visual principal si se busca un efecto de brillo. Usar siempre capas superpuestas con opacidad controlada para preservar la legibilidad del arte original.



### 164. Inconsistencia de CÃ³digos de Juego y NormalizaciÃ³n â€” 2026-05-08

- **Problema**: Los banners de PokÃ©mon no aparecÃ­an a pesar de estar guardados en la base de datos.

- **Causa RaÃ­z**: El sistema tenÃ­a duplicidad de cÃ³digos para el mismo juego (ej: `PKM` usado en el frontend vs `POKEMON` usado en la base de datos de banners). Al fallar la coincidencia exacta, el sistema no encontraba los activos.

- **SoluciÃ³n**: Implementar una capa de normalizaciÃ³n en `utils/api.ts` dentro de `fetchBanners` que mapea alias comunes (`PKM` -> `POKEMON`, `YGO` -> `YUGIOH`) antes de realizar la consulta a Supabase. AdemÃ¡s, se estandarizaron los registros existentes en la tabla `hero_banners`.

- **LecciÃ³n**: Cuando se trabaja con sistemas heredados o integraciones de terceros, siempre se debe asumir que los cÃ³digos de referencia pueden variar. Una capa de normalizaciÃ³n centralizada es vital para la integridad de los datos visuales.



### 165. Desacoplamiento de Vistas de Dashboard y Secciones de TCG â€” 2026-05-08

- **Problema**: Al intentar mostrar banners en las secciones de cada TCG, el listado de cartas (singles) era reemplazado por la vista de "Dashboard" (ofertas), arruinando la experiencia de navegaciÃ³n.

- **Causa RaÃ­z**: La variable `isDashboardView` controlaba tanto la visibilidad del banner como el tipo de contenido principal (Ofertas vs Parrilla). 

- **SoluciÃ³n**: Desacoplar las condiciones. Se introdujo `showHeroSection` para controlar la visibilidad del banner en cualquier secciÃ³n "limpia", mientras que `isDashboardView` se mantuvo restringido a la pÃ¡gina de inicio global para controlar la renderizaciÃ³n del carrusel de ofertas.

- **LecciÃ³n**: No usar un Ãºnico flag de estado para controlar mÃºltiples comportamientos de UI estructurales. Cada componente mayor (Banner, Ofertas, Parrilla) debe tener su propia lÃ³gica de visibilidad basada en el contexto del router y los filtros.



### 166. Integridad de Tablas de Metadatos y RLS â€” 2026-05-08

- **Problema**: Tablas crÃ­ticas como `conditions`, `sources` y `games` estaban expuestas sin Row Level Security (RLS) activo.

- **SoluciÃ³n**: Habilitar RLS en todas las tablas de metadatos y aplicar polÃ­ticas granulares: acceso pÃºblico de solo lectura (`SELECT`) y acceso administrativo total (`ALL`) validado mediante el rol del usuario en la tabla `profiles`.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 10 (RLS Prioritario). Ninguna tabla nueva debe crearse en el esquema `public` sin una polÃ­tica de RLS explÃ­citamente definida y verificada.



### 167. SincronizaciÃ³n de Campos de TaxonomÃ­a y Constraints NOT NULL â€” 2026-05-09

- **Problema**: El sistema crasheaba con un error de violaciÃ³n de restricciÃ³n `NOT NULL` en la columna `category` al intentar crear nuevos accesorios desde el panel administrativo.

- **Causa RaÃ­z**: La base de datos requiere obligatoriamente el campo `category` (texto) por razones de performance y legado, pero el formulario de administraciÃ³n solo estaba enviando el `category_code`. Al ser `null` el nombre de la categorÃ­a, la inserciÃ³n fallaba fatalmente.

- **SoluciÃ³n**: Implementar una derivaciÃ³n automÃ¡tica en el frontend que busca el nombre de la categorÃ­a en la lista de taxonomÃ­a (`accessory_categories`) basÃ¡ndose en el cÃ³digo seleccionado. Si no hay coincidencia, se aplica un fallback seguro ("Accesorios").

- **LecciÃ³n**: En tablas que implementan denormalizaciÃ³n (guardar cÃ³digo e ID/Nombre por separado), el frontend debe actuar como garante de la integridad, asegurando que todos los campos requeridos por restricciones de base de datos estÃ©n presentes antes de disparar el `create` o `update`. AdemÃ¡s, refactorizar interfaces estÃ¡ticas a dinÃ¡micas (basadas en DB) previene que la taxonomÃ­a del frontend se desincronice de la realidad del servidor.


### 154. Endurecimiento de RLS para Tablas Administrativas â€” 2026-05-09
- **Problema:** Error 42501 (insufficient privilege) al insertar accesorios a pesar de estar autenticado como admin en Supabase Auth.
- **Causa RaÃ­z:** Las polÃ­ticas basadas solo en `TO authenticated` son insuficientes si el motor de Supabase no puede verificar de forma atÃ³mica el rol extendido sin una polÃ­tica explÃ­cita que una `auth.uid()` con `public.profiles`.
- **SoluciÃ³n:** Implementar polÃ­ticas con `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`.
- **Regla Derivada:** Toda tabla de escritura administrativa DEBE tener esta verificaciÃ³n explÃ­cita para evitar bypasses de seguridad.

### 155. TypeScript State Type Safety in Form Resets â€” 2026-05-09
- **Problema:** El build fallÃ³ con `TS2345` al intentar resetear el formulario de accesorios tras un guardado exitoso.
- **Causa RaÃ­z:** Al aÃ±adir un campo obligatorio (`category`) al tipo del estado `formData`, cualquier llamada a `setFormData` que pase el objeto completo DEBE incluir dicha propiedad para cumplir con el contrato del tipo, incluso si se desea resetear a un valor por defecto.
- **SoluciÃ³n:** Sincronizar el objeto de reset inicial con la definiciÃ³n completa del tipo.
- **LecciÃ³n:** Al escalar estados complejos en React, usar interfaces explÃ­citas y buscar todas las llamadas de actualizaciÃ³n total del estado para evitar roturas de build silenciosas durante el desarrollo.

### 168. LocalizaciÃ³n SemÃ¡ntica de AnalÃ­ticas â€” 2026-05-10
- **Problema**: Los tÃ©rminos tÃ©cnicos como "Requests" y "Page Views" eran ambiguos para el usuario administrativo ("Â¿peticiones a quÃ©?").
- **SoluciÃ³n**: Implementar un glosario interactivo ("Â¿QuÃ© significa esto?") que traduce mÃ©tricas a lenguaje de negocio: Peticiones = Esfuerzo tÃ©cnico (fotos/datos), Vistas = Visitas reales a pÃ¡ginas.
- **LecciÃ³n**: En dashboards de mÃ©tricas, la claridad semÃ¡ntica es mÃ¡s importante que la precisiÃ³n tÃ©cnica. Siempre acompaÃ±ar nÃºmeros con explicaciones contextuales de "quÃ©" y "cuÃ¡ndo".

### 169. Limitaciones de GraphQL en Planes Cloudflare â€” 2026-05-10
- **Problema**: Errores persistentes de "Unknown field" al intentar obtener desgloses por URL o PaÃ­s.
- **Causa RaÃ­z**: Los nodos de agregaciÃ³n como `clientRequestPath` y `clientCountryName` dentro de `httpRequests1hGroups` estÃ¡n restringidos o requieren habilitaciÃ³n especÃ­fica segÃºn el plan de Cloudflare (Free/Pro/Ent).
- **SoluciÃ³n**: Adoptar un enfoque de "Estabilidad Progresiva". Ante fallos de esquema, revertir a la query mÃ­nima estable (sÃ³lo trÃ¡fico/cachÃ©) para garantizar que el dashboard nunca se rompa, priorizando la disponibilidad de datos crÃ­ticos sobre el desglose granular.
- **LecciÃ³n**: Al integrar APIs de terceros con tiers de precios, el backend debe ser defensivo y manejar esquemas opcionales para evitar que un cambio de plan bloquee el sistema.

### 170. PrevenciÃ³n de Deadlocks mediante OrdenaciÃ³n CanÃ³nica en Transacciones SQL (Mayo 2026)
- **Problema**: Errores intermitentes de "deadlock detected" y lentitud masiva en producciÃ³n durante el proceso de checkout cuando mÃºltiples clientes compraban Ã­tems coincidentes simultÃ¡neamente.
- **Causa RaÃ­z**: El RPC `create_order_atomic` iteraba sobre el JSON de Ã­tems del carrito en el orden arbitrario proporcionado por el cliente, actualizando el stock de `card_printings` o `accessories`. Cuando la TransacciÃ³n A bloqueaba el Ã­tem X y luego el Y, y la TransacciÃ³n B (simultÃ¡nea) bloqueaba el Ã­tem Y y luego el X, la base de datos abortaba una de las transacciones por interbloqueo.
- **SoluciÃ³n**: Parchar el procedimiento almacenado para reordenar internamente el array de Ã­tems mediante una consulta SQL (`ORDER BY item_type, item_id`) antes de realizar cualquier `SELECT ... FOR UPDATE` o `UPDATE` sobre el inventario.
- **LecciÃ³n**: Toda funciÃ³n o procedimiento almacenado que actualice mÃºltiples registros en lote DEBE garantizar un orden canÃ³nico y determinista antes de adquirir bloqueos de fila para asegurar escalabilidad y resiliencia bajo concurrencia.


### N. LÃ³gica de Descuentos, Fechas NULL y Funciones Duplicadas (PostgREST 300) â€” 2026-05-22
- **Problema**: El descuento se calculaba en un trigger (sobrescribiendo el precio base en la DB), y al pasar el cÃ¡lculo al frontend, los descuentos permanentes (sin fecha) dejaron de aplicar porque el frontend y los RPC requerÃ­an estrictamente una fecha de fin (discount_end_date). AdemÃ¡s, al borrar funciones en Supabase con firmas antiguas, fallaban devolviendo 300 Multiple Choices por haber duplicados (unction overloading).
- **Causa RaÃ­z**: 1. Las validaciones matemÃ¡ticas no tenÃ­an un fallback para fechas NULL como sinÃ³nimo de descuento permanente. 2. DROP FUNCTION asume una firma especÃ­fica y si difiere, PostgREST colapsa al intentar resolver el RPC en endpoints /rest/v1/rpc/....
- **SoluciÃ³n**: Se actualizaron todos los RPC (get_products_filtered, get_accessories_filtered, get_products_stock_by_printing_ids) y isDiscountActive del frontend para tratar discount_end_date IS NULL como un descuento activo permanente. Se limpiaron con sus firmas exactas todas las funciones duplicadas en Supabase.
- **Regla Derivada**: Nunca actualizar un RPC que cambia de firma sin hacer un DROP CASCADE explÃ­cito de las versiones anteriores. Siempre tratar las fechas opcionales (discount_end_date) con fallback a infinito para evitar que una etiqueta puramente visual no genere el impacto matemÃ¡tico deseado en caja.

### 171. Despliegues Multi-Entorno y Migraciones Manuales en DEV (Mayo 2026)
- **Problema**: El frontend DEV desplegado por Cloudflare arrojÃ³ error 400 (column order_items_1.finish does not exist) al consultar metadatos de Ã³rdenes.
- **Causa RaÃ­z**: Las migraciones SQL de cambios de esquema en order_items solo se habÃ­an aplicado en producciÃ³n. Como DEV estÃ¡ segregado en otro proyecto de Supabase y el pipeline CI/CD de Cloudflare solo procesa cÃ³digo frontend, la base de datos DEV quedÃ³ desincronizada del esquema esperado.
- **SoluciÃ³n**: Se utilizÃ³ el MCP de Supabase para aplicar manualmente las migraciones pendientes en el proyecto DEV (qfkqnnostzaqueujdms) usando el execute_sql con el DDL faltante.
- **LecciÃ³n**: Al crear migraciones SQL que afecten el modelo de datos (agregando columnas como inish o product_name), es mandatario aplicarlas explÃ­citamente en el proyecto DEV a travÃ©s de la CLI, dashboard o herramientas de MCP *antes* o *al mismo tiempo* de subir los cambios de frontend.

### 172. Proyecciones GraphQL CÃ­egas y Errores 400 (Mayo 2026)
- **Problema**: Fallo total de carga de la pÃ¡gina de Ã³rdenes tras agregar collector_number al bloque de selecciÃ³n products(...).
- **Causa RaÃ­z**: Se asumiÃ³ incorrectamente que collector_number residÃ­a en la tabla products. Al enviar una peticiÃ³n con una columna inexistente, Supabase (PostgREST) rechaza toda la peticiÃ³n con HTTP 400.
- **SoluciÃ³n**: Remover collector_number del select y documentar que los metadatos extendidos solo estÃ¡n en card_printings. 
- **LecciÃ³n**: JamÃ¡s agregar campos especulativos a una peticiÃ³n de PostgREST. Antes de modificar proyecciones (select), verificar obligatoriamente la existencia de la columna ejecutando SELECT column_name FROM information_schema.columns WHERE table_name = 'X'.

### 173. Frontend Filters Disconnected from Backend RPCs (Mayo 2026)
- **Problema**: Los filtros de interfaz (Descuentos, Preventa y Otros) estaban conectados al estado y URL de React, pero no producï¿½an cambios en los resultados de bï¿½squeda.
- **Causa Raï¿½z**: Los parï¿½metros booleanos y arrays (p_only_discount, p_only_presale, p_games con valor OTHERS) eran enviados correctamente por el frontend, pero las funciones RPC de Supabase (get_products_filtered y get_accessories_filtered) no tenï¿½an la lï¿½gica en su bloque WHERE para procesarlos, devolviendo el catï¿½logo entero.
- **Soluciï¿½n**: Modificadas las RPCs en Supabase para interceptar estos flags y filtrar a nivel de SQL. Se aï¿½adiï¿½ soporte para OTHERS (excluyendo la lista de juegos principales).
- **Lecciï¿½n**: Al implementar un nuevo control de filtro visual, la primera verificaciï¿½n debe ser **siempre** el contrato de la funciï¿½n de base de datos (RPC/endpoint) que recibe y procesa el parï¿½metro. De lo contrario se genera una ilusiï¿½n de funcionalidad en el cliente.

### 6. Filtrado OTHERS en Funciones SQL â€” 2026-05-26
- **Problema:** La pestaÃ±a 'OTROS' en el catÃ¡logo mostraba todos los productos (Magic, Digimon, etc.) en lugar de solo los productos sin juego.
- **Causa RaÃ­z:** En get_accessories_filtered, cuando el frontend enviaba game_code = 'OTHERS', se pasaba p_game_id = NULL. La condiciÃ³n (p_game_id IS NULL OR a.game_id = p_game_id) evaluaba a TRUE para todos los productos, anulando el filtro.
- **SoluciÃ³n:** Modificar la funciÃ³n SQL para manejar explÃ­citamente (p_game_code = 'OTHERS' AND a.game_id IS NULL) y aplicar el filtro regular solo si p_game_code != 'OTHERS'.
- **Regla Derivada:** Al usar filtros dinÃ¡micos en Supabase RPC que aceptan NULL para indicar 'sin filtro', siempre se debe proveer un caso base explÃ­cito (OTHERS o similar) para filtrar registros donde la columna es literalmente NULL. (Codificado en migraciÃ³n 20260527000000_fix_accessories_others_filter.sql).


### 174. Timeout y Tablas Temporales en SincronizaciÃ³n Masiva â€” 2026-05-27
- **Problema:** El script de sincronizaciÃ³n perdÃ­a datos intermedios en lotes y la fase final de denormalizaciÃ³n fallaba silenciosamente tras 2 minutos de procesamiento.
- **Causa RaÃ­z:** 1. Las tablas temporales de PostgreSQL creadas con ON COMMIT DROP se eliminan en el primer conn.commit() del script (usado para iteraciones en batch), provocando InFailedSqlTransaction. 2. El timeout por defecto de PostgreSQL aborta consultas de agregaciÃ³n masiva que duran mÃ¡s de 2 minutos.
- **SoluciÃ³n:** 1. Cambiar la declaraciÃ³n de la tabla temporal a ON COMMIT PRESERVE ROWS para procesos en batch. 2. Elevar explÃ­citamente el timeout (SET statement_timeout = '30min') en la sesiÃ³n del cursor justo antes de consultas analÃ­ticas pesadas.
- **Regla Derivada:** Al diseÃ±ar scripts en Python (psycopg2) que dividen inserts masivos en chunks con .commit() intermedios, jamÃ¡s usar ON COMMIT DROP en tablas temporales. Siempre aumentar el statement_timeout para actualizaciones de desnormalizaciÃ³n tipo FULL OUTER JOIN sobre histÃ³ricos completos.

### 175. Modificaciones a BD Remota con MÃºltiples Entornos (Mayo 2026)
- **Problema:** Se ejecutÃ³ un script de reemplazo de caracteres directamente en la base de datos de producciÃ³n (rama `main`) asumiendo que el archivo local `.env` (que apuntaba a `main`) era el entorno que el usuario querÃ­a probar, cuando el usuario estaba realmente testeando en la rama de Supabase `dev`.
- **Causa RaÃ­z:** Falta de validaciÃ³n cruzada. El archivo local `.env` no siempre refleja el entorno en el que el usuario interactÃºa actualmente (por ej. Cloudflare Pages Preview usando la rama `dev`).
- **SoluciÃ³n:** Solicitar explÃ­citamente y usar el MCP de Supabase especificando el `project_id` del entorno (en este caso el ID de la rama `dev`) en lugar de usar comandos Python basados ciegamente en `DATABASE_URL`.
- **LecciÃ³n:** Al operar directamente sobre bases de datos en la nube que tienen bifurcaciÃ³n por ramas, SIEMPRE usar las herramientas de MCP de Supabase para listar proyectos y ramas (`list_branches`) y forzar la operaciÃ³n a travÃ©s de `execute_sql` en la rama especÃ­fica solicitada por el usuario.

### 176. Restricciones de Nombres de Archivo de Windows en Sistemas de ImÃ¡genes (Mayo 2026)
- **Problema:** Los nombres de accesorios contenÃ­an caracteres invÃ¡lidos para el sistema de archivos de Windows (`:`, `/`, `"`, etc.), lo que impedÃ­a la coincidencia (match) de imÃ¡genes locales al subirlas en masa.
- **Causa RaÃ­z:** Se corrigiÃ³ originalmente solo el carÃ¡cter `:` pensando que era el Ãºnico obstÃ¡culo, omitiendo toda la lista de caracteres no compatibles en nombres de archivo OS.
- **SoluciÃ³n:** Aplicar expresiones regulares en la base de datos y scripts de limpieza de CSV para eliminar TODOS los caracteres problemÃ¡ticos (`[\\/*?"<>|:]`) y prevenir que el bulk upload falle.
- **Regla Derivada:** Si se va a hacer match local entre cadenas de la Base de Datos y nombres de archivos de un OS, la BD y los CSVs de importaciÃ³n deben estar sanitizados de la lista completa de caracteres invÃ¡lidos, no solo de un carÃ¡cter particular reportado.

### Filtros de Rango UX y Valores Cero â€” 2026-05-28
- **Problema:** El filtro de precios forzaba valores por defecto (ej. 1000000) impidiendo que el usuario vaciara el input. AdemÃ¡s, el backend ignoraba la bÃºsqueda por el valor `0` absoluto.
- **Causa RaÃ­z:** InicializaciÃ³n estricta sin admitir `undefined` en el estado de React. En API, la validaciÃ³n `precio || null` fallaba para el nÃºmero 0 al ser falsy.
- **SoluciÃ³n:** Utilizar `undefined` en el estado local para inputs vacÃ­os, y reemplazar `|| null` por validaciÃ³n estricta `!== undefined ? valor : null` en llamadas a la API.
- **Regla Derivada:** Las variables de estado para filtros numÃ©ricos opcionales deben soportar `undefined`. Validaciones hacia el backend deben usar validaciÃ³n estricta explÃ­cita `!== undefined`, nunca el operador lÃ³gico `||` para nÃºmeros que pueden ser vÃ¡lidamente cero.

### 177. AsunciÃ³n de Entornos y Filtros Ocultos (Mayo 2026)
- **Problema:** Se modificÃ³ la base de datos de PROD al asumir que `VITE_ENVIRONMENT=development` en el archivo local `.env` indicaba que la URL adjunta correspondÃ­a a DEV. Adicionalmente, la RPC de Supabase para bÃºsquedas (`get_accessories_filtered`) devolvÃ­a todo el catÃ¡logo por un cortocircuito lÃ³gico en `p_game_id IS NULL`.
- **Causa RaÃ­z:** 
  1. No cruzar la informaciÃ³n del archivo `.env` con la documentaciÃ³n canÃ³nica (`LEYES_DEL_SISTEMA.md` o IDs conocidos). 
  2. En PostgreSQL (RPCs), usar `(param IS NULL OR col = param)` cuando se pasa `NULL` como valor para "ignorar filtro" puede generar falsos positivos desastrosos si se combina con una condiciÃ³n excluyente en la misma evaluaciÃ³n (como `game_code = 'OTHERS'`).
- **SoluciÃ³n:** 
  1. Se reestructurÃ³ `.env` y `frontend/.env` definiendo explÃ­citamente ambos entornos (`DEV_...` y `PROD_...`). 
  2. Se parcheÃ³ la RPC en BD DEV aislando el chequeo explÃ­cito `(p_game_code = 'OTHERS' AND a.game_id IS NULL)` fuera del chequeo genÃ©rico de ignorar filtros.
- **Regla Derivada:** JamÃ¡s asumir entornos por nombres de variables locales (ej. `development` en un archivo no garantiza que la BD sea el sandbox). SIEMPRE confirmar el ID del proyecto Supabase (DEV=`bqfkqnnostzaqueujdms`, PROD=`sxuotvogwvmxuvwbsscv`).


### 178. Funciones Sobrecargadas en SQL y Despliegues de BD en Cloudflare (Junio 2026)
- **Problema:** Un error PGRST203 ('Could not choose the best candidate function') rompiï¿½ la tienda de Producciï¿½n porque habï¿½a mï¿½ltiples firmas para get_products_filtered.
- **Causa Raï¿½z:** Al crear una migraciï¿½n SQL, se modificï¿½ accidentalmente el orden de los parï¿½metros booleanos. PostgreSQL creï¿½ una funciï¿½n sobrecargada (overloaded) en vez de reemplazar la existente. Ademï¿½s, Cloudflare Pages no ejecuta estas migraciones automï¿½ticamente, creando discrepancia entre el repositorio y la DB remota.
- **Soluciï¿½n:** Ejecutar explï¿½citamente DROP FUNCTION de la firma defectuosa y CREATE OR REPLACE con los parï¿½metros en orden estricto, aplicando el SQL manualmente a las BDs de DEV y PROD.
- **Regla Derivada:** LEY 34 (Respetar orden de argumentos en CREATE OR REPLACE FUNCTION) y LEY 35 (Sincronizaciï¿½n manual en Cloudflare).


### 179. Bug en Filtro Cruzado de Categorï¿½as (category vs category_code) ï¿½ 2026-06-02
- **Problema:** Al seleccionar una categorï¿½a desde la barra lateral (ej. 'Otros', 'Accesorios'), la API devolvï¿½a 'SIN RESULTADOS'.
- **Causa Raï¿½z:** El frontend asignaba errï¿½neamente la etiqueta de UI de texto libre ('Otros') al parï¿½metro `category_code` en lugar de a `category`. Como `category_code` espera valores de tipo ENUM ('OTHER'), la bï¿½squeda fallaba de manera silenciosa.
- **Soluciï¿½n:** Reasignar el valor pasado por URL a la propiedad `category` dentro del mï¿½todo `fetchAccessories` en `Home.tsx`.
- **Regla Derivada:** Ley 36: DIFERENCIACIï¿½N DE CATEGORY_CODE VS CATEGORY.


### 180. Construcciï¿½n Correcta de URL para Edge Functions - 2026-06-04
- **Problema:** Errores 404 (Not Found) en la consola al consultar detalles de cartas/accesorios, y mensajes de fallback ([Supabase] Falling back for details...).
- **Causa Raï¿½z:** El frontend intentaba consumir la Edge Function omitiendo el prefijo /api o /tcg-api necesario al concatenar directamente API_BASE y /cards/.... Esto causaba que la llamada HTTP fallara, aunque el sistema se recuperaba consultando la tabla directamente.
- **Soluciï¿½n:** Utilizar la funciï¿½n de utilidad getApiUrl() en etchCardDetails (utils/api.ts) que garantiza la correcta inyecciï¿½n del prefijo, y comprender que los fallbacks a card_printings son mecanismos resilientes esperados.
- **Regla Derivada:** LEY 37 (Utilizar SIEMPRE getApiUrl para construir endpoints de Edge Functions en el frontend).


### 181. Supabase Storage RLS Concurrency y Promise.all() - 2026-06-04
- **Problema:** Al intentar subir múltiples imágenes simultáneamente usando Promise.all() hacia un bucket de Supabase Storage, el servidor retornaba un falso error 400 Bad Request: new row violates row-level security policy.
- **Causa Raíz:** Las subidas concurrentes a la misma tabla storage.objects pueden causar colisiones internas o bloqueos durante la evaluación de la política RLS en Supabase, resultando en un rechazo arbitrario.
- **Solución:** Reemplazar Promise.all() por iteraciones secuenciales (or...of) con wait para subir archivo por archivo, garantizando que no existan carreras de ejecución en el bucket.
- **Regla Derivada:** Al subir múltiples imágenes a Supabase Storage desde el frontend, SIEMPRE usar un enfoque secuencial (for-loop) en vez de concurrente (Promise.all) para evitar falsos errores de RLS.


### 36. [Routing en Edge Functions & Cache-Busting UI] â€” 2026-06-05
- **Problema:** El AdminDashboard daba error 500 para Cloudflare Analytics y el banner de 'SincronizaciÃ³n Retrasada' se quedaba atascado en el tiempo.
- **Causa RaÃ­z:** 
### 36. [Routing en Edge Functions & Cache-Busting UI] — 2026-06-05
- **Problema:** El AdminDashboard daba error 500 para Cloudflare Analytics y el banner de 'Sincronización Retrasada' se quedaba atascado en el tiempo.
- **Causa Raíz:** 
  1. El servidor de Supabase corta los prefijos en la URL al hacer proxys internos, rompiendo comprobaciones `path === '/api/admin/cloudflare/analytics'`.
  2. Consultar `order('updated_at', {desc: true})` sobre `card_printings` (sin índices) causaba un escaneo secuencial masivo, resultando en nulls silenciosos o timeouts.
  3. Al consultar cada 30s la misma URL de PostgREST, Google Chrome/Safari cachean agresivamente devolviendo 304 Not Modified, ignorando las actualizaciones en la DB.
- **Solución:** 
  1. Usar `path.includes('/admin/cloudflare/analytics')` para todas las validaciones de ruta en Edge Functions.
  2. Indexar la tabla `card_printings(updated_at DESC NULLS LAST)`.
  3. Inyectar cache-busting en el cliente Supabase-JS con `.neq('printing_id', Date.now().toString())`.

# Lessons Learned

## Lesson #38: Scryfall API y HTTP 400 Bad Request
- **Fecha**: 2026-06-07
- **Problema**: Los scripts en Python fallaban al hacer peticiones a Scryfall con error HTTP 400.
- **Causa Raíz**: Scryfall endureció sus políticas anti-scraping y rechaza clientes anónimos (como `requests/2.x.x`).
- **Solución**: Siempre inyectar un header `User-Agent` descriptivo y un `Accept: application/json` al hacer requests a Scryfall.

## Lesson #37: Componentes Inline vs Modales en Paneles Administrativos
- **Fecha**: 2026-06-07
- **Problema**: Insertar un módulo de historial directamente en el flujo del layout rompía la jerarquía visual del Dashboard.
- **Solución**: Refactorizar tablas pesadas y reportes secundarios hacia un componente Modal (`fixed inset-0 z-150`) disparado desde un botón estandarizado en la grilla principal.
- **Regla Derivada**: Nunca forzar módulos grandes dentro de un layout de navegación sin un botón colapsable o modal.

## Lesson #36: Cache Busting React Query y Proxies de Supabase-JS con `.neq('printing_id', Date.now().toString())`.
- **Regla Derivada:** NUNCA hacer polling estático con `supabase.from().select()` sin un mecanismo de invalidación de caché o cache-busting. NUNCA usar match estricto para routing manual en Supabase Edge Functions.

### 182. Pérdida de Contexto y Gasto de Tokens (Junio 2026)
- **Problema:** En sesiones de desarrollo prolongadas, el agente pierde el estado de la tarea, la rama, y gasta tokens innecesarios escaneando el proyecto (grep/read) o haciendo instalaciones locales incorrectas.
- **Causa Raíz:** Falta de un protocolo de estado persistente pequeño (SESSION_STATE) y de un Knowledge Graph que contenga la semántica del código pre-computada.
- **Solución:** Implementación de las 5 técnicas del mercado: Graphify (grafo de código local), SESSION_STATE.md, Context Budget Protocol, Spec-First Development y Browser-First Verification en el /prehook.
- **Regla Derivada:** Queda prohibido el uso arbitrario de grep/list_dir sin antes consultar el grafo (graphify query). Obligatorio leer SESSION_STATE.md al inicio de cada sesión y actualizarlo al cierre.

