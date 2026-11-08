# Graph Report - frontend\src  (2026-09-02)

## Corpus Check
- 103 files · ~98,260 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 431 nodes · 780 edges · 25 communities (24 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `692bb4e2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 47 edges
2. `useCart()` - 19 edges
3. `CartDrawer()` - 8 edges
4. `CardProps` - 7 edges
5. `Footer()` - 7 edges
6. `Header()` - 7 edges
7. `fetchCart()` - 6 edges
8. `ChunkErrorBoundary` - 5 edges
9. `UserMenu()` - 5 edges
10. `BulkImport()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `OrdersList()` --calls--> `useAuth()`  [EXTRACTED]
  components/Profile/OrdersList.tsx → context/AuthContext.tsx
- `AdminDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  pages/Admin/AdminDashboard.tsx → context/AuthContext.tsx
- `OrdersPage()` --calls--> `useAuth()`  [EXTRACTED]
  pages/Admin/OrdersPage.tsx → context/AuthContext.tsx
- `Home()` --calls--> `useAuth()`  [EXTRACTED]
  pages/Home.tsx → context/AuthContext.tsx
- `GlobalAuthModal()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (25 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (46): Banner, BulkRarityOfferModal(), BulkRarityOfferModalProps, Event, GAME_OPTIONS, Presale, Banner, Game (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (8): CartContext, CartContextType, CartItem, CartProvider(), clearActiveCart(), createNamedCart(), listUserCarts(), switchActiveCart()

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (35): Card, CardFace, CardProps, CardGrid(), CardGridProps, CardImage(), CardImageProps, Filters (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (35): AdminDashboard, AdminRankingsPage, BannersPage, CardDetail, CatalogPage, CategoriesPage, CheckoutPage, CheckoutSuccessPage (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (23): AddProductDrawer(), AddProductDrawerProps, CardPrinting, BulkImportCatalogModalProps, EgressInventoryModal(), EgressInventoryModalProps, ImportInventoryModal(), ImportInventoryModalProps (+15 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (15): AddAccessoryDrawer(), AddAccessoryDrawerProps, BulkImageUploadModalProps, UploadItem, BulkImportCatalogModal(), EditProductModal(), EditProductModalProps, StorageFile (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.07
Nodes (26): DiscoveryIcon(), PactIcon(), PreparationIcon(), SelectionIcon(), VideoPlaceholder(), HelpSection(), ManaText(), ManaTextProps (+18 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (10): CreditHistoryList(), DebtItem, DebtsList(), DebtsListProps, InventoryMovements(), Movement, MyMissionsList(), PlayerCardProps (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (12): RankingSeason, PlayerHistoryEntry, PlayerHistoryModal(), PlayerHistoryModalProps, PlayerRanking, RankingCategory, RankingSeasonManagerProps, RankingTier (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (12): InventoryPage(), PosSessionBanner(), GlobalAuthModal(), useAuth(), useCart(), BottomNav(), MobileMenuDrawer(), MobileMenuDrawerProps (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (4): CartManager(), ManageCreditsModal(), ManageCreditsModalProps, UserCreditsManager()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (8): 2026-02-01: API Deployment Issues, 2026-02-01: Card Deduplication & Price Display, 2026-02-01: Price Display Logic, 2026-02-16: CardModal Layout Architecture, 🧠 Agent Memory: frontend/src, 📌 Critical Lessons, 🛑 Known Issues, 🏗 Local Conventions

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (6): AdminDashboard(), CloudflareAnalytics(), CloudflareStats, Job, PriceChange, PriceUpdateHistory()

### Community 13 - "Community 13"
Cohesion: 0.47
Nodes (3): Category, CategoryModal(), Props

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (12): initialState, Theme, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState, useTheme(), HeaderProps (+4 more)

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (3): AuthContext, AuthContextType, AuthProvider()

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (5): QuickStockItem(), QuickStockItemProps, InventoryItem, QuickStockPanel(), addToCart()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (4): Order, ORDER_STATUSES, OrderItem, OrdersPage()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (5): ProfileSettingsModal(), ProfileSettingsModalProps, sendPasswordResetEmail(), updateUserPassword(), uploadUserAvatar()

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (10): CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums, Json, Tables (+2 more)

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (4): Order, ORDER_STATUS_CONFIG, OrderItem, OrdersList()

## Knowledge Gaps
- **134 isolated node(s):** `Profile`, `TournamentHub`, `AdminDashboard`, `ImportCollection`, `InventoryPage` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 9` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 12`, `Community 14`, `Community 15`, `Community 17`, `Community 18`, `Community 24`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `Footer()` connect `Community 6` to `Community 2`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `Profile`, `TournamentHub`, `AdminDashboard` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05325140809011777 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06567992599444958 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.04698581560283688 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.08199643493761141 - nodes in this community are weakly interconnected._