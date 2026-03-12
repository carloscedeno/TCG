# Ã°Å¸â€�â€ž COMPOUND LOG Ã¢â‚¬â€� TCG/Geekorium

> **PropÃƒÂ³sito**: Registro cronolÃƒÂ³gico del paso **Compound** del framework *Compounding Engineer* (Dan Shipper / Every.to).
>
> DespuÃƒÂ©s de cada sesiÃƒÂ³n de trabajo, el agente registra aquÃƒÂ­:
>
> - QuÃƒÂ© se aprendiÃƒÂ³
> - QuÃƒÂ© archivos de conocimiento se actualizaron
> - QuÃƒÂ© artefactos reutilizables se crearon o mejoraron
>
> Esto convierte cada sesiÃƒÂ³n en un activo permanente que acelera el trabajo futuro.

---

## Formato de Entrada

```markdown
## YYYY-MM-DD Ã¢â‚¬â€� [TÃƒÂ­tulo / Tema]

**QuÃƒÂ© pasÃƒÂ³:** Breve descripciÃƒÂ³n del trabajo realizado.
**Problema encontrado:** (si aplica)
**Causa raÃƒÂ­z:** (si aplica)
**Lo que cambiÃƒÂ³:**
- `lessons_learned.md` Ã¢â€ â€™ LecciÃƒÂ³n #N: [tÃƒÂ­tulo]
- `AGENTS.md` Ã¢â€ â€™ [secciÃƒÂ³n actualizada]
- `reference/[archivo].md` Ã¢â€ â€™ [quÃƒÂ© se agregÃƒÂ³]
**Artefacto reutilizable creado:** `scripts/nombre.py` o `workflows/nombre.md`
**Regla derivada:** (si aplica Ã¢â‚¬â€� citar dÃƒÂ³nde se codificÃƒÂ³)
```

---

## 2026-03-12 — Soporte "Por Encargo" y Notificaciones Premium

**Qué pasó:** Se implementó la capacidad de pedir productos sin stock físico (On-Demand), se refinó la página de éxito y se mejoraron las notificaciones por correo con botones de rastreo y etiquetas de variante precisas.
**Problema encontrado:** El sistema bloqueaba pedidos sin stock y los correos carecían de detalles visuales (foil/encargo) y links funcionales. Se encontró confusión entre los slugs `api` y `tcg-api` en despliegues remotos.
**Causa raíz:** Validaciones de stock rígidas en el RPC `add_to_cart`. Falta de sincronización entre carpetas de funciones duplicadas.
**Lo que cambió:**

- `lessons_learned.md` → Lecciones #60 (npx Supabase), #61 (Sync Edge Functions), #62 (On-Demand Logic).
- `LEYES_DEL_SISTEMA.md` → Regla de Negocio 4 y Regla Técnica (CLI).
- `AGENTS.md` → Marcadas features de On-Demand y Notificaciones como completadas.
- `supabase/functions/` → Sincronización total de `api` y `tcg-api`.
- `tests/unit/test_valuation_service.py` → Corregido para seguir la regla "CK single source of truth".
**Regla derivada:** Todo pedido permite cartas con stock 0 (On-Demand). Los despliegues en Windows deben usar `npx`. Ambas carpetas de funciones deben estar en espejo hasta la migración total.

## 2026-03-12 — Priorización de Stock y Fix Fiendlash

**Qué pasó:** Resolví la discrepancia de stock de 'Fiendlash' y optimicé el buscador para priorizar cartas disponibles.
**Problema encontrado:** El buscador mostraba stock pero el modal decía "Por encargo".
**Causa raíz:** Desfase entre IDs sintéticos del frontend (`uuid-foil`) y IDs físicos de la DB al consultar stock.
**Lo que cambió:**

- `lessons_learned.md` → Lección #68 (Discrepancia de IDs)
- `AGENTS.md` → Activada feature de priorización de stock.
- `PROGRESS.md` → Reporte de éxito en fix de stock.
- `api.ts` → Refactor de `fetchCardDetails` para normalizar IDs.
- `get_products_filtered` (RPC) → Actualizado para ordenar por stock desc y matches exactos.
**Regla derivada:** Las búsquedas siempre priorizan stock > 0. El modal auto-selecciona la variante con stock real.

---

## 2026-02-27 Ã¢â‚¬â€� AdopciÃƒÂ³n del Framework Compounding Engineer

**QuÃƒÂ© pasÃƒÂ³:** Se formalizÃƒÂ³ la adopciÃƒÂ³n del framework *Compounding Engineer* sobre la base existente del proyecto (`.agent/`, `LEYES_DEL_SISTEMA.md`, `lessons_learned.md`).

**Lo que cambiÃƒÂ³:**

- `.agent/COMPOUND.md` Ã¢â€ â€™ Creado (este archivo) Ã¢â‚¬â€� Log del paso Compound
- `.agent/workflows/compound.md` Ã¢â€ â€™ Creado Ã¢â‚¬â€� Workflow `/compound` post-sesiÃƒÂ³n
- `.agent/AGENTS.md` Ã¢â€ â€™ Actualizado Ã¢â‚¬â€� Ciclo CE documentado (PlanÃ¢â€ â€™WorkÃ¢â€ â€™ReviewÃ¢â€ â€™Compound)
- `.agent/reference/methodology.md` Ã¢â€ â€™ Actualizado Ã¢â‚¬â€� AÃƒÂ±adido Compound step, alineado Strata PPRE con CE PWRC

**Regla derivada:**
> Toda sesiÃƒÂ³n de trabajo debe terminar ejecutando `/compound` para que el conocimiento no se pierda en el historial de conversaciÃƒÂ³n.

---

## 2026-02-27 Ã¢â‚¬â€� Correcciones de DiseÃƒÂ±o Geekorium + Tests 100%

**QuÃƒÂ© pasÃƒÂ³:** Se implementaron las correcciones del documento `Geeko diseÃƒÂ±o fix.md` (tipografÃƒÂ­a, colores de marca en filtros, widget WhatsApp, checkout con mÃƒÂ©todo de despacho). Luego se ejecutÃƒÂ³ `/audit` completo y se corrigieron los 5 fallos/errores pre-existentes en los tests unitarios de backend.

**Lo que cambiÃƒÂ³:**

- `frontend/src/components/Navigation/WhatsAppWidget.tsx` Ã¢â€ â€™ Footer "AtenciÃƒÂ³n por WhatsApp"
- `frontend/src/components/Filters/FiltersPanel.tsx` Ã¢â€ â€™ Colores de filtros: `blue/purple` Ã¢â€ â€™ `geeko-cyan/violet-accent`
- `frontend/src/pages/CheckoutPage.tsx` Ã¢â€ â€™ Campo de MÃƒÂ©todo de Despacho obligatorio + validaciÃƒÂ³n email
- `frontend/src/pages/Home.tsx` Ã¢â€ â€™ Removido `italic` de heading `Ã‚Â¿CÃƒÂ³mo comprar?` (restricciÃƒÂ³n de spec)
- `frontend/src/pages/HelpPage.tsx` Ã¢â€ â€™ Removido `italic` de heading `Ã‚Â¿AÃƒÂºn tienes dudas?`
- `frontend/src/index.css` Ã¢â€ â€™ Token nuevo `--color-geeko-violet-deep: #523176`
- `tests/unit/test_collection_import.py` Ã¢â€ â€™ Reescrito con patch target correcto (`supabase_admin`)
- `tests/unit/test_valuation_service.py` Ã¢â€ â€™ Reescrito con mock two-step (sources + price_history por `source_id`)
- `tests/unit/test_commerce_inventory.py` Ã¢â€ â€™ Convertido de integraciÃƒÂ³n a unit test puro con mocks
- `.agent/lessons_learned.md` Ã¢â€ â€™ Lecciones #15Ã¢â‚¬â€œ#19

**Resultado:** `27/27` tests pasando. Build limpio. Push a `main`.

**Artefacto reutilizable:** PatrÃƒÂ³n de `table_side_effect` en tests para mockear Supabase con mÃƒÂºltiples tablas Ã¢â€ â€™ ver `test_valuation_service.py::_make_supabase_mock()` y `test_commerce_inventory.py::_cart_supabase_mock()`.

**Regla derivada:**
> Al refactorizar el cliente de Supabase en un servicio (ej: `supabase` Ã¢â€ â€™ `supabase_admin`), actualizar el patch target en TODOS los tests correspondientes. Usar `grep_search` con `patch(` + nombre del mÃƒÂ³dulo.

---

## 2026-02-27 Ã¢â‚¬â€� Hotfix: Reemplazo Exhaustivo de Colores Heredados

**QuÃƒÂ© pasÃƒÂ³:** Tras aplicar restricciones tipogrÃƒÂ¡ficas (eliminar `italic`), se descubriÃƒÂ³ que la secciÃƒÂ³n de Ayuda dependÃƒÂ­a de estilos utilitarios implÃƒÂ­citos y usaba la paleta de colores vieja del proyecto (beige, negro, verde). Se limpiÃƒÂ³ el componente completo.

**Lo que cambiÃƒÂ³:**

- `frontend/src/pages/HelpPage.tsx` Ã¢â€ â€™ `font-web-titles` restaurado, colores actualizados (fondo `#373266`, texto `#FFFFFF`, botÃƒÂ³n `#00AEB4`).
- `.agent/lessons_learned.md` Ã¢â€ â€™ LecciÃƒÂ³n #20 (Reemplazo Exhaustivo de Colores Heredados).

**Regla derivada:**
> Siempre que se modifique un componente heredado para ajustarlo a nuevas reglas de brand, se debe auditar TODO el componente buscando y reemplazando colores *hardcoded* obsoletos.

---

## 2026-02-27 Ã¢â‚¬â€� Hotfix: Fallback Image URLs en vistas combinadas de DB

**QuÃƒÂ© pasÃƒÂ³:** Los cards del inventario en el "Stock Geekorium" se mostraban sin imagen porque la consulta `get_products_filtered` estaba obteniendo `image_url` directamente de la tabla local `products` que puede estar nulo. El fallback a la metadata universal (`card_printings`) estaba ignorado a pesar del `LEFT JOIN`.

**Lo que cambiÃƒÂ³:**

- Modificado en Supabase (vÃƒÂ­a MCP) el RPC `get_products_filtered` (para ambas firmas).
- Se reemplazÃƒÂ³ `p.image_url` por `COALESCE(p.image_url, cp.image_url) as image_url`.
- `.agent/lessons_learned.md` Ã¢â€ â€™ LecciÃƒÂ³n #21 (Fallbacks Visuales en Vistas Combinadas de DB).

**Regla derivada:**
> Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.

---

## 2026-02-27 â€” Validaciones Estrictas de Checkout (Client-side)

**QuÃ© pasÃ³:** Se agregaron validaciones estrictas, reglas de longitud y stripping de inputs (
eplace) para nÃºmero de telÃ©fono venezolano, cÃ©dula de identidad y nombre en la pÃ¡gina de Checkout.

**Lo que cambiÃ³:**

- `frontend/src/pages/CheckoutPage.tsx` ? Regex y stripping de inputs invÃ¡lidos.
- `.agent/lessons_learned.md` ? LecciÃ³n #22 (Validaciones Locales Estrictas).

**Regla derivada:**
> Todo input vital para el pago/contacto fÃ­sico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.

---

## 2026-02-27 Ã¢â‚¬â€� Exactitud SQL (Search/Cart) y Fidelidad UI (TipografÃƒÂ­as)

**QuÃƒÂ© pasÃƒÂ³:** Se rediseÃƒÂ±ÃƒÂ³ la funciÃƒÂ³n de agregar al carrito (RPC dd_to_cart) en Supabase para proteger el stock disponible y se mejoraron los resultados de get_products_filtered para consultas exactas. En Frontend, se logrÃƒÂ³ paridad total con los mockups de diseÃƒÂ±o de interfaz (Fuentes Bogue, Daito, Rubik) en el Modal y navegaciÃƒÂ³n.

**Lo que cambiÃƒÂ³:**

- supabase/migrations/20260227120000_fix_search_and_cart_stock.sql Ã¢â€ â€™ ValidaciÃƒÂ³n sÃƒÂ³lida de Stock y Orden de Resultados.
- rontend/src/components/Card/CardModal.tsx Ã¢â€ â€™ Mapeo directo de clases tipogrÃƒÂ¡ficas.
- rontend/src/App.tsx y Home.tsx Ã¢â€ â€™ Reemplazo de logo de texto por imagen.
- .agent/lessons_learned.md Ã¢â€ â€™ LecciÃƒÂ³n #23 (Stock y BÃƒÂºsquedas), LecciÃƒÂ³n #24 (TipografÃƒÂ­as y Componentes UI).

**Artefacto creado:** MigraciÃƒÂ³n SQL 20260227120000....
**Regla derivada:** Validaciones de stock atÃƒÂ³micas en DB. Fuentes personalizadas aplicadas a nivel hoja, no contenedor.

## 2026-02-27 Ã¢â‚¬â€� [Checkout Flow & Inventory Reservation]

**QuÃƒÂ© pasÃƒÂ³:** Se implementÃƒÂ³ y verificÃƒÂ³ el flujo completo de checkout para usuarios guest con modelo de reserva temporal de inventario.
**Lo que cambiÃƒÂ³:**

- `lessons_learned.md` Ã¢â€ â€™ Guest Checkout & Inventory Pattern
- `frontend/src/pages/CheckoutPage.tsx` y `OrderTrackingPage.tsx`.
- `supabase/migrations/` Ã¢â€ â€™ Actualizaciones de RPC para `update_order_status` atÃƒÂ³mico y creaciÃƒÂ³n de `cancel_expired_orders`.
- Artefactos visuales: Creados diagramas MMD y generados grÃƒÂ¡ficos PNG sobre el flujo de negocio.
**Regla derivada:** Las validaciones de inventario siempre se delegan a un RPC con SECURITY DEFINER para evitar inconsistencias cliente/servidor.

 # #   2 0 2 6 - 0 3 - 0 1   -   C h e c k o u t   V e r i f i c a t i o n   F l o w 
 
 * * Q u Ã©   p a s Ã³ : * *   C a m b i a m o s   e l   m o d e l o   d e   c h e c k o u t   p a g a d o   p o r   u n o   d e   r e s e r v a   t e m p o r a l   c o n   c o n f i r m a c i Ã³ n   d i f e r i d a . 
 * * L o   q u e   c a m b i Ã³ : * * 
 -   ` l e s s o n s _ l e a r n e d . m d `   - >   L e c c i Ã³ n   ( R e s e r v a   T e m p o r a l   e n   R P C s ) 
 -   ` A G E N T S . m d `   - >   F e a t u r e s   a c t u a l i z a d a s 
 -   ` P R O G R E S S . m d `   - >   C h e c k o u t   u p d a t e   r e p o r t 
 * * R e g l a   d e r i v a d a : * *   V a l i d a c i o n e s   d e   i n v e n t a r i o   c o m p l e j a s   s e   d e b e n   m a n e j a r   c o n   t r a n s a c c i o n e s   a t Ã³ m i c a s   e x p l Ã­ c i t a s   e n   S u p a b a s e   y   c o n f i r m a c i Ã³ n   m a n u a l   o u t - o f - b a n d   c u a n d o   c o r r e s p o n d a . 
 
 

## 2026-03-01 Ã¢â‚¬â€� FinalizaciÃƒÂ³n Checkout Diferido & Pruebas E2E en ProducciÃƒÂ³n

**QuÃƒÂ© pasÃƒÂ³:** TerminaciÃƒÂ³n del flujo de validaciÃƒÂ³n de pago por WhatsApp y arreglos visuales en ProducciÃƒÂ³n (test-runners).
**Lo que cambiÃƒÂ³:**

- lessons_learned.md Ã¢â€ â€™ LecciÃƒÂ³n #3 de flujos y modales de React.
- docs/specs/PRD_Checkout_Flow_Update.md Ã¢â€ â€™ Todo marcado como completado.
**Artefacto creado:** -
**Regla derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales.

## 2026-03-02 Ã¢â‚¬â€� Estabilidad y Defensive Coding

**QuÃƒÂ© pasÃƒÂ³:** Se corrigiÃƒÂ³ un error Ã¢â‚¬Å“TypeError: reduce is not a functionÃ¢â‚¬ que afectaba la producciÃƒÂ³n mediante un barrido defensivo global en el frontend.
**Lo que cambiÃƒÂ³:**

- lessons_learned.md Ã¢â€ â€™ LecciÃƒÂ³n #10 (Defensive Data Handling)
- AGENTS.md Ã¢â€ â€™ Nueva regla crÃƒÂ­tica y features completadas.
- docs/PRD_MASTER.md Ã¢â€ â€™ SecciÃƒÂ³n de Estabilidad de AplicaciÃƒÂ³n.
- PROGRESS.md Ã¢â€ â€™ Estado de estabilidad actualizado.
**Artefacto creado:** walkthrough.md y udit_report.md (brain).
**Regla derivada:** Uso obligatorio de Array.isArray() en mÃƒÂ©todos de arreglo sobre datos de API.

## 2026-03-02 â€” OptimizaciÃ³n de Almacenamiento (Modelo Diferencial)

**QuÃ© pasÃ³:** ReducciÃ³n de 1.1GB de datos redundantes en la DB y blindaje del cÃ³digo de ingesta.
**Lo que cambiÃ³:**

- lessons_learned.md ? LecciÃ³n #64
- sync_cardkingdom_api.py ? LÃ³gica diferencial implementada
- LEYES_DEL_SISTEMA.md ? Agregada ley de almacenamiento diferencial

---

## 2026-03-03 â€” Soporte de FoliaciÃ³n (Foil) en Bulk Import

**QuÃƒÂ© pasÃƒÂ³:** Se implementÃ³ el soporte para distinguir entre cartas Foil y Non-Foil durante la importaciÃƒÂ³n masiva. Se resolviÃ³ el error de duplicados en base de datos y se actualizÃ³ la vista de productos.

**Lo que cambiÃƒÂ³:**

- `lessons_learned.md` â†’ LecciÃ³n #66 (Soporte de FoliaciÃ³n y AgregaciÃ³n en Lotes).
- `LEYES_DEL_SISTEMA.md` â†’ Regla de Negocio 3 (AgregaciÃ³n obligatoria en lotes).
- `PROGRESS.md` y `docs/PRD_MASTER.md` â†’ Actualizados con el Ã©xito de la integraciÃƒÂ³n de ManaBox CSV/TXT.
- `supabase/functions/tcg-api/index.ts` â†’ LÃ³gica de agregaciÃƒÂ³n por `finish` antes de upsert.
- RPC `bulk_import_inventory` â†’ Soporte para columna `finish` y manejo de conflictos.
- Vista `products_with_prices` â†’ InclusiÃ³n de la columna `finish`.

**Regla derivada:**
> Siempre consolidar duplicados (mismo printing+condition+finish) dentro de un lote de importaciÃƒÂ³n en el backend antes de enviarlo a la base de datos para evitar fallos de `ON CONFLICT`.

---

## 2026-03-03 â€” Fix: Fuentes Faltantes â†’ Google Fonts Fallbacks

**QuÃ© pasÃ³:** La aplicaciÃ³n en produciÃ³n generaba errores 404 en consola al intentar cargar `/fonts/Daito.woff2` y `/fonts/Bogue-Medium.woff2`. Los archivos de fuente nunca fueron aÃ±adidos al repositorio, solo las referencias CSS.

**Problema encontrado:** `@font-face` declaraciones en `index.css` apuntaban a archivos locales inexistentes en `/public/fonts/`.

**Causa raÃ­z:** Los archivos de fuente premium (Daito y Bogue) son de pago/demo y nunca se incluyeron en el repo.

**Lo que cambiÃ³:**

- `frontend/src/index.css` â†’ Eliminados `@font-face` locales; Google Fonts importa `Cinzel` y `Cinzel Decorative` como sustitutos de alta calidad.
- CSS vars `--font-logo`, `--font-web-titles`, `--font-titles` actualizadas para priorizar los Google Fonts.

**Regla derivada:**
> Si una fuente se referencia en `@font-face` con `url('/fonts/...')`, el archivo DEBE existir en `frontend/public/fonts/`. De lo contrario, el build es silencioso pero el runtime genera 404s. Siempre usar Google Fonts como fallback cuando no se disponga del archivo local.

---

## 2026-03-04 â€” TipografÃ­a Definitiva: Fuentes Locales Reales

**QuÃ© pasÃ³:** El usuario proporcionÃ³ los archivos de fuente definitivos (Daito, Bogue, Rubik). Se reemplazaron completamente los fallbacks de Google Fonts (Cinzel/Cinzel Decorative) por las fuentes locales reales. Se actualizÃ³ el WelcomeModal para cumplir el spec tipogrÃ¡fico de diseÃ±o.

**Lo que cambiÃ³:**

- `frontend/public/fonts/` â†’ 5 archivos agregados: `Daito-NormalMedium (1).otf`, `Bogue Medium.ttf`, `Rubik-Regular.ttf`, `Rubik-SemiBold.ttf`, `Rubik-Italic.ttf`
- `frontend/src/index.css` â†’ Eliminado `@import` de Google Fonts; 5 declaraciones `@font-face` locales con `font-display: swap`. Tokens `--font-logo`/`--font-web-titles` â†’ Daito; `--font-titles` â†’ Bogue.
- `frontend/src/components/Navigation/WelcomeModal.tsx` â†’ Fuentes asignadas por spec: Daito en logo/tÃ­tulos/CTAs, Rubik SemiBold en labels secundarios, Rubik Regular en body text.

**Artefacto reutilizable:** Spec tipogrÃ¡fico validado en dos capturas (Home y CardModal). Los roles de fuente estÃ¡n ahora documentados en los tokens CSS.

**Regla derivada:**
> Los archivos de fuente premium deben vivir en `frontend/public/fonts/` y referenciarse desde `@font-face` en `index.css`. El nombre exacto del archivo (incluyendo espacios y nÃºmeros) debe usarse tal cual en la declaraciÃ³n `src: url(...)`. No renombrar los archivos para evitar desincronizaciÃ³n.

---

## 2026-03-04 â€” Correcciones PRD: Fix Precios Foil + Checkout WhatsApp

**QuÃ© pasÃ³:** Se implementaron las dos Ã©picas del PRD de correcciones Geekorium. Ã‰pica 1: fix del bug crÃ­tico del toggle Normal/Foil en `CardDetail.tsx`. Ã‰pica 2: refactorizaciÃ³n completa del Step 2 del checkout eliminando datos bancarios y redirigiendo 100% a WhatsApp asistido.

**Problema encontrado (Ã‰pica 1):** El toggle Normal/Foil pasaba `activePrintingId` (el ID actual) como argumento a `handleVersionClick`, en lugar del `printing_id` de la *variante destino*. Esto resultaba en que al presionar "Foil" se volvÃ­a a cargar la misma carta sin cambiar de variante.

**Causa raÃ­z:** `handleVersionClick(activePrintingId!, 'foil')` â†’ debÃ­a ser `handleVersionClick(activeGroup?.foil?.printing_id, 'foil')`.

**Lo que cambiÃ³:**

- `frontend/src/pages/CardDetail.tsx` â†’ Toggle navega al `printing_id` correcto de la variante destino. Badge visual "NORMAL" / "âœ¨ FOIL" aÃ±adido junto al precio. CondiciÃ³n del estado activo del botÃ³n Normal basada en `activeFinish` (no en `details?.is_foil`).
- `frontend/src/pages/CheckoutPage.tsx` â†’ Eliminados bloques Pago MÃ³vil y Zelle. NÃºmero WA corregido a `584242507802`. Mensaje estructurado PRD-spec con `cardLines` (qty, nombre, set_code, finish, precio). Truncamiento a 40 Ã­tems. BotÃ³n verde WhatsApp (#25D366) con texto "Confirmar y Pagar por WhatsApp". Resumen de datos del cliente visible en Step 2.
- `.agent/AGENTS.md` â†’ Features nuevas marcadas como âœ….

**Regla derivada:**
> En el toggle de variantes (Normal/Foil), siempre usar `activeGroup?.{variante}?.printing_id` como argumento de navegaciÃ³n, nunca el `activePrintingId` actual. El ID activo es el *punto de partida*, no el *destino*.

> En `CheckoutPage`, los datos bancarios estÃ¡ticos son un riesgo operacional. El canal WhatsApp asistido es el Ãºnico CTA de cierre de venta.

## 2026-03-04 â€” Fix Precios Normal/Foil y WA Checkout

**QuÃ© pasÃ³:** Los precios de CardKingdom se mostraban igual para variantes Normal y Foil en CardModal por falta de separaciÃ³n explÃ­cita de usd_foil. AdemÃ¡s, el UI permitÃ­a hacer toggle a cartas sin stock o ocultas, y el checkout en WhatsApp enviaba demasiada data de cartas individuales.
**Lo que cambiÃ³:**

- lessons_learned.md â†’ LecciÃ³n #18 (LÃ³gica condicional/stock para toggles).
- pi.ts â†’ Fetch extrae prices.usd_foil y prices.usd explÃ­citamente.
- CardDetail.tsx/CardModal.tsx â†’ Modificado el renderizado del toggle basado en stock (> 0).
- CheckoutPage.tsx â†’ Se usan .reduce() en cartItems para sumar la cantidad segÃºn el inish (foil/normal) en vez de enviar 40 lÃ­neas de string.

## 2026-03-04 â€” Email Notifications & Pydantic Configuration

**QuÃ© pasÃ³:** Se implementÃ³ el envÃ­o asÃ­ncrono de correos electrÃ³nicos de confirmaciÃ³n de pedidos, integrando astapi-mail con el servidor SMTP de Hostinger. Se corrigieron los problemas de validaciÃ³n de configuraciÃ³n al usar Pydantic v2.

**Lo que cambiÃ³:**

- src/api/services/email_service.py â†’ Se creÃ³ el servicio para correos.
- src/api/services/cart_service.py â†’ IntegraciÃ³n de correos en el flujo de checkout mediante syncio.create_task.
- src/core/config.py â†’ Se actualizÃ³ a la API de Pydantic v2 usando model_config = SettingsConfigDict(...).
- lessons_learned.md â†’ LecciÃ³n #67 (ConfiguraciÃ³n de Pydantic v2) y #68 (EnvÃ­o de correos asÃ­ncrono en FastAPI).

**Regla derivada:**
> Al usar Pydantic v2 (pydantic-settings), se debe utilizar model_config = SettingsConfigDict() en lugar de la clase interna Config.
> Las notificaciones por correo en la API deben enviarse de forma no bloqueante (e.g. syncio.create_task o BackgroundTasks).

## 2026-03-05 â€” Branding Fix y CorrecciÃ³n de Correo

**QuÃ© pasÃ³:** El usuario solicitÃ³ reemplazar el nombre de la tienda en texto por el logo circular y corregir el enlace de correo que redirigÃ­a a Mailchimp.
**Lo que cambiÃ³:**

- `lessons_learned.md` â†’ LecciÃ³n #23 (Prioridad de intenciÃ³n sobre docs).
- `AGENTS.md` â†’ Registrada feature de Branding y Correo.
- `src/components/Navigation/Footer.tsx`, `WelcomeModal.tsx` y `src/pages/Home.tsx` â†’ UnificaciÃ³n de logo circular.
**Artefacto creado:** Walkthrough de branding.
**Regla derivada:** Los requerimientos dinÃ¡micos en chat prevalecen sobre el PRD estÃ¡tico.

## 2026-03-05 — Reparación de Notificaciones y Seguridad de Secretos

**Qué pasó**: Se corrigió el fallo en el envío de correos de confirmación tras compra y se robusteció la seguridad de los secretos para producción.
**Lo que cambió**:

- lessons_learned.md -> Lecciones #24 y #25
- src/core/config.py -> Validación proactiva de secretos en modo production.
- .env -> Sanitización de credenciales.
- docs/production.md -> Nueva guía de despliegue.
- LEYES_DEL_SISTEMA.md -> Agregada Ley 7 (Gestión Segura de Secretos).
**Artefacto creado**: docs/production.md.
**Regla derivada**: Ley 7 de LEYES_DEL_SISTEMA.md.

## 2026-03-06 — Reversión y Estabilización de Notificaciones

**Qué pasó:** Se revertieron los cambios que intentaban agregar miniaturas y detalles a los correos de pedido debido a fallos en el envío. Se estabilizó el sistema volviendo a la lógica anterior.
**Lo que cambió:**

- `lessons_learned.md` → Lección #26
- `tcg-api/index.ts` → Revertido a lógica original de Nodemailer.
- `CheckoutPage.tsx` → Revertido mapeo de items simplificado.
**Artefacto creado:** N/A (Reversión)
**Regla de Oro:** Lo simple funciona cuando lo complejo falla bajo presión.

## 2026-03-06 — Resolución Checkout y Optimización de Storage

**Qué pasó:** Se resolvió el error de "Orden no encontrada" en producción y se tomó la decisión estratégica de ocultar el flujo de carga de comprobantes de pago para optimizar la cuota de almacenamiento de la base de datos.

**Problema encontrado:** El RPC atómico fallaba por una columna inexistente (`product_name`) en `order_items`. Además, el sistema de almacenamiento estaba alcanzando límites de cuota prematuramente.

**Causa raíz:** Inconsistencia entre el schema esperado por el RPC y el schema real de la DB. Falta de snapshotting de datos críticos.

**Lo que cambió:**

- `lessons_learned.md` → Lección #27 (Optimización de Storage) y Lección #28 (Schema Persistence).
- `AGENTS.md` → Actualizada sección de Stack y Features (Storage oculto).
- `OrderTrackingPage.tsx` → UI de carga de comprobante ocultada; cleanup de código muerto.
- `supabase/migrations/20260306_resolve_rls_and_schema.sql` → Añadida columna `product_name` y permisos `anon`/`authenticated`.

**Regla derivada:**
> El snapshotting de datos (nombres, precios) en el momento de la transacción es obligatorio para garantizar la integridad histórica y evitar fallos por cambios en el catálogo.
---

## 2026-03-07 — Cloudflare Pages Deployment & SEO Optimization

**Qué pasó:** Se migró el hosting de GitHub Pages a **Cloudflare Pages** para soporte comercial de la marca Geekorium. Se implementó una estrategia de SEO condicional (indexación solo en `main`) y se resolvieron conflictos críticos de auto-detección de frameworks.

**Problemas resueltos:**

- **404 VitePress:** Cloudflare auto-detectaba VitePress erróneamente. Solución: Forzar Framework Preset a "None".
- **SPA Routing:** El router de React fallaba al recargar. Solución: Implementada estrategia `404.html` fallback.
- **Redirect Loop:** Removido archivo `_redirects` por advertencias de bucles infinitos en Cloudflare.
- **Favicon 404:** Añadido `favicon.ico` para soporte universal de navegadores.

**Lo que cambió:**

- `lessons_learned.md` → Lecciones #29 a #35 (Cloudflare, CI/CD, SEO, VitePress, SPA Routing).
- `index.html` → Implementación de SEO dinámico vía variables de entorno de Vite (%VITE_SEO_...%).
- `AGENTS.md` → Actualizado el stack (Deploy: Cloudflare Pages) y agregada regla crítica de branching (dev/main).
- `LEYES_DEL_SISTEMA.md` → Agregada Ley 8 (SEO y Entornos No-Productivos).
- `package.json` → Build script actualizado para generar `404.html` automáticamente.
- `frontend/.env.example` → Añadidas variables de SEO para guiar nuevos despliegues.

**Regla de Oro:**
> El SEO debe ser un ciudadano de primera clase en el build, pero solo debe ser visible (indexable) para los motores de búsqueda en el entorno de producción real.

---

## 2026-03-07 — Estrategia de Segregación de Base de Datos (Multi-DB)

**Qué pasó:** Se formalizó la estrategia para manejar dos bases de datos independientes (Prod y Dev) para garantizar la integridad de los datos de producción.

**Lo que cambió:**

- `LEYES_DEL_SISTEMA.md` → Agregada **Ley 9** (Segregación de Bases de Datos).
- `AGENTS.md` → Actualizada regla crítica #3 y stack tecnológico.
- `lessons_learned.md` → Lección #36 sobre el uso de Cloudflare Environment Overrides para segregación de DB.
- `implementation_plan.md` → Documentado el flujo de despliegue para Edge Functions y migraciones multi-proyecto.

**Regla derivada:**
> Los datos de desarrollo nunca deben tocar la base de datos de producción; la segregación se garantiza a nivel de infraestructura mediante proyectos independientes de Supabase vinculados a las ramas de despliegue.

---

## 2026-03-07 — CI/CD Refactor & Dev Environment Implementation

**Qué pasó:** Se habilitó exitosamente el despliegue automático de la rama `dev` en GitHub Pages (`dev.geekorium.shop`). Se eliminaron todas las dependencias de IDs de Supabase hardcodeados en el frontend para permitir la segregación total de entornos.

**Problemas resueltos:**

- Branch `dev` rechazada por "Environment protection rules" en GitHub Pages.
- Inconsistencias al llamar a Edge Functions desde `dev` que apuntaban a la DB de `prod`.

**Lo que cambió:**

- `lessons_learned.md` → Lecciones #37 (Permissions) y #38 (Dynamic Project IDs).
- `AGENTS.md` → Feature "Multi-Environment & Dynamic IDs" marcada como completada.
- `.github/workflows/deploy.yml` → Inyectada `VITE_SUPABASE_PROJECT_ID` en el build.
- `.env.example` → Actualizado con la nueva variable.
- `CollectionService.ts`, `BulkImport.tsx`, `AdminDashboard.tsx` → Refactorizados para usar variables de entorno.

**Regla derivada:**
> El ID del proyecto de Supabase debe tratarse como una variable de configuración dinámica (`VITE_SUPABASE_PROJECT_ID`) para garantizar que el frontend se conecte al backend correspondiente según su entorno de despliegue.

---

## 2026-03-09 — Refactorización de Valoración: "No Goldfish" Rule

**Qué pasó:** Se eliminó por completo la dependencia de la tabla legacy `aggregated_prices` (Goldfish) y se estableció Card Kingdom como la única fuente de mercado externo.

**Problema encontrado:** La lógica de valoración tenía fallbacks redundantes a una tabla obsoleta que causaba inconsistencias de precios entre el frontend y el backend.

**Lo que cambió:**

- `valuation_service.py` & `card_service.py` → Removidos todos los fallbacks a `aggregated_prices`.
- `frontend/src/utils/api.ts` → Limpieza total de referencias a Goldfish; uso estricto de Card Kingdom.
- `tests/unit/test_valuation_service.py` → Tests actualizados para validar la nueva regla de negocio.
- `lessons_learned.md` → Lección #39 (Priorización de Card Kingdom) y #40 (Remoción de Legado).

**Regla derivada:**
> El único mercado externo válido para valoración es Card Kingdom. Si no hay precio de tienda, se usa Card Kingdom. Si no hay Card Kingdom, el precio es 0. Nunca recurrir a tablas agregadas obsoletas.
--

## 2026-03-10 â€” SimplificaciÃ³n de Precios (CK NM) y Reversa de Branding

**QuÃ© pasÃ³:** Se simplificÃ³ la estrategia de precios para usar Card Kingdom NM como Ãºnica fuente de verdad. Se revirtieron todos los cambios de branding para conservar la identidad de "Geekorium".
**Lo que cambiÃ³:**

- `lessons_learned.md` â†’ LecciÃ³n #41
- `LEYES_DEL_SISTEMA.md` â†’ Actualizada Regla 1 (Precios de Geekorium)
- `AGENTS.md` â†’ Feature de Precios Simplificados marcada como completada
- `frontend/src/` y `email_service.py` â†’ Branding restaurado a "Geekorium"
**Regla derivada:** Los precios de Geekorium son estrictamente Card Kingdom NM. El branding original es sagrado.

## 2026-03-10 — Optimización de Migración de Precios (High Performance)

**QuÃ© pasÃ³:** Se optimizÃ³ la migracÃ³n de precios para evitar bloqueos en la base de datos y se reparÃ³ la lÃ³gica de ruteo de la API.
**Problema encontrado:** MigraciÃ³n fallaba por tiempos de espera (`statement timeout`) y la API devolvÃ­a 400 por prefijos en la URL.
**Causa raÃ­z:** Consultas SQL "loquillas" (sub-queries correlacionadas) y ruteo rÃ­gido en la funciÃ³n Edge.
**Lo que cambiÃ³:**

- `lessons_learned.md` → Lecciones #42 (SQL Performance), #43 (API Routing) y #46 (Per-Printing Denormalization).
- `supabase/migrations/20260310_...sql` → Uso de CTEs, `UPDATE FROM` y cambio de target a `card_printings`.
- `supabase/functions/api/index.ts` → Ruteo defensivo y lógica de precios por `printing_id`.
**Regla derivada:** Las migraciones masivas en Supabase DEBEN usar `UPDATE FROM` con CTEs. Los precios DEBEN denormalizarse en `card_printings`, no en `cards`.

## 2026-03-11 â€” SincronizaciÃ³n de Precios y OptimizaciÃ³n de DB (Card Kingdom)

**QuÃ© pasÃ³:** Se implementÃ³ la sincronizaciÃ³n completa de precios de Card Kingdom (Foil y Non-Foil) en el entorno de producciÃ³n. Se resolvieron problemas de conexiÃ³n con el Pooler de Supabase y se evitÃ³ el timeout mediante una estrategia de actualizaciÃ³n por lotes (Batched Updates).

**Problema encontrado:**

1. Error de resoluciÃ³n de host al usar la IP directa de la DB.
2. `statement timeout` al intentar actualizar 100k+ registros con una subconsulta correlacionada en un solo bloque.
3. El RPC `exec_sql` no estaba disponible en producciÃ³n.

**Causa raÃ­z:**

1. El Pooler de Supabase requiere el host `aws-0-us-west-2.pooler.supabase.com` y el usuario con formato `postgres.project_ref`.
2. Las subconsultas correlacionadas son O(N^2) en Postgres; saturaban el CPU.
3. Restricciones de seguridad del proyecto en producciÃ³n.

**Lo que cambiÃ³:**

- `lessons_learned.md` â†’ Lecciones #44 (Supabase Pooler Connection) y #45 (Batched Update Strategy).
- `.env` â†’ `DATABASE_URL` para producciÃ³n unificada.
- `scripts/sync_cardkingdom_api.py` â†’ LÃ³gica de actualizaciÃ³n directa vÃ­a `psycopg2`.
- `scripts/update_prices_batched.py` â†’ Creado para backfill masivo de precios denormalizados.
- `scripts/apply_final_pricing_fix.py` â†’ ConsolidaciÃ³n de cambios en MV y RPCs.
- `AGENTS.md` â†’ MÃ³dulos de pricing marcados como completados.

**Artefacto reutilizable:**

- Script de actualizaciÃ³n por lotes `update_prices_batched.py`.
- PatrÃ³n de conexiÃ³n a Pooler en `.env`.

**Regla derivada:**
> Para actualizaciones de metadatos en tablas masivas (>100k filas), usar siempre actualizaciones por lotes (Batch Size ~1000) o CTEs con `UPDATE FROM` para evitar bloqueos y timeouts.

---

## 2026-03-11 — Sincronización de Branding y Limpieza de Entorno

**Qué pasó:** Se sincronizó el logo oficial de la marca y se eliminaron indicadores de entorno ("DEV") hardcodeados en el frontend. Se actualizaron las variables de SEO para reflejar un entorno limpio.
**Lo que cambió:**

- `lessons_learned.md` → Lección #47: Sincronización de Branding y Eliminación de Badges Hardcoded.
- `AGENTS.md` → Refinada feature de branding y contacto.
- `frontend/src/pages/Home.tsx` → Eliminado badge "DEV".
- `frontend/src/components/Navigation/Footer.tsx` → Corregida ruta del logo.
- `frontend/.env` → Actualizadas variables SEO.
**Regla derivada:** Los assets de marca deben residir en `public/branding/`. Prohibido hardcodear indicadores de entorno; usar variables `VITE_`.

---

## 2026-03-11 — Auditoría de Seguridad Supabase (Zero Error State)

**Qué pasó:** Se realizó una auditoría exhaustiva de seguridad sobre la base de datos de Supabase, resolviendo todos los errores reportados por el *Security Advisor*. Se habilitó RLS en todas las tablas y se aseguraron las vistas.

**Lo que cambió:**

- `lessons_learned.md` → Lecciones #48 (Security Advisor) y #49 (RLS Guest Checkout).
- `LEYES_DEL_SISTEMA.md` → Agregada **Ley 10** (Prioridad de Seguridad RLS).
- `supabase/migrations/` → Creadas 2 migraciones: `20260310220000_enable_rls_and_view_security.sql` y `20260310224000_supplemental_security_fixes.sql`.

**Artefacto reutilizable:**

- Patrón de políticas RLS para *Guest Checkout* (público pero restringido por ID).

**Regla derivada:**

## 2026-03-10 — Branding & Asset Sync

**Qué pasó:**
Se actualizó la identidad visual en toda la aplicación, migrando de `Logo.jpg` a `Logo.png` para mejor calidad y transparencia, y se estableció un nuevo favicon (`Fav.jpg`). Se sincronizaron los assets desde `docs/logos` a `frontend/public`.

**Lo que cambió:**

- `lessons_learned.md` → Lección #50 (Branding Sync)
- `.agent/AGENTS.md` → Actualizada feature "Corrección de Branding"
- `LEYES_DEL_SISTEMA.md` → Ley 11: Integridad de Branding
- Múltiples componentes frontend corregidos.

**Artefacto creado:** Ninguno (refactorización de assets).
**Regla derivada:**
> Los activos de branding en `docs/logos/` son la fuente de verdad y deben estar siempre sincronizados con `frontend/public/branding/`.
---

## 2026-03-11 — Pricing Fix (TMNT/PZA) & Env Consolidation

**Qué pasó:** Se resolvió el problema de actualización de precios para ediciones especiales (TMNT, PZA) mediante un fallback por collector number. Se unificaron todos los archivos `.env` en uno solo en la raíz para evitar corrupciones y desincronización de llaves.

**Lo que cambió:**

- `lessons_learned.md` → Lecciones #51 (Fallback Matching), #52 (Env Unification), #53 (Orphan Processes), #54 (Diagnostic Robustness).
- `AGENTS.md` → Actualizado con features de sincronización de precios y unificación de entorno.
- `LEYES_DEL_SISTEMA.md` → Agregada **Ley 12** (Entorno único) y **Regla de Operación 4** (Gestión de procesos).
- `scripts/sync_cardkingdom_api.py` → Implementada lógica de match por SKU/Collector Number y corregido error de variables no definidas post-refactor.
- `frontend/vite.config.ts` → Configurado para leer `.env` desde la raíz.

**Regla derivada:**
> Todo cambio estructural en configuración o sincronización masiva requiere un reinicio limpio de procesos para evitar el uso de estados obsoletos (`stale state`).

## 2026-03-11 — SEO Fix: Placeholders Literales en Producción

**Qué pasó:** El tab del navegador mostraba `%VITE_SEO_TITLE%` en `geekorium.shop` porque las variables SEO (`VITE_SEO_TITLE`, `VITE_SEO_DESCRIPTION`, etc.) nunca fueron configuradas en el dashboard de Cloudflare Pages. Se hardcodearon los valores SEO estáticos directamente en `index.html` y se identificaron las variables de Cloudflare faltantes.

**Problema encontrado:** Variables `%VITE_*%` no reemplazadas en el HTML de producción → aparecen como texto literal en el browser.

**Causa raíz:** Cloudflare Pages buildea y reemplaza los placeholders de Vite SOLO si la variable está definida en su dashboard (Settings → Environment Variables). Esas variables nunca fueron agregadas allá.

**Lo que cambió:**

- `lessons_learned.md` → Lección #55 (Variables SEO de Vite No Reemplazadas en Producción)
- `frontend/index.html` → SEO hardcodeado directamente (`<title>Geekorium Emporio Mágico</title>`, OG tags, Twitter cards). Solo `%VITE_ROBOTS%` queda como placeholder.
- `.github/workflows/deploy.yml` → Añadida `VITE_SEO_TITLE` para el build de GitHub Pages.

**Variables faltantes en Cloudflare identificadas:**

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | `sxuotvogwvmxuvwbsscv` |
| `VITE_ROBOTS` | `index, follow` |

**Pendiente:** Configurar Google Search Console (verificación DNS + sitemap) para que Google indexe el sitio.

**Regla derivada:**
> Auditar `index.html` en cada setup nuevo: todo `%VITE_*%` sin variable en el hosting es un bug silencioso. SEO estático → hardcode. SEO dinámico por entorno → parametrizar.

## 2026-03-11 — CI/CD Migration Mismatch & Frontend Fallback Bug

**Qué pasó:** Se resolvió un error crítico que detenía los despliegues automáticos en GitHub Actions debido a desajustes en el historial de migraciones de Supabase. A su vez, se corrigió un bug en el frontend donde el renderizado de cartas Foil heredaba precios de la variante Normal porque FastAPI respondía de forma incompleta, evadiendo la lógica de fallback de Supabase.

**Lo que cambió:**

- `lessons_learned.md` → Lección #56 (Migration Mismatch en CI/CD) y #57 (Sobrecritura en Fallbacks API a Supabase).
- `frontend/src/utils/api.ts` → Limpieza explícita del pipeline de `all_versions` cuando el API retorna data sin atributos de acabado (*finish*).
- `LEYES_DEL_SISTEMA.md` → Agregada Regla sobre el control de migraciones en entornos alojados y la sincronización con CI/CD.

**Regla derivada:**

1. Eliminar migraciones locales requiere limpieza de `supabase_migrations.schema_migrations` remoto.
2. Todo dato devuelto de un API con deficiencias estructurales debe purgarse si el frontend planea usar un fallback directo, nunca iterar sobre el dato corrompido.

## 2026-03-11 — Corrección de Duplicados Foil/Nonfoil en Búsqueda

**Qué pasó:** Se solucionó el problema donde variantes Foil y Nonfoil de la misma impresión (printing) aparecían genéricas o se pisaban en React debido a Keys duplicadas.

**Lo que cambió:**

- `lessons_learned.md` → Lección #58 (Unicidad Física en RPCs).
- `supabase/migrations/20260311200000_add_finish_to_products_filtered.sql` → Añadido `finish` al dataset.
- `frontend/src/pages/Home.tsx` → Keys dinámicas de React basadas en `printing_id` + `finish`.

**Regla derivada:** Todo RPC que retorne listas de inventario físico debe siempre exponer y proyectar los diferenciadores físicos (ej. `finish`, `condition`) al frontend para garantizar unicidad en React Components.

## 2026-03-11 — Recarga de Caché PostgREST y Precios Ramificados

**Qué pasó:** Tras corregir las duplicaciones de React Keys iterando sobre la propiedad `finish`, la UI seguía sin mostrar Foil o los precios Foil correctos, porque la caché del API de Supabase (PostgREST) no se invalidó tras el parche manual, y porque el SQL proyectaba el `avg_market_price_usd` para toda variante, sin discriminar el acabado.

**Lo que cambió:**

- `lessons_learned.md` → Lección #59 (Recarga de Caché API y Precios Ramificados en RPCs).
- `supabase/migrations/20260311200000_add_finish_to_products_filtered.sql` → Añadida lógica condicional `CASE WHEN finish='foil' THEN foil_price ELSE nonfoil_price END`.
- `scripts/apply_sql.py` → Script de utilidad en Python creado para inyectar parches de emergencia, forzando automáticamente `NOTIFY pgrst, 'reload schema'`.

**Regla derivada:** Cualquier parche SQL hotfix aplicado remotamente sobre PostgREST requiere estrictamente `NOTIFY pgrst, 'reload schema'`. Además, la proyección de la propiedad `price` no puede ser plana en inventario TCG; debe ramificarse en el RPC tras evaluar las banderas físicas del elemento iterado.
