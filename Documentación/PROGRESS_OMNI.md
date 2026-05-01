# 📊 Progreso: Geekorium Omni-TCG (v2.0)

**Última Actualización**: 2026-04-30 17:05
**Estado**: ✅ Fase 1.6: Rebranding Premium y Estabilización UI Completada

---

## Roadmap de Ejecución

### 🏗️ Fase 1: Estructura (Compounding)
- [x] Definición de Historias de Usuario (`OMNI_TCG_REQS.md`)
- [x] Configuración de Task List (`task.md`)
- [x] Establecimiento de PROGRESS_OMNI.md
- [x] Aprobación de estructura por el usuario

### ⚙️ Fase 2: Motor de Datos (Backend & DB)
- [x] Índices GIN y Optimización de Esquema
- [x] Refactorización de Lógica SKU-Aware
- [x] Loader: Pokémon TCG (API v2)
- [x] Normalización de Game Codes (PKM Mapping)
- [ ] Loader: Digimon TCG (Resilient Scraper)
- [ ] Loader: TCGPlayer Bridge (One Piece / Gundam)

### 🚀 Fase 3: Orquestación & UI
- [x] Hotfix: Restauración de Búsqueda y Filtros en Producción
- [x] Sincronización de URL (Source of Truth) en Home/Header
- [x] **Overhaul Responsive & Rebranding Premium** (Landing Page v2.0)
- [x] Restauración de Identidad Visual (Logo Beta Original)
- [x] GitHub Actions Pipelines (Metadata & Prices) - *Estabilizado*
- [x] **Arena Manager & Tournaments**: Gestión dinámica de eventos y pre-inscripciones.

---

## Log de Decisiones
- **2026-04-27**: Se decide crear documentación separada (`OMNI_TCG_*.md`) para evitar ruido en la documentación principal de MTG hasta la validación final.
- **2026-04-27**: El algoritmo SKU-Aware se estandariza como `[F]SET-NNNN` para todos los nuevos TCGs.
- **2026-04-28**: **Hotfix Crítico**: Se restaura el buscador de producción (`main`) alineando los parámetros RPC y robusteciendo la sincronización de la URL en React.
- **2026-04-30**: **Rebranding Premium**: Se refactoriza la Landing Page para incluir un Hero Banner de alto impacto y una sección de categorías TCG con fondo degradado. Se migra toda la navegación a un modelo "Single Source of Truth" basado en URL para eliminar el bug de doble clic.
- **2026-04-30**: **Responsive Architecture**: Se simplifica el Header a una sola fila para portátiles pequeños y se utiliza padding dinámico (`vw`) en secciones de scroll para evitar recortes laterales.
- **2026-05-01**: **Arena Manager & Sidebar Integration**: Se integra la gestión de banners y eventos desde el panel Admin. Se activa la pre-inscripción dinámica en el Tournament Hub con base de datos propia. Se estabiliza el Home mediante la corrección de anidamiento JSX y restauración de dependencias.

