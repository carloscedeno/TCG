# ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  TCG Hub - Developer Knowledge Base (Lessons Learned)



Este documento registra los desafÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­os tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.



## ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Entorno y Dependencias



### 160. MitigaciÃƒÂ³n de Vulnerabilidades en npm y Scripts de Build (Junio 2026)
- **Problema**: Riesgo de ataques de cadena de suministro (supply chain attacks) asociados a la ejecuciÃƒÂ³n automÃƒÂ¡tica de scripts en `npm install`.
- **Causa RaÃƒÂ­z**: `npm` permite la ejecuciÃƒÂ³n de scripts de ciclo de vida (`postinstall`) sin confirmaciÃƒÂ³n explÃƒÂ­cita. AdemÃƒÂ¡s, dependencias transitivas mal declaradas pueden fallar bajo resoluciÃƒÂ³n estricta.
- **SoluciÃƒÂ³n**: 
  1. Migrar a `pnpm` y usar `pnpm approve-builds` para autorizar scripts explÃƒÂ­citamente (`[ERR_PNPM_IGNORED_BUILDS]`).
  2. Al migrar a `pnpm` (que usa symlinks estrictos), paquetes con dependencias peer ocultas como `vite-plugin-pwa` (que requiere `workbox-window`) fallarÃƒÂ¡n en build. Se deben instalar explÃƒÂ­citamente (`pnpm add workbox-window`).
- **Regla Derivada**: Prohibido usar `npm`. Toda dependencia se maneja con `pnpm`.


### 160. MitigaciÃƒÂ³n de Vulnerabilidades en npm y Scripts de Build (Junio 2026)
- **Problema**: Riesgo de ataques de cadena de suministro (supply chain attacks) asociados a la ejecuciÃƒÂ³n automÃƒÂ¡tica de scripts en `npm install`.
- **Causa RaÃƒÂ­z**: `npm` permite la ejecuciÃƒÂ³n de scripts de ciclo de vida (`postinstall`) sin confirmaciÃƒÂ³n explÃƒÂ­cita. AdemÃƒÂ¡s, dependencias transitivas mal declaradas pueden fallar bajo resoluciÃƒÂ³n estricta.
- **SoluciÃƒÂ³n**: 
  1. Migrar a `pnpm` y usar `pnpm approve-builds` para autorizar scripts explÃƒÂ­citamente (`[ERR_PNPM_IGNORED_BUILDS]`).
  2. Al migrar a `pnpm` (que usa symlinks estrictos), paquetes con dependencias peer ocultas como `vite-plugin-pwa` (que requiere `workbox-window`) fallarÃƒÂ¡n en build. Se deben instalar explÃƒÂ­citamente (`pnpm add workbox-window`).
- **Regla Derivada**: Prohibido usar `npm`. Toda dependencia se maneja con `pnpm`.


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


### 1. Conflictos de VersiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n en CI/CD (GitHub Actions)



- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.

- **Causa**: Versiones muy recientes de librerÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as a veces tardan horas/dÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.

- **Causa**: Versiones muy recientes de librerÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­as a veces tardan horas/dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­as en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - Sincronizar la versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Python del runner (3.12) con la local.

  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.



### 159. Invariantes de Esquema de Base de Datos vs RPCs DinÃƒÂ¡micos (Mayo 2026)
- **Problema**: ViolaciÃƒÂ³n inmediata de restricciÃƒÂ³n `NOT NULL` en la columna `product_name` de `order_items` al intentar finalizar una compra en producciÃƒÂ³n.
- **Causa RaÃƒÂ­z**: Durante la refactorizaciÃƒÂ³n de funciones atÃƒÂ³micas en PL/pgSQL (ej. `create_order_atomic`), las sentencias de inserciÃƒÂ³n omitieron mapear todas las columnas requeridas por el esquema de base de datos.
- **SoluciÃƒÂ³n**: Al diseÃƒÂ±ar o actualizar procedimientos almacenados de ÃƒÂ³rdenes, recuperar de forma explÃƒÂ­cita todos los metadatos descriptivos del catÃƒÂ¡logo (`name`, `printing_id`, `finish`, `set_code`) con caÃƒÂ­das de respaldo robustas (`COALESCE`) hacia el payload de entrada.
- **LecciÃƒÂ³n**: Nunca asumir que las columnas descriptivas de un ÃƒÂ­tem de orden son opcionales. En un sistema e-commerce resiliente, congelar los metadatos al momento de la transacciÃƒÂ³n es un requerimiento innegociable de auditorÃƒÂ­a e inmutabilidad.

### 155. El Anti-patrÃƒÆ’Ã‚Â³n del "Cero Fantasma" en React (Mayo 2026)
- **Problema**: ApariciÃƒÆ’Ã‚Â³n de dÃƒÆ’Ã‚Â­gitos "0" literales en la UI, especialmente en esquinas de tarjetas o grids, sin explicaciÃƒÆ’Ã‚Â³n aparente.
- **Causa RaÃƒÆ’Ã‚Â­z**: Uso de cortocircuito lÃƒÆ’Ã‚Â³gico `&&` con variables numÃƒÆ’Ã‚Â©ricas en JSX (ej: `{stock && <Badge />}`). En JavaScript, `0 && anything` retorna `0`. React renderiza el nÃƒÆ’Ã‚Âºmero `0` como un nodo de texto vÃƒÆ’Ã‚Â¡lido, a diferencia de `false`, `null` o `undefined`.
- **SoluciÃƒÆ’Ã‚Â³n**:
    1. **ConversiÃƒÆ’Ã‚Â³n ExplÃƒÆ’Ã‚Â­cita**: Usar `!!variable && <Component />` para forzar a booleano.
    2. **ComparaciÃƒÆ’Ã‚Â³n ExplÃƒÆ’Ã‚Â­cita**: Usar `variable > 0 && <Component />` si el objetivo es mostrar algo solo cuando hay valor.
    3. **Ternario**: Usar `{variable ? <Component /> : null}`.
- **LecciÃƒÆ’Ã‚Â³n**: NUNCA usar variables numÃƒÆ’Ã‚Â©ricas directamente con `&&` en JSX si `0` es un valor posible. Se debe endurecer el tipado y la evaluaciÃƒÆ’Ã‚Â³n lÃƒÆ’Ã‚Â³gica en componentes crÃƒÆ’Ã‚Â­ticos como `Card.tsx` para mantener la limpieza visual de la marca.

### 156. ValidaciÃƒÆ’Ã‚Â³n de Precios Cero en Importaciones (Mayo 2026)
- **Problema**: La carga masiva rechazaba filas con precio "0.00" indicando "Faltan campos obligatorios".
- **Causa RaÃƒÆ’Ã‚Â­z**: Uso de validaciÃƒÆ’Ã‚Â³n `if (!price)` en la Edge Function. En JavaScript, `0` es falsy, por lo que el sistema interpretaba un precio de cero como un campo vacÃƒÆ’Ã‚Â­o.
- **SoluciÃƒÆ’Ã‚Â³n**: Cambiar la validaciÃƒÆ’Ã‚Â³n a `if (isNaN(price))` para permitir explÃƒÆ’Ã‚Â­citamente el valor `0` mientras se siguen rechazando valores no numÃƒÆ’Ã‚Â©ricos o nulos.
- **LecciÃƒÆ’Ã‚Â³n**: Al validar datos financieros, siempre permitir el `0` explÃƒÆ’Ã‚Â­citamente si tiene sentido para el negocio (promos, regalos, placeholders).

### 158. TypeScript Build Strictness in CI (Mayo 2026)
- **Problema**: Despliegues fallidos en producciÃƒÆ’Ã‚Â³n debido a variables e imports no utilizados (`TS6133`).
- **Causa RaÃƒÆ’Ã‚Â­z**: El compilador en entornos de CI (como GitHub Actions o Cloudflare Pages) suele estar configurado con reglas mÃƒÆ’Ã‚Â¡s estrictas que el entorno de desarrollo local.
- **SoluciÃƒÆ’Ã‚Â³n**: Eliminar rigurosamente imports y variables no utilizadas antes de cada push. El uso de herramientas de linting local es mandatorio.
- **LecciÃƒÆ’Ã‚Â³n**: No confiar solo en que "funciona en local"; el build de producciÃƒÆ’Ã‚Â³n es el juez final.

### 159. SPA Navigation Scroll Behavior (Mayo 2026)
- **Problema**: Al navegar a una nueva pÃƒÆ’Ã‚Â¡gina (ej: del CatÃƒÆ’Ã‚Â¡logo al Detalle de Producto), el scroll se mantenÃƒÆ’Ã‚Â­a en la posiciÃƒÆ’Ã‚Â³n anterior, forzando al usuario a "subir" manualmente para ver el contenido.
- **Causa RaÃƒÆ’Ã‚Â­z**: Los navegadores no resetean el scroll automÃƒÆ’Ã‚Â¡ticamente en aplicaciones Single Page (React) a menos que se implemente explÃƒÆ’Ã‚Â­citamente.
- **SoluciÃƒÆ’Ã‚Â³n**: Crear un componente global `ScrollToTop` que escuche cambios en `pathname` y ejecute `window.scrollTo(0, 0)`.
- **LecciÃƒÆ’Ã‚Â³n**: La gestiÃƒÆ’Ã‚Â³n del scroll es una parte fundamental de la experiencia de usuario (UX) en aplicaciones modernas de TCG con listados largos.

- **Problema**: Discrepancias de precios entre el carrito de invitados y usuarios registrados, junto con errores 404 al ver detalles de accesorios.
- **Causa RaÃƒÂ­z**:
    1. El frontend realizaba cÃƒÂ¡lculos de precios y mapeos complejos que no siempre coincidÃƒÂ­an con la lÃƒÂ³gica del backend (RPC get_user_cart).
    2. La lÃƒÂ³gica de bÃƒÂºsqueda de detalles por UUID intentaba cargar accesorios desde el endpoint de cartas de la Edge Function, causando 404s.
- **SoluciÃƒÂ³n**:
    1. **Confianza en el RPC**: Refactorizar etchCart para usar directamente la respuesta plana del RPC unificado, eliminando lÃƒÂ³gica redundante en el cliente.
    2. **Paridad de Descuentos**: Replicar la lÃƒÂ³gica de cÃƒÂ¡lculo de ofertas (discount_percentage + discount_until) en el procesamiento del carrito de invitados (pi.ts).
    3. **PriorizaciÃƒÂ³n de Inventario Local**: Ajustar etchCardDetails para buscar siempre en la tabla ccessories ANTES de recurrir a la Edge Function si el ID es un UUID.
- **LecciÃƒÂ³n**: Centralizar la lÃƒÂ³gica de precios en la base de datos (RPCs) y asegurar que el frontend sea un reflejo fiel de esos datos. Los accesorios (inventario local) siempre deben tener prioridad de resoluciÃƒÂ³n sobre el catÃƒÂ¡logo global (Cartas) para evitar fallos de ruta.

### 153. RestauraciÃƒÆ’Ã‚Â³n de Identidad y Pantone (Mayo 2026)

- **Problema**: El intento de "modernizar" o "neutralizar" el diseÃƒÆ’Ã‚Â±o mediante un cambio de Pantone (de Geeko Cyan #00D1FF a Electric Blue #0099FF) provocÃƒÆ’Ã‚Â³ una pÃƒÆ’Ã‚Â©rdida de identidad visual y fue percibido como un error ("se ve verde").

- **Causa RaÃƒÆ’Ã‚Â­z**: Sobre-correcciÃƒÆ’Ã‚Â³n estÃƒÂ©tica sin validar contra la marca establecida. El uso de sombras y resplandores en tonos azulados sobre un fondo oscuro puede alterar la percepciÃƒÆ’Ã‚Â³n del color base si no se usa el valor exacto de la marca.

- **SoluciÃƒÆ’Ã‚Â³n**: Revertir globalmente a #00D1FF (Geeko Cyan). Restaurar elementos de marca explÃƒÆ’Ã‚Â­citos (etiqueta "SINGLES", iconos de destellos) que habÃƒÆ’Ã‚Â­an sido simplificados excesivamente.

- **LecciÃƒÆ’Ã‚Â³n**: La documentaciÃƒÆ’Ã‚Â³n visual y los pantallazos de producciÃƒÆ’Ã‚Â³n (`geekorium.shop`) son la **fuente de verdad absoluta**. Cualquier refactorizaciÃƒÆ’Ã‚Â³n tipogrÃƒÆ’Ã‚Â¡fica o de color debe ser validada contra estos antes de darla por finalizada. Evitar la "invenciÃƒÆ’Ã‚Â³n" de nuevos selectores o disposiciones si el usuario solicita "restaurar lo anterior".



### 148. RemediaciÃƒÆ’Ã‚Â³n de Flujo "Por Encargo" (Bypass de Stock) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-05-07

- **Problema:** El checkout fallaba con error de "Stock insuficiente" al intentar comprar cartas sin existencia fÃƒÆ’Ã‚Â­sica, a pesar de que la Regla de Negocio 4 permite pedidos "Por Encargo".

- **Causa RaÃƒÆ’Ã‚Â­z:** El RPC `create_order_atomic` tenÃƒÆ’Ã‚Â­a una validaciÃƒÆ’Ã‚Â³n estricta `IF v_current_stock < quantity THEN RAISE EXCEPTION` que no discriminaba entre productos normales y pedidos on-demand.

- **SoluciÃƒÆ’Ã‚Â³n:** Implementar un flag `is_on_demand` en la lÃƒÆ’Ã‚Â³gica de la orden. El frontend detecta `quantity > stock` y envÃƒÆ’Ã‚Â­a el flag; el RPC usa este flag para saltar la excepciÃƒÆ’Ã‚Â³n y marcar la lÃƒÆ’Ã‚Â­nea de pedido correctamente.

- **Regla Derivada:** Todo flujo de checkout atÃƒÆ’Ã‚Â³mico debe soportar un bypass de validaciÃƒÆ’Ã‚Â³n de stock si el ÃƒÆ’Ã‚Â­tem estÃƒÆ’Ã‚Â¡ marcado como "on-demand" (LecciÃƒÆ’Ã‚Â³n #148).

### 157. RemediaciÃƒÂ³n de Carga Masiva y Gaps de CatÃƒÂ¡logo (Mayo 2026)
- **Problema**: Fallos intermitentes en la carga masiva de inventario para sets nuevos o tokens (ej: TM3C, TECC).
- **Causa RaÃƒÂ­z**: El sistema asume que el catÃƒÂ¡logo maestro (`sets`, `card_printings`) estÃƒÂ¡ siempre completo. Las importaciones fallan por violaciones de FK si el set o la impresiÃƒÂ³n especÃƒÂ­fica no existen previamente. AdemÃƒÂ¡s, el uso de `ON CONFLICT` en `products` puede fallar si no se especifica el nombre de la restricciÃƒÂ³n ÃƒÂºnica (`products_printing_id_condition_finish_key`) en entornos con mÃƒÂºltiples ÃƒÂ­ndices o columnas anulables.
- **SoluciÃƒÂ³n**:
    1. **SincronizaciÃƒÂ³n Proactiva**: Implementar un paso de "pre-vuelo" que verifique la existencia de IDs de Scryfall y cree los registros faltantes en `sets` y `card_printings` antes de insertar en `products`.
    2. **Endurecimiento de SQL**: Usar `ON CONFLICT ON CONSTRAINT products_printing_id_condition_finish_key` para garantizar una resoluciÃƒÂ³n de conflictos atÃƒÂ³mica y sin ambigÃƒÂ¼edades.
    3. **Mapeo de Precios**: Permitir precios `0.0` (Free/Token) explÃƒÂ­citamente sin que el script de sincronizaciÃƒÂ³n los descarte como nulos.
- **LecciÃƒÂ³n**: Un importador masivo robusto debe ser capaz de auto-remediar el catÃƒÂ¡logo maestro usando fuentes externas (Scryfall) si detecta que la base de datos local estÃƒÂ¡ desactualizada.



### 143. SincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n SKU-Aware

- **Problema**: Los scripts de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n con CardKingdom tenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an errores de mapeo en sets modernos.

- **Causa**: El uso de campos descriptivos ambiguos en lugar de identificadores ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnicos.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Los scripts de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n con CardKingdom deben priorizar el SKU (`[F]SET-NNNN`) sobre el campo `variation` para sets modernos y tokens para garantizar un mapeo 100% exacto de acabados y coleccionistas.



### 144. ResoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n DinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡mica de Juegos

- **Problema**: Errores en el frontend al intentar cargar datos de juegos debido a IDs cambiantes entre entornos.

- **Causa**: Hardcoding de IDs de bases de datos seriales.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Evitar hardcoding de IDs de bases de datos seriales en el frontend. En entornos de desarrollo, Magic: The Gathering puede ser ID 1, mientras que en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n es ID 22. Se implementÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ una resoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡mica en `api.ts` basada en el nombre del juego o su cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo (`MTG`).



## ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Base de Datos y Supabase



### 2. "Precios Invisibles" (AgregaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Fallida)



- **Problema**: El script de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n insertaba precios pero no se reflejaban en la UI.

- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requerÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a un `condition_id` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡lido. Los inserts manuales omitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an estos campos, dejando los precios en un limbo.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Todo script de ingesta de precios debe incluir:

  - `timestamp`: ISO string (UTC).

  - `condition_id`: ID numÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©rico correspondiente (ej: 16 para Near Mint).

  - `is_foil`: Booleano explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­cito.



### 3. Timeouts en Filtros (Performance)



- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.

- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndices.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - **ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ndices CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.

  - **Estrategia de Consulta**: Para tablas masivas, es mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s rÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡pido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.



## ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ Frontend y API



### 4. Coherencia en el Fallback de Supabase



- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".

- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ndar de Postgres) que no existe en esta estructura especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­fica.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Mantener mapeos de nombres de columnas idÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nticos entre la respuesta del API local y el cÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³digo de fallback de Supabase.

- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.

- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.

- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.



### 5. Counting Strategy & Timeouts



- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡micos donde el planificador de Postgres ya tiene estadÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sticas.

  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n con "Infinite Scroll" o botones de "Siguiente".



## ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Despliegue y CI/CD



### 6. TypeScript Strict Build (TS6133)



- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.

- **Causa**: ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de `tsconfig.json` con `noUnusedParameters: true`.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n exitosa.



### 7. Variables de Entorno en GitHub Actions



- **Problema**: El frontend funcionaba localmente pero en producciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n los dropdowns (Sets) estaban vacÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­os y las bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsquedas fallaban.

- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a 404).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.

  - **Resiliencia de Fallback**: Todo endpoint crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ definido.



---



## ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Frontend y UX



### 8. UX de Autocompletado vs. BÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda Activa (Feb 2026)



- **Problema**: Al implementar el autocompletado, el `debounce` automÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡tico disparaba la bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda principal cada vez que el usuario escribÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a, recargando resultados innecesariamente.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: **Desacoplar siempre el input de bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda del trigger de bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda.**

  - El input solo actualiza el estado local para sugerencias.

  - La bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda principal (`activeSearchQuery`) solo se actualiza mediante acciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­cita (`Enter` o click en sugerencia).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Se refactorizÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ el frontend para separar `query` (input) de `activeSearchQuery` (fetch).



### 9. Timeout en Queries con DISTINCT ON (Feb 2026)



- **Problema**: `DISTINCT ON (card_name)` + `ORDER BY` con JOIN (`s.release_date`) causaba timeout (Error 500) sin ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndices especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficos para esa combinaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: **ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ndices obligatorios para Sort/Filter.**

  - Si usas `DISTINCT ON (columna)`, DEBE haber un ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndice en `(columna)`.

  - Si filtras con `ILIKE`, DEBE haber ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndice `GIN` con `pg_trgm`.

  - Verificar siempre con `EXPLAIN ANALYZE` en datos con volumetrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a real.



### 10. NO Usar Queries DinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡micas para Vistas Principales de Tablas Grandes (Feb 2026)



- **Problema**: A pesar de ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndices correctos, `DISTINCT ON` sobre 80,000+ filas con Joins y RLS activo sigue siendo demasiado pesado.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n Definitiva: USAR VISTA MATERIALIZADA.**

  - Si deduplicar o agregar de tabla principal grande (>10k filas): pre-calcular en `MATERIALIZED VIEW`.

  - Usar `SECURITY DEFINER` en la funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n RPC para saltar overhead de RLS si la vista ya contiene datos pÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºblicos filtrados.



### 11. CardModal ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ Nunca Filtrar all_versions al Cambiar Printing (Feb 2026)



- **Problema**: Al cambiar el printing seleccionado, la lista de versiones desaparecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a si la respuesta de la API para ese printing no incluÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a todas las versiones.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Preservar siempre el array `all_versions` en el estado del frontend al navegar entre printings. Nunca re-derivarlo de la respuesta parcial de un printing individual.



### 12. Soporte Foil Virtual ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ Entidades Virtuales No En DB (Feb 2026)



- **Problema**: Intentar buscar registros de cartas foil como entidades separadas en la DB fallaba.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Las cartas foil son **entradas virtuales** generadas por la Edge Function `tcg-api` cuando `prices.usd_foil IS NOT NULL`. No existen como filas separadas en `card_printings`. Nunca hacer migrations que asuman lo contrario.



### 13. DFC (Double-Faced Cards) ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ Links y Flip de Imagen (Feb 2026)



- **Problema**: Los links de CardKingdom para DFCs fallaban porque incluÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an el nombre de ambas caras (`//`). Las imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes DFC no flippeaban.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - **Links**: Usar solo `card_faces[0].name` (cara frontal) para bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsquedas en CardKingdom.

  - **Flip**: Detectar DFC por `card_faces?.length > 1`. Implementar toggle de imagen client-side.

  - **Fallback Frontend**: Si `image_uris` es null, usar `card_faces[0].image_uris` como fallback.



### 14. Precios: Siempre Parsear como Number (Feb 2026)



- **Problema**: `toFixed()` crasheaba cuando el precio venÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a como string o null de la API.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Siempre convertir: `const price = Number(rawPrice)`. Verificar `isNaN(price)` antes de formatear. Mostrar `S/P` si null/undefined.



### 145. AlineaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de ParÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metros RPC y SincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de URL (Abril 2026)

- **Problema**: El buscador y los filtros de la tienda dejaron de funcionar tras una refactorizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de nombres de variables en el frontend.

- **Causa RaÃƒÆ’Ã†â€™z**: 

  1. Desajuste entre los nombres de parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metros esperados por la base de datos de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (`game_filter`, `rarity_filter`) y los enviados por el frontend (`game_code`, `rarities`).

  2. El componente `Home.tsx` no sincronizaba el estado de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda (`q`) desde la URL cuando el usuario navegaba o usaba sugerencias de la cabecera.

  3. Al aplicar filtros, la URL se sobrescribÃƒÆ’Ã†â€™a por completo en lugar de mezclarse con los parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metros existentes (borrando el tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rmino de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: 

  - **VerificaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Firma**: Siempre verificar la firma exacta de la funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en la base de datos de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n antes de cambiar nombres de parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metros en `api.ts`.

  - **URL como Source of Truth**: El estado del frontend debe seguir a la URL (One-Way Data Flow). Implementar efectos robustos que lean de `searchParams` y actualicen el estado interno.

  - **Mezcla de ParÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metros**: Usar `new URLSearchParams(searchParams)` para conservar el estado existente al aplicar nuevos filtros.

  - **Soporte de UX**: Asegurar que la tecla `Enter` en formularios de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda "confirme" la acciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n y actualice la URL para disparar el fetch.



### 146. Linting CrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tico en CI/CD (GitHub Actions)

- **Problema**: El despliegue de producciÃƒÆ’Ã‚Â³n fallaba con un error de variable no utilizada, a pesar de funcionar localmente.

- **Causa**: `npm run build` en entornos CI suele aplicar reglas de linting mÃƒÆ’Ã‚Â¡s estrictas (`no-unused-vars`). Componentes con importaciones comentadas o "fantasmas" bloquean el pipeline.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Eliminar siempre las importaciones no utilizadas antes de un push. Si una funcionalidad se comenta temporalmente (ej: botÃƒÆ’Ã‚Â³n "Explore"), su importaciÃƒÆ’Ã‚Â³n asociada (ej: `ExternalLink`) debe comentarse o eliminarse tambiÃƒÆ’Ã‚Â©n.



### 147. Robustez en Consultas Join de Supabase (PostgREST)

- **Problema**: Scripts de backend fallaban con `NoneType` errors al intentar acceder a datos de joins complejos.

- **Causa**: PostgREST puede devolver `null` en objetos anidados si la relaciÃƒÆ’Ã‚Â³n no existe o si hay ambigÃƒÆ’Ã‚Â¼edad en el esquema. Acceder directamente como `item['cards']['card_name']` sin validaciÃƒÆ’Ã‚Â³n previa es peligroso.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Usar siempre `.get()` y validaciÃƒÆ’Ã‚Â³n defensiva para datos provenientes de joins complejos en Supabase. Implementar fallbacks razonables (ej: `game_code` por defecto a 'MTG') y logging granular para identificar registros huÃƒÆ’Ã‚Â©rfanos.



---



## ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ DiseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o y Branding



### 15. Restricciones de ItÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡licas por SecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ Spec Geekorium (Feb 2026)



- **Problema**: Clase `italic` aparecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a en headings de secciones donde la spec lo prohÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­be explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­citamente.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ador estableciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ que `font-web-titles` (Daito/Roboto Slab) no debe usarse en itÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lica en secciones de contenido informativo (ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo comprar?, Ayuda). Solo se permite italic en tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tulos de marca/admin.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Remover `italic` de `Home.tsx` L581 (ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo comprar?) y `HelpPage.tsx` L28 (ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿AÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºn tienes dudas?).

- **Regla Derivada**: Al implementar headings con `font-web-titles`, verificar si la secciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n estÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ en la lista de restricciones de la spec. La lista actual: secciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n `ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo comprar?` y secciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Ayuda.



### 16. Tokens de Color de Marca: Incluir Todas las Variantes del Spec (Feb 2026)



- **Problema**: El token `#523176` (variante tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cnica morada) estaba en la spec pero no definido en `index.css` como CSS variable.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Al implementar la paleta inicial se omitiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ esta variante por considerarla secundaria.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Agregar `--color-geeko-violet-deep: #523176` al bloque `@theme` de `index.css`.

- **Regla Derivada**: Al adoptar un nuevo spec de diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o, mapear **todas** las variantes de color del documento al sistema de tokens, incluso si no se usan inmediatamente. Pendiente usarlo en: bordes de cartas Lorcana, sellos de cera, accents de sets especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficos.



---



## ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âª Testing



### 17. Patch Target Correcto para Servicios con `supabase_admin` (Feb 2026)



- **Problema**: `test_collection_import.py` fallaba con `AttributeError: module does not have the attribute 'supabase'`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El service `collection_service.py` fue refactorizado para usar `supabase_admin = get_supabase_admin()` en lugar de `supabase`. Los tests seguÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an mockeando el atributo viejo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Cambiar el patch target en los fixtures de `'api.services.collection_service.supabase'` ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ `'api.services.collection_service.supabase_admin'`.

- **Regla Derivada**: Cuando un servicio renombra su variable de cliente de Supabase, buscar y actualizar TODOS los tests que la mockean. Usar `grep_search` con `patch(` + el mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo para detectarlos.



### 18. Lazy Imports en Servicios ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ CÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mo Parchearlos (Feb 2026)



- **Problema**: `patch('src.api.services.collection_service.MatcherService')` fallaba porque `MatcherService` se importa dentro del cuerpo de la funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n (`from .matcher_service import MatcherService`), no al nivel del mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Los lazy imports (dentro de la funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n) no crean atributos en el namespace del mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo que los contiene, por lo que no son patcheables desde ahÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Parchear en el mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo **fuente**, no en el mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³dulo importador: `patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock)`.

- **Regla Derivada**: Si una clase/funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n se importa con `from .modulo import Clase` dentro de una funciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n, siempre parchear en `modulo.Clase`, no en `servicio_importador.Clase`.



### 19. Mock Chain para `ValuationService` ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ Two-Step Query (Feb 2026)



- **Problema**: `test_valuation_calculation_logic` afirmaba `store_price == 100.0` pero obtenÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a `1.0`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El test pasaba `{'source': 'geekorium', 'price_usd': 100.0}` pero el servicio NO usa el campo `source` ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ hace primero un query a la tabla `sources` para obtener un mapa `{source_id ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ source_code}`, luego itera `price_history` buscando `source_id` (entero).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Reescribir el mock como un `table_side_effect` que retorna datos distintos por tabla: `sources` ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ mapa de IDs, `price_history` ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ filas con `source_id` (int), no `source` (str).

- **Regla Derivada**: Antes de escribir mocks para servicios, leer su implementaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n para identificar el flujo exacto de queries. Los servicios con lookups de tablas de referencia (como `sources`, `conditions`) requieren mocks de mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºltiples tablas.



### 20. Reemplazo Exhaustivo de Colores Heredados al Refactorizar UI (Feb 2026)



- **Problema**: Tras remover la clase `italic` en `HelpPage.tsx` para ajustarse a una regla tipogrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡fica nueva, se revelaron clases utilitarias de color heredadas (`bg-[#f4e4bc]`, `text-black`, `bg-[#25D366]`) que desentonaban con el nuevo spec.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: RefactorizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n local "quirÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºrgica" (solo tocar `italic`) en componentes sin auditar si su paleta general sigue el nuevo "DiseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o Fix".

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Reemplazo masivo de colores heredados en el componente modificado. Beige (`#f4e4bc`) a Primario (`#373266`), Negro (`text-black`) a Blanco (`#FFFFFF`), y Verde (`#25D366`) a Cyan (`geeko-cyan` / `#00AEB4`). AdemÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s se debiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ re-aÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±adir `font-web-titles` porque el `<h3/>` carecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a de familia tipogrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡fica tras quitar la itÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡lica.

- **Regla Derivada**: Siempre que se modifique un componente heredado ("legacy") para ajustarlo a nuevas reglas de brand, auditar TODO el componente. Eliminar colores *hardcoded* obsoletos y aplicar los nuevos tokens de marca. Validar que no perder clases como `italic` descubra la falta de clases estructurales como familias de fuentes (`font-web-titles`).



### 21. Fallbacks Visuales en Vistas Combinadas de DB (Feb 2026)



- **Problema**: Las imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes de las cartas no se mostraban en el Grid ("Imagen No Disponible"), a pesar de existir imÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡genes en la base de datos de Scryfall.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El endpoint RPC `get_products_filtered` retornaba directamente la columna `image_url` de la tabla `products`, la cual puede ser nula dependiendo del formato de importaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n, en lugar de considerar el fallback a la tabla unida `card_printings`.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Refactorizar la proyecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n SQL para incluir `COALESCE(p.image_url, cp.image_url) as image_url`.

- **Regla Derivada**: Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.



### 22. Validaciones Locales Estrictas (Feb 2026)



- **Problema**: Formularios sin validaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n previa enviaban datos inconsistentes (ej. formato de telÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©fono errÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³neo) al equipo de soporte.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n / LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Validar clide-side formatos especÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficos (ej. venezolanos 04), rechazar letras en cÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©dula (

eplace(/\D/g, '')), y forzar longitud en campos de texto antes de habilitar el pago.

- **Regla Derivada**: Todo input vital para el pago/contacto fÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.



### 23. BÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda y ValidaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Stock en SQL (Feb 2026)



- **Problema**: El carrito permitÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a agregar mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s cartas de las que habÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a en stock si se hacÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºltiples clicks o llamadas al RPC dd_to_cart. AdemÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s, la bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda global a veces no priorizaba coincidencias exactas.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El control de stock no totalizaba las cantidades previas del mismo item en el carrito antes de comparar con el stock mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ximo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Refactorizar dd_to_cart sumando quantity + v_current_qty > v_stock y lanzando un error. Ajustar get_products_filtered con un ORDER BY que priorice strings idÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nticos (p.name ILIKE ).

- **Regla Derivada**: Todo control de inventario en el backend debe ser calculable (suma del estado actual + intento) y rechazar transacciones a nivel SQL, y las funciones de bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda deben devolver coincidencias exactas primero.



### 24. Resolviendo TipografÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as en UI EspecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­fica (Feb 2026)



- **Problema**: El diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o UI requerÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a mapeos hiperespecÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ficos de tipografÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­as (Daito para tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tulos, Bogue para precios, Rubik para cuerpo) en base a mockups donde no bastaba heredar la tipografÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a general.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Las clases CSS como ont-sans no sobreescribÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­an correctamente la jerarquÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a necesaria si el componente padre tenÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a otra.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Aplicar clases nominales directas en Tailwind (ont-web-titles, ont-titles, ont-sans) a los subnodos del texto en los componentes y remover tags italic que forzaban el fallback del font.

- **Regla Derivada**: La fidelidad 1:1 de PRD UI requiere aplicar clases tipogrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ficas explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­citas en el nivel mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s bajo (hojas) del nodo del DOM y evitar modificadores de estilo globales (como italic o bold general) que rompan el font-face de UI.



### [Guest Checkout & Inventory Pattern] ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ 2026-02-27



- **Problema:** Riesgo de doble venta en un e-commerce de productos ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºnicos (trading cards) cuando los pagos son asÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ncronos (Zelle/Pago MÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³vil) y los usuarios no tienen cuenta.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** Falta de un estado intermedio que bloquee el inventario temporalmente mientras el pago ocurre off-platform.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** Implementar un estado de orden `pending_payment` que reduce el `reserved_stock` inmediatamente mediante un RPC atÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mico de Supabase, acompaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±ado de un Job/RPC que cancela las ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³rdenes expiradas (superan 24 hrs sin validaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n) y devuelve el stock. Uso de URLs ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºnicas (`/order/:id`) para que invitados suban su comprobante.

- **Regla Derivada:** Todo cambio de estado de `orders` debe evaluarse en el RPC `update_order_status` para gestionar `reserved_stock` vs `stock` dinÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡micamente y de forma atÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³mica.



### 2. ValidaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n y Reserva Diferida - 2026-03-01



- **Problema:** Exigir comprobantes upfront choca con la realidad del stock fÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sico desfasado.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** El proceso asumÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a que el stock del e-commerce siempre era 100% exacto respecto a la tienda fÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sica.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** Romper el pago y la verificaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n en 2 pasos. Reservar el stock primero (pending_verification), y pagar despuÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©s (awaiting_payment).

- **Regla Derivada:** Cualquier estado que cambie a cancelled/returned desde active debe liberar el stock inmediatamente para evitar desajustes remanentes.



### 3. Evitar Bloqueos de UI por Fugas de InteracciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n - 2026-03-01



- **Problema:** Un modal (CardModal) que se cierra al agregar al carrito funcionaba bien en testing local pero dejaba la UI colgada (timeout por capa transparente superpuesta) en pruebas E2E en ProducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** El modal tenÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gica condicional que solo lo cerraba si se pasaba un prop onAddToCartSuccess. En flujos donde este prop faltaba, la promesa colgaba visualmente porque esperaba al callback para cerrarse.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** Consolidar el cierre del modal (onClose()) para que siempre ocurra de manera incondicional, independiente de callbacks extra.

- **Regla Derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales a nivel del componente que las renderiza, no deben depender de hooks inyectados opcionales.



### 10. TypeError: reduce is not a function en ProducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¿Ãƒâ€šÃ‚Â½ 2026-03-02



- **Problema:** La aplicaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n fallaba en producciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n al navegar a /profile con un error Uncaught TypeError: s.reduce is not a function.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** Respuestas de la API que devuelven objetos vacÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­os o

ull en lugares donde se espera un arreglo (ej. cartItems, collection). React Context o servicios no estaban garantizando un valor fallback de arreglo estable.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** ImplementaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n masiva de protecciones Array.isArray(data) ? data : [] antes de cualquier llamada a .reduce(), .map() o .filter().

- **Regla Derivada:** **Defensive Data Handling**. Prohibido usar mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©todos de arreglo sobre datos de API sin validaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n previa con Array.isArray(). Codificado en AGENTS.md y PRD_MASTER.md.



### 64. Redundancia CrÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tica en Historial de Precios ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ 2026-03-02



- **Problema:** La base de datos alcanzÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ 1.42 GB (lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­mite plan 1.1 GB) debido a la tabla 'price_history'.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** Scrapers guardaban el precio diario de 30,000+ cartas incluso si el precio no variaba, generando un 95% de redundancia.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** DeduplicaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n tÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©cnica e implementaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gica diferencial en 'sync_cardkingdom_api.py'.



### 65. IntegraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de ManaBox y PriorizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Scryfall ID (Marzo 2026)



- **Problema**: La importaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n por nombre/set puede fallar en cartas con nombres similares o mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºltiples versiones (promos, showcase).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Implementar una detecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n automÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡tica de encabezados en el frontend (ManaBox ID, Scryfall ID) y priorizar la bÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºsqueda por scryfall_id en el backend. Esto garantiza una precisiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n del 100% y evita el mapeo manual.

- **NormalizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Las condiciones de ManaBox (e.g.

ear_mint, lightly_played) deben normalizarse en el backend a cÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³digos internos (NM, LP) para mantener la integridad de la base de datos.

- **UX**: Una pre-visualizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n que use los mismos ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ndices de mapeo que la lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gica de parseo evita confusiones visuales en el proceso de importaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.



### 66. Soporte de FoliaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n (Finish) y AgregaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n en Lotes (Marzo 2026)



- **Problema**: Errores `ON CONFLICT` al intentar importar la misma carta en versiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n Foil y Non-Foil en un mismo lote, y fallos de visualizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de precios/stock para versiones foil.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: La restricciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de unicidad en la tabla `products` no incluÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a la columna `finish`. AdemÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s, la lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gica de importaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n no consolidaba duplicados dentro del mismo batch antes de enviarlos a la DB.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - **DB**: Agregar columna `finish` y actualizar la restricciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºnica a `(printing_id, condition, finish)`.

  - **Edge Function**: Implementar un diccionario de agregaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n en el `tcg-api` que sume cantidades de filas idÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©nticas (mismo printing+condition+finish) antes del `upsert`.

  - **Vistas**: Actualizar `products_with_prices` para incluir la columna `finish` y asegurar que el frontend reciba este metadato.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/LEYES_DEL_SISTEMA.md) -> Regla de Negocio 3 (AgregaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n en Lotes).



### 67. Fuentes Locales Sin Archivo = 404 Silencioso en Build ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-03



- **Problema**: La app en produccion generaba `GET /fonts/Daito.woff2 404` en la consola del navegador.

- **Causa Raiz**: Declaraciones `@font-face` en `index.css` referenciaban archivos con `url('/fonts/...')` que nunca existieron en `frontend/public/fonts/`. El build de Vite compila sin errores aunque los archivos no existan.

- **Solucion**: Eliminar `@font-face` locales e importar `Cinzel` y `Cinzel Decorative` de Google Fonts como fallbacks premium.

- **Regla Derivada**: Toda fuente en `@font-face` con `url('/fonts/...')` DEBE tener su archivo fisico. Si no esta disponible, usar Google Fonts. Documentar el original como comentario en el CSS.



### 18. Toggle Variant UI y CardKingdom Pricing



- **Problema:** Los botones de variante Foil/Normal quedaban habilitados sin stock disponible (o no funcionales), y el precio 'Mercado Externo' (MKT) fusionaba foil y normal mostrando el mismo valor para ambas versiones.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** La UI dependÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a del atributo disabled basado en la *ausencia* de datos, pero no comprobaba stock === 0. AdemÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡s, pi.ts usaba genericamente vg_market_price_usd para variantes sintÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ticas sin bifurcar adecuadamente entre prices.usd y prices.usd_foil.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** Implementar renderizado condicional ({condition && <button>}) u ocultamiento via JS para variantes inexistentes, aÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±adir validaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n disabled={(stock || 0) === 0} para variantes existentes pero agotadas. En pi.ts, asignar prices.usd a nonfoil y prices.usd_foil a foil explÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­citamente al expandir el objeto ll_versions.

- **Regla Derivada:** UI de variantes en E-commerce fÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­sico: Si no existe variante, oculta el UI. Si existe pero no hay stock, deshabilita la UI (opacity-50). Los precios externos siempre deben extraer las propiedades separadas (usd vs usd_foil) del provider base.



### 67. ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Pydantic v2 (SettingsConfigDict)



- **Problema**: pydantic-settings generaba errores (como Config error o validaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n fallida) al intentar heredar de BaseSettings y usar una clase interna Config.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Con la introducciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Pydantic v2, la declaraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de configuraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n mediante subclases Config quedÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ obsoleta a favor de model_config.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Usar model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8') dentro de la clase Settings.

- **Regla Derivada**: Siempre actualizar los esquemas de configuraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n a las convenciones de Pydantic v2 para garantizar soporte continuo y evitar problemas con pytest y builds.



### 68. EnvÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­o AsÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ncrono de Correos en FastAPI



- **Problema**: Realizar el envÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­o de correos (ej: servidor SMTP) de manera sÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ncrona dentro del path operator del carrito de compras introducÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­a latencias inaceptables en la respuesta (checkout), degradando la experiencia de usuario.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: La operaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de red con SMTP bloquea el hilo principal si no se delega a una tarea de fondo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Delegar el envÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­o a tareas asÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ncronas no bloqueantes. En este caso se empleÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ syncio.create_task() (tambiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©n se puede usar BackgroundTasks de FastAPI) para despachar correos (al cliente y admin) inmediatamente antes de devolver la respuesta 200 OK.

- **Regla Derivada**: Cualquier integraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n con servicios externos de notificaciones en rutas sensibles debe ser wait de una tarea en fondo o despachado asÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­ncronamente para mantener latencias < 500ms.



### 23. Prioridad de IntenciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n del Usuario sobre DocumentaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n EstÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡tica ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¯Ã‚Â¿Ã‚Â½ 2026-03-05



- **Problema:** El PRD y otros documentos de diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o especificaban vincular el botÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de correo a una landing de Mailchimp, pero el usuario reportÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ esto como un error.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z:** DocumentaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de diseÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±o obsoleta que no fue actualizada tras cambios en la estrategia de marketing del cliente.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n:** Priorizar la comunicaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n directa del usuario sobre lo escrito en docs/. Implementar `mailto:info@geekorium.shop` directamente.

- **Regla Derivada:** En caso de contradicciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n entre un documento `docs/*.md` y una instrucciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n directa del usuario en el chat, el chat siempre tiene la razÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n. Marcar la discrepancia en el log para futura actualizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de docs.



### 24. JerarquÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a de ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n SMTP (Mar 2026)



- **Problema**: Los correos no se enviaban porque las credenciales estaban en frontend/.env pero el backend las buscaba en la raÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Los operativos backend (FastAPI/Python) suelen buscar el archivo .env en la raÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z del proyecto. Las configuraciones compartidas o crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas de backend deben centralizarse allÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ para ser accesibles.



### 25. Seguridad de Secretos en ProducciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (Mar 2026)



- **Problema**: Hardcodear secretos en .env es un riesgo de seguridad en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en pydantic.BaseSettings (usando model_post_init) para asegurar que variables como SMTP_PASSWORD se provean via entorno del sistema y no vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a archivo fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico en modo production.



### 27. OptimizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Storage y DecisiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Ocultar Features (Mar 2026)



- **Problema**: El flujo de carga de comprobantes de pago disparaba el uso de cuota de Supabase Storage de forma acelerada.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Carga de archivos binarios (imÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡genes) en cada transacciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, lo que podrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a agotar la cuota gratuita/pagada sin un valor de negocio crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tico inmediato (ya existe flujo WhatsApp).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: En proyectos con restricciones de cuota, es mejor ocultar features de alto consumo de storage ("payment-proofs") y delegar la validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n al canal asistido (WhatsApp) que ya se utiliza para el cierre de venta.

- **AcciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Se comentÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ el componente de carga en `OrderTrackingPage.tsx` y se eliminÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ la migraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de creaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n del bucket.



### 28. Checkout AtÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mico y Desacoplamiento de Schema (Mar 2026)



- **Problema**: El flujo de checkout fallaba silenciosamente ("Orden no encontrada") a pesar de que el carrito se vaciaba.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El RPC `create_order_atomic` intentaba insertar un valor en la columna `product_name` de `order_items`, la cual no existÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a en el schema de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n. El admin funcionaba porque usaba un JOIN dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡mico, ocultando la inconsistencia.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Se aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ la columna `product_name` a `order_items` para persistir el nombre del producto en el momento de la compra (snapshotting) y se habilitaron permisos pÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºblicos (anon/authenticated) para el rastreo.

- **Regla Derivada**: En flujos atÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³micos (RPC), cualquier error de schema en una sub-tabla cancela toda la transacciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n. Siempre verificar que las columnas usadas en el RPC existan en todas las tablas afectadas.



### 29. Hosting para E-commerce: Cloudflare Pages vs. GitHub Pages (Mar 2026)



- **Problema**: GitHub Pages prohÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­be explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente el uso comercial en su capa gratuita, lo que pone en riesgo sitios de venta directa como Geekorium.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Migrar a **Cloudflare Pages**.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Cloudflare Pages permite oficialmente uso comercial en su plan gratuito y ofrece ancho de banda ilimitado, eliminando riesgos de costos por trÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡fico de imÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡genes pesadas (cartas TCG).

- **SPA Routing**: Cloudflare usa un archivo `_redirects` en `public/` con la regla `/* /index.html 200` para manejar rutas de React de forma nativa.



### 30. Estrategia de Branching y CI/CD (Mar 2026)



- **Problema**: Desplegar directamente desde `main` sin un entorno de previsualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n aumenta el riesgo de errores en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Adoptar un modelo de `dev` (Preview) y `main` (Production).

- **Flujo**: Cloudflare Pages genera despliegues automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticos para cada rama. Los cambios se validan en la URL de preview de `dev` antes de ser incorporados a `main` vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a Pull Request para el despliegue final.



### 31. Cloudflare Pages vs. Workers para Frontend ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema:** ConfusiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en el dashboard de Cloudflare al intentar desplegar un frontend de React usando la secciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de "Workers".

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Los **Workers** son para lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica serverless (scripts), mientras que **Pages** es la herramienta diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ada para hosting de sitios estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticos (Vite, React). Siempre usar la pestaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±a "Pages" para el despliegue del frontend.



### 32. SEO Condicional vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a Variables de Entorno de Vite ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema:** Necesidad de activar SEO (meta tags y robots) solo en la rama de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (`main`) y ocultar el sitio en desarrollo/preview (`dev`).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Usar placeholders `%VITE_SEO_...%` y `%VITE_ROBOTS%` en `index.html`.

- **ConfiguraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:**

  - **Prod:** `VITE_ROBOTS=index, follow`

  - **Dev/Preview:** `VITE_ROBOTS=noindex, nofollow`

- **Ventaja:** Permite inyectar SEO real solo en el dominio productivo sin aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir dependencias pesadas de React.



### 33. Root Directory en Estructuras Monorepo/Subcarpetas ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema:** El build fallaba en Cloudflare porque intentaba buscar `package.json` en la raÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z del repo.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** En proyectos donde el frontend reside en una subcarpeta (ej: `/frontend`), es OBLIGATORIO configurar el **Root Directory** en el dashboard de Cloudflare para que el proceso de build se ejecute en el contexto correcto.



### 34. Conflicto de Auto-detecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (Vite vs. VitePress) en Cloudflare ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema:** Cloudflare Pages intentaba usar un preset de "VitePress" en lugar de "Vite" debido a la presencia de archivos de documentaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n o nombres similares, lo que resultaba en errores 404 por rutas de assets incorrectas.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Configurar explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente el **Framework Preset** como **"None"** en el dashboard de Cloudflare. Esto obliga al sistema a usar solo el comando de build (`npm run build`) y el directorio de salida (`dist`) especificado, sin suposiciones de frameworks adicionales.



### 35. SPA Routing: `404.html` vs `_redirects` en Cloudflare Pages ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema:** El uso de un archivo `_redirects` con la regla `/* /index.html 200` puede generar advertencias de "Redirect Loop" en el dashboard de Cloudflare si se combina con redirecciones de dominio (ej. HTTP -> HTTPS).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** El mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©todo mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s robusto para SPAs en Cloudflare Pages es la estrategia de **`404.html` fallback**. Al copiar el `index.html` generado al archivo `404.html` durante el build, Cloudflare servirÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ la aplicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n para cualquier ruta no encontrada, permitiendo que el router de React tome el control sin generar avisos de bucle.



### 36. GestiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Multi-entorno de Base de Datos (Supabase) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema**: Riesgo de contaminar datos de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n o romper el schema productivo durante el desarrollo de nuevas features.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Segregar bases de datos usando proyectos independientes de Supabase vinculados a las ramas de Cloudflare.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: La mejor forma de manejar mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples bases de datos en un SPA desplegado en Cloudflare Pages es mediante **Environment Overrides**. Al configurar variables como `VITE_SUPABASE_URL` de forma distinta para los entornos de "Production" y "Preview", la aplicaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n se conecta automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticamente al proyecto de Supabase correcto basado en el branch desde el que se desplegÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³.

- **Edge Functions**: Es crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tico recordar que las Edge Functions y sus secretos deben sincronizarse manualmente (o vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a CLI link) en ambos proyectos, ya que son entornos aislados.



### 37. Restricciones de Despliegue en GitHub Environments ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema**: El despliegue de la rama `dev` fallaba con "Branch is not allowed to deploy due to environment protection rules".

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Los repositorios de GitHub con "Environments" (ej: `github-pages`) suelen restringir los despliegues solo a `main` por defecto en la secciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n "Deployment branches and tags".

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Ajustar la configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n del Environment en GitHub Settings para permitir todas las ramas ("No restriction") o aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente la rama `dev`.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Al habilitar un nuevo entorno de hosting (como GitHub Pages para `dev`), el primer despliegue fallarÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ si no se actualizan los permisos de rama en el Dashboard de GitHub.



### 38. RefactorizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de IDs de Proyecto Supabase ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-07



- **Problema**: El uso de IDs de Supabase hardcodeados en URLs de Edge Functions impedÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a que la rama `dev` conectara con su propia instancia de base de datos.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Reemplazar todos los IDs estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticos por la variable de entorno `VITE_SUPABASE_PROJECT_ID`.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Para sistemas multi-entorno, el ID del proyecto debe tratarse como un secreto dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡mico inyectado por el hoster, igual que la URL y la Anon Key. Esto garantiza que el frontend siempre hable con el backend correcto segÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn su origen.



### 39. PriorizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Card Kingdom sobre Goldfish (Marzo 2026)



- **Problema**: Inconsistencias de precios por uso de mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples fuentes de mercado externo sin una jerarquÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a clara.

- **DecisiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Card Kingdom es ahora la fuente de verdad ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnica para precios de mercado externo. Se eliminÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ el uso de la tabla `aggregated_prices` (Goldfish).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Mantener sistemas de fallback complejos a fuentes de datos obsoletas introduce "ruido" en la valoraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n y dificulta el debugging. La simplicidad de una sola fuente (CK) mejora la fiabilidad.

- **ImplementaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Si el precio de la tienda (`Geekorium`) es nulo, el sistema siempre debe recurrir al precio actual de Card Kingdom (`price_history`).



### 40. Limpieza de Selects en Supabase (Frontend & Backend) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ Marzo 2026



- **Problema**: Al realizar cambios en la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de negocio (como remover una tabla), es fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡cil olvidar limpiar los strings de `select()` en el frontend (`api.ts`) o backend.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Los errores de "Property X does not exist" en el frontend suelen deberse a proyecciones incompletas en la llamada de Supabase. Siempre verificar que todos los campos necesarios (incluyendo `stock`, `is_foil`, etc.) estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©n presentes en el string de `select` tras una refactorizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **AcciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Se restaurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ la columna `stock` en `fetchCardDetails` que se habÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a omitido accidentalmente durante la limpieza de Goldfish.



### 41. SimplificaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n de Precios y Reversa de Branding (Marzo 2026)



- **Problema**: Estrategia de precios confusa que mezclaba mÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºltiples fuentes y condiciones. Intento errÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³neo de "limpiar" el branding de Geekorium.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: El usuario aclarÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ que la prioridad era usar **Card Kingdom NM** como fuente ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºnica de verdad para los precios de Geekorium, y que el branding original debe conservarse intacto.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**:

  - Refactorizar lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³gica de precios en `ValuationService`, Edge Functions y DB para filtrar estrictamente por 'NM' de Card Kingdom.

  - Revertir cualquier cambio en el nombre de la marca ("Geekorium", "Geekorium El Emporio") en el frontend y servicios de email.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: La simplicidad en los precios agiliza la operaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n. Nunca asumir que el branding debe "profesionalizarse" si el usuario no lo pide; respetar la identidad establecida es crÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­tico.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Regla 1 (Precios de Geekorium): Solo precios NM de Card Kingdom.

392:

393: ### 42. High-Performance SQL Bulk Updates (Marzo 2026)

394:

395: - **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.



### 42. High-Performance SQL Bulk Updates (Marzo 2026)



- **Problema**: Large `UPDATE` statements using correlated subqueries cause statement timeouts and database lock contention on tables with 100k+ rows.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­z**: Nested loops over the target table and the subquery for every row.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Use `UPDATE FROM` with a Common Table Expression (CTE). Pre-calculate all prices in memory and join them to the target table in a single pass.

- **Regla Derivada**: Bulk metadata updates in Supabase must use the `CTE + UPDATE FROM` pattern.



### 43. Defensive API Path Normalization (Marzo 2026)



- **Problema**: Edge Functions returning 400 or 500 errors intermittently due to unexpected URL prefixes (e.g., `/functions/v1/api/`) or trailing slashes added by some clients/proxies.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Implement a robust "strip and normalized" loop at the start of the Edge Function to remove multiple prefixes and standardize endpoints to a base path (e.g., `/api/sets`).

- **Regla Derivada**: Edge Functions must be agnostic to deployment-specific URL prefixes.



### 44. ConexiÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n Segura a Supabase Pooler (Marzo 2026)



- **Problema**: "Connection timed out" o "Host not found" al intentar conectar scripts de Python externos a la DB de producciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.

- **Causa**: Intentar usar el host del dashboard o la IP directa que puede estar bloqueada o rotada.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Usar el **Transaction Pooler** (Puerto 5432 o 6543). El host debe ser `[region].pooler.supabase.com` y el usuario DEBE incluir el Project Ref (`postgres.[project-ref]`).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Siempre configurar el `DATABASE_URL` con el pooler para scripts de mantenimiento masivo de larga duraciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n.



### 45. Estrategia de Batched Updates para DenormalizaciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n (Marzo 2026)



- **Problema**: Actualizar columnas denormalizadas (`avg_market_price_usd`) en una tabla de 200k+ registros fallaba consistentemente por `statement timeout`.

- **Causa**: El planificador de Postgres intentaba un Sequential Scan masivo con subconsultas correlacionadas.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n**: Implementar un script de Python que procese la tabla por IDs primarios en lotes (ej. 1,000 registros). Esto libera el bloqueo de tabla entre lotes y evita que el proceso supere el lÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â­mite de tiempo de una transacciÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³n individual.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Si una migraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n SQL tarda mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s de 30s en Postgres de Supabase, no forzar el timeout; mover la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica a un batch script externo.



### 46. Correct Denormalization Level (Per-Printing vs. Per-Card) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-10



- **Problema**: Al denormalizar precios (`avg_market_price_usd`) en la tabla `cards`, todas las versiones de una carta (ej. Pandemonium de *Exodus* vs. *The List*) mostraban el mismo precio, perdiendo la precisiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n por versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Una carta (`card_id`) puede tener mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples impresiones (`printing_id`) con precios drÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡sticamente diferentes. Denormalizar a nivel de carta colapsa esta distinciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Mover la columna denormalizada a `card_printings`. Actualizar Materialized Views y RPCs para unir por `printing_id` en lugar de `card_id` cuando se trate de precios.

- **Regla Derivada**: Nunca denormalizar datos que varÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an por ediciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n/acabado en la tabla maestra de cartas; usar siempre la tabla de impresiones.



### 48. Zero-Error Supabase Security Advisor (Mar 2026)



- **Problema**: Supabase Security Advisor reportaba mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples vulnerabilidades de RLS y riesgos en vistas con `SECURITY DEFINER`.

- **Causa**: Tablas de metadatos (sets, cards) y de usuario (orders, carts) carecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an de polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas de seguridad explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citas, exponiendo datos de negocio o de clientes. Vistas recreadas sin `security_invoker = true` bypassaban el RLS.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - Habilitar RLS en **todas** las tablas pÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºblicas (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

  - Definir polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas granulares: `SELECT` pÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºblico para metadatos (cards, sets) y `Owner-Only` para datos sensibles (user_watchlist, user_addresses) usando `auth.uid()`.

  - Configurar vistas con `security_invoker = true` para asegurar que respeten los permisos del usuario que consulta.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Un estado de "Zero Errors" en el Security Advisor no solo es una mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©trica de cumplimiento, sino una garantÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a de que el acceso a datos estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ controlado por polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas y no por la configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n por defecto del motor.



441: ### 49. RLS Policies for Guest Checkout (Mar 2026)

442:

443: - **Problema**: Habilitar RLS en tablas de carrito (`carts`, `cart_items`) y pedidos (`orders`) rompe el flujo de "Guest Checkout" si se restringe el acceso solo a usuarios autenticados.

444: - **Causa**: Los usuarios anÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³nimos (`anon`) necesitan interactuar temporalmente con sus propios datos sin una sesiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Supabase Auth persistente.

445: - **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas permitiendo `INSERT` a `anon` y `SELECT` basado en el `id` del carrito o pedido si el usuario posee la referencia (ej: ID en localStorage). Para `orders`, permitir `SELECT` pÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºblico pero restringido por ID para seguimiento.

446: - **Regla Derivada**: Siempre validar que las polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas de RLS no bloqueen flujos de usuarios no autenticados vitales para la conversiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de venta.

447:

448: ### 50. Branding Asset Synchronization & Consistency (Mar 2026)

449:

450: - **Problema**: Discrepancia entre los archivos de diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o en `docs/logos/` y los assets servidos en `frontend/public/branding/`, resultando en logotipos desactualizados o inconsistentes.

451: - **Causa**: Falta de un flujo de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n definido; los componentes de React referenciaban archivos antiguos (ej: `Logo.jpg` en lugar de `Logo.png`).

452: - **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

453:   - Establecer `docs/logos/` como la fuente de verdad.

454:   - Sincronizar manualmente (o vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a script) a `frontend/public/branding/`.

455:   - Refactorizar todos los componentes frontend (`Footer`, `Home`, `WelcomeModal`, `HelpPage`, `LegalPage`) para usar el nuevo path y extensiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

456:   - Actualizar `index.html` para el favicon y apple-touch-icon.

457: - **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: La identidad visual debe tratarse como cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo; cualquier cambio en el "Source of Truth" de diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o requiere una auditorÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a de referencias en todo el frontend para garantizar la integridad visual de la marca.



### 51. Fallback Matching by Collector Number (CardKingdom Sync) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: El script de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de CardKingdom fallaba al actualizar precios para ediciones especiales (ej. TMNT, PZA) debido a IDs de Scryfall faltantes o discrepantes.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: No siempre hay un mapeo 1:1 de `scryfall_id` en el catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo de CardKingdom para sets promocionales o de colaboraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar una lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de respaldo (fallback) que extraiga el `collector_number` del SKU de CardKingdom (ej. "TMT-0017" -> "17") y realice el match combinando `set_name` + `collector_number`.

- **Regla Derivada**: Todo script de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de precios externo debe tener un mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©todo de match de respaldo basado en metadatos fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sicos (set + nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºmero) si el ID ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnico del proveedor falla.



### 52. UnificaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Archivos de Entorno (.env) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: Discrepancias de llaves (especialmente `SUPABASE_SERVICE_ROLE_KEY`) y corrupciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de archivos debido a mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples archivos `.env` (raÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z y frontend/).

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: DesincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n manual entre archivos y herramientas (Vite vs Python) buscando configuraciones en lugares distintos.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Centralizar todas las variables en un ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnico `.env` en la raÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z. Configurar Vite con `envDir: '../'` para leer desde la raÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: En monorepos pequeÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±os o proyectos con subcarpetas, un solo archivo de entorno en la raÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z garantiza que todos los servicios (Frontend, API, Scripts) operen sobre la misma "fuente de verdad".



### 53. GestiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Procesos HuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rfanos en SincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: Errores intermitentes de `Invalid API Key` o falta de actualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de datos a pesar de aplicar correcciones en el cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo y el `.env`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Procesos de Python persistentes en segundo plano que mantienen versiones obsoletas de las variables de entorno o que bloquean conexiones a la base de datos.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Antes de reintentar sincronizaciones crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas tras cambios en la configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, es obligatorio listar y terminar procesos huÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rfanos (`Stop-Process -Name python -Force`).

- **Regla Derivada**: (Codificada en LEYES_DEL_SISTEMA.md) Todo cambio estructural en configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n requiere un reinicio limpio de servicios y procesos de mantenimiento.



### 54. Robustez en Scripts de DiagnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³stico (Supabase SQL vs API) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: Scripts de diagnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³stico rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡pido fallan por `APIError` al intentar realizar joins complejos (`table.select('*, cards(name)')`).

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Restricciones de aliasing en la API PostgREST o desconfiguraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n momentÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡nea de relaciones en el cliente Python.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Para verificaciones manuales rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡pidas, preferir consultas SQL directas vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a `psycopg2` o realizar selecciones simples de IDs y resolver relaciones programÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticamente.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: La simplicidad en el diagnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³stico previene falsos negativos causados por la propia herramienta de prueba.



### 55. Variables SEO de Vite No Reemplazadas en ProducciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: El tab del navegador mostraba literalmente `%VITE_SEO_TITLE%` en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (`geekorium.shop`).

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Los placeholders `%VITE_*%` en `index.html` solo son reemplazados por Vite durante el build si la variable estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ definida como env var en ese momento. Las variables `VITE_SEO_TITLE`, `VITE_SEO_DESCRIPTION`, `VITE_SEO_KEYWORDS`, `VITE_SEO_IMAGE` y `VITE_APP_URL` nunca fueron configuradas en el dashboard de Cloudflare Pages ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Environment Variables ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Production.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Hardcodear los valores SEO estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticos directamente en `frontend/index.html`. Mantener solo `%VITE_ROBOTS%` como placeholder (para controlar indexaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n por entorno: `index, follow` en prod, `noindex, nofollow` en dev).

- **Variables faltantes descubiertas en Cloudflare**: `VITE_SUPABASE_PROJECT_ID` y `VITE_ROBOTS`.

- **Regla Derivada**: Auditar `index.html` en cada setup de proyecto nuevo. Todo `%VITE_*%` que no estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© en el dashboard del hosting es un bug silencioso. Las metas SEO estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticas (tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tulo, descripciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de marca) deben hardcodearse; las dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micas por entorno (robots, URL canÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³nica) se parametrizan.

- **Google Search Console**: Para que Google indexe un sitio nuevo, NO basta con tener `robots: index, follow`. Se requiere verificar el dominio en GSC (via registro TXT en DNS de Cloudflare) y enviar el sitemap manualmente. Sin esto, el crawl puede tardar semanas o no ocurrir.



### 56. Error de "Migration Mismatch" en Supabase CI/CD (GitHub Actions) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: El pipeline `supabase/setup` en GitHub Actions fallaba con "Migration mismatch" al intentar hacer push o reset a la base de datos de Preview.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Borrar o renombrar archivos de migraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n localmente no elimina sus registros histÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ricos de la DB remota en Supabase (`supabase_migrations.schema_migrations`). El CLI detecta esta divergencia y aborta.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Ir al SQL Editor del proyecto Supabase remoto y hacer `DELETE FROM supabase_migrations.schema_migrations WHERE version = 'VERSION_HUERFANA';` para alinear la DB con los archivos locales antes de re-ejecutar el pipeline.

- **Regla Derivada**: Nunca eliminar scripts de migraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n que ya se ejecutaron en un entorno alojado, a menos que tambiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©n se purgue su huella en la tabla interna de Supabase o se haga un reset completo desde cero.



### 57. Sobrecritura Incompleta en Patrones de Fallback API a Supabase ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: Una carta Foil obtenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a el precio de `$5.99` (precio Normal) en lugar de `$59.99` (precio Foil) en el frontend.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: En `api.ts`, una respuesta exitosa pero incompleta desde FastAPI llenaba la propiedad `data.all_versions` con objetos sin `finish` ni `avg_market_price_foil_usd`. Aunque se detectaba que faltaba data (`apiVersionsLackFinishData`), la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica saltaba el *query de Supabase fallback* porque la condiciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n original era `if (!data.all_versions || data.all_versions.length === 0)`.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Cuando se detecta data incompleta (e.g., `apiVersionsLackFinishData`), es obligatorio vaciar el atributo base explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente (`data.all_versions = []` o `delete data.all_versions`) antes del chequeo condicional del fallback para forzar la re-evaluaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n estructurada desde la base de datos directa.

- **Regla Derivada**: En patrones donde un API proxy falla/devuelve data parcial y el frontend tiene un fallback directo a la DB de Supabase, la data parcial errÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³nea DEBE purgarse por completo en memoria. Mezclar las respuestas (`{...baseData, ...data}`) sin purgar provoca cortocircuitos lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gicos en la UI.



### 58. Unicidad FÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sica y React Keys en RPCs de Inventario ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: El frontend mostraba duplicados exactos (ej. 2 cartas idÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©nticas) o sobreescribÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a variantes al renderizar resultados de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda si no habÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a distinciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n entre foil y nonfoil en la respuesta del RPC `get_products_filtered`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: En la tabla `products`, las variantes Foil y Nonfoil del mismo `printing_id` estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡n separadas. Sin embargo, si el RPC no retorna la columna `finish`, el frontend las mapeaba ambas usando unicÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡mente `printing_id` como React Key, causando advertencias de UI de claves duplicadas, sobreescritura de cartas, y perdiendo el estado visual "Foil".

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Asegurarse de que el RPC recupere la columna `finish` (`LOWER(COALESCE(p.finish, 'nonfoil')) as finish`) y utilizarla en el frontend para generar un React Key ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnico (`${printing_id}-${finish}`). Adicionalmente, pasar `is_foil` explicitamente al componente derivÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ndolo de `finish`.

- **Regla Derivada**: Todo RPC que retorne listas de inventario fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico TCG debe siempre exponer y proyectar los diferenciadores fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sicos (ej. `finish`, `condition`) al frontend para garantizar unicidad garantizada en las visualizaciones de React y posibilitar lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica UI condicional.



### 59. Recarga de CachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© PostgREST y Precios Ramificados en RPCs ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-11



- **Problema**: Tras aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir la columna `finish` al RPC `get_products_filtered` en la base de datos de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n mediante un script SQL directo, el frontend seguÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a recibiendo la respuesta antigua (sin `finish`) y mostrando precios incorrectos para las versiones Foil.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**:

  1. PostgREST (la capa API de Supabase) mantiene un cachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© del schema de la base de datos. Los cambios directos en funciones SQL no invalidan este cachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticamente, lo que provoca que la API siga retornando la firma antigua de la funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

  2. Inicialmente, no se considerÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ que el precio a mostrar (*market price*) debe ramificarse dependiendo del *finish*. La consulta SQL usaba `avg_market_price_usd` de forma genÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rica para todas las variantes.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  1. Ejecutar `NOTIFY pgrst, 'reload schema';` inmediatamente despuÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s de alterar una funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n SQL cruda.

  2. Modificar el RPC para que el precio devuelto dependa inteligentemente de la variante fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sica que se va a imprimir en esa fila: `COALESCE(CASE WHEN LOWER(p.finish) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)`.

- **Regla Derivada**: Al desarrollar RPCs unificados de inventario TCG, la proyecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de la propiedad `price` no puede ser plana; **debe** ramificarse evaluando las banderas fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sicas (`finish`, y en el futuro `condition` o `language`). AdemÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s, cualquier parche SQL *hotfix* aplicado en vivo sobre Supabase requiere estrictamente recargar la capa API HTTP (`NOTIFY pgrst, 'reload schema'`).



### 60. Uso de Supabase CLI en Windows (npx) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-12



- **Problema**: El comando `supabase` falla con `CommandNotFoundException` si no estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ en el PATH global del sistema.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Usar siempre `npx supabase` para invocar el CLI local. Para despliegues remotos, es obligatorio incluir el flag `--project-ref [ID]` para evitar ambigÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼edades si el enlace local (`.supabase/config`) no estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ sincronizado.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla TÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cnica (Herramientas CLI).



### 61. SincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Edge Functions Duplicadas ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-12



- **Problema**: Desplegar una funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n corregida (ej. `api`) no solucionaba el problema en todas las partes del sitio (ej. Admin o Import) porque existÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a otra funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n idÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ntica con distinto nombre (`tcg-api`) desplegada previamente.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Durante fases de transiciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n o refactorizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de nombres de funciones, es Mandatorio sincronizar el cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo en ambas carpetas (`api/` y `tcg-api/`) antes del despliegue para garantizar consistencia en todo el ecosistema.

- **Regla Derivada**: Evitar la fragmentaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica compartida; si dos Edge Functions hacen lo mismo, deben eliminarse o mantenerse estrictamente en espejo hasta la migraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n total.



### 62. LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de Pedidos "Por Encargo" (Stock 0) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-12



- **Problema**: El sistema bloqueaba la venta de cartas sin stock fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico, limitando el e-commerce solo a lo disponible en preventa o inventario actual.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - **Bypassing**: Modificar RPC `add_to_cart` para ignorar la validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de `stock_actual` si el producto permite pedidos on-demand.

  - **CreaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n On-the-fly**: Si una variante (Foil/NM) no existe en la tabla `products`, el RPC debe crearla con stock 0 en lugar de fallar, permitiendo que el usuario la "encargue".

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 4 (Soporte Por Encargo).



### 68. Discrepancia de Stock "8 fuera / 1 dentro" (Marzo 2026)



- **Problema**: El buscador mostraba stock disponible, pero el modal mostraba "Por encargo".

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Uso de IDs sintÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ticos en el frontend (`uuid-foil`, `uuid-nonfoil`) que no coincidÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an con el `printing_id` real al consultar el stock por RPC.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Refactorizar `api.ts` para extraer el base UUID (stripping suffixes) antes de filtrar el resultado del RPC de stock.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Las llaves de React y los IDs de navegaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n pueden ser sintÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ticos para garantizar unicidad visual, pero los queries de datos de negocio (stock, precio) DEBEN trabajar sobre el ID canÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³nico de la base de datos.

- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `fetchCardDetails` ahora normaliza los IDs antes del mapeo de stock.



### 23. Prioridad de Precios: Mercado vs Inventario ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-12



- **Problema**: Cartas en stock mostraban precio de $0.00 o "---" en el modal, aunque en la bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda se veÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a el precio correcto ($24.99).

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: En `api.ts`, la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de mezcla de datos de inventario usaba el operador `??` (nullish coalescing), lo que permitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a que un valor de `0` en la tabla `products` (precio no seteado manualmente) sobrescribiera el `market_price` de la tabla `card_printings`.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Refactorizar la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica en `fetchCardDetails` para validar que el precio de inventario sea estrictamente mayor a 0 antes de usarlo como override.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Un precio de `0` en el inventario debe tratarse pedagÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gicamente como "sin precio manual" (fallback al mercado), no como "precio gratis". La lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de negocio debe ser consistente entre el listado (`get_products_filtered` RPC) y el detalle (`api.ts`).

- **Regla Derivada**: [api.ts](file:///c:/Users/carlo/OneDrive/Documents/Antigravity/TCG/frontend/src/utils/api.ts) -> `finalPrice` ahora valida `Number(exactProd.price) > 0`.



### 69. UnificaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Credenciales SMTP y SincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Edge Functions ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-12



- **Problema**: El envÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o de correos fallaba silenciosamente tras cambios en la configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n debido a discrepancias en los nombres de variables de entorno entre las funciones `api` (`SMTP_USERNAME`) y `tcg-api` (`SMTP_USER`).

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: FragmentaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo entre funciones duplicadas que realizan tareas similares y falta de logs de diagnÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³stico para la carga de secretos de Supabase.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - Unificar los nombres de variables a `SMTP_USERNAME` y `SMTP_PASSWORD` en todas las Edge Functions.

  - Sincronizar la lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de envÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o de notificaciones entre `api/index.ts` y `tcg-api/index.ts`.

  - AÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir logs de consola explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citos (`SMTP credentials loaded: true/false`) para facilitar el debugging en el dashboard de Supabase.

- **Regla Derivada**: Las variables de entorno para infraestructuras compartidas (SMTP, API Keys) deben seguir un esquema de nombrado ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnico en todo el proyecto. Cualquier cambio en una Edge Function "espejo" debe replicarse inmediatamente en la otra.



### 70. Price Fallback Chain & Starred Collector Numbers ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-12

- **Problema:** Cartas en stock mostraban "S/P" (Sin Precio) a pesar de tener datos de mercado en otras versiones.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z:** Existencia de versiones duplicadas (con "ÃƒÆ’Ã‚Â¢Ãƒâ€¹Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦" en el nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºmero de coleccionista) que carecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an de metadatos de precio, mientras que la versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n base sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ los tenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a. El buscador devolvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a la versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n sin precio.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:**

  1. Refactorizar el RPC `get_products_filtered` con una cadena de fallback: `Market(Finish) -> Market(Nonfoil) -> Market(Foil) -> Store Price -> 0`.

  2. Ejecutar un script de correcciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de datos para copiar precios de versiones base a versiones starred.

- **Regla Derivada:** Todo RPC de inventario debe implementar fallbacks de precio entre acabados (finish) para mitigar falta de metadata especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­fica.

### 71. LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de DetecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Foil y RemediaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Masiva (Marzo 2026)



- **Problema**: El sistema importaba casi todas las cartas como "Foil", incluso tierras duales de 3ED que no existen en ese acabado.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**:

  1. **Bug en Edge Function**: La lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica `finish.toLowerCase().includes('foil')` devolvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a true para "nonfoil" porque contiene la palabra "foil".

  2. **Data Inconsistente**: Miles de registros en `products` heredaron este error, ensuciando el inventario y la visualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - **CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo**: Refactorizar a `(finish === 'foil' || (finish.includes('foil') && !finish.includes('nonfoil')))` para exclusividad.

  - **DB**: Script PL/pgSQL masivo que:

    - Identifica cartas marcadas como `foil` que no soportan ese acabado segÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âºn `card_printings`.

    - Fusiona el stock con la versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n `nonfoil` si existe, o renombra la entrada en place.

    - Actualiza `order_items` y `cart_items` para mantener integridad referencial antes de borrar registros duplicados.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance y Datos). Las correcciones de finish deben considerar la tabla unida `card_printings`.

### 72. Ultra-Performance Filtering via Single-Table Denormalization (March 2026)



- **Problema**: Timeouts (500) y latencia alta en filtros complejos (Color, Tipo, Rareza) sobre tablas de 200k+ registros con mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples joins.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: La ejecuciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de joins dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micos en Supabase/PostgREST es costosa. Los ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndices en tablas relacionales no siempre compensan el overhead del planificador de Postgres en queries muy ramificadas.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: **Extrema DenormalizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**. Mover metadatos crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticos (`release_date`, `colors`, `set_name`, `type_line`) directamente a la tabla `products`. RediseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ar el RPC `get_products_filtered` para que sea un query de una sola tabla (`FROM products`).

- **SincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Usar un trigger `BEFORE INSERT OR UPDATE` en la tabla destino para poblar los datos, y triggers `AFTER UPDATE` en las tablas fuente para "tocar" los registros relacionados y forzar la sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n sin recursiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n infinita.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 6 (Performance). Si una query con Joins supera los 200ms, denormalizar metadatos a la tabla principal.



### 73. Frontend Request Cancellation with AbortController (March 2026)



- **Problema**: "Race conditions" visuales y sobrecarga del servidor al mover sliders de filtros (Precio/AÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±o) rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡pidamente. El servidor procesaba peticiones que el usuario ya no necesitaba.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Cada cambio en el estado disparaba un `fetch` asÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ncrono. Sin cancelaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, las respuestas podÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an llegar desordenadas o acumularse en el backend.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar `AbortController` en el hook `useEffect` de data fetching.

- **PatrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:



```typescript

useEffect(() => {

  const controller = new AbortController();

  fetchData(controller.signal);

  return () => controller.abort();

}, [filters]);

```



- **Regla Derivada**: Todo component de bÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºsqueda/filtrado masivo DEBE implementar `AbortController` para gestionar el ciclo de vida de las peticiones de red.

### 74. Robust Foil Matching & Finishes Array (March 2026)



- **Problema**: Cartas importadas como foil eran guardadas como non-foil por el RPC `bulk_import_inventory`, resultando en visualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n y precios incorrectos (ej. "Wan Shi Tong, Librarian").

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**:

  1. El RPC priorizaba el match por la columna `is_foil`, ignorando el array `finishes` usado por sets modernos (Avatar, etc.).

  2. Fallback de Scryfall: Algunas versiones (starred collector numbers) no tienen metadata de precio foil, causando confusiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en el matching si no hay una jerarquÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a clara.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - **Backend**: Actualizar RPC para que considere `requested_finish` vs (`is_foil` OR `finishes` array) con prioridad sobre la fecha de lanzamiento.

  - **Frontend**: Implementar una heurÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­stica de validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en `BulkImport.tsx` que detecta precios altos ($ > 50) en cartas marcadas como non-foil, lanzando un aviso de confirmaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 6 (ImportaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Robusta).

### 75. Non-Automatic Joins in Supabase Client ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-13

- **Problema**: `Could not find a relationship between 'orders' and 'profiles' in the schema cache` al intentar un join simple.

- **Causa**: Supabase PostgREST no detecta relaciones automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticas si los campos no tienen foreign keys explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citas en el schema real de Postgres o si hay ambigÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼edades en la cachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© del cliente.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Evitar joins forzados si no son necesarios. Para `orders`, los datos del comprador ya estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡n denormalizados en `guest_info` o `shipping_address`. Usar esos campos directamente es mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s resiliente.

- **Regla Derivada**: No asumir que `select('*, table(*)')` funcionarÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ siempre; verificar foreign keys en el schema antes de intentar joins profundos.



### 76. Email Priority in Orders ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-13

- **Problema**: El admin mostraba "N/A" en el correo del comprador.

- **Causa**: Se buscaba en `orders.user_email` (columna inexistente) o se intentaba unir con `profiles` (que no guarda emails en esta arquitectura).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: La jerarquÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a de email correcta es: `guest_info.email` -> `shipping_address.email`.

- **Regla Derivada**: Para ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rdenes de invitados y usuarios registrados, el email de contacto seguro reside en los metadatos de envÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o/invitado.



### 77. Inventory Zero-Price Integrity Sweep ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-03-13

- **Problema**: Productos "On-Demand" o con errores de importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n terminaban con precio $0.00 en el carrito.

- **Causa**: Falta de validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n reactiva en el momento de la inserciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n o desincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n con el mercado.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar barridos (sweeps) automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticos que busquen precios 0 y los reparen consultando `card_printings`.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla 7 (PrevenciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Zero-Price).



### 78. RemociÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Proactiva de Funcionalidades "On-Hold" (Marzo 2026)



- **Problema**: El inicio de sesiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n social (Google, Discord, Microsoft) fue solicitado para ser ocultado o puesto en "hold" para simplificar la experiencia de usuario inicial.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Cuando una funcionalidad secundaria se pone en pausa por decisiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n del usuario, no basta con comentarla si genera advertencias de lint o aumenta el peso muerto del cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo. Es preferible removerla limpiamente de la UI y los componentes asociados, manteniendo el estado de autenticaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n core intacto.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 8 (Simplicidad y Foco). Funcionalidades en hold deben ser removidas de la vista activa para evitar ruido visual y tÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©cnico.

- ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ **Visibilidad Condicional de Carrito**: El botÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n "AÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir al carrito" ahora estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ oculto por defecto en la vista general (grid/list) y solo es visible en el modal de detalles, mejorando la estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©tica de navegaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n masiva.

- ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ **Filtrado de Stock Robusto (Multi-capa)**: ImplementaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de limpieza de ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tems agotados directamente en `api.ts` y componentes de detalle. EliminaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n completa de versiones "Por Encargo" ($0.00) en el flujo de vista de stock.

- ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ **Ocultamiento de SecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Archivo**: Removida la pestaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±a de histÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rico para simplificar la UX. El sistema ahora opera exclusivamente sobre el inventario vivo (Marketplace).



### 79. Component Prop Drilling for Visibility Control (March 2026)



- **Problema**: Necesidad de implementar un patrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de `showElement` prop con un valor por defecto.

- **ImplementaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - `CardProps` ahora incluye `showCartButton?: boolean = false`.

  - Los padres (`CardGrid`) propagan este prop.

  - El modal de detalle (`CardModal`) lo ignora o lo fuerza a `true`, manteniendo la funcionalidad aislada.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Al rediseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ar visibilidad de componentes compartidos, usar props booleanos explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citos en lugar de lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gicas globales de estado si el cambio es puramente de visualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n contextual. Esto permite mayor flexibilidad sin efectos secundarios en otras partes de la app.

### 25. Ocultamiento de Features vs. EliminaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (Marzo 2026)



- **Problema**: El sistema de "Archivo" confundÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a a los usuarios reciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©n registrados.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Presencia de una funcionalidad de referencia histÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rica en un sitio de venta directa.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Para cambios de UX rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡pidos bajo presiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, ocultar el punto de entrada (`tabs`) y forzar el estado inicial (`activeTab`) es mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s seguro y rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡pido que eliminar cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo de fondo.

- **ImplementaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: En `Home.tsx`, forzar `activeTab: 'marketplace'`, retornar `null` en el botÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de toggle e ignorar el parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metro URL `?tab=reference`.

- **Integridad**: Mantener una rama de referencia (`v1.0-productiva`) antes de apagar funcionalidades importantes garantiza la reversibilidad total sin miedo a perder cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo legado.



### 81. AlineaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de IDs de Fuentes de Precios (Marzo 2026)



- **Problema**: Discrepancias en el historial de precios debido a mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples IDs (`1`, `21`) asignados a la misma fuente (Card Kingdom) en diferentes etapas del desarrollo.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Inconsistencia en scripts de raspado (scrapers) iniciales que no compartÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an una tabla de referencia de fuentes.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Estandarizar IDs de fuentes crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas: **16 para TCGplayer** y **17 para Card Kingdom**. Ejecutar scripts de alineaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (`align_everything.py`) para migrar registros histÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ricos al ID oficial y consolidar las tablas `sources` y `price_sources`.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 1. Todo script de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n debe usar el ID 17 para Card Kingdom de forma hardcodeada o mediante lookup en la tabla de referencia oficial.





### 82. Storefront Caching & Pricing Updates (April 2026)

- **Problema**: El inventario (products) fue actualizado exitosamente para eliminar productos con precio .00, pero la grilla en la tienda seguÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a mostrando .00.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: La visualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n principal del frontend depende de la Vista Materializada mv_unique_cards, la cual se alimenta de la tabla de catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo card_printings, no del inventario directo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Para que un ajuste de mercado se refleje visualmente, el script debe actualizar la columna de precios denormalizada en card_printings y luego ejecutar explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente REFRESH MATERIALIZED VIEW mv_unique_cards;.

- **Regla Derivada**: Todo update de pricing que deba verse en frontend requiere refrescar la vista materializada como ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltimo paso obligatorio.



### 83. Integridad en Egresos Masivos (Abril 2026)

- **Problema**: Riesgo de inconsistencia de stock al procesar archivos CSV con filas duplicadas o cantidades que exceden el stock disponible en un entorno multi-transaccional.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Si no se agrupan las cantidades por "Printing + Condition + Finish" antes de comparar con la DB, dos filas pequeÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±as podrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an pasar la validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n individualmente pero fallar la resta combinada, o generar errores de restricciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: 

- **AgregaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n Previa**: El RPC de validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (`preview_bulk_egress`) y ejecuciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n debe usar un CTE para sumar todas las cantidades del lote por nodo fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico antes de evaluar el stock.

  - **Aborto Transaccional**: La operaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de egreso debe ser atÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mica (una sola funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n RPC). Si una sola carta del lote falla la validaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de stock final (stock - pedido < 0), se debe lanzar una excepciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n para revertir el lote completo, evitando estados de inventario parciales.

- **Regla Derivada**: Todo proceso de baja de inventario debe registrarse obligatoriamente en `inventory_logs` con un motivo explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­cito para auditorÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a administrativa.



### 84. Frictionless WhatsApp Checkout (April 2026)

- **Concept**: Reducing a 2-step checkout to a single form by using "safe defaults" (CÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©dula, Address, etc.) for required backend fields while focusing the UI on Name, WhatsApp, and Email.

- **UI Logic**: Use of a dynamic "Confirm & Pay" button that remains disabled (grey) until the 3 mandatory fields are valid, then turns green with a glow effect.

- **Notification**: Email is mandatory as it's the primary channel for automated order confirmation, complementary to the manual WhatsApp flow.



### 85. Branding & "Secret" Access (April 2026)

- **Pattern**: Hiding "Login" buttons from the public view during BETA to prioritize conversion and reduce unauthorized support requests.

- **Implementation**: Providing a "Secret Link" (`/geeko-login`) for the internal team instead of a UI-hidden button.

- **UX**: Updating the restricted route handler (`AdminRoute`) to provide a helpful "Restricted Access" screen with a link to the secret login, improving internal use while keeping public users away.



### 86. WhatsApp Itemized Order Detail ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ Regression Risk (April 2026)

- **Problema**: After a UX simplification session (April 6), the WhatsApp redirect message was reduced to aggregate counts ("Normal: 5, Foil: 2"), losing the per-card breakdown. This blocked operational review of orders.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Frictionless checkout improvements over-simplified the WA message to reduce message length, inadvertently removing data needed by the store team.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Restore the itemized format: `ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ Qty x Name [SET] [FINISH] - $Total`. Cap at 40 items and append an overflow note directing to email for full detail.

- **Regla Derivada**: The WhatsApp message is the PRIMARY operational channel for the Geekorium team. It MUST always include a per-card breakdown. Simplification of the checkout form must NEVER simplify the order detail sent to the store.



### 87. PDF Receipt via New Window (No Library) (April 2026)

- **Problema**: `window.print()` called on the main checkout page produced an unstyled browser print of the entire app UI, not a real comprobante.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: `generateReceiptHTML()` in `CheckoutSuccessPage.tsx` produces a standalone, self-contained HTML document (with Google Fonts, full CSS branding, item table, and status badge) opened via `window.open()`. The receipt page auto-fires `window.print()` on load.

- **PatrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Pass all data needed for the receipt (`customerInfo`, `items`, `total`, `orderId`) through React Router's `navigate()` state. No DB round-trip needed on the success page.

- **Regla Derivada**: For lightweight, one-time document generation in a React SPA, prefer the new-window HTML approach over PDF libraries (jsPDF, react-pdf). It requires zero npm dependencies and produces a print-ready, fully branded document.



### 88. AtÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³mica EliminaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de ÃƒÆ’Ã†â€™ÃƒÂ¯Ã‚Â¿Ã‚Â½tems e Inventario (Abril 2026)

- **Problema**: Eliminar un ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tem de un pedido requiere actualizar el total y restaurar el stock fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sico simÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltaneamente para evitar discrepancias.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: LÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica distribuida en el frontend puede fallar si la conexiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n se interrumpe entre llamadas.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Crear una funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n RPC `delete_order_item_v1` que maneje: 1. VerificaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de estado de orden, 2. Incremento de stock en `products`, 3. RecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡lculo de `total_amount`, 4. EliminaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de la fila en `order_items`.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 6 (Integridad Global). Operaciones cruzadas entre Pedidos e Inventario deben ser atÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³micas vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a SQL.



### 89. UI-Based Confirmation vs Browser Native (Abril 2026)

- **Problema**: El uso de `window.confirm()` en entornos de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n puede ser bloqueado o auto-cancelado por el navegador si se detectan mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples re-renders o interferencias de eventos, resultando en botones que "no hacen nada".

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El log de consola mostraba "User clicked CANCEL" instantÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡neamente sin que el usuario interactuara.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar un estado de confirmaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n en lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­nea (`confirmingItemId`). Al pulsar la acciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, el botÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n cambia a un set de iconos "Confirmar [Check] / Cancelar [X]".

- **Ventaja**: Evita bloqueos de scripts del navegador, es mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s rÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡pido y coherente con el lenguaje visual de la app (Rose-Neon).

- **Regla Derivada**: Preferir estados de confirmaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n "Inline" para acciones destructivas en el panel administrativo para garantizar robustez ante polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas de seguridad de navegadores modernos.



### 90. Touch-First Visibility vs Desktop-Only Hover (April 2026)

- **Problem**: Critical actions (like "Add to Cart") were hidden behind a hover state (`opacity-0 group-hover:opacity-100`). This made the feature inaccessible on smartphones, tablets, and POS touchscreens.

- **Solution**: Switch to **Permanent Visibility**. Important CTA (Call to Action) buttons should always be visible (at least partially) or have a very clear visual affordance that doesn't rely on mouse pointers.

- **Improved UX**: Use a "Pulse" or subtle expansion animation on hover for *desktop enrichment*, but ensure the base state is usable for touch.



### 91. React.memo Custom Comparison Pitfalls (April 2026)

- **Problem**: A component (`Card.tsx`) refused to show a new button even when the parent passed `showCartButton={true}`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: The `React.memo` second argument (comparison function) was manually listing props to watch (`card_id`, `price`, etc.) but was **omitting** `showCartButton`. React saw the props changed, but the manual check said "nothing important changed", blocking the re-render.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Avoid manual prop comparison in `React.memo` unless strictly necessary for performance. If used, it MUST include every prop that affects the visual output. When in doubt, let React's default shallow comparison handle it.



### 92. Implicit 'any' in Production Builds (April 2026)



- **Problema**: El servidor de desarrollo (`npm run dev`) funcionaba perfectamente, pero la compilaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n (`npm run build`) fallaba con `error TS7006: Parameter 'm' implicitly has an 'any' type`.

- **Causa**: La configuraciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de TypeScript en modo estricto para producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n prohÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­be el uso de `any` implÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­cito en parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metros de funciones (especialmente en `.map()`, `.filter()`).

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Nunca omitir el tipado en funciones de transformaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de datos en `utils/api.ts`. Un simple `(m: any)` permite que el build pase y asegura que el despliegue no se bloquee.



### 93. OptimizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Rendimiento en Carrito de Invitados (Abril 2026)



- **Problema**: Usuarios no logueados experimentaban un retraso de varios segundos al editar el carrito.

- **Causa**: La funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n `fetchCart` realizaba peticiones secuenciales (individuales) a Supabase por cada ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tem. Un carrito de 15 ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tems disparaba ~30-45 queries.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: **Batch Fetching**. Agrupar todos los IDs de impresiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n, realizar una ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnica consulta `.in()` para metadatos y una ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnica llamada RPC para stock/precios vivos. Esto reduce la complejidad de $O(N)$ a $O(1)$ viajes de red.

- **Mapeo de Datos**: Al usar batch fetching, es crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tico asegurar que el objeto retornado mantenga la estructura esperada por los componentes (nested `products` object). Se debe corregir el mapeo en `CartContext` para soportar tanto datos planos como anidados.



### 94. Schema Discrepancies en CI/CD y Error 42P10 (Abril 2026)



- **Problema**: El script de importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Supabase fallaba en GitHub Actions con el error `postgrest.exceptions.APIError: {'code': '42P10', 'message': 'there is no unique or exclusion constraint matching the ON CONFLICT specification'}`.

- **Causa**: El script intentaba un `upsert` usando `on_conflict='game_id,set_code'`. El entorno local de desarrollo sÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ poseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a esa restricciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­cita de clave compuesta, pero la base de datos remota de producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n solo tenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a implementado un `UNIQUE(set_code)`. PostgREST arrojaba excepciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de esquema inmediatamente al no hallar correspondencia exacta a las columnas especificadas.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: ProgramaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n defensiva en scripts de BD multi-entorno utilizando fallbacks dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micos (Ej: atrapar especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ficamente el cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo `'42P10'` en el bloque de excepciones y re-ejecutar el `upsert` haciendo un "Fallback" a `on_conflict='set_code'`).

### 95. Gatillos de SincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n y Visibilidad de Inventario (Abril 2026)



- **Problema**: Nuevas ediciones importadas exitosamente (ej: Strixhaven) no eran visibles en el inventario a pesar de tener stock y pertenecer al juego correcto (`MTG`).

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**:

  1. El frontend requiere `type_line` y `colors` para renderizar las cartas; si son nulos, la carta se omite.

  2. La funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de base de datos `sync_product_metadata` (gatillo en `products`) omitÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a estos campos en su clÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡usula `SELECT INTO`, por lo que nunca se poblaban automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ticamente desde el catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - Actualizar el trigger de PostgreSQL para incluir `type_line`, `colors` y `release_date` (usando `COALESCE` para preservar datos manuales si existen).

  - Forzar una sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n masiva ("Touch" update) de los productos afectados.

- **Regla Derivada**: Todo gatillo de sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n denormalizada entre el catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo maestro y el inventario DEBE incluir la totalidad de los campos crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticos para la UI del frontend.



### 96. CardKingdom SKU-Based Mapping (April 2026)



- **Problema**: La sincronizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de precios para Strixhaven fallaba o se contaminaba con ediciones antiguas debido a que el campo `variation` de CK estaba vacÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­o para sets modernos.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo de CardKingdom para sets modernos (Strixhaven, Tokens, etc.) incrusta el nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºmero de coleccionista y el acabado directamente en el SKU (`[F]SET-NNNN`), no en los campos de metadatos tradicionales.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  - **Foil Detection**: El prefijo `F` en el SKU es la fuente ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºnica de verdad para detectar versiones Foil.

  - **Collector mapping**: Extraer el nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºmero del SKU sustrayendo ceros a la izquierda.

  - **Prioridad de EdiciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Al mapear por cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo de set (ej: `soa`), priorizar manualmente ediciones primarias ("Secrets of Strixhaven") sobre aliases o sub-sets para evitar oscilaciones de precios.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 7.



### 97. High-Performance Batch SQL Updates (April 2026)



- **Problema**: Actualizar >25,000 precios mediante `executemany` (mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples `UPDATE` individuales) sobre un pooler (puerto 6543) excedÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a los 90 minutos de ejecuciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Latencia de red acumulada y round-trip por cada fila, sumado al overhead del gestor de conexiones por cada transacciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n individual.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: **VALUES Table Pattern**. Agrupar los cambios en chunks (ej: 2,000 filas) y ejecutar un solo `UPDATE target_table SET col = v.new_val FROM (VALUES (...), (...)) AS v(id, new_val) WHERE target_table.id = v.id`.

- **Resultado**: El tiempo de ejecuciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n bajÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ de >90 minutos a **63 segundos** para 47,000 actualizaciones.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Ley 18.



### 98. RPC Overload and Frontend Consistency (April 2026)



- **Problema**: El checkout fallaba en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n con el error "Function not found" a pesar de existir localmente y en el dashboard.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Un script de limpieza de sobrecargas (`drop_order_overloads.py`) eliminÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ la versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n exacta que el frontend llamaba (con `p_cart_id`). PostgREST no hace fallback automÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡tico si la firma es ambigÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼a o falta un parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metro requerido.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

    - **ProtecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de Firmas**: Nunca eliminar sobrecargas de funciones crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas sin verificar la versiÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n exacta que el frontend (especialmente en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n) estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ llamando.

    - **Resilient RPC Pattern**: Restaurar funciones con `DEFAULT NULL` en parÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡metros nuevos para mantener compatibilidad con callers antiguos (Edge Functions) y nuevos (Frontend).

- **Regla Derivada**: Toda actualizaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de firma de RPC en producciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n debe ser retrocompatible o desplegarse simultÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡neamente con el frontend.



### 145. Polymorphic Order Integrity (Accessories) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-23

- **Problema**: Los pedidos mixtos (cartas + accesorios) fallaban en el checkout porque el sistema solo esperaba `product_id`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: La tabla `order_items` usa claves forÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡neas separadas y mutuamente excluyentes para accesorios y productos. El frontend enviaba IDs en campos inconsistentes dependiendo del origen (carrito de invitados vs logueados).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Refactorizar el RPC `create_order_atomic` para manejar `product_id` y `accessory_id` de forma polimÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rfica con recuperaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n de ID defensiva.

- **Regla Derivada**: Todo ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tem de orden debe pasar por un mapeador de IDs en el frontend antes de enviarse al RPC, asegurando que se identifique correctamente si es un producto base o un accesorio.



### 146. Guest Tracking RLS & 406 Errors ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-23

- **Problema**: El rastreo de pedidos para invitados devolvÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a "0 rows" o `406 Not Acceptable`.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: RLS habilitado sin polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas que permitieran al rol `anon` leer pedidos por ID. PostgREST devuelve 406 si el usuario no tiene permisos de `SELECT` sobre las columnas solicitadas.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Conceder `GRANT SELECT` a `anon` y `authenticated` en `orders` y `order_items`, y crear una polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­tica pÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºblica `FOR SELECT USING (true)` (el acceso se limita de facto por el conocimiento del UUID de la orden).

- **Regla Derivada**: El flujo de "Guest Checkout" requiere que las tablas de ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rdenes sean legibles por el rol `anon` mediante polÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticas de RLS que permitan el acceso por ID.



### 147. PostgREST Schema Cache Latency ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-24

- **Problema**: Tras ejecutar migraciones SQL (especialmente `DROP` y `CREATE OR REPLACE FUNCTION`), el frontend sigue recibiendo errores 404 o firmas de funciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n antiguas.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: La capa API de Supabase (PostgREST) mantiene un cachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â© del esquema que no siempre se invalida instantÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡neamente ante cambios DDL directos vÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a SQL Editor.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Al realizar cambios crÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ticos en funciones RPC que el frontend consume, es una buena prÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ctica ejecutar `NOTIFY pgrst, 'reload schema';` o realizar un cambio menor en el esquema (como un comentario `COMMENT ON FUNCTION ...`) para forzar la invalidaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n del cachÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©.



### 148. Inclusive Filtering for Generic Accessories ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-24

- **Problema**: Los accesorios "GenÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ricos" (como fundas, cajas o dados) desaparecÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an de la tienda cuando el usuario seleccionaba un juego especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­fico (MTG, PKM), a pesar de ser compatibles con todos.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El filtro SQL `a.game_id = p_game_id` excluÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a filas donde `game_id` es NULL (productos genÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ricos).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Implementar una lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³gica de filtrado inclusiva: `WHERE (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL)`. Esto asegura que los productos especÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ficos del juego Y los genÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ricos aparezcan siempre.

- **Regla Derivada**: [LEYES_DEL_SISTEMA.md] -> Regla de Negocio 9. Los productos sin ID de juego se consideran universales y deben aparecer en todos los contextos de filtrado de juego.



### 149. Admin UI Alignment & State Sync ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-24

- **Problema**: DesalineaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n visual en tablas administrativas tras aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir nuevas columnas (`is_active`, `game_id`), causando que los datos no coincidan con sus encabezados.

- **LecciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Al expandir tablas complejas en React, evitar el uso de ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­ndices de array para renderizar columnas. Usar un mapeo explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­cito de celdas por nombre de propiedad y asegurar que el nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºmero de etiquetas `<th/>` sea idÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©ntico al de `<td/>` en cada fila para evitar "drift" visual.



### 150. Dynamic Game Mapping in Bulk Imports ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-24

- **Problema**: Los scripts de importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n masiva fallaban con errores de llave forÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡nea (`accessories_game_id_fkey`) al intentar insertar IDs de juegos que no existÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­an en el entorno de destino (ej: ID 6 para Digimon).

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: No usar IDs hardcodeados en scripts de importaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n. Usar subconsultas dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micas: `(SELECT game_id FROM games WHERE game_name ILIKE '...' LIMIT 1)`.

- **Regla Derivada**: Todo script de utilidad de carga masiva debe resolver IDs de tablas de referencia dinÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡micamente mediante el nombre o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo de la entidad.



### 151. Defensive Optional Chaining for Polymorphic Data ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-24

- **Problema**: El componente `CardModal` y `CardDetail` crasheaban con `TypeError: Cannot read properties of undefined (reading 'toUpperCase')` al abrir accesorios en el catÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡logo.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: El campo `set_code` no existe para accesorios. El componente asumÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a que todos los productos son cartas TCG y llamaba `.toUpperCase()` directamente sin verificar null/undefined.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Usar optional chaining en todos los `string.toUpperCase()` sobre datos de API: `set_code?.toUpperCase()`. Enriquecer la respuesta de `fetchCardDetails` para accesorios con campos placeholder (`set_code: category`, `collector_number: 'ACC'`).

- **Regla Derivada**: **Nunca** llamar mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©todos de string directamente sobre propiedades de datos de API. Siempre usar `?.` o validar con un guard antes. Aplica especialmente cuando la misma vista renderiza tipos de datos polimÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rficos (cartas, accesorios).



### 152. Polymorphic UI: Separate Layouts for Different Product Types ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-24

- **Problema**: El `CardModal`, diseÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ado para cartas TCG, mostraba informaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n irrelevante (FOIL/NONFOIL toggle, "EDICIÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œN / IMPRESIONES", legalidad de formatos, CardKingdom link) cuando se abrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a un accesorio como una caja de Gundam o snacks.

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Reutilizar el mismo layout de carta para todos los tipos de productos es un anti-patrÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n cuando las entidades tienen caracterÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­sticas fundamentalmente diferentes.

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**: Condicionar el layout completo con `details?.is_accessory`. Cuando es `true`, renderizar un layout alternativo limpio: imagen centrada, nombre, categorÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­a, badge de stock prominente, precio simple ("Precio"), y CTA de carrito. Cuando es `false`, usar el layout original de carta con todas sus secciones.

- **Regla Derivada**: En plataformas de e-commerce polimÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³rficas (cartas + accesorios), el modal/detalle debe detectar el tipo de producto y renderizar el layout apropiado. No intentar ocultar secciones con condicionales dispersos; mejor separar los branches de rendering completos.



### 153. JSX Fragment Nesting in Ternary Conditionals ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã¯Â¿Â½ 2026-04-24

- **Problema**: Al refactorizar un componente grande (CardModal) para agregar un branch ternario complejo, mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples errores de TypeScript surgieron: "JSX element has no corresponding closing tag", "Expected closing tag for JSX fragment".

- **Causa RaÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­z**: Al dividir el rendering existente en dos branches de un ternario (accesorio vs carta), es fÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡cil perder el `<>` de apertura del fragment en el branch `else`, y los `</div>` de cierre previos al fragment quedan "huÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©rfanos".

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n**:

  1. Usar `tsc --noEmit` para verificar JSX antes de `npm run build`.

  2. Al agregar un ternario que envuelve mÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºltiples elementos, aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±adir explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente `<>` y `</>` para el branch que lo necesita.

  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­neas separadas).

- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ lÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­neas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.



  2. Al agregar un ternario que envuelve mÃƒÆ’Ã‚Âºltiples elementos, aÃƒÆ’Ã‚Â±adir explÃƒÆ’Ã‚Â­citamente `<>` y `</>` para el branch que lo necesita.

  3. Verificar que los closing tags inline (`{/* comment */}`) no causen errores de parsing en TypeScript (prefirir lÃƒÆ’Ã‚Â­neas separadas).

- **Regla Derivada**: Ante refactors grandes de JSX en componentes de 500+ lÃƒÆ’Ã‚Â­neas, dividir los cambios en pasos verificables con `tsc --noEmit` entre cada uno.



### 154. CartContext Flattening vs CartDrawer Nested Fields ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-24

- **Problema**: Los ÃƒÆ’Ã‚Â­tems del carrito mostraban `$0.00` individualmente en `CartDrawer`, aunque el SUBTOTAL total era correcto.

- **Causa RaÃƒÆ’Ã‚Â­z**: `CartContext.refreshCart()` aplana los datos del RPC `get_user_cart` en campos de primer nivel (`item.price`, `item.name`, `item.image_url`, `item.set_code`). Sin embargo, `CartDrawer` leÃƒÆ’Ã‚Â­a la estructura anidada antigua (`item.products?.price`), que no existe en el state aplanado ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ resultando en `undefined ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ $0.00`.

- **Por quÃƒÆ’Ã‚Â© el SUBTOTAL funcionaba**: La lÃƒÆ’Ã‚Â³gica del subtotal ya tenÃƒÆ’Ã‚Â­a el fallback correcto `(item.products?.price || item.price || 0)`, pero la lÃƒÆ’Ã‚Â­nea de display por ÃƒÆ’Ã‚Â­tem no.

- **SoluciÃƒÆ’Ã‚Â³n**: Actualizar `CartDrawer` para leer los campos planos primero con el nested como fallback: `item.price || item.products?.price || 0`. Aplicar el mismo patrÃƒÆ’Ã‚Â³n a `name`, `image_url`, `set_code` e `is_foil`.

- **Regla Derivada**: Cuando `CartContext` cambia la forma del state (de nested a flat), TODOS los consumidores (`CartDrawer`, `CheckoutPage`, etc.) deben actualizarse simultÃƒÆ’Ã‚Â¡neamente. El patrÃƒÆ’Ã‚Â³n seguro es siempre usar `item.price || item.products?.price` para soportar ambas formas durante transiciones.



### 101. Rigor de TypeScript en CI/CD (Variables no usadas) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-25

- **Problema:** El build fallÃƒÆ’Ã‚Â³ mÃƒÆ’Ã‚Âºltiples veces en el servidor de despliegue debido a variables declaradas pero no usadas (`TS6133`).

- **Causa RaÃƒÆ’Ã‚Â­z:** El entorno local (VS Code/Dev) era mÃƒÆ’Ã‚Â¡s permisivo que el pipeline de producciÃƒÆ’Ã‚Â³n/dev del servidor.

- **SoluciÃƒÆ’Ã‚Â³n:** Limpieza quirÃƒÆ’Ã‚Âºrgica de imports y variables no usadas. No asumir que si "funciona en local" pasarÃƒÆ’Ã‚Â¡ el build del servidor.

- **Regla Derivada:** Realizar un `npm run build` local antes de cada push para detectar errores de tipado estricto.



### 102. SincronizaciÃƒÆ’Ã‚Â³n URL-Estado para NavegaciÃƒÆ’Ã‚Â³n Reactiva ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-25

- **Problema:** El menÃƒÆ’Ã‚Âº cambiaba la URL pero el catÃƒÆ’Ã‚Â¡logo no se actualizaba ni cambiaba de pestaÃƒÆ’Ã‚Â±a.

- **Causa RaÃƒÆ’Ã‚Â­z:** El componente principal (`Home.tsx`) solo leÃƒÆ’Ã‚Â­a los `searchParams` en el montaje inicial.

- **SoluciÃƒÆ’Ã‚Â³n:** Implementar un `useEffect` que escuche `searchParams` y sincronice el estado local (`activeTab`, `filters`).

- **Regla Derivada:** Cualquier navegaciÃƒÆ’Ã‚Â³n basada en URL en una SPA requiere sincronizaciÃƒÆ’Ã‚Â³n reactiva del estado interno para disparar nuevos fetches de datos.



### 103. ResoluciÃƒÆ’Ã‚Â³n de AmbigÃƒÆ’Ã‚Â¼edad en PostgREST (PGRST203) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-26

- **Problema:** La API de Supabase fallaba al llamar a una funciÃƒÆ’Ã‚Â³n RPC con error de mÃƒÆ’Ã‚Âºltiples candidatos.

- **Causa RaÃƒÆ’Ã‚Â­z:** Redefinir funciones sin borrar versiones anteriores con firmas similares crea sobrecarga ambigua.

- **SoluciÃƒÆ’Ã‚Â³n:** Limpieza profunda usando un bloque PL/pgSQL que recorre los OIDs de las funciones duplicadas.

- **Regla Derivada:** Siempre incluir DROP FUNCTION IF EXISTS con la firma exacta antes de recrear RPCs.



### 104. AuditorÃƒÆ’Ã‚Â­a de Datos de Referencia (Lookups) ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-04-26

- **SoluciÃƒÆ’Ã‚Â³n**: UnificaciÃƒÆ’Ã‚Â³n de registros, actualizaciÃƒÆ’Ã‚Â³n de llaves forÃƒÆ’Ã‚Â¡neas y estandarizaciÃƒÆ’Ã‚Â³n de cÃƒÆ’Ã‚Â³digos.

- **Regla Derivada**: Antes de expandir un catÃƒÆ’Ã‚Â¡logo maestro, auditar la tabla actual para mapear IDs existentes.



### 148. EstabilizaciÃƒÆ’Ã‚Â³n de Precios Reales y Omni-Sync (Mayo 2026)

- **Problema**: Desajustes de precios "congelados" en producciÃƒÆ’Ã‚Â³n (ej: $16.99 vs $14.99) y fallas persistentes en los pipelines de GitHub Actions.

- **Causa RaÃƒÆ’Ã‚Â­z**: 

- **SoluciÃƒÆ’Ã‚Â³n:** Centralizar objetos de mapeo (gameMap, gameMapInv) a nivel global en el componente.

- **Regla Derivada:** Nunca usar Strings mÃƒÆ’Ã‚Â¡gicos para mapeos de negocio; centralizar en constantes unificadas.



### 106. Strict Filtering for Polymorphic Catalogs (MTG vs. Generic) - 2026-04-27

- **Causa RaÃƒÆ’Ã‚Â­z:** La funciÃƒÆ’Ã‚Â³n de base de datos (get_accessories_filtered) usaba una condiciÃƒÆ’Ã‚Â³n 'loose': AND (p_game_id IS NULL OR a.game_id = p_game_id OR a.game_id IS NULL). Esto forzaba la inclusiÃƒÆ’Ã‚Â³n de genÃƒÆ’Ã‚Â©ricos en cada filtro de juego.

- **SoluciÃƒÆ’Ã‚Â³n:** Implementar filtrado estricto en el RPC eliminando la condiciÃƒÆ’Ã‚Â³n OR a.game_id IS NULL cuando se provee un p_game_id. Adicionalmente, ajustar el frontend para que el botÃƒÆ’Ã‚Â³n general de 'Productos' no fuerce un juego por defecto (cambiando el fallback de ['Magic: The Gathering'] a []), permitiendo ver el catÃƒÆ’Ã‚Â¡logo completo solo cuando se desea.

- **Regla Derivada:** En catÃƒÆ’Ã‚Â¡logos con productos especÃƒÆ’Ã‚Â­ficos de nicho y productos genÃƒÆ’Ã‚Â©ricos, el filtro de juego debe ser estricto para evitar ruido visual ('contaminaciÃƒÆ’Ã‚Â³n de resultados'). Los productos genÃƒÆ’Ã‚Â©ricos deben ser accesibles solo en la vista global sin filtros.



### 107. Standardizing Multi-TCG Codes (Database vs. Frontend) - 2026-04-27

- **SoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n:** Modificar la consulta SQL dentro del RPC `get_products_filtered` para asegurar que las comparaciones sean case-insensitive, utilizando funciones como `UPPER()` (ej. `UPPER(p.set_code) = ANY(set_filter)`) y permitiendo mapeos tanto de cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digo de set como de nombre (ej. `p.set_name = ANY(set_filter) OR UPPER(p.set_code) = ANY(set_filter)`). AdemÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡s, se estandarizÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³ la resoluciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n del ID de juego internamente.

- **Regla Derivada:** LEYES_DEL_SISTEMA.md > Toda consulta de filtrado de texto o cÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³digos provenientes de URLs o interfaces debe ser explÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â­citamente sanitizada y convertida a case-insensitive (`UPPER`, `LOWER` o `ILIKE`) en las funciones de base de datos antes de evaluar un `MATCH`.



### 108. Alignment of Cross-Project Environments (Dev vs. Prod) - 2026-04-28

- **Problema**: Falla total en la carga de Pokemon en el entorno dev a pesar de que el codigo parecia correcto.

- **Causa Raiz**: El entorno de desarrollo (Sandbox: bqfkqnnostzaqueujdms) tenia una tabla de juegos con IDs y codigos diferentes (PKM en lugar de POKEMON, ID 10 en lugar de 23). Ademas, la base de datos estaba vacia para ese juego.

- **Solucion**: Alinear el frontend y los scripts de poblacion con los estandares del Sandbox (PKM, ID 10) y actualizar los RPCs para normalizar multiples variantes a un unico codigo estandar.

- **Regla Derivada**: Antes de diagnosticar logica de frontend, verificar la existencia y estructura de datos en el proyecto Supabase especifico mediante la API o scripts de diagnostico.

### 97. EstabilizaciÃƒÆ’Ã‚Â³n de Sidebar DinÃƒÆ’Ã‚Â¡mico y Anidamiento JSX (Mayo 2026)

- **Problema**: El despliegue de producciÃƒÆ’Ã‚Â³n fallaba con errores de sintaxis tras aÃƒÆ’Ã‚Â±adir un sidebar dinÃƒÆ’Ã‚Â¡mico, a pesar de que el cÃƒÆ’Ã‚Â³digo parecÃƒÆ’Ã‚Â­a correcto.

### 149. RemediaciÃƒÆ’Ã‚Â³n Masiva de Secretos Hardcodeados (Mayo 2026)

- **Problema**: Fuga crÃƒÆ’Ã‚Â­tica de credenciales de PostgreSQL en `.env.dev` y proliferaciÃƒÆ’Ã‚Â³n de contraseÃƒÆ’Ã‚Â±as hardcodeadas en mÃƒÆ’Ã‚Â¡s de 60 scripts auxiliares del proyecto, detectado por GitGuardian.

- **Causa RaÃƒÆ’Ã‚Â­z**: PrÃƒÆ’Ã‚Â¡ctica heredada de hardcodear URLs de conexiÃƒÆ’Ã‚Â³n con credenciales incluidas para agilizar la ejecuciÃƒÆ’Ã‚Â³n de scripts locales y de mantenimiento.

- **SoluciÃƒÆ’Ã‚Â³n**: 

  - **Limpieza Automatizada**: CreaciÃƒÆ’Ã‚Â³n de un script de remediaciÃƒÆ’Ã‚Â³n masiva (`cleanup_secrets.py`) que utiliza regex para reemplazar URLs y contraseÃƒÆ’Ã‚Â±as por llamadas a `os.getenv()`.

  - **Ignorado Estricto**: ActualizaciÃƒÆ’Ã‚Â³n de `.gitignore` en todas las ramas (`dev`, `main`) para incluir `.env.dev` y otros archivos de entorno.

  - **RotaciÃƒÆ’Ã‚Â³n de Credenciales**: ParametrizaciÃƒÆ’Ã‚Â³n de los scripts para que dependan de `DATABASE_URL_PROD` y `DATABASE_URL_DEV`, permitiendo rotar las claves en Supabase sin romper el flujo de trabajo.

- **Regla Derivada**: **PROHIBIDO** hardcodear cualquier URL de conexiÃƒÆ’Ã‚Â³n que incluya el esquema `postgresql://`. Toda conexiÃƒÆ’Ã‚Â³n debe pasar por `os.getenv` o un gestor de secretos. Ver `LEYES_DEL_SISTEMA.md` > Ley de Seguridad 22.



### 150. RedefiniciÃƒÆ’Ã‚Â³n Local de Interfaces en Componentes Grandes (Mayo 2026)

- **Problema**: Errores de build `TS2339` persistentes tras actualizar interfaces globales en `api.ts`.

- **Causa RaÃƒÆ’Ã‚Â­z**: Componentes grandes como `CardModal.tsx` redefinen interfaces crÃƒÆ’Ã‚Â­ticas (`CardDetails`, `Version`) localmente en lugar de importarlas desde la fuente de verdad. Esto genera inconsistencias cuando se aÃƒÆ’Ã‚Â±aden campos al modelo de datos.

- **LecciÃƒÆ’Ã‚Â³n**: **Unicidad de Tipos**. Evitar redefinir interfaces de datos del dominio dentro de los componentes. Si un componente necesita una interfaz, debe importarla desde `api.ts`. Si se aÃƒÆ’Ã‚Â±ade un campo a la API, se debe buscar todas las redefiniciones locales (Grep) para asegurar la paridad. Ver `LEYES_DEL_SISTEMA.md` > Ley 21.



### 151. Null-Safe Price Handling in Inventory Rendering ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-05-05

- **Problema**: El panel administrativo de inventario crasheaba con `TypeError: Cannot read properties of null (reading 'toFixed')` al ordenar la tabla de mayor a menor.

- **Causa RaÃƒÆ’Ã‚Â­z**: Algunos artÃƒÆ’Ã‚Â­culos (especialmente los reciÃƒÆ’Ã‚Â©n importados o "on-demand") tienen un valor de `price` nulo en la base de datos. Al ordenar, estos nulos suben al principio de la lista, y la lÃƒÆ’Ã‚Â³gica de la UI intentaba llamar a `.toFixed(2)` sobre ellos.

- **SoluciÃƒÆ’Ã‚Â³n**: Implementar una polÃƒÆ’Ã‚Â­tica de "Null-Safe Formatting" en el frontend: `(item.price || 0).toFixed(2)`. Asegurar que los cÃƒÆ’Ã‚Â¡lculos de descuento tambiÃƒÆ’Ã‚Â©n contemplen fallbacks a cero para evitar resultados `NaN`.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 20 (Integridad Visual de Ofertas). Todo renderizado de precios en el Admin debe usar el patrÃƒÆ’Ã‚Â³n de fallback `(val || 0)` antes de formatear.



### 152. RPC Overloading & Function Signature Sync ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-05-05

- **Problema**: Error `PGRST203` (mÃƒÆ’Ã‚Âºltiples candidatos encontrados) al intentar cargar productos en el Marketplace tras aÃƒÆ’Ã‚Â±adir el parÃƒÆ’Ã‚Â¡metro `p_only_new`.

- **Causa RaÃƒÆ’Ã‚Â­z**: Supabase (PostgreSQL) permite la sobrecarga de funciones con el mismo nombre pero diferentes argumentos. `CREATE OR REPLACE FUNCTION` no elimina versiones antiguas con firmas distintas; PostgREST no puede decidir cuÃƒÆ’Ã‚Â¡l llamar si hay ambigÃƒÆ’Ã‚Â¼edad.

- **SoluciÃƒÆ’Ã‚Â³n**: Implementar una migraciÃƒÆ’Ã‚Â³n de "limpieza dinÃƒÆ’Ã‚Â¡mica" que use `pg_proc` para identificar y ejecutar `DROP FUNCTION ... CASCADE` sobre todas las versiones sobrecargadas antes de recrear la versiÃƒÆ’Ã‚Â³n canÃƒÆ’Ã‚Â³nica ÃƒÆ’Ã‚Âºnica.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 23 (SincronizaciÃƒÆ’Ã‚Â³n de RPC). Toda modificaciÃƒÆ’Ã‚Â³n de parÃƒÆ’Ã‚Â¡metros en un RPC existente debe ir precedida de un borrado total de sobrecargas para evitar conflictos `PGRST203`.



### 153. Resilient Bulk Updates & Pooler Stability ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-05-05

- **Problema**: Las actualizaciones masivas de precios en `card_printings` y `products` (200k+ filas) fallaban por `statement_timeout` o pÃƒÆ’Ã‚Â©rdida de sincronizaciÃƒÆ’Ã‚Â³n al usar el Supabase Pooler (Puerto 6543).

- **Causa RaÃƒÆ’Ã‚Â­z**: El pooler de transacciones interrumpe conexiones de larga duraciÃƒÆ’Ã‚Â³n. Los joins masivos durante un `UPDATE FROM` superan los lÃƒÆ’Ã‚Â­mites de tiempo estÃƒÆ’Ã‚Â¡ndar de PostgreSQL en la nube.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - **PatrÃƒÆ’Ã‚Â³n de Materialized View Temporal**: Crear una vista materializada de los precios actualizados, indexarla por `printing_id`, y realizar el `UPDATE` mediante un join simple contra la vista. Esto reduce el tiempo de ejecuciÃƒÆ’Ã‚Â³n de minutos a segundos.

  - **Batching de ID**: Procesar los cambios en lotes de IDs (ej: 1,000 cartas) con `SET statement_timeout = 0`.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 18 (Performance en Sincronizaciones Masivas).



### 154. Environment Isolation & Secret Injection in CI/CD ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ï¿½ 2026-05-05

- **Problema**: Los precios en producciÃƒÆ’Ã‚Â³n se desincronizaban porque el flujo automatizado `omni-sync.yml` no recibÃƒÆ’Ã‚Â­a la `DATABASE_URL` de producciÃƒÆ’Ã‚Â³n, usando por defecto el entorno de desarrollo o fallando silenciosamente.

- **Causa RaÃƒÆ’Ã‚Â­z**: Falta de inyecciÃƒÆ’Ã‚Â³n explÃƒÆ’Ã‚Â­cita de secretos en el YAML de GitHub Actions y dependencia de variables genÃƒÆ’Ã‚Â©ricas en `common/db.py`.

- **SoluciÃƒÆ’Ã‚Â³n**:

  - **InyecciÃƒÆ’Ã‚Â³n de Secretos**: Mapear explÃƒÆ’Ã‚Â­citamente `DATABASE_URL: ${{ secrets.DATABASE_URL_PROD }}` en el workflow.

  - **Carga Prioritaria**: Refactorizar `db.py` para priorizar variables especÃƒÆ’Ã‚Â­ficas del entorno (PROD/DEV) al detectar el contexto de ejecuciÃƒÆ’Ã‚Â³n.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 19 (ProtecciÃƒÆ’Ã‚Â³n de Entornos).



### 103. Clipping en Animaciones de Escala Ã¢â‚¬â€� 2026-05-05

- **Problema:** Los iconos del selector TCG se cortaban por la parte superior al activarse o pasar el cursor.

- **Causa RaÃƒÂ­z:** El contenedor tenÃƒÂ­a overflow-hidden y no contaba con suficiente padding-top para absorber el scale-110 combinado con translate-y-2.

- **SoluciÃƒÂ³n:** Eliminar overflow-hidden y aumentar el padding vertical (pt-14 / md:pt-20).

- **Regla Derivada:** Ley de " RespiraciÃƒÂ³n Visual para Animaciones\ codificada en LEYES_DEL_SISTEMA.md.



### 104. Referencias de Iconos Lucide Ã¢â‚¬â€� 2026-05-05

- **Problema:** Fallo en el build de producciÃƒÂ³n por ChevronDown no definido.

- **Causa RaÃƒÂ­z:** ImportaciÃƒÂ³n incompleta tras refactorizar un selector.

- **SoluciÃƒÂ³n:** VerificaciÃƒÂ³n de imports post-ediciÃƒÂ³n y ejecuciÃƒÂ³n de npm run build local antes de push.



### 105. EstandarizaciÃƒÂ³n de Logos TCG Ã¢â‚¬â€� 2026-05-05

- **Problema:** Uso de emojis inconsistente para representar los juegos en diferentes partes de la app.

- **Causa RaÃƒÂ­z:** Falta de una biblioteca de assets estandarizada.

- **SoluciÃƒÂ³n:** CreaciÃƒÂ³n de frontend/public/logos/tcg/ con variantes color y black.

- **Regla Derivada:** Ley de \Identidad de Marca TCG\ en LEYES_DEL_SISTEMA.md.



### 155. Soporte Multi-Imagen y Carruseles Premium (Mayo 2026)

- **Problema**: Los productos (accesorios) estaban limitados a una sola imagen, lo que dificultaba mostrar diferentes ÃƒÂ¡ngulos o detalles.

- **Causa RaÃƒÂ­z**: El esquema de base de datos (image_url) y los componentes de visualizaciÃƒÂ³n (CardModal) solo soportaban un ÃƒÂºnico string de URL.

- **SoluciÃƒÂ³n**: 

  - **AmpliaciÃƒÂ³n de Esquema**: AÃƒÂ±adir dditional_images text[] a la tabla ccessories.

  - **SincronizaciÃƒÂ³n de RPC**: Actualizar las funciones SQL (get_accessories_filtered) para incluir el nuevo array en el retorno, evitando desincronizaciÃƒÂ³n de tipos en el frontend.

  - **UX de Admin**: Implementar un sistema de selecciÃƒÂ³n de "Imagen Principal" que mantenga la compatibilidad con el campo image_url existente, permitiendo a la vez gestionar una galerÃƒÂ­a.

  - **Carousel DinÃƒÂ¡mico**: Integrar AnimatePresence de ramer-motion para transiciones suaves que eleven la percepciÃƒÂ³n de calidad ("premium feel").

- **LecciÃƒÂ³n**: Al implementar galerÃƒÂ­as, mantener siempre un campo "primary_image" independiente del array de adicionales para no penalizar el rendimiento de las vistas de lista (grids) que no necesitan cargar todo el array.



### 156. Rebranding UI y Limpieza de CÃƒÂ³digo (Mayo 2026)

- **Problema**: Al deshabilitar secciones por rebranding (Misiones), el build de producciÃƒÂ³n fallaba por errores de TypeScript (variables no usadas e imports muertos).

- **Causa RaÃƒÂ­z**: El proyecto tiene configuraciones de linting/build estrictas que no permiten cÃƒÂ³digo muerto en archivos crÃƒÂ­ticos como `Home.tsx`.

- **SoluciÃƒÂ³n**: No basta con comentar el JSX; se debe podar activamente el estado (`useState`), los efectos (`useEffect`) y los imports (`Link`, etc.) asociados para garantizar la integridad del build.

- **LecciÃƒÂ³n**: La "limpieza atÃƒÂ³mica" es obligatoria al "apagar" features en entornos de desarrollo remoto altamente automatizados.



### 157. UX Espacial: Filtros Colapsables Estilo Marketplace (Mayo 2026)

- **Problema**: El panel de filtros lateral era demasiado largo, obligando al usuario a hacer scroll infinito para encontrar filtros bÃƒÂ¡sicos como el precio o el aÃƒÂ±o.

- **SoluciÃƒÂ³n**: Implementar secciones colapsables con memoria de estado local. Las secciones con filtros activos se expanden por defecto para mantener la visibilidad del contexto actual del usuario.

- **Impacto**: ReducciÃƒÂ³n del 70% en el uso del espacio vertical inicial, mejorando drÃƒÂ¡sticamente la tasa de interacciÃƒÂ³n en dispositivos con viewports limitados.

- **Regla Derivada**: (Ley 29) Todo panel lateral con mÃƒÂ¡s de 4 categorÃƒÂ­as de filtrado DEBE ser colapsable.



### 158. Flujo de Checkout "Por Encargo" (Bypass de Stock) Ã¢â‚¬â€� 2026-05-07

- **Problema**: El RPC `create_order_atomic` bloqueaba pedidos si el stock era insuficiente, impidiendo la venta de ÃƒÂ­tems "Por Encargo" (Regla de Negocio 4).

- **Causa RaÃƒÂ­z**: ValidaciÃƒÂ³n estricta en el backend (`RAISE EXCEPTION`) sin considerar el flag `is_on_demand`.

- **SoluciÃƒÂ³n**: RefactorizaciÃƒÂ³n del RPC para permitir stock negativo o bypass de error cuando el ÃƒÂ­tem se marca como bajo demanda, y actualizaciÃƒÂ³n de la UI para mostrar badges de "POR ENCARGO" basados en `cantidad > stock`.

- **LecciÃƒÂ³n**: Las reglas de negocio de disponibilidad deben estar sincronizadas entre la validaciÃƒÂ³n de base de datos y el estado visual del carrito para evitar fricciÃƒÂ³n en el checkout.



### 159. Restricciones de ConexiÃƒÂ³n Directa a DB (Entorno Remoto) Ã¢â‚¬â€� 2026-05-07

- **Problema**: Fallos de conexiÃƒÂ³n (`FATAL: tenant/user not found`) al intentar ejecutar migraciones SQL remotas desde scripts de utilidad.

- **Causa RaÃƒÂ­z**: El Transaction Pooler de Supabase (puerto 6543) requiere una configuraciÃƒÂ³n de usuario/tenant muy especÃƒÂ­fica que puede fallar en entornos restringidos.

- **LecciÃƒÂ³n**: Para remediaciones crÃƒÂ­ticas en bases de datos remotas donde el acceso directo estÃƒÂ¡ limitado, es preferible preparar el archivo de migraciÃƒÂ³n en `supabase/migrations/` y delegar la ejecuciÃƒÂ³n al pipeline de CI/CD o al comando `supabase db push` si se cuenta con el token de acceso.



### 160. Escalado de UI y Densidad Visual Premium Ã¢â‚¬â€� 2026-05-07

- **Problema**: El landing page se sentÃƒÂ­a disperso y los iconos de navegaciÃƒÂ³n carecÃƒÂ­an de impacto visual en resoluciones altas.

- **Causa RaÃƒÂ­z**: Paddings verticales excesivos y escalas de iconos/fuentes conservadoras diseÃƒÂ±adas para mÃƒÂ³viles que no aprovechaban el espacio en escritorio.

- **SoluciÃƒÂ³n**: 

  - **ReducciÃƒÂ³n de Padding**: Ajuste de `py-12` a `py-4` en contenedores principales y eliminaciÃƒÂ³n de `bounding boxes` en carruseles para una estÃƒÂ©tica "flotante".

  - **Escalado Responsivo**: Uso de clases Tailwind dinÃƒÂ¡micas (ej. `w-11 sm:w-14`) para iconos de navegaciÃƒÂ³n y aumento de la altura del Header a `h-20`.

- **LecciÃƒÂ³n**: La percepciÃƒÂ³n de "Premium Feel" a menudo depende de la eliminaciÃƒÂ³n de marcos sÃƒÂ³lidos y la maximizaciÃƒÂ³n del tamaÃƒÂ±o de los activos de marca, manteniendo una densidad de informaciÃƒÂ³n alta pero organizada.



### 161. Visibilidad Condicional de PestaÃƒÂ±as por Contexto Ã¢â‚¬â€� 2026-05-07

- **Problema**: La pestaÃƒÂ±a "Stock Geekorium" aparecÃƒÂ­a en la secciÃƒÂ³n de accesorios (Artilugios), confundiendo al usuario ya que solo hay stock de cartas para MTG.

- **SoluciÃƒÂ³n**: Implementar una restricciÃƒÂ³n lÃƒÂ³gica en `Home.tsx` que evalÃƒÂºa `filters.games?.includes('MTG')` antes de renderizar la pestaÃƒÂ±a de inventario de cartas.

- **LecciÃƒÂ³n**: Menos es mÃƒÂ¡s. Ocultar opciones irrelevantes segÃƒÂºn el contexto de filtrado actual reduce la carga cognitiva y previene errores de navegaciÃƒÂ³n del usuario.



### 162. Errores de Sintaxis en Refactorizaciones Masivas Ã¢â‚¬â€� 2026-05-08

- **Problema**: El build fallaba con `error TS1381: Property or signature expected.` en `CartDrawer.tsx`.

- **Causa RaÃƒÂ­z**: Durante el reemplazo masivo de colores `neutral-XXX` por tokens de marca, se rompiÃƒÂ³ accidentalmente la sintaxis de un operador ternario en los controles de cantidad, dejando un cÃƒÂ³digo invÃƒÂ¡lido.

- **LecciÃƒÂ³n**: Las refactorizaciones de "Buscar y Reemplazar" en mÃƒÂºltiples archivos deben ir acompaÃƒÂ±adas de un `npm run build` local inmediato. Un error tipogrÃƒÂ¡fico pequeÃƒÂ±o en un componente central puede bloquear todo el pipeline de CI/CD.



### 163. Mezcla de Capas y Opacidad en ImÃƒÂ¡genes Foil Ã¢â‚¬â€� 2026-05-08

- **Problema**: Las imÃƒÂ¡genes de las cartas se veÃƒÂ­an oscuras ("opacas") en la pÃƒÂ¡gina de detalle.

- **Causa RaÃƒÂ­z**: AplicaciÃƒÂ³n directa de `mix-blend-mode: overlay` sobre la etiqueta `<img>`. Al no tener una capa base de color, el modo de mezcla oscurecÃƒÂ­a la imagen original en lugar de iluminarla. AdemÃƒÂ¡s, el efecto se aplicaba incluso a cartas no-foil.

- **SoluciÃƒÂ³n**: Mover el efecto `foil-shimmer` a una capa (div) independiente sobre la imagen con `opacity-30` y `pointer-events-none`. Condicionar la aplicaciÃƒÂ³n del efecto y de la clase `holo-effect` estrictamente al estado `isFoil`.

- **LecciÃƒÂ³n**: Nunca aplicar modos de mezcla destructivos (`overlay`, `multiply`) directamente sobre el activo visual principal si se busca un efecto de brillo. Usar siempre capas superpuestas con opacidad controlada para preservar la legibilidad del arte original.



### 164. Inconsistencia de CÃƒÂ³digos de Juego y NormalizaciÃƒÂ³n Ã¢â‚¬â€� 2026-05-08

- **Problema**: Los banners de PokÃƒÂ©mon no aparecÃƒÂ­an a pesar de estar guardados en la base de datos.

- **Causa RaÃƒÂ­z**: El sistema tenÃƒÂ­a duplicidad de cÃƒÂ³digos para el mismo juego (ej: `PKM` usado en el frontend vs `POKEMON` usado en la base de datos de banners). Al fallar la coincidencia exacta, el sistema no encontraba los activos.

- **SoluciÃƒÂ³n**: Implementar una capa de normalizaciÃƒÂ³n en `utils/api.ts` dentro de `fetchBanners` que mapea alias comunes (`PKM` -> `POKEMON`, `YGO` -> `YUGIOH`) antes de realizar la consulta a Supabase. AdemÃƒÂ¡s, se estandarizaron los registros existentes en la tabla `hero_banners`.

- **LecciÃƒÂ³n**: Cuando se trabaja con sistemas heredados o integraciones de terceros, siempre se debe asumir que los cÃƒÂ³digos de referencia pueden variar. Una capa de normalizaciÃƒÂ³n centralizada es vital para la integridad de los datos visuales.



### 165. Desacoplamiento de Vistas de Dashboard y Secciones de TCG Ã¢â‚¬â€� 2026-05-08

- **Problema**: Al intentar mostrar banners en las secciones de cada TCG, el listado de cartas (singles) era reemplazado por la vista de "Dashboard" (ofertas), arruinando la experiencia de navegaciÃƒÂ³n.

- **Causa RaÃƒÂ­z**: La variable `isDashboardView` controlaba tanto la visibilidad del banner como el tipo de contenido principal (Ofertas vs Parrilla). 

- **SoluciÃƒÂ³n**: Desacoplar las condiciones. Se introdujo `showHeroSection` para controlar la visibilidad del banner en cualquier secciÃƒÂ³n "limpia", mientras que `isDashboardView` se mantuvo restringido a la pÃƒÂ¡gina de inicio global para controlar la renderizaciÃƒÂ³n del carrusel de ofertas.

- **LecciÃƒÂ³n**: No usar un ÃƒÂºnico flag de estado para controlar mÃƒÂºltiples comportamientos de UI estructurales. Cada componente mayor (Banner, Ofertas, Parrilla) debe tener su propia lÃƒÂ³gica de visibilidad basada en el contexto del router y los filtros.



### 166. Integridad de Tablas de Metadatos y RLS Ã¢â‚¬â€� 2026-05-08

- **Problema**: Tablas crÃƒÂ­ticas como `conditions`, `sources` y `games` estaban expuestas sin Row Level Security (RLS) activo.

- **SoluciÃƒÂ³n**: Habilitar RLS en todas las tablas de metadatos y aplicar polÃƒÂ­ticas granulares: acceso pÃƒÂºblico de solo lectura (`SELECT`) y acceso administrativo total (`ALL`) validado mediante el rol del usuario en la tabla `profiles`.

- **Regla Derivada**: `LEYES_DEL_SISTEMA.md` -> Ley 10 (RLS Prioritario). Ninguna tabla nueva debe crearse en el esquema `public` sin una polÃƒÂ­tica de RLS explÃƒÂ­citamente definida y verificada.



### 167. SincronizaciÃƒÂ³n de Campos de TaxonomÃƒÂ­a y Constraints NOT NULL Ã¢â‚¬â€� 2026-05-09

- **Problema**: El sistema crasheaba con un error de violaciÃƒÂ³n de restricciÃƒÂ³n `NOT NULL` en la columna `category` al intentar crear nuevos accesorios desde el panel administrativo.

- **Causa RaÃƒÂ­z**: La base de datos requiere obligatoriamente el campo `category` (texto) por razones de performance y legado, pero el formulario de administraciÃƒÂ³n solo estaba enviando el `category_code`. Al ser `null` el nombre de la categorÃƒÂ­a, la inserciÃƒÂ³n fallaba fatalmente.

- **SoluciÃƒÂ³n**: Implementar una derivaciÃƒÂ³n automÃƒÂ¡tica en el frontend que busca el nombre de la categorÃƒÂ­a en la lista de taxonomÃƒÂ­a (`accessory_categories`) basÃƒÂ¡ndose en el cÃƒÂ³digo seleccionado. Si no hay coincidencia, se aplica un fallback seguro ("Accesorios").

- **LecciÃƒÂ³n**: En tablas que implementan denormalizaciÃƒÂ³n (guardar cÃƒÂ³digo e ID/Nombre por separado), el frontend debe actuar como garante de la integridad, asegurando que todos los campos requeridos por restricciones de base de datos estÃƒÂ©n presentes antes de disparar el `create` o `update`. AdemÃƒÂ¡s, refactorizar interfaces estÃƒÂ¡ticas a dinÃƒÂ¡micas (basadas en DB) previene que la taxonomÃƒÂ­a del frontend se desincronice de la realidad del servidor.


### 154. Endurecimiento de RLS para Tablas Administrativas Ã¢â‚¬â€� 2026-05-09
- **Problema:** Error 42501 (insufficient privilege) al insertar accesorios a pesar de estar autenticado como admin en Supabase Auth.
- **Causa RaÃƒÂ­z:** Las polÃƒÂ­ticas basadas solo en `TO authenticated` son insuficientes si el motor de Supabase no puede verificar de forma atÃƒÂ³mica el rol extendido sin una polÃƒÂ­tica explÃƒÂ­cita que una `auth.uid()` con `public.profiles`.
- **SoluciÃƒÂ³n:** Implementar polÃƒÂ­ticas con `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`.
- **Regla Derivada:** Toda tabla de escritura administrativa DEBE tener esta verificaciÃƒÂ³n explÃƒÂ­cita para evitar bypasses de seguridad.

### 155. TypeScript State Type Safety in Form Resets Ã¢â‚¬â€� 2026-05-09
- **Problema:** El build fallÃƒÂ³ con `TS2345` al intentar resetear el formulario de accesorios tras un guardado exitoso.
- **Causa RaÃƒÂ­z:** Al aÃƒÂ±adir un campo obligatorio (`category`) al tipo del estado `formData`, cualquier llamada a `setFormData` que pase el objeto completo DEBE incluir dicha propiedad para cumplir con el contrato del tipo, incluso si se desea resetear a un valor por defecto.
- **SoluciÃƒÂ³n:** Sincronizar el objeto de reset inicial con la definiciÃƒÂ³n completa del tipo.
- **LecciÃƒÂ³n:** Al escalar estados complejos en React, usar interfaces explÃƒÂ­citas y buscar todas las llamadas de actualizaciÃƒÂ³n total del estado para evitar roturas de build silenciosas durante el desarrollo.

### 168. LocalizaciÃƒÂ³n SemÃƒÂ¡ntica de AnalÃƒÂ­ticas Ã¢â‚¬â€� 2026-05-10
- **Problema**: Los tÃƒÂ©rminos tÃƒÂ©cnicos como "Requests" y "Page Views" eran ambiguos para el usuario administrativo ("Ã‚Â¿peticiones a quÃƒÂ©?").
- **SoluciÃƒÂ³n**: Implementar un glosario interactivo ("Ã‚Â¿QuÃƒÂ© significa esto?") que traduce mÃƒÂ©tricas a lenguaje de negocio: Peticiones = Esfuerzo tÃƒÂ©cnico (fotos/datos), Vistas = Visitas reales a pÃƒÂ¡ginas.
- **LecciÃƒÂ³n**: En dashboards de mÃƒÂ©tricas, la claridad semÃƒÂ¡ntica es mÃƒÂ¡s importante que la precisiÃƒÂ³n tÃƒÂ©cnica. Siempre acompaÃƒÂ±ar nÃƒÂºmeros con explicaciones contextuales de "quÃƒÂ©" y "cuÃƒÂ¡ndo".

### 169. Limitaciones de GraphQL en Planes Cloudflare Ã¢â‚¬â€� 2026-05-10
- **Problema**: Errores persistentes de "Unknown field" al intentar obtener desgloses por URL o PaÃƒÂ­s.
- **Causa RaÃƒÂ­z**: Los nodos de agregaciÃƒÂ³n como `clientRequestPath` y `clientCountryName` dentro de `httpRequests1hGroups` estÃƒÂ¡n restringidos o requieren habilitaciÃƒÂ³n especÃƒÂ­fica segÃƒÂºn el plan de Cloudflare (Free/Pro/Ent).
- **SoluciÃƒÂ³n**: Adoptar un enfoque de "Estabilidad Progresiva". Ante fallos de esquema, revertir a la query mÃƒÂ­nima estable (sÃƒÂ³lo trÃƒÂ¡fico/cachÃƒÂ©) para garantizar que el dashboard nunca se rompa, priorizando la disponibilidad de datos crÃƒÂ­ticos sobre el desglose granular.
- **LecciÃƒÂ³n**: Al integrar APIs de terceros con tiers de precios, el backend debe ser defensivo y manejar esquemas opcionales para evitar que un cambio de plan bloquee el sistema.

### 170. PrevenciÃƒÂ³n de Deadlocks mediante OrdenaciÃƒÂ³n CanÃƒÂ³nica en Transacciones SQL (Mayo 2026)
- **Problema**: Errores intermitentes de "deadlock detected" y lentitud masiva en producciÃƒÂ³n durante el proceso de checkout cuando mÃƒÂºltiples clientes compraban ÃƒÂ­tems coincidentes simultÃƒÂ¡neamente.
- **Causa RaÃƒÂ­z**: El RPC `create_order_atomic` iteraba sobre el JSON de ÃƒÂ­tems del carrito en el orden arbitrario proporcionado por el cliente, actualizando el stock de `card_printings` o `accessories`. Cuando la TransacciÃƒÂ³n A bloqueaba el ÃƒÂ­tem X y luego el Y, y la TransacciÃƒÂ³n B (simultÃƒÂ¡nea) bloqueaba el ÃƒÂ­tem Y y luego el X, la base de datos abortaba una de las transacciones por interbloqueo.
- **SoluciÃƒÂ³n**: Parchar el procedimiento almacenado para reordenar internamente el array de ÃƒÂ­tems mediante una consulta SQL (`ORDER BY item_type, item_id`) antes de realizar cualquier `SELECT ... FOR UPDATE` o `UPDATE` sobre el inventario.
- **LecciÃƒÂ³n**: Toda funciÃƒÂ³n o procedimiento almacenado que actualice mÃƒÂºltiples registros en lote DEBE garantizar un orden canÃƒÂ³nico y determinista antes de adquirir bloqueos de fila para asegurar escalabilidad y resiliencia bajo concurrencia.


### N. LÃƒÂ³gica de Descuentos, Fechas NULL y Funciones Duplicadas (PostgREST 300) Ã¢â‚¬â€� 2026-05-22
- **Problema**: El descuento se calculaba en un trigger (sobrescribiendo el precio base en la DB), y al pasar el cÃƒÂ¡lculo al frontend, los descuentos permanentes (sin fecha) dejaron de aplicar porque el frontend y los RPC requerÃƒÂ­an estrictamente una fecha de fin (discount_end_date). AdemÃƒÂ¡s, al borrar funciones en Supabase con firmas antiguas, fallaban devolviendo 300 Multiple Choices por haber duplicados (unction overloading).
- **Causa RaÃƒÂ­z**: 1. Las validaciones matemÃƒÂ¡ticas no tenÃƒÂ­an un fallback para fechas NULL como sinÃƒÂ³nimo de descuento permanente. 2. DROP FUNCTION asume una firma especÃƒÂ­fica y si difiere, PostgREST colapsa al intentar resolver el RPC en endpoints /rest/v1/rpc/....
- **SoluciÃƒÂ³n**: Se actualizaron todos los RPC (get_products_filtered, get_accessories_filtered, get_products_stock_by_printing_ids) y isDiscountActive del frontend para tratar discount_end_date IS NULL como un descuento activo permanente. Se limpiaron con sus firmas exactas todas las funciones duplicadas en Supabase.
- **Regla Derivada**: Nunca actualizar un RPC que cambia de firma sin hacer un DROP CASCADE explÃƒÂ­cito de las versiones anteriores. Siempre tratar las fechas opcionales (discount_end_date) con fallback a infinito para evitar que una etiqueta puramente visual no genere el impacto matemÃƒÂ¡tico deseado en caja.

### 171. Despliegues Multi-Entorno y Migraciones Manuales en DEV (Mayo 2026)
- **Problema**: El frontend DEV desplegado por Cloudflare arrojÃƒÂ³ error 400 (column order_items_1.finish does not exist) al consultar metadatos de ÃƒÂ³rdenes.
- **Causa RaÃƒÂ­z**: Las migraciones SQL de cambios de esquema en order_items solo se habÃƒÂ­an aplicado en producciÃƒÂ³n. Como DEV estÃƒÂ¡ segregado en otro proyecto de Supabase y el pipeline CI/CD de Cloudflare solo procesa cÃƒÂ³digo frontend, la base de datos DEV quedÃƒÂ³ desincronizada del esquema esperado.
- **SoluciÃƒÂ³n**: Se utilizÃƒÂ³ el MCP de Supabase para aplicar manualmente las migraciones pendientes en el proyecto DEV (qfkqnnostzaqueujdms) usando el execute_sql con el DDL faltante.
- **LecciÃƒÂ³n**: Al crear migraciones SQL que afecten el modelo de datos (agregando columnas como inish o product_name), es mandatario aplicarlas explÃƒÂ­citamente en el proyecto DEV a travÃƒÂ©s de la CLI, dashboard o herramientas de MCP *antes* o *al mismo tiempo* de subir los cambios de frontend.

### 172. Proyecciones GraphQL CÃƒÂ­egas y Errores 400 (Mayo 2026)
- **Problema**: Fallo total de carga de la pÃƒÂ¡gina de ÃƒÂ³rdenes tras agregar collector_number al bloque de selecciÃƒÂ³n products(...).
- **Causa RaÃƒÂ­z**: Se asumiÃƒÂ³ incorrectamente que collector_number residÃƒÂ­a en la tabla products. Al enviar una peticiÃƒÂ³n con una columna inexistente, Supabase (PostgREST) rechaza toda la peticiÃƒÂ³n con HTTP 400.
- **SoluciÃƒÂ³n**: Remover collector_number del select y documentar que los metadatos extendidos solo estÃƒÂ¡n en card_printings. 
- **LecciÃƒÂ³n**: JamÃƒÂ¡s agregar campos especulativos a una peticiÃƒÂ³n de PostgREST. Antes de modificar proyecciones (select), verificar obligatoriamente la existencia de la columna ejecutando SELECT column_name FROM information_schema.columns WHERE table_name = 'X'.

### 173. Frontend Filters Disconnected from Backend RPCs (Mayo 2026)
- **Problema**: Los filtros de interfaz (Descuentos, Preventa y Otros) estaban conectados al estado y URL de React, pero no producÃ¯Â¿Â½an cambios en los resultados de bÃ¯Â¿Â½squeda.
- **Causa RaÃ¯Â¿Â½z**: Los parÃ¯Â¿Â½metros booleanos y arrays (p_only_discount, p_only_presale, p_games con valor OTHERS) eran enviados correctamente por el frontend, pero las funciones RPC de Supabase (get_products_filtered y get_accessories_filtered) no tenÃ¯Â¿Â½an la lÃ¯Â¿Â½gica en su bloque WHERE para procesarlos, devolviendo el catÃ¯Â¿Â½logo entero.
- **SoluciÃ¯Â¿Â½n**: Modificadas las RPCs en Supabase para interceptar estos flags y filtrar a nivel de SQL. Se aÃ¯Â¿Â½adiÃ¯Â¿Â½ soporte para OTHERS (excluyendo la lista de juegos principales).
- **LecciÃ¯Â¿Â½n**: Al implementar un nuevo control de filtro visual, la primera verificaciÃ¯Â¿Â½n debe ser **siempre** el contrato de la funciÃ¯Â¿Â½n de base de datos (RPC/endpoint) que recibe y procesa el parÃ¯Â¿Â½metro. De lo contrario se genera una ilusiÃ¯Â¿Â½n de funcionalidad en el cliente.

### 6. Filtrado OTHERS en Funciones SQL Ã¢â‚¬â€� 2026-05-26
- **Problema:** La pestaÃƒÂ±a 'OTROS' en el catÃƒÂ¡logo mostraba todos los productos (Magic, Digimon, etc.) en lugar de solo los productos sin juego.
- **Causa RaÃƒÂ­z:** En get_accessories_filtered, cuando el frontend enviaba game_code = 'OTHERS', se pasaba p_game_id = NULL. La condiciÃƒÂ³n (p_game_id IS NULL OR a.game_id = p_game_id) evaluaba a TRUE para todos los productos, anulando el filtro.
- **SoluciÃƒÂ³n:** Modificar la funciÃƒÂ³n SQL para manejar explÃƒÂ­citamente (p_game_code = 'OTHERS' AND a.game_id IS NULL) y aplicar el filtro regular solo si p_game_code != 'OTHERS'.
- **Regla Derivada:** Al usar filtros dinÃƒÂ¡micos en Supabase RPC que aceptan NULL para indicar 'sin filtro', siempre se debe proveer un caso base explÃƒÂ­cito (OTHERS o similar) para filtrar registros donde la columna es literalmente NULL. (Codificado en migraciÃƒÂ³n 20260527000000_fix_accessories_others_filter.sql).


### 174. Timeout y Tablas Temporales en SincronizaciÃƒÂ³n Masiva Ã¢â‚¬â€� 2026-05-27
- **Problema:** El script de sincronizaciÃƒÂ³n perdÃƒÂ­a datos intermedios en lotes y la fase final de denormalizaciÃƒÂ³n fallaba silenciosamente tras 2 minutos de procesamiento.
- **Causa RaÃƒÂ­z:** 1. Las tablas temporales de PostgreSQL creadas con ON COMMIT DROP se eliminan en el primer conn.commit() del script (usado para iteraciones en batch), provocando InFailedSqlTransaction. 2. El timeout por defecto de PostgreSQL aborta consultas de agregaciÃƒÂ³n masiva que duran mÃƒÂ¡s de 2 minutos.
- **SoluciÃƒÂ³n:** 1. Cambiar la declaraciÃƒÂ³n de la tabla temporal a ON COMMIT PRESERVE ROWS para procesos en batch. 2. Elevar explÃƒÂ­citamente el timeout (SET statement_timeout = '30min') en la sesiÃƒÂ³n del cursor justo antes de consultas analÃƒÂ­ticas pesadas.
- **Regla Derivada:** Al diseÃƒÂ±ar scripts en Python (psycopg2) que dividen inserts masivos en chunks con .commit() intermedios, jamÃƒÂ¡s usar ON COMMIT DROP en tablas temporales. Siempre aumentar el statement_timeout para actualizaciones de desnormalizaciÃƒÂ³n tipo FULL OUTER JOIN sobre histÃƒÂ³ricos completos.

### 175. Modificaciones a BD Remota con MÃƒÂºltiples Entornos (Mayo 2026)
- **Problema:** Se ejecutÃƒÂ³ un script de reemplazo de caracteres directamente en la base de datos de producciÃƒÂ³n (rama `main`) asumiendo que el archivo local `.env` (que apuntaba a `main`) era el entorno que el usuario querÃƒÂ­a probar, cuando el usuario estaba realmente testeando en la rama de Supabase `dev`.
- **Causa RaÃƒÂ­z:** Falta de validaciÃƒÂ³n cruzada. El archivo local `.env` no siempre refleja el entorno en el que el usuario interactÃƒÂºa actualmente (por ej. Cloudflare Pages Preview usando la rama `dev`).
- **SoluciÃƒÂ³n:** Solicitar explÃƒÂ­citamente y usar el MCP de Supabase especificando el `project_id` del entorno (en este caso el ID de la rama `dev`) en lugar de usar comandos Python basados ciegamente en `DATABASE_URL`.
- **LecciÃƒÂ³n:** Al operar directamente sobre bases de datos en la nube que tienen bifurcaciÃƒÂ³n por ramas, SIEMPRE usar las herramientas de MCP de Supabase para listar proyectos y ramas (`list_branches`) y forzar la operaciÃƒÂ³n a travÃƒÂ©s de `execute_sql` en la rama especÃƒÂ­fica solicitada por el usuario.

### 176. Restricciones de Nombres de Archivo de Windows en Sistemas de ImÃƒÂ¡genes (Mayo 2026)
- **Problema:** Los nombres de accesorios contenÃƒÂ­an caracteres invÃƒÂ¡lidos para el sistema de archivos de Windows (`:`, `/`, `"`, etc.), lo que impedÃƒÂ­a la coincidencia (match) de imÃƒÂ¡genes locales al subirlas en masa.
- **Causa RaÃƒÂ­z:** Se corrigiÃƒÂ³ originalmente solo el carÃƒÂ¡cter `:` pensando que era el ÃƒÂºnico obstÃƒÂ¡culo, omitiendo toda la lista de caracteres no compatibles en nombres de archivo OS.
- **SoluciÃƒÂ³n:** Aplicar expresiones regulares en la base de datos y scripts de limpieza de CSV para eliminar TODOS los caracteres problemÃƒÂ¡ticos (`[\\/*?"<>|:]`) y prevenir que el bulk upload falle.
- **Regla Derivada:** Si se va a hacer match local entre cadenas de la Base de Datos y nombres de archivos de un OS, la BD y los CSVs de importaciÃƒÂ³n deben estar sanitizados de la lista completa de caracteres invÃƒÂ¡lidos, no solo de un carÃƒÂ¡cter particular reportado.

### Filtros de Rango UX y Valores Cero Ã¢â‚¬â€� 2026-05-28
- **Problema:** El filtro de precios forzaba valores por defecto (ej. 1000000) impidiendo que el usuario vaciara el input. AdemÃƒÂ¡s, el backend ignoraba la bÃƒÂºsqueda por el valor `0` absoluto.
- **Causa RaÃƒÂ­z:** InicializaciÃƒÂ³n estricta sin admitir `undefined` en el estado de React. En API, la validaciÃƒÂ³n `precio || null` fallaba para el nÃƒÂºmero 0 al ser falsy.
- **SoluciÃƒÂ³n:** Utilizar `undefined` en el estado local para inputs vacÃƒÂ­os, y reemplazar `|| null` por validaciÃƒÂ³n estricta `!== undefined ? valor : null` en llamadas a la API.
- **Regla Derivada:** Las variables de estado para filtros numÃƒÂ©ricos opcionales deben soportar `undefined`. Validaciones hacia el backend deben usar validaciÃƒÂ³n estricta explÃƒÂ­cita `!== undefined`, nunca el operador lÃƒÂ³gico `||` para nÃƒÂºmeros que pueden ser vÃƒÂ¡lidamente cero.

### 177. AsunciÃƒÂ³n de Entornos y Filtros Ocultos (Mayo 2026)
- **Problema:** Se modificÃƒÂ³ la base de datos de PROD al asumir que `VITE_ENVIRONMENT=development` en el archivo local `.env` indicaba que la URL adjunta correspondÃƒÂ­a a DEV. Adicionalmente, la RPC de Supabase para bÃƒÂºsquedas (`get_accessories_filtered`) devolvÃƒÂ­a todo el catÃƒÂ¡logo por un cortocircuito lÃƒÂ³gico en `p_game_id IS NULL`.
- **Causa RaÃƒÂ­z:** 
  1. No cruzar la informaciÃƒÂ³n del archivo `.env` con la documentaciÃƒÂ³n canÃƒÂ³nica (`LEYES_DEL_SISTEMA.md` o IDs conocidos). 
  2. En PostgreSQL (RPCs), usar `(param IS NULL OR col = param)` cuando se pasa `NULL` como valor para "ignorar filtro" puede generar falsos positivos desastrosos si se combina con una condiciÃƒÂ³n excluyente en la misma evaluaciÃƒÂ³n (como `game_code = 'OTHERS'`).
- **SoluciÃƒÂ³n:** 
  1. Se reestructurÃƒÂ³ `.env` y `frontend/.env` definiendo explÃƒÂ­citamente ambos entornos (`DEV_...` y `PROD_...`). 
  2. Se parcheÃƒÂ³ la RPC en BD DEV aislando el chequeo explÃƒÂ­cito `(p_game_code = 'OTHERS' AND a.game_id IS NULL)` fuera del chequeo genÃƒÂ©rico de ignorar filtros.
- **Regla Derivada:** JamÃƒÂ¡s asumir entornos por nombres de variables locales (ej. `development` en un archivo no garantiza que la BD sea el sandbox). SIEMPRE confirmar el ID del proyecto Supabase (DEV=`bqfkqnnostzaqueujdms`, PROD=`sxuotvogwvmxuvwbsscv`).


### 178. Funciones Sobrecargadas en SQL y Despliegues de BD en Cloudflare (Junio 2026)
- **Problema:** Un error PGRST203 ('Could not choose the best candidate function') rompiÃ¯Â¿Â½ la tienda de ProducciÃ¯Â¿Â½n porque habÃ¯Â¿Â½a mÃ¯Â¿Â½ltiples firmas para get_products_filtered.
- **Causa RaÃ¯Â¿Â½z:** Al crear una migraciÃ¯Â¿Â½n SQL, se modificÃ¯Â¿Â½ accidentalmente el orden de los parÃ¯Â¿Â½metros booleanos. PostgreSQL creÃ¯Â¿Â½ una funciÃ¯Â¿Â½n sobrecargada (overloaded) en vez de reemplazar la existente. AdemÃ¯Â¿Â½s, Cloudflare Pages no ejecuta estas migraciones automÃ¯Â¿Â½ticamente, creando discrepancia entre el repositorio y la DB remota.
- **SoluciÃ¯Â¿Â½n:** Ejecutar explÃ¯Â¿Â½citamente DROP FUNCTION de la firma defectuosa y CREATE OR REPLACE con los parÃ¯Â¿Â½metros en orden estricto, aplicando el SQL manualmente a las BDs de DEV y PROD.
- **Regla Derivada:** LEY 34 (Respetar orden de argumentos en CREATE OR REPLACE FUNCTION) y LEY 35 (SincronizaciÃ¯Â¿Â½n manual en Cloudflare).


### 179. Bug en Filtro Cruzado de CategorÃ¯Â¿Â½as (category vs category_code) Ã¯Â¿Â½ 2026-06-02
- **Problema:** Al seleccionar una categorÃ¯Â¿Â½a desde la barra lateral (ej. 'Otros', 'Accesorios'), la API devolvÃ¯Â¿Â½a 'SIN RESULTADOS'.
- **Causa RaÃ¯Â¿Â½z:** El frontend asignaba errÃ¯Â¿Â½neamente la etiqueta de UI de texto libre ('Otros') al parÃ¯Â¿Â½metro `category_code` en lugar de a `category`. Como `category_code` espera valores de tipo ENUM ('OTHER'), la bÃ¯Â¿Â½squeda fallaba de manera silenciosa.
- **SoluciÃ¯Â¿Â½n:** Reasignar el valor pasado por URL a la propiedad `category` dentro del mÃ¯Â¿Â½todo `fetchAccessories` en `Home.tsx`.
- **Regla Derivada:** Ley 36: DIFERENCIACIÃ¯Â¿Â½N DE CATEGORY_CODE VS CATEGORY.


### 180. ConstrucciÃ¯Â¿Â½n Correcta de URL para Edge Functions - 2026-06-04
- **Problema:** Errores 404 (Not Found) en la consola al consultar detalles de cartas/accesorios, y mensajes de fallback ([Supabase] Falling back for details...).
- **Causa RaÃ¯Â¿Â½z:** El frontend intentaba consumir la Edge Function omitiendo el prefijo /api o /tcg-api necesario al concatenar directamente API_BASE y /cards/.... Esto causaba que la llamada HTTP fallara, aunque el sistema se recuperaba consultando la tabla directamente.
- **SoluciÃ¯Â¿Â½n:** Utilizar la funciÃ¯Â¿Â½n de utilidad getApiUrl() en etchCardDetails (utils/api.ts) que garantiza la correcta inyecciÃ¯Â¿Â½n del prefijo, y comprender que los fallbacks a card_printings son mecanismos resilientes esperados.
- **Regla Derivada:** LEY 37 (Utilizar SIEMPRE getApiUrl para construir endpoints de Edge Functions en el frontend).


### 181. Supabase Storage RLS Concurrency y Promise.all() - 2026-06-04
- **Problema:** Al intentar subir mÃºltiples imÃ¡genes simultÃ¡neamente usando Promise.all() hacia un bucket de Supabase Storage, el servidor retornaba un falso error 400 Bad Request: new row violates row-level security policy.
- **Causa RaÃ­z:** Las subidas concurrentes a la misma tabla storage.objects pueden causar colisiones internas o bloqueos durante la evaluaciÃ³n de la polÃ­tica RLS en Supabase, resultando en un rechazo arbitrario.
- **SoluciÃ³n:** Reemplazar Promise.all() por iteraciones secuenciales (or...of) con wait para subir archivo por archivo, garantizando que no existan carreras de ejecuciÃ³n en el bucket.
- **Regla Derivada:** Al subir mÃºltiples imÃ¡genes a Supabase Storage desde el frontend, SIEMPRE usar un enfoque secuencial (for-loop) en vez de concurrente (Promise.all) para evitar falsos errores de RLS.


### 36. [Routing en Edge Functions & Cache-Busting UI] Ã¢â‚¬â€� 2026-06-05
- **Problema:** El AdminDashboard daba error 500 para Cloudflare Analytics y el banner de 'SincronizaciÃƒÂ³n Retrasada' se quedaba atascado en el tiempo.
- **Causa RaÃƒÂ­z:** 
### 36. [Routing en Edge Functions & Cache-Busting UI] â€” 2026-06-05
- **Problema:** El AdminDashboard daba error 500 para Cloudflare Analytics y el banner de 'SincronizaciÃ³n Retrasada' se quedaba atascado en el tiempo.
- **Causa RaÃ­z:** 
  1. El servidor de Supabase corta los prefijos en la URL al hacer proxys internos, rompiendo comprobaciones `path === '/api/admin/cloudflare/analytics'`.
  2. Consultar `order('updated_at', {desc: true})` sobre `card_printings` (sin Ã­ndices) causaba un escaneo secuencial masivo, resultando en nulls silenciosos o timeouts.
  3. Al consultar cada 30s la misma URL de PostgREST, Google Chrome/Safari cachean agresivamente devolviendo 304 Not Modified, ignorando las actualizaciones en la DB.
- **SoluciÃ³n:** 
  1. Usar `path.includes('/admin/cloudflare/analytics')` para todas las validaciones de ruta en Edge Functions.
  2. Indexar la tabla `card_printings(updated_at DESC NULLS LAST)`.
  3. Inyectar cache-busting en el cliente Supabase-JS con `.neq('printing_id', Date.now().toString())`.

# Lessons Learned

## Lesson #38: Scryfall API y HTTP 400 Bad Request
- **Fecha**: 2026-06-07
- **Problema**: Los scripts en Python fallaban al hacer peticiones a Scryfall con error HTTP 400.
- **Causa RaÃ­z**: Scryfall endureciÃ³ sus polÃ­ticas anti-scraping y rechaza clientes anÃ³nimos (como `requests/2.x.x`).
- **SoluciÃ³n**: Siempre inyectar un header `User-Agent` descriptivo y un `Accept: application/json` al hacer requests a Scryfall.

## Lesson #37: Componentes Inline vs Modales en Paneles Administrativos
- **Fecha**: 2026-06-07
- **Problema**: Insertar un mÃ³dulo de historial directamente en el flujo del layout rompÃ­a la jerarquÃ­a visual del Dashboard.
- **SoluciÃ³n**: Refactorizar tablas pesadas y reportes secundarios hacia un componente Modal (`fixed inset-0 z-150`) disparado desde un botÃ³n estandarizado en la grilla principal.
- **Regla Derivada**: Nunca forzar mÃ³dulos grandes dentro de un layout de navegaciÃ³n sin un botÃ³n colapsable o modal.

## Lesson #36: Cache Busting React Query y Proxies de Supabase-JS con `.neq('printing_id', Date.now().toString())`.
- **Regla Derivada:** NUNCA hacer polling estÃ¡tico con `supabase.from().select()` sin un mecanismo de invalidaciÃ³n de cachÃ© o cache-busting. NUNCA usar match estricto para routing manual en Supabase Edge Functions.

### 182. PÃ©rdida de Contexto y Gasto de Tokens (Junio 2026)
- **Problema:** En sesiones de desarrollo prolongadas, el agente pierde el estado de la tarea, la rama, y gasta tokens innecesarios escaneando el proyecto (grep/read) o haciendo instalaciones locales incorrectas.
- **Causa RaÃ­z:** Falta de un protocolo de estado persistente pequeÃ±o (SESSION_STATE) y de un Knowledge Graph que contenga la semÃ¡ntica del cÃ³digo pre-computada.
- **SoluciÃ³n:** ImplementaciÃ³n de las 5 tÃ©cnicas del mercado: Graphify (grafo de cÃ³digo local), SESSION_STATE.md, Context Budget Protocol, Spec-First Development y Browser-First Verification en el /prehook.
- **Regla Derivada:** Queda prohibido el uso arbitrario de grep/list_dir sin antes consultar el grafo (graphify query). Obligatorio leer SESSION_STATE.md al inicio de cada sesiÃ³n y actualizarlo al cierre.

### 183. Unicidad de Direcciones Predeterminadas mediante Triggers Database-Level (Junio 2026)
- **Problema:** Al permitir que los usuarios administren mÃºltiples direcciones en su libreta, existe el riesgo de que el cliente (o peticiones concurrentes del frontend) marque mÃ¡s de una direcciÃ³n como predeterminada de envÃ­o (`is_default`) o de facturaciÃ³n (`is_billing`), causando ambigÃ¼edad en procesos automatizados de despacho.
- **SoluciÃ³n:** Crear un trigger a nivel de base de datos (`BEFORE INSERT OR UPDATE ON user_addresses`) que intercepte cualquier fila con la bandera activa y ejecute un `UPDATE` atÃ³mico para desmarcar todas las demÃ¡s direcciones del mismo usuario. Esto garantiza la integridad referencial sin aÃ±adir lÃ³gica compleja o transacciones pesadas en el cÃ³digo frontend.
- **Regla Derivada:** El manejo de estados mutuamente excluyentes (como banderas predeterminadas por usuario) debe resolverse siempre mediante triggers SQL a nivel de fila antes de la inserciÃ³n/actualizaciÃ³n, no mediante validaciones en el cliente.

### 184. Persistencia de Historial en Campos Schemaless JSONB (Junio 2026)
- **Problema:** Para cumplir con el requerimiento de soportar una direcciÃ³n de facturaciÃ³n independiente a la de envÃ­o sin alterar o rigidizar la tabla de Ã³rdenes (`orders`), agregar mÃºltiples columnas de facturaciÃ³n independientes requerirÃ­a una migraciÃ³n de esquema compleja y difÃ­cil de mantener.
- **SoluciÃ³n:** Utilizar la flexibilidad de la columna JSONB de direcciÃ³n (`shipping_address`) para almacenar la direcciÃ³n fÃ­sica elegida y, de forma opcional y anidada, un objeto secundario `billing_address`. Esto preserva el historial de la compra de forma inmutable sin modificar las columnas estructuradas de la tabla de Ã³rdenes.
- **Regla Derivada:** Datos transaccionales de sÃ³lo-lectura histÃ³rica y con estructura variable (como detalles de facturaciÃ³n/despacho) deben encapsularse dentro de columnas JSONB existentes en lugar de forzar nuevas columnas estructuradas en el modelo de datos.

### 185. Fechas de Lanzamiento y Filtro de Preventas Multi-Tipo (Junio 2026)
- **Problema:** Facilitar el filtro de "Preventas" en el historial de compras requerÃ­a cruzar datos de productos cuyo origen de preventa y fechas de lanzamiento variaban segÃºn el tipo de catÃ¡logo (accesorios vs cartas). Los accesorios carecÃ­an de una columna de fecha de lanzamiento, impidiendo calcular las estimaciones de llegada de forma homogÃ©nea.
- **SoluciÃ³n:** Crear la columna `release_date` en la tabla de accesorios para lograr paridad con el catÃ¡logo de cartas. En el frontend, se calcula la fecha mÃ¡xima de liberaciÃ³n estimada iterando sobre los Ã­tems de la orden y extrayendo el valor correspondiente, permitiendo mostrar banners de lanzamiento en el historial de Ã³rdenes y la pÃ¡gina de tracking.
- **Regla Derivada:** Para habilitar filtros agregados multi-tipo en el historial de pedidos, las tablas de inventario subyacentes deben mantener paridad en columnas temporales clave (`release_date` / `updated_at`).


### 2026-08-16: Cross-Tab Sync con localStorage `storage` Event

- **Problema**: El carrito se actualizaba en la pestaÃ±a activa pero no en otras pestaÃ±as abiertas de la misma sesiÃ³n.
- **Causa RaÃ­z**: `window.dispatchEvent(new Event('cart-updated'))` es un evento local del DOM. Solo la pestaÃ±a que lo emite lo escucha; las otras pestaÃ±as son completamente ajenas.
- **SoluciÃ³n**: Usar la API nativa `localStorage` + el evento `storage` del `window`. El evento `storage` es cross-tab: se emite automÃ¡ticamente en **todas las demÃ¡s pestaÃ±as** (no en la propia) cuando una pestaÃ±a modifica el localStorage.
- **PatrÃ³n Correcto**: Emitir `localStorage.setItem('cart_sync_timestamp', Date.now())` en cada mutaciÃ³n del carrito. En `CartContext` escuchar `window.addEventListener('storage', handler)` y llamar `refreshCart()` cuando `e.key === 'cart_sync_timestamp'`.
- **Regla Derivada**: Para sincronizaciÃ³n multi-pestaÃ±a, siempre usar `localStorage` events. Para sincronizaciÃ³n dentro de la misma pestaÃ±a, usar `CustomEvent` del DOM.

### 2026-08-16: add_to_cart_v2 â€” JOIN estricto rompe cartas sin set_id

- **Problema**: Cartas inyectadas vÃ­a Auto-Discovery no podÃ­an ser aÃ±adidas al carrito. El RPC retornaba `'No se pudo identificar la entidad'` silenciosamente.
- **Causa RaÃ­z**: El RPC original hacÃ­a `JOIN public.sets s ON cp.set_id = s.set_id`. Las cartas de Auto-Discovery se insertaron solo con `set_code` (string), sin `set_id` (FK). El JOIN producÃ­a `v_name IS NULL`.
- **SoluciÃ³n**: Eliminar el JOIN con `public.sets`. Extraer `set_code` directamente de `card_printings`. La columna `set_code` siempre existe en el catÃ¡logo. La tabla `sets` es solo un catÃ¡logo de referencia, no un requisito para operaciones de carrito.
- **Regla Derivada**: Los RPCs de operaciones transaccionales (carrito, checkout) NO deben depender de JOINs con tablas de referencia opcionales. Siempre usar los campos mÃ¡s directos disponibles en la tabla principal.

### 2026-08-16: QuickStockItem â€” condition != finish

- **Problema**: Al agregar cartas desde el panel de stock rÃ¡pido, todas se aÃ±adÃ­an como `nonfoil` aunque fueran foil.
- **Causa RaÃ­z**: `handleAddToCart` usaba `item.condition === 'Foil'` para detectar si era foil. La condiciÃ³n real de un producto es `NM`, `LP`, `MP`, etc., nunca `'Foil'`. El campo correcto es `finish`.
- **SoluciÃ³n**: Agregar `finish?: string` a `QuickStockItemProps` y usar `item.finish?.toLowerCase() ?? 'nonfoil'`.
- **Regla Derivada**: En Geekorium, `condition` = calidad fÃ­sica (NM/LP/MP) y `finish` = acabado (nonfoil/foil/etched). Son campos completamente distintos. Nunca usar `condition` para inferir `finish`.



# #   2 0 2 6 - 0 6 - 1 7 :   C u i d a d o   c o n   V i t e P W A   a u t o U p d a t e   y   p r e c o n n e c t s   c r u d o s 
 
 E l   m o d o   ' a u t o U p d a t e '   d e   V i t e P W A   p r e c a c h e a   t o d o s   l o s   a s s e t s   i n m e d i a t a m e n t e ,   l o   q u e   p u e d e   a h o g a r   l a   c o n e x i o n   W i - F i   e n   m o v i l e s   l e n t o s   y   b l o q u e a r   p e t i c i o n e s   c r i t i c a s   a   S u p a b a s e .   A d e m a s ,   e v i t e m o s   u s a r   % V I T E _ V A R S %   e n   e l   i n d e x . h t m l   p a r a   < l i n k   r e l = ' p r e c o n n e c t ' >   s i   n o   g a r a n t i z a m o s   q u e   e l   b u i l d   r e e m p l a c e   l a   v a r i a b l e ,   y a   q u e   S a f a r i   b l o q u e a r a   e l   r e n d e r i z a d o   ( h a s t a   p o r   1 4   s e g u n d o s )   e s p e r a n d o   q u e   s e   r e s u e l v a   u n   D N S   l i t e r a l   c o m o   ' % V I T E _ S U P A B A S E _ U R L % ' . 
 
 
### 161. Bulk Import Set Name Resolution (Aug 2026)
- **Problema**: El filtro por Set en el catÃ¡logo ('The Hobbit') no devolvÃ­a resultados para cartas reciÃ©n importadas, aunque el cÃ³digo del set ('HOB') era correcto.
- **Causa RaÃ­z**: El importador masivo (bulk_upload) dejaba la columna set_name en NULL. El filtro del frontend enviaba el nombre completo del set al RPC get_products_filtered, el cual intentaba hacer match directo contra p.set_name o p.set_code. Al ser NULL, fallaba silenciosamente.
- **SoluciÃ³n**: 
  1. **En la base de datos (DiseÃ±o Relacional)**: Se actualizÃ³ get_products_filtered para que busque el cÃ³digo correcto haciendo un subquery a la tabla sets como fuente de la verdad: OR p.set_code IN (SELECT set_code FROM sets WHERE set_name = ANY(set_filter)).
  2. **En el Importador**: Se modificÃ³ el RPC ulk_import_inventory para que siempre rellene set_name consultando la tabla sets durante la inserciÃ³n.
- **LecciÃ³n**: Nunca depender de datos denormalizados (como set_name en la tabla products) para filtros crÃ­ticos. Usar subqueries a las tablas de referencia (sets) garantiza robustez incluso si los scripts de importaciÃ³n fallan en guardar el dato redundante.

### 162. CSS Flexbox Inverse Overflow en Precios (Aug 2026)
- **Problema**: El precio de las cartas FOIL en la vista de cuadrÃ­cula (Grid) se veÃ­a cortado por la izquierda (ej: '79.99' en lugar de '.99'), perdiendo el sÃ­mbolo de moneda.
- **Causa RaÃ­z**: En contenedores flex con justify-end, si el contenido (el string del precio + el badge FOIL) es mÃ¡s ancho que el espacio disponible de la tarjeta (muy angosta en pantallas de 6 columnas), el desbordamiento ocurre hacia la izquierda, no hacia la derecha, ocultando los primeros caracteres.
- **SoluciÃ³n**: Reducir el tamaÃ±o de fuente de 	ext-lg a 	ext-base y aÃ±adir 	racking-tight al precio en el componente Card.tsx (vista grid) para asegurar que quepa sin desbordarse.
- **LecciÃ³n**: Siempre probar los componentes de precio con strings anchos (ej: valores de 3 dÃ­gitos + FOIL badge) en las columnas mÃ¡s estrechas del grid responsivo. El justify-end puede ocultar fallas de responsive design comiÃ©ndose el contenido por la izquierda.

### 163. Ordenamiento HÃ­brido por Fecha de Carga (Aug 2026)
- **Problema**: El filtro 'NUEVO' agrupaba las cartas reciÃ©n cargadas en pequeÃ±os bloques separados por microsegundos, lo que impedÃ­a que el usuario pudiera ordenarlas por precio globalmente (ej: veÃ­a puras cartas azules baratas primero, luego rojas, etc.).
- **Causa RaÃ­z**: El RPC forzaba un ORDER BY restocked_at DESC como primer criterio para separar lo nuevo de lo viejo. Como el importador las subÃ­a secuencialmente en milisegundos distintos, el orden por precio se volvÃ­a secundario e inÃºtil.
- **SoluciÃ³n**: Eliminar el ORDER BY restocked_at DESC forzado para el filtro NUEVO. En su lugar, el RPC calcula dinÃ¡micamente el Ãºltimo dÃ­a de carga (MAX(restocked_at)) y define una ventana de 7 dÃ­as. Todo lo que cae en esa ventana se filtra en el WHERE, permitiendo que el ORDER BY sea exclusivamente el que el usuario eligiÃ³ (ej: price DESC), mezclando asÃ­ todas las cartas de esa semana por precio.
- **LecciÃ³n**: Separar el concepto de 'SelecciÃ³n' (WHERE) del concepto de 'Orden' (ORDER BY). Si el usuario quiere ver lo nuevo ordenado por precio, la novedad debe ser un filtro, no un criterio de ordenamiento forzado.

### 50. CardTrader API V2 Disconnects â€” 2026-08-19
- **Problema:** El endpoint de CardTrader (/marketplace/products) desconecta la conexiÃ³n de manera abrupta en iteraciones continuas (arroja HTTPX RemoteProtocolError).
- **Causa RaÃ­z:** Rate Limiting no documentado o inestabilidad del servidor de CardTrader al procesar cientos de consultas en serie.
- **SoluciÃ³n:** Envolver la peticiÃ³n GET en un bloque try/except para capturar la excepciÃ³n y evitar que el loop entero de actualizaciÃ³n de precios se rompa.
- **Regla Derivada:** En scripts de sync de APIs de TCG gratuitos, siempre blindar las peticiones de red para que el proceso sea resiliente. Codificado en price_sync.py.

### 51. UI Multi-Game Isolation en Trading Hub â€” 2026-08-19
- **Problema:** El componente de la tienda detallada mostraba 'Card Kingdom Price' y enlaces de CK para cartas de Gundam.
- **Causa RaÃ­z:** DiseÃ±o y copy originales hardcodeados estrictamente para Magic the Gathering.
- **SoluciÃ³n:** Condicionar los labels (Card Kingdom Price vs Geekorium Price) y los hipervÃ­nculos del Market Price (Standard @ CK vs Standard @ CT) verificando details?.game === 'GND'.
- **Regla Derivada:** Cualquier UI genÃ©rico que muestre precios o links de mercado debe verificar primero el juego de la carta (details.game).

### 52. Integridad Referencial al inyectar Stock Dummy â€” 2026-08-19
- **Problema:** Al inyectar stock temporal de Gundam en la tabla products reutilizando un printing_id arbitrario (ej. Bloodline Culling de MTG), la UI crasheÃ³ mostrando 'IMAGEN NO DISPONIBLE' y '99 Versions'.
- **Causa RaÃ­z:** El componente CardDetail colapsa los productos agrupando por printing_id. Inyectar 100 productos bajo la misma ID rompiÃ³ la lÃ³gica visual.
- **SoluciÃ³n:** Para testear catÃ¡logos en frontend, inyectar stock de forma estricta recuperando printing_id e image_url reales del juego (game_id = 17) en la tabla card_printings.
- **Regla Derivada:** Nunca inventar o reciclar FKs de printing_id en products. Siempre hacer JOIN o un IN query contra card_printings validando el juego.

# #   2 0 2 6 - 0 8 - 2 1 :   V e r c e l   S c h e m a   D e s y n c 
 -   W h e n   m o d i f y i n g   d a t a b a s e   s c h e m a s   v i a   S u p a b a s e ,   e n s u r e   t h a t   t h e   m o d i f i c a t i o n s   a r e   a p p l i e d   t o   B O T H   t h e   d e v e l o p m e n t   A N D   p r o d u c t i o n   e n v i r o n m e n t s   i f   t h e   f r o n t e n d   d e p e n d s   o n   t h e m . 
 -   S u p a b a s e   c a c h e s   t h e   s c h e m a   u s i n g   P o s t g R E S T .   R u n   \ N O T I F Y   p g r s t ,   ' r e l o a d   s c h e m a ' \   v i a   S Q L   t o   e n s u r e   n e w   c o l u m n s   a r e   a v a i l a b l e   i n   t h e   A P I   i m m e d i a t e l y . 
 -   T h e   c l i e n t   r e q u e s t e d   t h e   G u n d a m   3 - p o i n t   s y s t e m   ( C o n q u i s t a ,   D e r r i b o ,   K i l l s )   t o   b e   u s e d   a c r o s s   A L L   g a m e s ,   n o t   j u s t   G u n d a m .   R e m o v e d   t h e   s i n g l e - p o i n t   f a l l b a c k   t o   u n i f y   t h e   s c o r i n g   s y s t e m .  
 
### 54. Supabase Webhooks and Env Mixed-up â€” 2026-08-23
- **Problema:** Los webhooks nativos de Odoo (ir.actions.server state=webhook) no enviaban los campos esperados y la funciÃ³n de Supabase devolvÃ­a error de Auth con la apikey.
- **Causa RaÃ­z:** Odoo no envÃ­a campos a menos que se definan en webhook_field_ids. AdemÃ¡s, Supabase/Kong filtra los parÃ¡metros de URL llamados apikey, y el usuario editaba plantillas en PROD mientras operaba en DEV.
- **SoluciÃ³n:** 1. Usar un query param personalizado (?secret=...) en lugar de apikey. 2. AÃ±adir los ids de res.partner a webhook_field_ids en Odoo. 3. Identificar el proyecto (DEV vs PROD) para las plantillas.
- **Regla Derivada:** Usar query parameters customizados para secrets en Supabase Edge Functions que se llaman desde Webhooks externos. Validar siempre que el entorno (Project Ref) de Supabase coincide con donde se edita.

### 55. Fallo de Scraping BCV por SSL Gubernamental (Aug 2026)
- **Problema:** Al intentar hacer scraping con Deno/Node a bcv.org.ve para obtener la tasa oficial, el sistema lanzaba 'invalid peer certificate: UnknownIssuer'.
- **Causa Raíz:** Las entidades del gobierno venezolano frecuentemente tienen certificados SSL autofirmados o vencidos que bloquean a los runtimes modernos.
- **Solución:** No hacer scraping directo. Utilizar el API público 've.dolarapi.com/v1/dolares/oficial' o el API de Binance P2P ('p2p.binance.com') para asegurar estabilidad a largo plazo.
- **Regla Derivada:** Nunca usar web scraping tradicional contra páginas web gubernamentales de LATAM para procesos automatizados sin control de SSL; usar siempre intermediarios o APIs públicos comprobados.



### 56. Odoo Cambio de Moneda Principal a USD y Cálculo Multimoneda Inverso (Nov 2026)
- **Problema**: Odoo bloqueaba el cambio de moneda de la compañía (`res.company.currency_id`) con el error "No puede cambiar la moneda de la compañía, ya que contiene asientos contables". Además, al cambiar la moneda base a USD, las tasas relativas cambiaron de sentido matemático.
- **Causa Raíz**: 1) Existían 8 facturas/asientos contables de prueba en `account.move` generadas durante desarrollo que impedían el cambio de divisa de la compañía. 2) Odoo define el campo `rate` como "unidades de esta moneda por 1 unidad de moneda de la compañía". Cuando la base era VEF, USD era `1/BCV`. Al pasar la base a USD (1.0), el tipo de cambio de VEF/VES en Odoo pasa a ser directamente `rateOficial` (ej. 891.10), y USB (Dólar Binance USDT) pasa a ser la paridad `rateOficial / rateParalelo`.
- **Solución**: Se eliminaron los asientos y pagos de prueba en Odoo, se cambió `res.company.currency_id` a USD (id=1), se limpiaron los registros históricos desalineados de USD en `res.currency.rate`, y se actualizó y desplegó la Edge Function `odoo-bcv-sync` para calcular y persistir las tasas correctamente respecto al USD base.
- **Regla Derivada**: La moneda base de la compañía en Odoo no debe tener tasas con valores distintos a 1.0 en `res.currency.rate`. Al cambiar la moneda base, adaptar inmediatamente las funciones automáticas de sincronización cambiaria.

### 44. Integración Tripartita E2E (Web -> SortSwift -> Odoo) & Prevención de Sobreescritura de Items Web
- **Contexto**: Al crear una orden en el flujo de checkout asistido, la web gobierna la transacción: bloquea el stock web a 0, crea la orden en Odoo via odoo-sync, y coloca un hold temporal de 60 minutos en SortSwift sobre la carta física (order_items.sortswift_reservation_id).
- **Problema Descubierto**:
  1. Odoo configurado con acciones automatizadas dispara inmediatamente un webhook de sale.order hacia odoo-webhook. En la implementación anterior, odoo-webhook ejecutaba DELETE FROM order_items WHERE order_id = targetWebOrderId y reconstruía las líneas desde Odoo, borrando el sortswift_reservation_id que odoo-sync acababa de asociar.
  2. En el sandbox de SortSwift, invocar POST /raw-cards/{id}/return sobre una carta que ya tiene estado vailable incrementa su cantidad física (+1). Si la cantidad era 1, pasa a 2, por lo que un commit posterior reduce la cantidad a 1 y la carta sigue apareciendo como vailable.
  3. Al consultar pedidos en PostgREST (orders), combinar id.eq.<val>,odoo_order_id.eq.<val> en .or() cuando <val> no es un UUID válido causa invalid input syntax for type uuid en PostgreSQL.
- **Solución Implementada**:
  1. En odoo-webhook/index.ts, aislar la reconstrucción de order_items únicamente para pedidos creados de origen en Odoo (if (!webOrderId)). Para pedidos originados en la web, odoo-webhook solo actualiza el estado (status), monto y odoo_order_id, preservando intactos los items y reservas web.
  2. En odoo-webhook/index.ts, validar con regex UUID antes de consultar por id en .or(). Si es string normal, consultar estrictamente por odoo_order_id.
  3. En SortSwiftClient y tests, condicionar 
eturn_card_to_sandbox para que solo se invoque si el estado de la carta es 'removed' o su cantidad es 0, evitando inflar el inventario artificialmente.
- **Resultado**: Suite de pruebas E2E automatizada (scripts/tests/e2e_full_checkout_sortswift_test.py) con 3 escenarios críticos (Checkout con Commit, Checkout con Cancelación y Venta Directa POS en tienda) pasando al 100%.
