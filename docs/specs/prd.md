# PRD: El Emporio (TCG Singles Marketplace)
**Status**: 🟢 Active | **Version**: 1.0 | **Type**: MVP Specification

## 1. Executive Summary
**Mission**: Launch a high-performance, low-cost digital marketplace for TCG singles (Magic, Pokémon, Yu-Gi-Oh!) in 3 weeks.
**Core Value**: Speed, Aesthetics, and Operational Efficiency.
**Differentiation**: "Bajo Costo" architecture (Netlify/Supabase) with "Premium" UX (Glassmorphism/React).

## 2. Technical Architecture
### Frontend (Storefront)
- **Framework**: React 19 + Vite (Existing in `frontend/`)
- **Styling**: TailwindCSS 4.0 + Lucide React (Icons)
- **Deployment**: Netlify (SPA Mode)
- **State**: React Router DOM 7.0

### Backend (Data & Operations)
- **Database**: Supabase (PostgreSQL + Auth)
- **API Layer**: Supabase JS Client (`@supabase/supabase-js`)
- **Inventory Management**: Python Scripts (`src/api/utils/supabase_client.py`) for bulk imports/updates.

### Infrastructure
- **Auth**: Supabase Auth (Google OAuth + Email)
- **Storage**: Supabase Storage (Proof of Payment images)
- **Hosting**: Netlify Free Tier

## 3. Data Dictionary
### Tables
- **`products`**:
    - `id` (UUID, PK)
    - `name` (Text)
    - `game` (Text: MTG, PKM, YGO)
    - `set_code` (Text)
    - `price` (Numeric)
    - `stock` (Int)
    - `image_url` (Text)
    - `rarity` (Text)
- **`orders`**:
    - `id` (UUID, PK)
    - `user_id` (UUID, FK)
    - `total` (Numeric)
    - `status` (Enum: pending, paid, shipped)
    - `payment_proof_url` (Text)
    - `created_at` (Timestamp)
- **`order_items`**:
    - `order_id` (FK)
    - `product_id` (FK)
    - `quantity` (Int)
    - `price_at_purchase` (Numeric)

## 4. Phase 1 Scope (MVP - 3 Weeks)
### Week 1: Identity & UX
- [ ] **Design System**: Implement "Geekorium" palette (Dark Mode, Neon Accents) in `frontend/src/index.css`.
- [ ] **Hero Section**: Dynamic "New Arrivals" carousel.
- [ ] **Catalog**: Grid/List view with live search and filters (Game, Price, Rarity).

### Week 2: Data & Inventory
- [ ] **Python Importer**: Script to parse "Manabox" CSV exports and hydrate `products` table.
- [ ] **Supabase Sync**: Ensure real-time stock updates.

### Week 3: Checkout & Launch
- [ ] **Cart Context**: Global state for shopping cart.
- [ ] **Manual Checkout**: Form to upload image (Proof of Payment).
- [ ] **Order Dashboard**: Admin view to see pending orders.

## 5. Security & Constraints
- **RLS (Row Level Security)**: Public read for products, Authenticated write for orders.
- **Failover**: If Supabase is down, show "Maintenance Mode" static page.
- **Performance**: Lighthouse score > 90 (Mobile).

## 6. Existing Assets Integration
- Reuse `TCG/frontend` structure.
- Reuse `TCG/src/api/utils/supabase_client.py` for backend logic.
- Reuse `TCG/data/` for initial seed data.
