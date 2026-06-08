---
description: Prehook de anclaje y validación — verificar estado del entorno y asimilar leyes para evitar pérdida de contexto o desvaríos antes de codificar
---

// turbo

# /prehook — Anclaje y Validación del Carlos AI Framework

Ejecuta este workflow **antes de iniciar cualquier plan o desarrollo de nuevas características** para asegurar la alineación absoluta del agente con el proyecto, prevenir alucinaciones de terminología ("desvaríos") y garantizar la consistencia del entorno de trabajo.

```text
[PREHOOK ← estás aquí] → Init → Plan → Work → Review → Audit → Compound
```

---

## 🛡️ 1. Ejecución del Prehook Automatizado

El agente debe correr de inmediato y sin pedir confirmación el script de verificación del entorno:

```powershell
python tools/scripts/carlos_prehook.py
```

Este script realiza un chequeo de cordura (Sanity Check) sobre:
- Estado y rama de Git (asegurando trabajar en `dev` y reportando archivos sin guardar).
- Presencia y validez del archivo `.env` y variables de Supabase.
- Verificación de existencia de las leyes y lecciones aprendidas del proyecto.

---

## 🧠 2. Leer SESSION_STATE (Contexto Persistente)

**OBLIGATORIO — leer ANTES de cualquier otra acción:**

```
.agent/SESSION_STATE.md
```

Este archivo contiene la memoria de trabajo entre sesiones:
- Rama activa y último commit
- Archivos en zona caliente (tocados recientemente)
- Próxima acción recomendada
- Restricciones activas de la semana
- Estado del knowledge graph (Graphify)

Si el archivo no existe o tiene más de 2 días sin actualizar → crearlo/actualizarlo.

---

## 🗺️ 3. Verificar Knowledge Graph (Graphify)

Si `graphify-out/graph.json` existe, el agente DEBE usarlo como primera fuente:

```powershell
# Buscar un componente o función:
graphify query "nombre del componente"

# Entender dependencias:
graphify query "¿qué componentes usan useAuth?"

# Actualizar tras cambios de código:
graphify update frontend/src --no-viz
```

**Regla absoluta:** Graphify primero → `grep_search` solo si el grafo no cubre lo que necesitas.

---

## 💰 4. Context Budget Protocol (Anti-token-waste)

| Acción | PROHIBIDO ❌ | CORRECTO ✅ |
|--------|-------------|------------|
| Buscar función | grep en todo el repo | `graphify query` primero |
| Leer archivo | `view_file` completo ciegamente | Solo líneas relevantes (StartLine/EndLine) |
| Instalar paquete | Sin preguntar | Verificar si existe + mini-spec primero |
| Verificar cambio visual | Asumir que funciona | Screenshot via Chrome DevTools MCP |
| Explorar estructura | `list_dir` recursivo | Consultar `graphify-out/GRAPH_REPORT.md` |

---

## 🧠 5. Directiva de Anclaje (Grounding & Anti-Hallucination)

1. **Marco de Trabajo Oficial**: Operamos bajo el **Carlos AI Framework**. Terminología ajena = prohibida.
2. **Alineación Inteligente**:
   - Nuevas features → cruzar con `docs/PRD_MASTER.md`
   - Mantenimiento/refactores → inspeccionar archivos implicados antes de actuar
3. **Cero Suposiciones Locales**: Todo apunta a Cloudflare Pages / Supabase remoto. Nunca local.
4. **IDs de Entorno**:
   - DEV Supabase: `bqfkqnnostzaqueujdms`
   - PROD Supabase: `sxuotvogwvmxuvwbsscv`
5. **Testing en Dev**: No puedes pedirle al usuario que pruebe algo en 'dev' (ej: dev.geekorium.shop) si no has hecho un `git push` de tus cambios. El entorno dev es remoto, por lo que los cambios locales no se reflejan allí automáticamente hasta que se despliegan mediante CI/CD.
6. **Ejecución Remota de SQL**: Tienes disponible el MCP de Supabase. NUNCA le pidas al usuario que ejecute migraciones, DDL o queries SQL manualmente en su Dashboard. Usa la herramienta `call_mcp_tool` con `execute_sql` (o las de migración) para aplicar los cambios tú mismo en la base de datos remota.

---

## 📋 6. Spec-First para Tareas Grandes

Si la tarea afecta **más de 2 archivos** o **instala una dependencia** → escribir mini-spec ANTES de ejecutar:

```markdown
### SPEC: [nombre]
**Qué cambia:** [1 línea]
**Archivos afectados:** [lista]
**Dependencias nuevas:** [NINGUNA / nombre + justificación]
**Prueba de éxito:** [cómo verificamos]
**Restricciones:** [qué NO tocar]
```

Esperar aprobación del usuario. No ejecutar antes.

---

## ✅ 7. Confirmación del Prehook al Usuario

```text
## 🛡️ Prehook Carlos AI Framework completado

✅ Git Status: [Limpio / Modificado] en rama [dev]
✅ Entorno y Supabase: OK
✅ SESSION_STATE: Leído — zona caliente: [archivos]
✅ Graphify: [Disponible (299 nodos) / Desactualizado → graphify update frontend/src --no-viz]
✅ Leyes del Sistema: Cargadas y en estricta observancia.

→ Contexto anclado. ¿Procedemos con [Tarea]?
```
