# Graph Report - .  (2026-06-08)

## Corpus Check
- 89 files · ~71,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 299 nodes · 595 edges · 11 communities (10 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Banners, Events & Games|Banners, Events & Games]]
- [[_COMMUNITY_Admin Dashboard & Orders|Admin Dashboard & Orders]]
- [[_COMMUNITY_Card Catalog & UI Components|Card Catalog & UI Components]]
- [[_COMMUNITY_Cart & Auth Context|Cart & Auth Context]]
- [[_COMMUNITY_Inventory Management|Inventory Management]]
- [[_COMMUNITY_Checkout & PWA Flow|Checkout & PWA Flow]]
- [[_COMMUNITY_Icons, Help & Pre-Registration|Icons, Help & Pre-Registration]]
- [[_COMMUNITY_Profile & Portfolio|Profile & Portfolio]]
- [[_COMMUNITY_Product Admin & Import|Product Admin & Import]]
- [[_COMMUNITY_API Utils & Sync|API Utils & Sync]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 29 edges
2. `useCart()` - 17 edges
3. `CardProps` - 7 edges
4. `CartDrawer()` - 6 edges
5. `Footer()` - 6 edges
6. `UserMenu()` - 6 edges
7. `Header()` - 5 edges
8. `BulkImport()` - 5 edges
9. `getApiUrl()` - 5 edges
10. `fetchCardDetails()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `ProfilePage()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/pages/Profile.tsx → frontend/src/context/AuthContext.tsx
- `InventoryPage()` --calls--> `useCart()`  [EXTRACTED]
  frontend/src/pages/Admin/InventoryPage.tsx → frontend/src/context/CartContext.tsx
- `PosSessionBanner()` --calls--> `useAuth()`  [EXTRACTED]
  frontend/src/components/Admin/PosSessionBanner.tsx → frontend/src/context/AuthContext.tsx
- `CardGridProps` --references--> `CardProps`  [EXTRACTED]
  frontend/src/components/Card/CardGrid.tsx → frontend/src/components/Card/Card.tsx
- `DealsCarouselProps` --references--> `CardProps`  [EXTRACTED]
  frontend/src/components/Home/DealsCarousel.tsx → frontend/src/components/Card/Card.tsx

## Import Cycles
- None detected.

## Communities (11 total, 1 thin omitted)

### Community 0 - "Banners, Events & Games"
Cohesion: 0.06
Nodes (41): Banner, BannersPage(), Event, EventsPage(), GAME_OPTIONS, Presale, Banner, Game (+33 more)

### Community 1 - "Admin Dashboard & Orders"
Cohesion: 0.07
Nodes (30): AdminDashboard(), BulkImportCatalogModal(), BulkImportCatalogModalProps, CloudflareAnalytics(), CloudflareStats, Order, ORDER_STATUSES, OrderItem (+22 more)

### Community 2 - "Card Catalog & UI Components"
Cohesion: 0.07
Nodes (33): AuthModal(), Card, CardFace, CardProps, CardGrid(), CardGridProps, CardImage(), CardImageProps (+25 more)

### Community 3 - "Cart & Auth Context"
Cohesion: 0.08
Nodes (26): CartManager(), PosSessionBanner(), CartContext, CartContextType, CartItem, CartProvider(), useCart(), ManaText() (+18 more)

### Community 4 - "Inventory Management"
Cohesion: 0.10
Nodes (17): AddAccessoryDrawer(), AddAccessoryDrawerProps, BulkImageUploadModalProps, UploadItem, Category, CategoryModal(), Props, EditProductModal() (+9 more)

### Community 5 - "Checkout & PWA Flow"
Cohesion: 0.10
Nodes (7): PresalesPage(), PwaReloadPrompt(), MISSION_STEPS, WelcomeModal(), WhatsAppWidget(), CheckoutSuccessPage(), OrderTrackingPage()

### Community 6 - "Icons, Help & Pre-Registration"
Cohesion: 0.13
Nodes (12): DiscoveryIcon(), PactIcon(), PreparationIcon(), SelectionIcon(), VideoPlaceholder(), HelpSection(), PreRegistrationModal(), PreRegistrationModalProps (+4 more)

### Community 7 - "Profile & Portfolio"
Cohesion: 0.15
Nodes (12): EgressInventoryModal(), EgressInventoryModalProps, ProfilePage(), PlayerCardProps, TCGStat, PortfolioStats(), PortfolioStatsProps, CollectionItem (+4 more)

### Community 8 - "Product Admin & Import"
Cohesion: 0.15
Nodes (13): AddProductDrawer(), AddProductDrawerProps, CardPrinting, ImportInventoryModal(), ImportInventoryModalProps, InventoryItem, InventoryPage(), SortField (+5 more)

## Knowledge Gaps
- **65 isolated node(s):** `AddAccessoryDrawerProps`, `AddProductDrawerProps`, `CardPrinting`, `BulkImageUploadModalProps`, `UploadItem` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Admin Dashboard & Orders` to `Card Catalog & UI Components`, `Cart & Auth Context`, `Profile & Portfolio`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `useCart()` connect `Cart & Auth Context` to `Product Admin & Import`, `Admin Dashboard & Orders`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Footer()` connect `Icons, Help & Pre-Registration` to `Card Catalog & UI Components`, `Cart & Auth Context`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **What connects `AddAccessoryDrawerProps`, `AddProductDrawerProps`, `CardPrinting` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Banners, Events & Games` be split into smaller, more focused modules?**
  _Cohesion score 0.061683599419448475 - nodes in this community are weakly interconnected._
- **Should `Admin Dashboard & Orders` be split into smaller, more focused modules?**
  _Cohesion score 0.07149758454106281 - nodes in this community are weakly interconnected._
- **Should `Card Catalog & UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.0696969696969697 - nodes in this community are weakly interconnected._