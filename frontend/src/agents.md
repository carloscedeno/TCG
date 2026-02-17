# 🧠 Agent Memory: frontend/src

## 📌 Critical Lessons

### 2026-02-01: Card Deduplication & Price Display

**CRITICAL**: The grid MUST show only ONE card per unique card name (latest printing).

**Problem**: Grid was showing multiple copies of the same card (different editions/sets).

**Root Cause**:

- API deduplication logic used a simple `Set` that skipped duplicates
- Did NOT guarantee which printing was kept (first seen vs. latest)
- Did NOT compare `release_date` to determine the most recent edition

**Solution** (Commit 9553131):

```typescript
// ❌ WRONG: Simple Set-based deduplication
const seenCards = new Set();
if (unique && seenCards.has(cardId)) continue;

// ✅ CORRECT: Map-based deduplication with date comparison
const cardMap = new Map();
for (const item of data) {
  const existing = cardMap.get(cardId);
  if (!existing || (releaseDate && releaseDate > existing.release_date)) {
    cardMap.set(cardId, { item, release_date: releaseDate });
  }
}
```

**Key Principle**:

- **Grid**: Show ONLY the latest printing (highest `release_date`)
- **Modal**: Show ALL printings in dropdown, allow switching
- **Image/Price**: Update dynamically when user selects different edition

### 2026-02-01: Price Display Logic

**CRITICAL**: Prices must follow a specific fallback hierarchy.

**Problem**: Cards showing $0.00 even when prices existed.

**Root Causes**:

1. **Missing Data**: `aggregated_prices` table was empty (needed CardKingdom sync)
2. **Wrong Field**: API returned `total` but frontend expected `total_count`
3. **No Fallback**: No fallback to `store_price` when `market_price` was 0

**Solution** (Commits c1fab06, 8592178):

```typescript
// ✅ CORRECT: Price fallback hierarchy
const marketPrice = item.aggregated_prices?.[0]?.avg_market_price_usd || 0;
const storePrice = product?.price || 0;
const displayPrice = marketPrice || storePrice || 0;

// ✅ CORRECT: API response field
return {
  cards: mappedCards,
  total_count: count,  // NOT 'total'
  offset: offsetVal,
  limit: limitVal
}
```

**Key Principle**:

1. **Priority 1**: `market_price` (from `aggregated_prices`)
2. **Priority 2**: `store_price` (from `products` table)
3. **Priority 3**: Show $0.00 if both are unavailable

**Data Requirements**:

- Run `python scripts/sync_cardkingdom_api.py` to populate `aggregated_prices`
- Ensure `products` table has inventory for store prices

### 2026-02-01: API Deployment Issues

**CRITICAL**: Code changes must be deployed to Supabase Edge Functions.

**Problem**: API was returning wrong structure even after code changes.

**Root Cause**: GitHub Actions workflow requires `SUPABASE_ACCESS_TOKEN` secret.

**Solution**:

1. Verify GitHub Actions has `SUPABASE_ACCESS_TOKEN` in secrets
2. Push changes to `supabase/functions/**` to trigger deployment
3. Wait 2-3 minutes for deployment to complete
4. Test API endpoint directly to verify deployment

**Verification**:

```bash
# Test API version
curl https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/

# Test card endpoint
curl https://sxuotvogwvmxuvwbsscv.supabase.co/functions/v1/tcg-api/api/cards?limit=5
```

### 2026-02-16: CardModal Layout Architecture

**CRITICAL**: The CardModal left column layout MUST follow a specific flex architecture to prevent the "giant image" or "hidden versions list" bug.

**Problem**: Card image was taking all available space, pushing the versions list completely off-screen or making it invisible.

**Root Causes**:

1. **Over-aggressive Stock Filter**: `fetchCardDetails` was filtering out ALL versions without stock, causing "0 Versiones" display
2. **Broken Layout**: Image container used `flex-1` without constraints, allowing it to grow indefinitely
3. **No Minimum Height**: Versions container had no guaranteed minimum space

**Symptoms**:

- Versions list shows "0 Versiones" even when versions exist
- Image is enormous and versions list is invisible/cut off
- Layout "estaba bien" but broke after changes

**Solution** (2026-02-16):

```tsx
// ❌ WRONG: Uncontrolled flex-1 allows image to dominate
<div className="flex-1 min-h-[300px] ...">
  {/* Image */}
</div>
<div className="md:h-[240px] ...">
  {/* Versions - can be crushed */}
</div>

// ✅ CORRECT: Controlled flex with guaranteed minimums
<div className="flex-[1_1_0%] min-h-[300px] md:min-h-0 relative ...">
  {/* Image - can shrink to 0 if needed */}
</div>
<div className="h-auto max-h-[180px] md:h-[35%] md:min-h-[200px] shrink-0 ...">
  {/* Versions - GUARANTEED at least 200px on desktop */}
</div>
```

**API Fix** (`utils/api.ts`):

```typescript
// ❌ WRONG: Filter out versions without stock
const versionsWithStock = (versionsData || [])
  .filter((v: any) => stockMap.has(v.printing_id))  // ← REMOVES versions!
  .map(...)

// ✅ CORRECT: Show all versions, mark stock as 0 if unavailable
const versionsWithStock = (versionsData || [])
  .map((v: any) => {
    const product = stockMap.get(v.printing_id);
    return {
      ...v,
      stock: product?.stock || 0,  // ← Default to 0, don't hide
      price: product?.price || v.aggregated_prices?.[0]?.avg_market_price_usd || 0
    };
  });
```

**Key Principles**:

1. **Image Container**:
   - Use `flex-[1_1_0%]` (can grow, can shrink, basis 0)
   - MUST have `min-h-0` to allow shrinking below content size
   - Use `relative` positioning for absolute children

2. **Versions Container**:
   - Use percentage height `h-[35%]` for flexibility
   - MUST have `min-h-[200px]` to guarantee visibility
   - MUST have `shrink-0` to prevent being crushed by image
   - Inner content MUST be `overflow-y-auto`

3. **Data Layer**:
   - NEVER filter out versions based on stock availability
   - Always show all versions with `stock: 0` for out-of-stock items
   - Provide safe defaults for `set_code`, `set_name` to prevent crashes

**Validation Checklist**:

- [ ] Test with cards with many versions (Dark Ritual: 47 versions, Boomerang)
- [ ] Test with cards with few versions (1-2 versions)
- [ ] Verify versions list is scrollable
- [ ] Verify image doesn't push content off-screen
- [ ] Verify "X Versiones" counter shows correct number
- [ ] Verify out-of-stock versions show "Stock: 0" but are still visible

**Files Affected**:

- `frontend/src/components/Card/CardModal.tsx` (lines 217, 248)
- `frontend/src/utils/api.ts` (lines 261-277, 337-345)

**Reference**: See `docs/PRD_Mejoras_Visuales_y_Funcionales_Web.md` Section 3.4 for full specification.

## 🛑 Known Issues

- Frontend unit tests failing (CardGrid.test.tsx) - needs investigation
- `oracle_text` empty for some cards in database (data quality issue)

## 🏗 Local Conventions

- Use TailwindCSS utility classes.
- Lucide React for icons.
- Always test API changes with `python tests/verify_supabase_functions.py`
- Always verify deduplication logic with cards that have multiple printings
