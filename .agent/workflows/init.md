---
description: Inicialización de sesión — cargar contexto, leyes del sistema y reglas de entorno antes de empezar a programar
---

# /init — Inicialización de Sesión (Context & Rules)

Ejecuta este workflow **al inicio de cada nueva iteración o sesión de trabajo** para asegurar que el agente cargue todo el contexto histórico, las reglas (leyes) del sistema y directivas del proyecto antes de modificar código.

```text
[INIT ← estás aquí] → Plan → Work → Review → Audit → Compound
```

---

## 📖 1. Lectura Obligatoria de Leyes y Contexto

El agente debe leer (usando `view_file` o `read_resource`) los siguientes archivos antes de proceder:

- [ ] **Leyes del Sistema y Reglas**:
  - `.agent/rules/geeko_rules.md`
  - `.agent/rules/responsive-design.md`
- [ ] **Lecciones Aprendidas (Leyes Históricas)**:
  - `.agent/lessons_learned.md`
  - `.agent/COMPOUND.md` (para contexto reciente)
- [ ] **Estado Actual y Tareas**:
  - `.agent/AGENTS.md` (para ver qué características están pendientes/en progreso)

---

## 🚨 2. Reglas Estrictas del Entorno (Directivas Permanentes)

El agente debe aplicar de inmediato y sin preguntar estas reglas en su memoria operativa:

1. **Ramas y Control de Versiones**:
   - Si el usuario dice "sube a dev", se refiere a hacer commit y push a la rama `dev` en el repositorio remoto.
   - **NO USAMOS LOCAL**: Toda validación y prueba se asume que corre sobre un entorno de Development remoto o Cloudflare Pages.

2. **Base de Datos (Supabase)**:
   - Antes de crear tablas, funciones o RPCs, SIEMPRE usar la herramienta de revisión de BD (ej. listar tablas, revisar esquema actual).
   - No hacer cambios destructivos sin confirmación.

3. **Restricción de Archivos y UI**:
   - Respetar los tokens de diseño y colores de la marca (Geeko Cyan y Geeko Green) sin degradar a tonos monocromáticos.
   - Mantener siempre la coherencia del diseño y Leyes de Accesibilidad indicadas en las reglas leídas.

---

## 🔍 3. Entendimiento del Objetivo de la Sesión

Al ejecutar `/init [tarea o detalles xyz]`, el agente debe:

1. Leer el objetivo actual indicado por el usuario.
2. Identificar y explorar (leer) los archivos fuente implicados (`.ts`, `.tsx`, `.sql`, etc.).
3. Formular un breve plan o entendimiento y presentarlo al usuario:
   > "He cargado las leyes (Geeko rules, lessons learned), sé que trabajamos en la rama 'dev' y no en local. El objetivo es XYZ. Aquí está mi plan de ataque..."

---

## Ejecución Automática de Carga de Contexto

> *Agente: Si el usuario llama a este comando, asume las reglas de inmediato, lee los archivos mencionados en el punto 1 y responde confirmando qué aprendiste de ellos para esta sesión.*
