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

## 🛑 Known Issues

- Frontend unit tests failing (CardGrid.test.tsx) - needs investigation
- `oracle_text` empty for some cards in database (data quality issue)

## 🏗 Local Conventions

- Use TailwindCSS utility classes.
- Lucide React for icons.
- Always test API changes with `python tests/verify_supabase_functions.py`
- Always verify deduplication logic with cards that have multiple printings
