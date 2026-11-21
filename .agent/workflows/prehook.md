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
- Verificación de existencia de las leyes, lecciones aprendidas y reglas de código/seguridad del proyecto.

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

## 🧘 6. SKILL 1 (PERMANENTE): Disciplina de Código (Reglas de Karpathy)

El agente debe acatar estrictamente estas 4 reglas en toda modificación o creación:

1. **Piensa antes de programar:**
   - Analiza el problema y expón brevemente tu plan antes de tocar código.
   - Si un requerimiento es ambiguo o existen múltiples opciones, detente y pregunta primero.
2. **Simplicidad extrema (haz solo lo pedido):**
   - Implementa exactamente lo solicitado de la forma más directa y simple posible.
   - Prohibido agregar abstracciones innecesarias, features extras o archivos no pedidos.
3. **Cambios quirúrgicos (toca solo lo necesario):**
   - Modifica únicamente las líneas y archivos estrictamente relacionados con la tarea.
   - Prohibido reformatear o refactorizar código fuera del alcance. Preserva comentarios y reglas existentes.
4. **Verifica antes de decir "listo":**
   - Revisa cambios línea por línea y corre pruebas para validar que no se rompió nada antes de dar por cerrada la tarea.

---

## 🔒 7. SKILL 2 (PERMANENTE): Seguridad por Defecto

Prácticas de seguridad aplicadas automáticamente en todo momento sin excepción:

1. **Cero secretos expuestos:** Claves API y tokens NUNCA en código ni frontend. Variables privadas solo en backend. Prefijo `VITE_` solo para configs 100% públicas.
2. **Desconfía del cliente:** Validación de datos, precios, stock, roles y formularios siempre en el servidor (Supabase RPCs / Edge Functions).
3. **Consultas parametrizadas:** Prevención absoluta de SQL injection, XSS y CSRF.
4. **Rutas y sesiones blindadas:** Validación en servidor (RLS / Edge Functions) para `/admin` y datos sensibles.
5. **Límites y control de archivos:** Rate limiting y validación estricta de MIME, extensión y tamaño en subidas.
6. **Código limpio para producción:** Sin debug activo, sin trazas públicas y sin datos sensibles en logs.

---

## 📋 8. Spec-First para Tareas Grandes

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

## ✅ 9. Confirmación del Prehook al Usuario

```text
## 🛡️ Prehook Carlos AI Framework completado

✅ Git Status: [Limpio / Modificado] en rama [dev]
✅ Entorno y Supabase: OK
✅ SESSION_STATE: Leído — zona caliente: [archivos]
✅ Graphify: [Disponible (299 nodos) / Desactualizado → graphify update frontend/src --no-viz]
✅ Leyes del Sistema: Cargadas y en estricta observancia.
✅ Disciplina de Código (Karpathy) & Seguridad por Defecto: Activas y operativas.

→ Contexto anclado. ¿Procedemos con [Tarea]?
```
