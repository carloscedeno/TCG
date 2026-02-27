# Bug Fix Report: Duplicate Keys & Pagination/Filter Race Condition

**Date**: 2026-02-06
**Severity**: High (Caused UI crashes/errors)
**Status**: ✅ Fixed

## 1. Issue Description

When a user performed the following actions, the application crashed or threw "Encountered two children with the same key" errors:

1. Loaded the page (Page 0).
2. Clicked "Load More" (fetching Page 1, appending to list).
3. Changed a filter (e.g., changed 'Rarity' or 'Set').
4. The application would sometimes append the *new filtered results* (Page 0 of new filter) to the *old unfiltered results*, or worse, trigger a race condition where `page` wasn't reset fast enough, causing the API to fetch "Page 1 of New Filter" and append it, leading to potential duplicates if the same cards appeared in both sets (or just logic errors).

The React error `Encountered two children with the same key` confirmed that we were attempting to render a list where the same `card_id` appeared multiple times.

## 2. Root Analyst

### 2.1 State Synchronization Lag

The `page` state was being reset in a `useEffect` that depended on `filters`. However, other `useEffect`s responsible for fetching data might trigger *before* the page reset took effect or were using stale state closures.

### 2.2 Append Logic

The `fetchData` function was designed to *always append* results when `offset > 0`. If the `page` wasn't reset to `0` *immediately* upon filter change, the first fetch for the new filter might happen with `page > 0`, or a race condition would cause an append of new results to the old list.

## 3. Solution Implemented

### 3.1 Immediate State Reset (`handle[Filter]Change`)

Instead of relying on `useEffect` to reactively reset the page (which introduces a render cycle delay), I implemented dedicated handler functions that update both the filter state AND the page state in a single synchronous operation/batch.

```typescript
// Old way (Passive)
useEffect(() => setPage(0), [filters]);

// New way (Active/Immediate)
const handleFilterChange = (newFilters) => {
  setFilters(newFilters);
  setPage(0); // Immediate reset
};
```

This ensures that by the time the `useEffect` for fetching data runs, `page` is universally known to be `0`.

### 3.2 Duplicate Protection (Safety Net)

I added a filtering step in the `setCards` state updater to ensure that even if the API returns a card that is already in the list (e.g., due to a bizarre data consistency issue or race condition), it is filtered out before being added to the state.

```typescript
setCards(prev => {
  const existingIds = new Set(prev.map(c => c.card_id));
  const newCards = result.cards.filter(c => !existingIds.has(c.card_id));
  return [...prev, ...newCards];
});
```

### 3.3 Debounce Optimization

Updated the search debounce logic to also reset the page immediately when the debounced query updates.

## 4. Files Modified

- `frontend/src/pages/Home.tsx`:
  - Removed passive `useEffect` for page reset.
  - Added `handleFilterChange`, `handleRarityChange`, `handleSortChange`, `handleTabChange`.
  - Updated `fetchData` to include duplicate filtering.
  - Updated UI elements (Search, Filters, Sort, Mobile Drawer) to use these new handlers.

## 5. Verification

- **Test**: Load Page -> Load More -> Change Filter.
- **Result**: Grid clears immediately, new results load from Page 0. No duplicate key errors.
- **Test**: Search "Sol Ring" -> Clear Search.
- **Result**: Grid resets to full list (Page 0). No errors.
