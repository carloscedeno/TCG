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

### 2.2. Price Tracking & Analysis (✅ Core Implemented)
- **Marketplace Comparison:** Side-by-side pricing from multiple sources (Scrapers built for Cardmarket, TCGPlayer).
- **Calculated Metrics:** Average Market Price and Suggested Buy Price.
- **Historical Charts:** Interactive charts (1M, 3M, 1Y, All) with zoom and multi-line comparison (NM vs MP, Foil vs Non-Foil).

### 2.3. User Collection Management (🏗️ In Progress)
- **Bulk Upload**: CSV/TXT import with mapping verification and conflict resolution (Identifies TCG and Store Prices).
- **Portfolio Dashboard**: 
    - **Two-Factor Valuation**: Collection value is calculated using both **Geekorium Store Prices** (internal benchmark) and **CardKingdom Market Prices** (external reference).
    - **Profit/Loss Tracking**: Real-time gainers and losers based on the variance between purchase price, store price, and market price.
    - **Ganadores/Perdedores Widgets**: Highlighting cards with the highest market shifts.
- **Inline Editing**: Quick updates for card quantity and condition.

### 2.4. Admin & Automation (✅ Implemented)
- **GeekoSystem Terminal:** Real-time monitoring of scrapers and sync tasks.
- **Catalog Sync:** Automated ingestion from Scryfall (MTG) and Pokemon TCG API.
- **GitHub Automation:** Manual trigger of GitHub Actions workflows directly from the dashboard.

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

## 4. Source of Truth Documentation
This PRD is the primary source of truth. Technical details are further expanded in:
- `docs/Requisitos iniciales.txt`
- `docs/Mejoras_Implementadas.md`
- `PROJECT_STRUCTURE.md`
