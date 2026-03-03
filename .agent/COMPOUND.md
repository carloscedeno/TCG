# ðŸ”„ COMPOUND LOG â€” TCG/Geekorium

> **PropÃ³sito**: Registro cronolÃ³gico del paso **Compound** del framework *Compounding Engineer* (Dan Shipper / Every.to).
>
> DespuÃ©s de cada sesiÃ³n de trabajo, el agente registra aquÃ­:
>
> - QuÃ© se aprendiÃ³
> - QuÃ© archivos de conocimiento se actualizaron
> - QuÃ© artefactos reutilizables se crearon o mejoraron
>
> Esto convierte cada sesiÃ³n en un activo permanente que acelera el trabajo futuro.

---

## Formato de Entrada

```markdown
## YYYY-MM-DD â€” [TÃ­tulo / Tema]

**QuÃ© pasÃ³:** Breve descripciÃ³n del trabajo realizado.
**Problema encontrado:** (si aplica)
**Causa raÃ­z:** (si aplica)
**Lo que cambiÃ³:**
- `lessons_learned.md` â†’ LecciÃ³n #N: [tÃ­tulo]
- `AGENTS.md` â†’ [secciÃ³n actualizada]
- `reference/[archivo].md` â†’ [quÃ© se agregÃ³]
**Artefacto reutilizable creado:** `scripts/nombre.py` o `workflows/nombre.md`
**Regla derivada:** (si aplica â€” citar dÃ³nde se codificÃ³)
```

---

## 2026-02-27 â€” AdopciÃ³n del Framework Compounding Engineer

**QuÃ© pasÃ³:** Se formalizÃ³ la adopciÃ³n del framework *Compounding Engineer* sobre la base existente del proyecto (`.agent/`, `LEYES_DEL_SISTEMA.md`, `lessons_learned.md`).

**Lo que cambiÃ³:**

- `.agent/COMPOUND.md` â†’ Creado (este archivo) â€” Log del paso Compound
- `.agent/workflows/compound.md` â†’ Creado â€” Workflow `/compound` post-sesiÃ³n
- `.agent/AGENTS.md` â†’ Actualizado â€” Ciclo CE documentado (Planâ†’Workâ†’Reviewâ†’Compound)
- `.agent/reference/methodology.md` â†’ Actualizado â€” AÃ±adido Compound step, alineado Strata PPRE con CE PWRC

**Regla derivada:**
> Toda sesiÃ³n de trabajo debe terminar ejecutando `/compound` para que el conocimiento no se pierda en el historial de conversaciÃ³n.

---

## 2026-02-27 â€” Correcciones de DiseÃ±o Geekorium + Tests 100%

**QuÃ© pasÃ³:** Se implementaron las correcciones del documento `Geeko diseÃ±o fix.md` (tipografÃ­a, colores de marca en filtros, widget WhatsApp, checkout con mÃ©todo de despacho). Luego se ejecutÃ³ `/audit` completo y se corrigieron los 5 fallos/errores pre-existentes en los tests unitarios de backend.

**Lo que cambiÃ³:**

- `frontend/src/components/Navigation/WhatsAppWidget.tsx` â†’ Footer "AtenciÃ³n por WhatsApp"
- `frontend/src/components/Filters/FiltersPanel.tsx` â†’ Colores de filtros: `blue/purple` â†’ `geeko-cyan/violet-accent`
- `frontend/src/pages/CheckoutPage.tsx` â†’ Campo de MÃ©todo de Despacho obligatorio + validaciÃ³n email
- `frontend/src/pages/Home.tsx` â†’ Removido `italic` de heading `Â¿CÃ³mo comprar?` (restricciÃ³n de spec)
- `frontend/src/pages/HelpPage.tsx` â†’ Removido `italic` de heading `Â¿AÃºn tienes dudas?`
- `frontend/src/index.css` â†’ Token nuevo `--color-geeko-violet-deep: #523176`
- `tests/unit/test_collection_import.py` â†’ Reescrito con patch target correcto (`supabase_admin`)
- `tests/unit/test_valuation_service.py` â†’ Reescrito con mock two-step (sources + price_history por `source_id`)
- `tests/unit/test_commerce_inventory.py` â†’ Convertido de integraciÃ³n a unit test puro con mocks
- `.agent/lessons_learned.md` â†’ Lecciones #15â€“#19

**Resultado:** `27/27` tests pasando. Build limpio. Push a `main`.

**Artefacto reutilizable:** PatrÃ³n de `table_side_effect` en tests para mockear Supabase con mÃºltiples tablas â†’ ver `test_valuation_service.py::_make_supabase_mock()` y `test_commerce_inventory.py::_cart_supabase_mock()`.

**Regla derivada:**
> Al refactorizar el cliente de Supabase en un servicio (ej: `supabase` â†’ `supabase_admin`), actualizar el patch target en TODOS los tests correspondientes. Usar `grep_search` con `patch(` + nombre del mÃ³dulo.

---

## 2026-02-27 â€” Hotfix: Reemplazo Exhaustivo de Colores Heredados

**QuÃ© pasÃ³:** Tras aplicar restricciones tipogrÃ¡ficas (eliminar `italic`), se descubriÃ³ que la secciÃ³n de Ayuda dependÃ­a de estilos utilitarios implÃ­citos y usaba la paleta de colores vieja del proyecto (beige, negro, verde). Se limpiÃ³ el componente completo.

**Lo que cambiÃ³:**

- `frontend/src/pages/HelpPage.tsx` â†’ `font-web-titles` restaurado, colores actualizados (fondo `#373266`, texto `#FFFFFF`, botÃ³n `#00AEB4`).
- `.agent/lessons_learned.md` â†’ LecciÃ³n #20 (Reemplazo Exhaustivo de Colores Heredados).

**Regla derivada:**
> Siempre que se modifique un componente heredado para ajustarlo a nuevas reglas de brand, se debe auditar TODO el componente buscando y reemplazando colores *hardcoded* obsoletos.

---

## 2026-02-27 â€” Hotfix: Fallback Image URLs en vistas combinadas de DB

**QuÃ© pasÃ³:** Los cards del inventario en el "Stock Geekorium" se mostraban sin imagen porque la consulta `get_products_filtered` estaba obteniendo `image_url` directamente de la tabla local `products` que puede estar nulo. El fallback a la metadata universal (`card_printings`) estaba ignorado a pesar del `LEFT JOIN`.

**Lo que cambiÃ³:**

- Modificado en Supabase (vÃ­a MCP) el RPC `get_products_filtered` (para ambas firmas).
- Se reemplazÃ³ `p.image_url` por `COALESCE(p.image_url, cp.image_url) as image_url`.
- `.agent/lessons_learned.md` â†’ LecciÃ³n #21 (Fallbacks Visuales en Vistas Combinadas de DB).

**Regla derivada:**
> Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.

---

## 2026-02-27 — Validaciones Estrictas de Checkout (Client-side)

**Qué pasó:** Se agregaron validaciones estrictas, reglas de longitud y stripping de inputs (
eplace) para número de teléfono venezolano, cédula de identidad y nombre en la página de Checkout.

**Lo que cambió:**

- `frontend/src/pages/CheckoutPage.tsx` ? Regex y stripping de inputs inválidos.
- `.agent/lessons_learned.md` ? Lección #22 (Validaciones Locales Estrictas).

**Regla derivada:**
> Todo input vital para el pago/contacto físico debe ser sanitizado en onChange y validado estrictamente en formato local antes de invocar la API.

---

## 2026-02-27 â€” Exactitud SQL (Search/Cart) y Fidelidad UI (TipografÃ­as)

**QuÃ© pasÃ³:** Se rediseÃ±Ã³ la funciÃ³n de agregar al carrito (RPC dd_to_cart) en Supabase para proteger el stock disponible y se mejoraron los resultados de get_products_filtered para consultas exactas. En Frontend, se logrÃ³ paridad total con los mockups de diseÃ±o de interfaz (Fuentes Bogue, Daito, Rubik) en el Modal y navegaciÃ³n.

**Lo que cambiÃ³:**

- supabase/migrations/20260227120000_fix_search_and_cart_stock.sql â†’ ValidaciÃ³n sÃ³lida de Stock y Orden de Resultados.
- rontend/src/components/Card/CardModal.tsx â†’ Mapeo directo de clases tipogrÃ¡ficas.
- rontend/src/App.tsx y Home.tsx â†’ Reemplazo de logo de texto por imagen.
- .agent/lessons_learned.md â†’ LecciÃ³n #23 (Stock y BÃºsquedas), LecciÃ³n #24 (TipografÃ­as y Componentes UI).

**Artefacto creado:** MigraciÃ³n SQL 20260227120000....
**Regla derivada:** Validaciones de stock atÃ³micas en DB. Fuentes personalizadas aplicadas a nivel hoja, no contenedor.

## 2026-02-27 â€” [Checkout Flow & Inventory Reservation]

**QuÃ© pasÃ³:** Se implementÃ³ y verificÃ³ el flujo completo de checkout para usuarios guest con modelo de reserva temporal de inventario.
**Lo que cambiÃ³:**

- `lessons_learned.md` â†’ Guest Checkout & Inventory Pattern
- `frontend/src/pages/CheckoutPage.tsx` y `OrderTrackingPage.tsx`.
- `supabase/migrations/` â†’ Actualizaciones de RPC para `update_order_status` atÃ³mico y creaciÃ³n de `cancel_expired_orders`.
- Artefactos visuales: Creados diagramas MMD y generados grÃ¡ficos PNG sobre el flujo de negocio.
**Regla derivada:** Las validaciones de inventario siempre se delegan a un RPC con SECURITY DEFINER para evitar inconsistencias cliente/servidor.

 # #   2 0 2 6 - 0 3 - 0 1   -   C h e c k o u t   V e r i f i c a t i o n   F l o w 
 
 * * Q u é   p a s ó : * *   C a m b i a m o s   e l   m o d e l o   d e   c h e c k o u t   p a g a d o   p o r   u n o   d e   r e s e r v a   t e m p o r a l   c o n   c o n f i r m a c i ó n   d i f e r i d a . 
 * * L o   q u e   c a m b i ó : * * 
 -   ` l e s s o n s _ l e a r n e d . m d `   - >   L e c c i ó n   ( R e s e r v a   T e m p o r a l   e n   R P C s ) 
 -   ` A G E N T S . m d `   - >   F e a t u r e s   a c t u a l i z a d a s 
 -   ` P R O G R E S S . m d `   - >   C h e c k o u t   u p d a t e   r e p o r t 
 * * R e g l a   d e r i v a d a : * *   V a l i d a c i o n e s   d e   i n v e n t a r i o   c o m p l e j a s   s e   d e b e n   m a n e j a r   c o n   t r a n s a c c i o n e s   a t ó m i c a s   e x p l í c i t a s   e n   S u p a b a s e   y   c o n f i r m a c i ó n   m a n u a l   o u t - o f - b a n d   c u a n d o   c o r r e s p o n d a . 
 
 

## 2026-03-01 â€” FinalizaciÃ³n Checkout Diferido & Pruebas E2E en ProducciÃ³n

**QuÃ© pasÃ³:** TerminaciÃ³n del flujo de validaciÃ³n de pago por WhatsApp y arreglos visuales en ProducciÃ³n (test-runners).
**Lo que cambiÃ³:**

- lessons_learned.md â†’ LecciÃ³n #3 de flujos y modales de React.
- docs/specs/PRD_Checkout_Flow_Update.md â†’ Todo marcado como completado.
**Artefacto creado:** -
**Regla derivada:** Las acciones de cierre y cleanup visuales deben ser incondicionales.

## 2026-03-02 â€” Estabilidad y Defensive Coding

**QuÃ© pasÃ³:** Se corrigiÃ³ un error â€œTypeError: reduce is not a functionâ€ que afectaba la producciÃ³n mediante un barrido defensivo global en el frontend.
**Lo que cambiÃ³:**

- lessons_learned.md â†’ LecciÃ³n #10 (Defensive Data Handling)
- AGENTS.md â†’ Nueva regla crÃ­tica y features completadas.
- docs/PRD_MASTER.md â†’ SecciÃ³n de Estabilidad de AplicaciÃ³n.
- PROGRESS.md â†’ Estado de estabilidad actualizado.
**Artefacto creado:** walkthrough.md y udit_report.md (brain).
**Regla derivada:** Uso obligatorio de Array.isArray() en mÃ©todos de arreglo sobre datos de API.

## 2026-03-02 — Optimización de Almacenamiento (Modelo Diferencial)

**Qué pasó:** Reducción de 1.1GB de datos redundantes en la DB y blindaje del código de ingesta.
**Lo que cambió:**

- lessons_learned.md ? Lección #64
- sync_cardkingdom_api.py ? Lógica diferencial implementada
- LEYES_DEL_SISTEMA.md ? Agregada ley de almacenamiento diferencial

---

## 2026-03-03 — Soporte de Foliación (Foil) en Bulk Import

**Qué pasó:** Se implementó el soporte para distinguir entre cartas Foil y Non-Foil durante la importación masiva. Se resolvió el error de duplicados en base de datos y se actualizó la vista de productos.

**Lo que cambió:**

- `lessons_learned.md` → Lección #66 (Soporte de Foliación y Agregación en Lotes).
- `LEYES_DEL_SISTEMA.md` → Regla de Negocio 3 (Agregación obligatoria en lotes).
- `PROGRESS.md` y `docs/PRD_MASTER.md` → Actualizados con el éxito de la integración de ManaBox CSV/TXT.
- `supabase/functions/tcg-api/index.ts` → Lógica de agregación por `finish` antes de upsert.
- RPC `bulk_import_inventory` → Soporte para columna `finish` y manejo de conflictos.
- Vista `products_with_prices` → Inclusión de la columna `finish`.

**Regla derivada:**
> Siempre consolidar duplicados (mismo printing+condition+finish) dentro de un lote de importación en el backend antes de enviarlo a la base de datos para evitar fallos de `ON CONFLICT`.

---

## 2026-03-03 — Fix: Fuentes Faltantes → Google Fonts Fallbacks

**Qué pasó:** La aplicación en produción generaba errores 404 en consola al intentar cargar `/fonts/Daito.woff2` y `/fonts/Bogue-Medium.woff2`. Los archivos de fuente nunca fueron añadidos al repositorio, solo las referencias CSS.

**Problema encontrado:** `@font-face` declaraciones en `index.css` apuntaban a archivos locales inexistentes en `/public/fonts/`.

**Causa raíz:** Los archivos de fuente premium (Daito y Bogue) son de pago/demo y nunca se incluyeron en el repo.

**Lo que cambió:**

- `frontend/src/index.css` → Eliminados `@font-face` locales; Google Fonts importa `Cinzel` y `Cinzel Decorative` como sustitutos de alta calidad.
- CSS vars `--font-logo`, `--font-web-titles`, `--font-titles` actualizadas para priorizar los Google Fonts.

**Regla derivada:**
> Si una fuente se referencia en `@font-face` con `url('/fonts/...')`, el archivo DEBE existir en `frontend/public/fonts/`. De lo contrario, el build es silencioso pero el runtime genera 404s. Siempre usar Google Fonts como fallback cuando no se disponga del archivo local.
