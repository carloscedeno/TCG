# 🗂️ Project Structure — Geekorium

> Última actualización: 2026-02-26

```
TCG/
├── .agent/                     # Contexto y reglas para agentes IA
│   ├── AGENTS.md               # Punto de entrada: stack, features, reglas críticas
│   ├── lessons_learned.md      # Bugs críticos, anti-patrones, soluciones probadas
│   ├── reference/              # Reglas modulares por área
│   │   ├── methodology.md      # Metodología PRD-first
│   │   ├── frontend.md         # Estándares React/Tailwind
│   │   ├── api.md              # Supabase Edge Functions
│   │   ├── scrapers.md         # Calidad de datos
│   │   └── documentation.md   # Gestión de docs
│   ├── rules/                  # Reglas adicionales
│   └── workflows/              # Comandos automatizados (/import, /nightly-sync)
│
├── frontend/                   # React 18 + TypeScript (desplegado en GitHub Pages)
│   ├── src/
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── Card/           # Card + CardModal (componentes críticos)
│   │   │   ├── Navigation/     # Header, QuickStockPanel
│   │   │   └── ...
│   │   ├── pages/              # Home, Admin, Checkout, Login
│   │   └── utils/              # api.ts (cliente Supabase), helpers
│   └── tests/e2e/              # Playwright E2E tests
│
├── supabase/
│   ├── functions/
│   │   └── tcg-api/            # Edge Function principal (Deno/TypeScript)
│   └── migrations/             # Migraciones SQL versionadas
│
├── src/                        # Python: lógica de backend y sync
│   ├── api/                    # FastAPI endpoints (uso interno/admin)
│   ├── core/                   # Lógica de negocio
│   └── features/               # Módulos por feature
│
├── scripts/                    # Scripts de operación
│   ├── setup.py                # Setup inicial del entorno
│   ├── sync_cardkingdom_api.py # Sync de precios CK
│   ├── import_manabox.py       # Import de inventario ManaBox
│   ├── deploy_api.ps1          # Deploy Edge Functions
│   └── debug/                  # Scripts de debug (no producción)
│
├── tests/                      # Tests Python
│   └── fixtures/               # Archivos de test (CSV, TXT)
│
├── data/                       # Datos procesados y JSONs de referencia
│
├── docs/                       # Documentación ACTIVA
│   ├── PRD_MASTER.md           # ⭐ PRD canónico unificado (fuente de verdad)
│   ├── TechDocs/               # Arquitectura, DB schema, API docs
│   │   ├── architecture.md
│   │   ├── data-dictionary.md
│   │   ├── environment-setup.md
│   │   └── ...
│   ├── reference/              # Documentación de referencia (TCG structures, etc.)
│   ├── api/                    # Documentación de APIs
│   ├── specs/                  # Especificaciones técnicas
│   └── archive/                # 📦 Documentación histórica (no tocar)
│       ├── prds/               # PRDs anteriores archivados
│       ├── plans/              # Planes de implementación pasados
│       ├── sessions/           # Resúmenes de sesiones de trabajo
│       └── reports/            # Reportes de bugs, deployments, verificaciones
│
├── README.md                   # Introducción y quick start
├── LEYES_DEL_SISTEMA.md        # Reglas inmutables de operación del agente
├── GUIA_ADMINISTRACION.md      # Guía para administradores
├── INICIO_RAPIDO.md            # Quick start detallado
├── USAGE_GUIDE.md              # Guía de uso
├── PROGRESS.md                 # Progreso y roadmap
│
├── .env                        # Variables de entorno (no commitear)
├── .env.example                # Template de variables
├── pyproject.toml              # Config Python
└── requirements.txt            # Dependencias Python
```

## Archivos Críticos

| Archivo | Propósito |
|---------|-----------|
| `docs/PRD_MASTER.md` | Fuente de verdad del producto |
| `.agent/AGENTS.md` | Contexto principal para agentes IA |
| `.agent/lessons_learned.md` | Anti-patrones y soluciones probadas |
| `LEYES_DEL_SISTEMA.md` | Reglas de operación autónoma |
| `frontend/src/components/Card/Card.tsx` | Componente crítico (shielded) |
| `frontend/src/components/Card/CardModal.tsx` | Componente crítico (shielded) |
| `supabase/functions/tcg-api/index.ts` | Edge Function principal |

## Convenciones

- **No crear archivos .md en la raíz** salvo los listados arriba
- **Documentación activa** → `docs/`
- **Sesiones/reportes/diagnósticos** → `docs/archive/`
- **Scripts temporales** → `scripts/debug/` (no la raíz)
