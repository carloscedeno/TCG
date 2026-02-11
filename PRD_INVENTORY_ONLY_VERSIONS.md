# PRD: Inventory-Only Card Versions Display

**Version:** 1.0  
**Date:** 2026-02-11  
**Status:** Draft  
**Priority:** High  

---

## 1. Executive Summary

### Problem Statement

Currently, the "Stock Geekorium" section shows all card versions (printings) regardless of inventory availability. This creates confusion when users see versions with "STOCK: 0" and cannot add them to their cart. The card modal displays all printings of a card, including those not in inventory, leading to a poor user experience.

### Solution Overview

Filter the card versions display to show **only** versions that exist in the `products` table with `stock > 0`. This applies to:

- The card modal's "Edición / Impresiones" section
- Any inventory-related views in the Geekorium stock section

### Success Metrics

- Users only see versions they can actually purchase
- Reduced confusion and failed add-to-cart attempts
- Improved conversion rate in the Geekorium section
- Clearer stock visibility

---

## 2. User Stories

### US-1: View Available Versions Only

**As a** customer browsing the Geekorium inventory  
**I want to** see only the card versions that are in stock  
**So that** I don't waste time looking at unavailable versions

**Acceptance Criteria:**

- ✅ Card modal shows only versions with `stock > 0`
- ✅ Each version displays the exact stock quantity
- ✅ Versions with `stock = 0` are completely hidden
- ✅ If no versions are in stock, show a clear message

### US-2: Stock Quantity Visibility

**As a** customer viewing card details  
**I want to** see the exact stock quantity for each version  
**So that** I know how many copies are available

**Acceptance Criteria:**

- ✅ Stock count is prominently displayed for each version
- ✅ Stock indicator uses clear visual design (color coding)
- ✅ Low stock (1-3 items) shows a warning indicator

### US-3: Geekorium Section Filtering

**As a** customer in the "Stock Geekorium" tab  
**I want to** see only cards that have at least one version in stock  
**So that** I only browse purchasable items

**Acceptance Criteria:**

- ✅ Cards without any in-stock versions are excluded from results
- ✅ Card count reflects only in-stock items
- ✅ Filters work correctly with stock availability

---

## 3. Technical Specification

### 3.1 Database Changes

**No schema changes required.** The `products` table already has:

- `printing_id` (links to `card_printings`)
- `stock` (integer, current inventory)

### 3.2 Backend Changes

#### Update `fetchCardDetails` API

**File:** `frontend/src/utils/api.ts`

**Current Behavior:**

```typescript
// Fetches ALL versions from card_printings
const { data: versionsData } = await supabase
  .from('card_printings')
  .select('*, sets(*), aggregated_prices(avg_market_price_usd)')
  .eq('card_id', sbData.card_id);
```

**New Behavior:**

```typescript
// Fetch only versions that exist in products with stock > 0
const { data: versionsData } = await supabase
  .from('card_printings')
  .select(`
    *,
    sets(*),
    aggregated_prices(avg_market_price_usd),
    products!inner(id, stock, price)
  `)
  .eq('card_id', sbData.card_id)
  .gt('products.stock', 0);
```

**Response Format:**

```typescript
{
  printing_id: string;
  set_name: string;
  set_code: string;
  collector_number: string;
  rarity: string;
  price: number;
  image_url: string;
  stock: number; // From products table
  product_id: string; // From products table
}
```

### 3.3 Frontend Changes

#### CardModal Component

**File:** `frontend/src/components/Card/CardModal.tsx`

**Changes:**

1. Update version list to show stock from `products` table
2. Add visual indicators for stock levels:
   - **High stock (>10):** Green indicator
   - **Medium stock (4-10):** Yellow indicator
   - **Low stock (1-3):** Red indicator with warning
3. Hide "Add to Cart" button for out-of-stock versions (already implemented)
4. Show "Out of Stock" message if no versions are available

**UI Updates:**

```tsx
{v.stock > 0 ? (
  <div className="flex items-center gap-1">
    <div className={`w-2 h-2 rounded-full ${
      v.stock > 10 ? 'bg-green-500' : 
      v.stock > 3 ? 'bg-yellow-500' : 
      'bg-red-500'
    }`} />
    <span className="text-[8px] font-black text-geeko-cyan uppercase">
      Stock: {v.stock}
    </span>
  </div>
) : null}
```

#### Home/Inventory Page

**File:** `frontend/src/pages/Home.tsx`

**Changes:**

1. When in "Stock Geekorium" tab, filter cards to show only those with `total_stock > 0`
2. Update card count to reflect only in-stock items

### 3.4 RPC Updates (if needed)

**Option 1:** Update `get_unique_cards_optimized` to accept a `stock_filter` parameter

**Option 2:** Create a new RPC `get_inventory_cards` specifically for the Geekorium section

```sql
CREATE OR REPLACE FUNCTION get_inventory_cards(
  search_query TEXT DEFAULT NULL,
  game_ids INTEGER[] DEFAULT NULL,
  rarity_filter TEXT[] DEFAULT NULL,
  set_names TEXT[] DEFAULT NULL,
  color_codes TEXT[] DEFAULT NULL,
  type_filter TEXT[] DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  printing_id UUID,
  card_name TEXT,
  set_name TEXT,
  set_code TEXT,
  image_url TEXT,
  rarity TEXT,
  type_line TEXT,
  colors TEXT[],
  avg_market_price_usd NUMERIC,
  total_stock INTEGER,
  product_id UUID
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (c.card_id)
    cp.printing_id,
    c.card_name,
    s.set_name,
    s.set_code,
    cp.image_url,
    cp.rarity,
    c.type_line,
    c.colors,
    ap.avg_market_price_usd,
    p.stock as total_stock,
    p.id as product_id
  FROM cards c
  JOIN card_printings cp ON c.card_id = cp.card_id
  JOIN sets s ON cp.set_id = s.set_id
  JOIN products p ON cp.printing_id = p.printing_id
  LEFT JOIN aggregated_prices ap ON cp.printing_id = ap.printing_id
  WHERE p.stock > 0
    AND (search_query IS NULL OR c.card_name ILIKE '%' || search_query || '%')
    AND (game_ids IS NULL OR c.game_id = ANY(game_ids))
    AND (rarity_filter IS NULL OR LOWER(cp.rarity) = ANY(rarity_filter))
    AND (set_names IS NULL OR s.set_name = ANY(set_names))
    AND (color_codes IS NULL OR c.colors && color_codes)
    AND (type_filter IS NULL OR c.type_line ILIKE ANY(type_filter))
  ORDER BY c.card_id, s.release_date DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;
```

---

## 4. UI/UX Design

### 4.1 Card Modal - Versions Section

**Before:**

```
EDICIÓN / IMPRESIONES                    3 Versiones

[DSK] Duskmourn: House of Horror         $6.32
      #119 • rare                         STOCK: 0  [🛒]

[DSK] Duskmourn: House of Horror         $6.49
      #294 • rare                         STOCK: 0  [🛒]

[DSK] Duskmourn: House of Horror         $6.31
      #312 • rare                         STOCK: 0  [🛒]
```

**After (with stock):**

```
EDICIÓN / IMPRESIONES                    2 Versiones en Stock

[DSK] Duskmourn: House of Horror         $6.32
      #119 • rare                         🟢 STOCK: 5  [🛒]

[M21] Core Set 2021                      $4.99
      #087 • rare                         🔴 STOCK: 1  [🛒]
```

**After (no stock):**

```
EDICIÓN / IMPRESIONES

⚠️ No hay versiones disponibles en inventario
```

### 4.2 Stock Indicators

- **🟢 Green Dot:** Stock > 10 (plenty available)
- **🟡 Yellow Dot:** Stock 4-10 (limited availability)
- **🔴 Red Dot:** Stock 1-3 (very limited, act fast!)

---

## 5. Implementation Plan

### Phase 1: Backend (1-2 hours)

1. ✅ Update `fetchCardDetails` to join with `products` table
2. ✅ Filter versions where `stock > 0`
3. ✅ Include stock quantity in response
4. ✅ Test API endpoint

### Phase 2: Frontend - Card Modal (1-2 hours)

1. ✅ Update `CardModal.tsx` to display stock from products
2. ✅ Add stock level indicators (color dots)
3. ✅ Hide out-of-stock versions
4. ✅ Show "no stock" message when applicable
5. ✅ Test version display

### Phase 3: Frontend - Inventory Page (1 hour)

1. ✅ Update "Stock Geekorium" tab to filter by stock
2. ✅ Update card count
3. ✅ Test filtering

### Phase 4: Testing & Deployment (1 hour)

1. ✅ E2E tests for inventory filtering
2. ✅ Manual testing of edge cases
3. ✅ Deploy to production

**Total Estimated Time:** 4-6 hours

---

## 6. Testing Strategy

### 6.1 Unit Tests

- Test version filtering logic
- Test stock indicator color logic
- Test empty state handling

### 6.2 Integration Tests

- Test API returns only in-stock versions
- Test card modal displays correct stock counts
- Test inventory page filtering

### 6.3 E2E Tests

```typescript
test('should show only in-stock versions in card modal', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="stock-geekorium-tab"]');
  await page.click('[data-testid="card-item"]:first-child');
  
  // All versions should have stock > 0
  const versions = await page.locator('[data-testid="version-item"]').all();
  for (const version of versions) {
    const stockText = await version.locator('[data-testid="stock-count"]').textContent();
    const stock = parseInt(stockText?.match(/\d+/)?.[0] || '0');
    expect(stock).toBeGreaterThan(0);
  }
});
```

### 6.4 Manual Testing Checklist

- [ ] Card with multiple in-stock versions shows all
- [ ] Card with one in-stock version shows only that one
- [ ] Card with no in-stock versions shows "no stock" message
- [ ] Stock indicators show correct colors
- [ ] Add to cart works for all displayed versions
- [ ] Geekorium tab shows only cards with stock

---

## 7. Edge Cases

### 7.1 Card with No In-Stock Versions

**Scenario:** User clicks on a card that has versions but none in stock  
**Behavior:** Show message "No hay versiones disponibles en inventario"

### 7.2 Stock Changes During Session

**Scenario:** Stock goes to 0 while user is viewing  
**Behavior:** Next refresh will hide the version (acceptable)

### 7.3 Multiple Products for Same Printing

**Scenario:** Same `printing_id` has multiple product entries  
**Behavior:** Sum stock quantities or show highest stock

---

## 8. Future Enhancements

1. **Real-time Stock Updates:** Use Supabase subscriptions to update stock in real-time
2. **Stock Alerts:** Allow users to set alerts when out-of-stock versions come back
3. **Pre-order System:** Allow users to pre-order out-of-stock versions
4. **Stock History:** Show historical stock levels and restock frequency

---

## 9. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance impact from JOIN | Medium | Add index on `products.printing_id` |
| Users confused by missing versions | Low | Clear messaging about stock availability |
| Stock data inconsistency | Medium | Ensure `products` table is kept up-to-date |

---

## 10. Success Criteria

- ✅ 0% of displayed versions have `stock = 0`
- ✅ User feedback indicates less confusion
- ✅ Reduced failed add-to-cart attempts
- ✅ Page load time remains under 2 seconds
- ✅ All E2E tests pass

---

## 11. Rollout Plan

1. **Development:** Implement changes in feature branch
2. **Staging:** Deploy to staging for QA testing
3. **Production:** Deploy during low-traffic hours
4. **Monitoring:** Watch for errors and user feedback
5. **Rollback Plan:** Revert to showing all versions if issues arise

---

**Approved by:** _Pending_  
**Implementation Start:** _TBD_  
**Target Completion:** _TBD_
