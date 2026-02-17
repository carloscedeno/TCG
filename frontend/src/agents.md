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

**Solution** (2026-02-16 - Final):

```tsx
// ❌ WRONG: Not handling state change or ignoring previous versions
const loadCardDetails = async (id: string) => {
  const data = await fetchCardDetails(id);
  setDetails(data); // If data has no .all_versions, the menu DISAPPEARS!
};

// ✅ CORRECT: Preserve versions in state if the card is the same (oracle_id)
const loadCardDetails = async (id: string) => {
  const data = await fetchCardDetails(id);
  
  // PRESERVE VERSIONS: If new data has no versions but old state had them for same card_id
  if ((!data.all_versions || data.all_versions.length <= 1) && details?.all_versions) {
    if (details.card_id === data.card_id) {
      data.all_versions = details.all_versions; // KEEP THE LIST
    }
  }
  setDetails(data);
};
```

**TypeScript Safety**:

- NEVER use implicit `any` in API callbacks (e.g., `.map(v => ...)`). ALWAYS use `.map((v: any) => ...)`.
- Implicit `any` errors kill the CI/CD pipeline, even if `npm run dev` works.

**Key Principles**:

1. **State Persistence**: CardModal must bridge data gaps. If a version switch returns a "slim" card object, the UI must manually re-attach the previous `all_versions` list to prevent the navigation menu from vanishing.
2. **Printing vs. Oracle Identity**:
   - `printing_id`: Specific version (e.g., 2X2-1). Use for loading images/prices.
   - `card_id` (Oracle ID): The base card. Use to link all printings together in the versions list.
3. **CI/CD Build Check**: Before pushing any refactor of `api.ts` or `CardModal.tsx`, manually run `npm run build` in the `frontend` directory to catch silent TS errors.
4. **Layout**: Controlled flex with guaranteed minimums (35% height / 200px min-h) for the versions list prevents crushing by oversized images.

**Validation Checklist**:

- [ ] Click through at least 3 alternative versions in the Modal.
- [ ] Verify image, set code, and price update for each click.
- [ ] Verify the versions list remains visible and scrollable after click.
- [ ] Run `npm run build` locally before pushing.

**Files Affected**:

- `frontend/src/components/Card/CardModal.tsx`
- `frontend/src/utils/api.ts`

**Reference**: See `docs/PRD_Mejoras_Visuales_y_Funcionales_Web.md` Section 3.4 for full specification.

## 🛑 Known Issues

- Frontend unit tests failing (CardGrid.test.tsx) - needs investigation
- `oracle_text` empty for some cards in database (data quality issue)

## 🏗 Local Conventions

- Use TailwindCSS utility classes.
- Lucide React for icons.
- Always run `npm run build` to verify TS safety.
- Always verify deduplication logic with cards that have multiple printings.
