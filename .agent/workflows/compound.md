---
description: Paso Compound post-sesión — codificar lo aprendido en activos reutilizables
---

# /compound — Workflow Post-Sesión

Ejecutar este workflow al **finalizar cada sesión de trabajo** para completar el ciclo *Compounding Engineer*:

```text
Plan → Work → Review → [COMPOUND ← estás aquí]
```

---

## Pasos

### 1. Identificar Lecciones Nuevas

Revisar lo que pasó en la sesión:

- ¿Se encontró un bug no documentado? → Agregar a `.agent/lessons_learned.md`
- ¿Se descubrió un patrón de arquitectura? → Agregar a `.agent/reference/[área].md`
- ¿Una regla de negocio quedó más clara? → Agregar a `LEYES_DEL_SISTEMA.md`

**Formato en `lessons_learned.md`:**

```markdown
### N. [Título] — YYYY-MM-DD
- **Problema:** ...
- **Causa Raíz:** ...
- **Solución:** ...
- **Regla Derivada:** (citar dónde se codificó)
```

### 2. Verificar `AGENTS.md`

- ¿Hay features que ahora están completas? Moverlas de `🚧 Pendientes` a `✅ Implementadas`.
- ¿Hay reglas críticas nuevas? Agregarlas a `⚠️ Reglas Críticas del Sistema`.

### 3. ¿Existe un Artefacto Reutilizable?

Si la solución puede usarse en el futuro:

- **Script de utilidad** → Guardar en `scripts/` con nombre descriptivo y docstring
- **Workflow nuevo** → Crear en `.agent/workflows/[nombre].md`
- **Prompt refinado** → Actualizar en `.agent/reference/[área].md`

### 4. Registrar en COMPOUND.md

Agregar una entrada al log `.agent/COMPOUND.md` con el formato:

```markdown
## YYYY-MM-DD — [Tema]

**Qué pasó:** ...
**Lo que cambió:**
- `lessons_learned.md` → Lección #N
- (otros archivos)
**Artefacto creado:** (si aplica)
**Regla derivada:** (si aplica)
```

### 5. Commit

```powershell
git add .agent/ LEYES_DEL_SISTEMA.md
git commit -m "🧠 compound: [resumen de lo aprendido]"
```

---

> **Regla de Oro del Compound Step:**
> Si el conocimiento solo existe en el historial de conversación, **no existe**. Solo cuenta lo que está escrito en los archivos del repo.
