# 🔄 COMPOUND LOG — TCG/Geekorium

> **Propósito**: Registro cronológico del paso **Compound** del framework *Compounding Engineer* (Dan Shipper / Every.to).
>
> Después de cada sesión de trabajo, el agente registra aquí:
>
> - Qué se aprendió
> - Qué archivos de conocimiento se actualizaron
> - Qué artefactos reutilizables se crearon o mejoraron
>
> Esto convierte cada sesión en un activo permanente que acelera el trabajo futuro.

---

## Formato de Entrada

```markdown
## YYYY-MM-DD — [Título / Tema]

**Qué pasó:** Breve descripción del trabajo realizado.
**Problema encontrado:** (si aplica)
**Causa raíz:** (si aplica)
**Lo que cambió:**
- `lessons_learned.md` → Lección #N: [título]
- `AGENTS.md` → [sección actualizada]
- `reference/[archivo].md` → [qué se agregó]
**Artefacto reutilizable creado:** `scripts/nombre.py` o `workflows/nombre.md`
**Regla derivada:** (si aplica — citar dónde se codificó)
```

---

## 2026-02-27 — Adopción del Framework Compounding Engineer

**Qué pasó:** Se formalizó la adopción del framework *Compounding Engineer* sobre la base existente del proyecto (`.agent/`, `LEYES_DEL_SISTEMA.md`, `lessons_learned.md`).

**Lo que cambió:**

- `.agent/COMPOUND.md` → Creado (este archivo) — Log del paso Compound
- `.agent/workflows/compound.md` → Creado — Workflow `/compound` post-sesión
- `.agent/AGENTS.md` → Actualizado — Ciclo CE documentado (Plan→Work→Review→Compound)
- `.agent/reference/methodology.md` → Actualizado — Añadido Compound step, alineado Strata PPRE con CE PWRC

**Regla derivada:**
> Toda sesión de trabajo debe terminar ejecutando `/compound` para que el conocimiento no se pierda en el historial de conversación.

---

## 2026-02-27 — Correcciones de Diseño Geekorium + Tests 100%

**Qué pasó:** Se implementaron las correcciones del documento `Geeko diseño fix.md` (tipografía, colores de marca en filtros, widget WhatsApp, checkout con método de despacho). Luego se ejecutó `/audit` completo y se corrigieron los 5 fallos/errores pre-existentes en los tests unitarios de backend.

**Lo que cambió:**

- `frontend/src/components/Navigation/WhatsAppWidget.tsx` → Footer "Atención por WhatsApp"
- `frontend/src/components/Filters/FiltersPanel.tsx` → Colores de filtros: `blue/purple` → `geeko-cyan/violet-accent`
- `frontend/src/pages/CheckoutPage.tsx` → Campo de Método de Despacho obligatorio + validación email
- `frontend/src/pages/Home.tsx` → Removido `italic` de heading `¿Cómo comprar?` (restricción de spec)
- `frontend/src/pages/HelpPage.tsx` → Removido `italic` de heading `¿Aún tienes dudas?`
- `frontend/src/index.css` → Token nuevo `--color-geeko-violet-deep: #523176`
- `tests/unit/test_collection_import.py` → Reescrito con patch target correcto (`supabase_admin`)
- `tests/unit/test_valuation_service.py` → Reescrito con mock two-step (sources + price_history por `source_id`)
- `tests/unit/test_commerce_inventory.py` → Convertido de integración a unit test puro con mocks
- `.agent/lessons_learned.md` → Lecciones #15–#19

**Resultado:** `27/27` tests pasando. Build limpio. Push a `main`.

**Artefacto reutilizable:** Patrón de `table_side_effect` en tests para mockear Supabase con múltiples tablas → ver `test_valuation_service.py::_make_supabase_mock()` y `test_commerce_inventory.py::_cart_supabase_mock()`.

**Regla derivada:**
> Al refactorizar el cliente de Supabase en un servicio (ej: `supabase` → `supabase_admin`), actualizar el patch target en TODOS los tests correspondientes. Usar `grep_search` con `patch(` + nombre del módulo.

---

## 2026-02-27 — Hotfix: Reemplazo Exhaustivo de Colores Heredados

**Qué pasó:** Tras aplicar restricciones tipográficas (eliminar `italic`), se descubrió que la sección de Ayuda dependía de estilos utilitarios implícitos y usaba la paleta de colores vieja del proyecto (beige, negro, verde). Se limpió el componente completo.

**Lo que cambió:**

- `frontend/src/pages/HelpPage.tsx` → `font-web-titles` restaurado, colores actualizados (fondo `#373266`, texto `#FFFFFF`, botón `#00AEB4`).
- `.agent/lessons_learned.md` → Lección #20 (Reemplazo Exhaustivo de Colores Heredados).

**Regla derivada:**
> Siempre que se modifique un componente heredado para ajustarlo a nuevas reglas de brand, se debe auditar TODO el componente buscando y reemplazando colores *hardcoded* obsoletos.

---

## 2026-02-27 — Hotfix: Fallback Image URLs en vistas combinadas de DB

**Qué pasó:** Los cards del inventario en el "Stock Geekorium" se mostraban sin imagen porque la consulta `get_products_filtered` estaba obteniendo `image_url` directamente de la tabla local `products` que puede estar nulo. El fallback a la metadata universal (`card_printings`) estaba ignorado a pesar del `LEFT JOIN`.

**Lo que cambió:**

- Modificado en Supabase (vía MCP) el RPC `get_products_filtered` (para ambas firmas).
- Se reemplazó `p.image_url` por `COALESCE(p.image_url, cp.image_url) as image_url`.
- `.agent/lessons_learned.md` → Lección #21 (Fallbacks Visuales en Vistas Combinadas de DB).

**Regla derivada:**
> Cuando se construyan RPCs o Vistas SQL que unan datos de inventario local (`products`) con metadata universal (`card_printings`, `cards`), los campos visuales (`image_url`) y descriptivos deben usar `COALESCE` para priorizar la fuente local y recurrir como fallback a la metadata universal.
