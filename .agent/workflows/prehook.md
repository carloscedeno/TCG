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

## 🧠 2. Directiva de Anclaje (Grounding & Anti-Hallucination)

Una vez ejecutado el script, el agente DEBE reflexionar explícitamente en su memoria de trabajo antes de emitir cualquier código:

1. **Marco de Trabajo Oficial**: Reconocer de forma irrefutable que estamos operando bajo el **Carlos AI Framework**. Queda estrictamente prohibido utilizar o sugerir terminología ajena u obsoleta.
2. **Alineación Inteligente (PRD vs Ad-Hoc)**: 
   - **Para nuevas features de producto**: Cruzar requerimientos con `docs/PRD_MASTER.md`.
   - **Para tareas sin PRD (mantenimiento, refactores, herramientas internas)**: Seguir de forma precisa y rigurosa las instrucciones directas del usuario, inspeccionando los archivos implicados para entender el contexto real del código antes de actuar.
3. **Cero Suposiciones Locales**: Confirmar que toda prueba y despliegue apunta a Cloudflare Pages / VITE_SUPABASE_PROJECT_ID en la nube y nunca a servicios locales no autorizados.

---

## 📝 3. Confirmación del Prehook al Usuario

Tras ejecutar la herramienta, el agente responderá al usuario con un resumen conciso:

```text
## 🛡️ Prehook Carlos AI Framework completado

✅ Git Status: [Limpio / Modificado] en rama [dev]
✅ Entorno y Supabase: OK
✅ Leyes del Sistema: Cargadas y en estricta observancia.

→ Contexto anclado sin desvaríos. ¿Procedemos con el plan de desarrollo para [Tarea]?
```
