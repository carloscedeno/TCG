# Graph Report - frontend\src  (2026-07-03)

## Corpus Check
- 98 files · ~114,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 391 nodes · 719 edges · 24 communities (22 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `76081e27`
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
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 43 edges
2. `useCart()` - 19 edges
3. `CartDrawer()` - 8 edges
4. `CardProps` - 7 edges
5. `Footer()` - 7 edges
6. `Header()` - 7 edges
7. `fetchCart()` - 6 edges
8. `UserMenu()` - 5 edges
9. `BulkImport()` - 5 edges
10. `getApiUrl()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `GlobalAuthModal()` --calls--> `useAuth()`  [EXTRACTED]
  App.tsx → context/AuthContext.tsx
- `OrdersList()` --calls--> `useAuth()`  [EXTRACTED]
  components/Profile/OrdersList.tsx → context/AuthContext.tsx
- `AdminDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  pages/Admin/AdminDashboard.tsx → context/AuthContext.tsx
- `OrdersPage()` --calls--> `useAuth()`  [EXTRACTED]
  pages/Admin/OrdersPage.tsx → context/AuthContext.tsx
- `Home()` --calls--> `useAuth()`  [EXTRACTED]
  pages/Home.tsx → context/AuthContext.tsx

## Import Cycles
- None detected.

## Communities (24 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (42): Banner, Event, GAME_OPTIONS, Presale, Banner, Game, RegistrationsModal(), RegistrationsModalProps (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (39): PosSessionBanner(), BulkImport(), useAuth(), CartContext, CartContextType, CartItem, CartProvider(), useCart() (+31 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (35): Card, CardFace, CardProps, CardGrid(), CardGridProps, CardImage(), CardImageProps, Filters (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (33): AdminDashboard, AdminRankingsPage, BannersPage, CardDetail, CatalogPage, CategoriesPage, CheckoutPage, CheckoutSuccessPage (+25 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (22): AddProductDrawer(), AddProductDrawerProps, CardPrinting, EgressInventoryModal(), EgressInventoryModalProps, ImportInventoryModal(), ImportInventoryModalProps, InventoryItem (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (16): AddAccessoryDrawer(), AddAccessoryDrawerProps, BulkImageUploadModalProps, UploadItem, BulkImportCatalogModal(), BulkImportCatalogModalProps, EditProductModal(), EditProductModalProps (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (10): DiscoveryIcon(), PactIcon(), PreparationIcon(), SelectionIcon(), VideoPlaceholder(), HelpSection(), Footer(), RankingCategory (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (8): AuthContext, AuthContextType, AuthProvider(), CreditHistoryList(), InventoryMovements(), Movement, MyMissionsList(), fetchUserMissions()

### Community 8 - "Community 8"
Cohesion: 0.19
Nodes (7): RankingSeason, PlayerRanking, RankingCategory, RankingSeasonManagerProps, RankingTier, PlayerRanking, RankingWidgetProps

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (6): AdminDashboard(), CloudflareAnalytics(), CloudflareStats, Job, PriceChange, PriceUpdateHistory()

### Community 10 - "Community 10"
Cohesion: 0.31
Nodes (4): CartManager(), ManageCreditsModal(), ManageCreditsModalProps, UserCreditsManager()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (8): 2026-02-01: API Deployment Issues, 2026-02-01: Card Deduplication & Price Display, 2026-02-01: Price Display Logic, 2026-02-16: CardModal Layout Architecture, 🧠 Agent Memory: frontend/src, 📌 Critical Lessons, 🛑 Known Issues, 🏗 Local Conventions

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (5): PlayerHistoryEntry, PlayerHistoryModal(), PlayerHistoryModalProps, PlayerRankingsList(), PlayerRankingsListProps

### Community 13 - "Community 13"
Cohesion: 0.47
Nodes (3): Category, CategoryModal(), Props

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (4): Order, ORDER_STATUSES, OrderItem, OrdersPage()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (5): ProfileSettingsModal(), ProfileSettingsModalProps, sendPasswordResetEmail(), updateUserPassword(), uploadUserAvatar()

### Community 16 - "Community 16"
Cohesion: 0.40
Nodes (4): Order, ORDER_STATUS_CONFIG, OrderItem, OrdersList()

## Knowledge Gaps
- **113 isolated node(s):** `Profile`, `TournamentHub`, `AdminDashboard`, `ImportCollection`, `InventoryPage` (+108 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Community 1` to `Community 2`, `Community 3`, `Community 4`, `Community 7`, `Community 9`, `Community 14`, `Community 15`, `Community 16`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `Footer()` connect `Community 6` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `useCart()` connect `Community 1` to `Community 10`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `Profile`, `TournamentHub`, `AdminDashboard` to the rest of the system?**
  _113 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.056107539450613676 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06936026936026936 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06567992599444958 - nodes in this community are weakly interconnected._