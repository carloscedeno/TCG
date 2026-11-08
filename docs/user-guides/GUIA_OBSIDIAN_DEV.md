# 🚀 Guia de Obsidian para Desarrolladores (Geekorium Workflow)

Esta guia describe como utilizar Obsidian y la IA para maximizar la velocidad de programacion, calidad del codigo y claridad mental.

---

## 1. ⚙️ Configuracion Inicial Realizada

1. **Exclusiones de rendimiento**: Se ignoraron carpetas gigantes (
ode_modules, .venv, .git, dumps SQL) para que Obsidian vuele y no gaste memoria.
2. **Ubicacion de adjuntos**: Imagenes y capturas se guardan automaticamente en docs/attachments/.
3. **Plantillas integradas**: Configuradas en docs/templates/ para generar notas estandarizadas en 1 segundo.
4. **Notas diarias**: Se almacenan en docs/daily-logs/ con formato YYYY-MM-DD.

---

## 2. 🧩 Plugins de Obsidian Altamente Recomendados

Para convertir tu Obsidian en un IDE de documentacion y diseno:

1. **Dataview**:
   - Permite consultar tus notas con SQL/JS.
   - *Uso*: Crear listas automaticas de todos los bugs abiertos, ADRs pendientes o tareas de la semana.
2. **Omnisearch**:
   - Motor de busqueda inteligente con soporte de texto en PDFs e imagenes.
3. **Excalidraw / Canvas**:
   - Para dibujar flujos de datos, diagramas de arquitectura de base de datos o mocks de interfaces a mano alzada.
4. **Git (Obsidian Git)**:
   - Auto-commit y sync de tus notas directamente con tu repo (opcional si ya usas Git CLI).
5. **Paste URL into Selection**:
   - Selecciona un texto, pega un link y se formatea automaticamente en Markdown.

---

## 3. 🔄 El Ciclo de Desarrollo Aumentado (AI + Obsidian + Code)

`
┌────────────────────────────────────────────────────────┐
│ 1. DEFINICION: Abre o crea un PRD / Feature Spec       │
│    (docs/specs/ o docs/PRD_MASTER.md)                  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 2. ARQUITECTURA: Escribe un ADR si hay diseno nuevo    │
│    (docs/architecture/adr/)                            │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 3. PAIR PROGRAMMING CON IA:                            │
│    Pasa el contexto de la nota al agente de IA.        │
│    Implementamos codigo limpio respetando las reglas.  │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│ 4. CIERRE & BITACORA:                                  │
│    Abre la nota diaria (Ctrl+P -> Daily notes) y anota │
│    lo logrado, lecciones o bugs encontrados.           │
└────────────────────────────────────────────────────────┘
`

---

## 4. ⌨️ Atajos Clave en Obsidian

- Ctrl + O: Abrir cualquier archivo al instante (Quick Switcher).
- Ctrl + G: Abrir la vista de Grafo (Graph View) para ver como todo el proyecto se conecta.
- Ctrl + P: Paleta de comandos (Insertar plantilla, nota diaria, buscar, exportar).
- [[: Escribe doble corchete para autocompletar enlaces a cualquier nota o modulo del proyecto.

