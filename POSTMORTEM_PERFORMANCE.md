# Post-Mortem: Incident 500-TIMEOUT-SEARCH (2026-02-06)

**Severity**: Critical (High Impact on UX)
**Component**: Search API / Database
**Status**: Resolved

## 🔴 The Issue

Users experienced persistent `500 Internal Server Error` (Statement Timeout) when loading the main page or searching for cards.

### Symptoms

- Initial page load failed or took >15s.
- "Canceling statement due to statement timeout" in logs.
- Search requests piled up (debounce issue compounded).

### Root Cause

The SQL query for fetching unique cards (`get_unique_cards_optimized`) was using a dynamic `DISTINCT ON (card_name)` approach over a large dataset (80k+ rows) with complex JOINs (Prices, Sets, Products).

Even with proper indices, the `DISTINCT ON` operation required scanning a large portion of the `cards` table and sorting it to find the "latest" printing for every single card before applying `LIMIT 50`. This operation often exceeded the default API timeout (2s-10s) when the database cache was cold or under load.

Row Level Security (RLS) checks on 80k rows further degraded performance.

## 🟡 Attempts & Failures

1. **Attempt 1**: Add Indexes (`idx_cards_card_name`, `idx_sets_release_date`).
    - **Result**: Query plan improved (Index Scan), but still timed out in production.
2. **Attempt 2**: Remove CTE (`WITH` clause) to allow predicate pushdown.
    - **Result**: Query became faster (~150ms in explain), but still timed out intermittently.
3. **Attempt 3**: `SECURITY DEFINER` to bypass RLS.
    - **Result**: Reduced overhead, but the fundamental complexity of Deduplication + Sorting + Joining remained too high for real-time response.

## 🟢 The Solution (Definitive)

**Materialized View Strategy.**

We replaced the dynamic calculation with a pre-calculated **Materialized View** (`mv_unique_cards`).

1. **Storage**: The heavy lifting (Joins, Deduplication, Sorting) is done ONCE during view creation/refresh.
2. **Access**: The API now reads from `mv_unique_cards` as if it were a simple table.
3. **Performance Check**: Response time dropped from >10s (timeout) to <50ms.

## 🛡️ Prevention (New Standards)

To prevent recurrence, the following rules (added to **LEYES DEL SISTEMA**) apply:

1. **Heavy Read Rule**: Any query requiring `DISTINCT ON` or Aggregation over the main entity table (`cards`, `products`) for the primary UI view MUST use a **Materialized View**.
2. **Index Mandate**: New queries cannot be merged without explicit `CREATE INDEX` statements for their filter/sort columns.
3. **RLS Bypass**: Public read-only functions performing heavy scans should use `SECURITY DEFINER` if safe.

## Action Items

- [x] Create `mv_unique_cards`.
- [x] Update RPC function to use MV.
- [x] Update `LEYES_DEL_SISTEMA.md`.
- [ ] Schedule regular `REFRESH MATERIALIZED VIEW` (via pg_cron or Edge Function).

---

**Signed**: Antigravity Agent
**Date**: 2026-02-06
