# 📊 Progreso: Geekorium Omni-TCG (v2.0)

**Última Actualización**: 2026-04-29 20:20
**Estado**: ✅ Fase 1.5 Completada - Producción Estabilizada

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
- [x] Hotfix: Estabilización de DNS y Normalización Inteligente de URLs (GitHub Actions)
- [ ] Loader: Digimon TCG (Resilient Scraper)
- [ ] Loader: TCGPlayer Bridge (One Piece / Gundam)

### 🚀 Fase 3: Orquestación & UI
- [x] Hotfix: Restauración de Búsqueda y Filtros en Producción
- [x] Sincronización de URL (Source of Truth) en Home/Header
- [x] GitHub Actions Pipelines (Metadata & Prices) Funcionando en Main
- [ ] Validación de Integridad de Assets (WebP / Supabase Storage)

---

## Log de Decisiones
- **2026-04-27**: Se decide crear documentación separada (`OMNI_TCG_*.md`) para evitar ruido en la documentación principal de MTG hasta la validación final.
- **2026-04-27**: El algoritmo SKU-Aware se estandariza como `[F]SET-NNNN` para todos los nuevos TCGs.
- **2026-04-28**: **Hotfix Crítico**: Se restaura el buscador de producción (`main`) alineando los parámetros RPC y robusteciendo la sincronización de la URL en React.
- **2026-04-28**: Se unifican los cÃ³digos de juego a `PKM` para Pokémon a lo largo de todo el sistema para evitar discrepancias entre el Scraper y el Frontend.
- **2026-04-29**: **Estabilización de Infraestructura**: Se implementa normalización inteligente de URLs de Supabase para evitar fallos de DNS en GitHub Actions causados por malformación de secretos.
