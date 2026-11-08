# 🗺️ Mapa de Código & Comunidades Graphify (Geekorium AST Graph)

> **Este documento es el puente entre el Grafo AST de Código (Graphify) y la Arquitectura / PKM (Obsidian).**
> Graphify extrae y agrupa 5,400+ nodos de codigo en comunidades funcionales. Aqui las mapeamos directamente a los modulos y PRDs del proyecto.

---

## 📊 Reportes Graphify Disponibles
- 📄 [[graphify-out/GRAPH_REPORT.md|Graph Report Completo (AST & Comunidades)]]
- 🌐 Arbol de llamadas y flujo: graphify-out/TCG-Web-App-callflow.html
- 🌳 Arbol jerarquico de dependencias: graphify-out/GRAPH_TREE.html

---

## 🧩 Las 10 Comunidades Principales de Codigo

| # | Comunidad Graphify | Capa / Directorio Principal | Documentacion & PRD Asociado |
|---|---|---|---|
| **1** | **Card Catalog & UI Components** | rontend/src/components/, rontend/src/pages/Home.tsx | [[docs/PRD_MASTER]] |
| **2** | **Cart & Auth Context** | rontend/src/context/, rontend/src/hooks/ | [[LEYES_DEL_SISTEMA]] |
| **3** | **Checkout & PWA Flow** | rontend/src/pages/Checkout.tsx | [[docs/flujo_checkout_corregido]] |
| **4** | **Admin Dashboard & Orders** | rontend/src/pages/Admin.tsx | [[GUIA_ADMINISTRACION]] |
| **5** | **Inventory Management** | rontend/src/components/admin/QuickStock.tsx | [[docs/Flujos_BPMN_Geeko]] |
| **6** | **Product Admin & Import** | scripts/, atch_fix_imports.py, src/ | [[REFERENCIA_MAESTRA_IMPORTACION.csv]] |
| **7** | **API Utils & Sync** | rontend/src/utils/api.ts, supabase/functions/tcg-api/ | [[docs/database/]] |
| **8** | **Banners, Events & Games** | rontend/src/components/HeroBanner.tsx | [[docs/PRD_COMUNIDADES_Y_RANKINGS]] |
| **9** | **Profile & Portfolio** | rontend/src/pages/Profile.tsx | [[docs/PRD_MASTER]] |
| **10** | **Icons, Help & Pre-Reg** | rontend/src/components/ui/ | [[USAGE_GUIDE]] |

---

## 🛠️ Como usar Graphify en tu flujo diario
1. **Cuando crees o cambies codigo**, ejecuta en terminal:
   graphify update . (actualiza el grafo AST en segundos sin costo de API).
2. **Para explorar conexiones de una sola nota en Obsidian**:
   Usa el **Grafo Local (Ctrl + P -> Open Local Graph)**. Te muestra la relacion exacta de la nota actual con el resto del sistema sin saturar la pantalla.

