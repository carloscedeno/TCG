# PRD - TCG Web App (Geekorium / Price Aggregator)

## 1. Vision & Product Goals

This platform is an advanced web application for aggregating and analyzing Trading Card Game (TCG) price data. It serves as a centralized tool for collectors, players, and sellers to track market trends and optimize their collections.

**Supported TCGs:**

- Magic: The Gathering (MTG)
- Pokémon
- Lorcana
- Flesh and Blood (FaB)
- Yu-Gi-Oh!
- Wixoss
- One Piece

**Primary Goals:**

- Consolidate price data from key marketplaces (Cardmarket, TCGplayer, Card Kingdom, Troll and Toad).
- Provide average market prices and suggested buy prices.
- Enable user collection management with portfolio tracking.
- Offer high-quality historical price data.

---

## 2. Core Features

### 2.1. Search & Filtering (✅ Implemented)

- **Advanced Search:** Real-time autocomplete, boolean logic (AND, OR, NOT), and exact phrase matching.
- **Dynamic Filters:** Game, Set/Edition, Rarity, Color, etc., with URL persistence.

### 2.2. Price Tracking & Analysis (✅ Fully Implemented)

- **Card Detail View**: Premium modal with "Add to Cart" integration.
- **Portfolio Analytics**:
  - **Performance Dashboard**: Real-time gainers and losers tracking.
  - **Price Alerts**: User-configurable thresholds with automatic nightly processing.
- **Inline Editing**: Quick updates for card quantity and condition.

## 3. Validación de Salud (PRD Compliance)

- **API Health**: Correr suite de verificación de endpoints.
  - Command: `python check_api_health.py`
- **Visual & UI Verification**: Levantar el navegador para verificar la carga de la página, capturar el DOM y grabar interacciones.
  - El agente debe usar `browser_subagent` para:
    - Entrar a `localhost:5173/TCG/`.
    - Verificar que no hay pantallas blancas (JS Errors).
    - Validar que el grid muestra cartas y los filtros funcionan.
    - Grabar la sesión para auditoría visual.
- **Product Health**: Verificar integridad de precios y stock.
  - Command: `python check_products_health.py`
- **Regression Testing**: Ejecutar pruebas de integración de Supabase.
  - Command: `python tests/verify_supabase_functions.py`

### 2.3. Commerce & Inventory (✅ Implemented)

- **Shopping Cart**: Real-time cart management with stock validation.
- **Checkout Flow**: Automatic inventory reduction and order history generation.

### 2.4. Admin & Automation (✅ Implemented)

- **GeekoSystem Terminal:** Real-time monitoring of scrapers and sync tasks.
- **Catalog & Price Sync**:
  - **Daily Automation**: Automatic price updates scheduled for **12:30 AM Pacific Time** daily.
  - **Multi-Source**: Ingestion from Scryfall (MTG) and direct market scraping from CardKingdom.
- **GitHub Automation**: Manual trigger of GitHub Actions workflows directly from the dashboard.

---

## 3. Technical Implementation

### 3.1. Scraping & Data Ingestion (Mature)

- **Anti-Bot Manager:** Rotating User-Agents, Proxies, rate limiting, and CAPTCHA detection.
- **Data Manager:** Incremental updates, historical snapshots, and anomaly detection.
- **Variant Detection:** Smart identification of Foil, Alt Art, Secret Rare, etc.
- **Marketplace Mapping:** Standardized condition mapping across TCGPlayer, Cardmarket, etc.

### 3.2. Architecture

- **Supabase (Core Backend)**: Our primary source of truth. All persistent data (Authentication, DB, Storage) and core business logic (Edge Functions) reside here.
- **Git (Frontend & Automation)**: Stores the React frontend code (deployed to GitHub Pages) and the automation ecosystem (FastAPI / Scrapers).
- **Hybrid Hub Model**: Local development (FastAPI/React) targets the production/staging Supabase Cloud instance directly to guarantee environment parity.

### 3.3. Deployment & Lifecycle

- **GitHub Sync**: Frontend and automation scripts are managed via Git and auto-deployed as required.
- **Persistence**: Scrapers and sync tasks update the global Supabase state.
- **Workflow**: Implement -> Commit -> Hybrid Local Verification -> Production Audit.

---

## 5. Roadmap & Future Phases

### Fase 5: Corrección de Detalles - Parte 1 (✅ Implementing & In Validation)

- **Regla 1: Agregación por Carta Única (Deduplicación)**: ✅ Implementado en el backend (`tcg-api`). El grid ahora filtra por la edición más reciente.
- **Regla 2: Fallback de Precios**: ✅ Implementado. Prioridad: `market_price` -> `store_price`.
- **Regla 3: Enlaces Externos**: ✅ Implementado. Botón "Standard Market" linkea a CardKingdom.
- **Regla 4: Landing por Novedades**: ✅ Implementado. Orden por `release_date` descendente por defecto.
- **Regla 5: Navegación y Títulos**: ✅ Implementado. Títulos clickeables, soporte para nuevas pestañas y modal optimizado.

---

## 6. Source of Truth Documentation

This PRD is the primary source of truth. Technical details are further expanded in:

- `docs/Requisitos iniciales.txt`
- `docs/Mejoras_Implementadas.md`
- `PROJECT_STRUCTURE.md`
