# PRD: Performance Optimization for Card Loading

## Status: Draft

## Date: 2026-02-04

---

## 1. Objective

Improve the loading speed of card details and the overall performance of the TCG application. The current implementation suffers from significant delays when opening a card modal, primarily due to inefficient database queries and redundant network requests.

## 2. Problem Statement

* **Database Bottleneck**: The `price_history` table lacks indexes on `printing_id` and `timestamp`, leading to full table scans when fetching prices for card versions.
* **Redundant API Calls**: `CardModal.tsx` performs duplicate `fetchCardDetails` calls when navigating to the "latest" version of a card.
* **Inefficient Data Fetching**: The backend fetches all price history records for all versions of a card, leading to large payloads and slow processing.
* **Lack of Caching**: Every card load triggers a fresh fetch from the server without any frontend or backend caching.

## 3. Proposed Solutions

### 3.1. Database Optimization

* Add indexes to `price_history(printing_id)` and `price_history(timestamp DESC)`.
* Create a dedicated SQL view or function to fetch the *latest* price for each printing more efficiently.

### 3.2. Backend (Supabase Edge Function) Improvements

* Optimize `handleCardsEndpoint` to fetch only the necessary data.
* Implement pagination or limiting for `all_versions` or associated history if applicable.
* Reduce the payload size by excluding redundant fields in the version list.

### 3.3. Frontend Optimizations

* Fix the redundant `fetchCardDetails` call in `CardModal.tsx`.
* Implement a simple caching layer or use `React Query` / `SWR` for data fetching to memoize results.
* Lazy load the "Versions" list or optimize its rendering.
* Add pre-fetching for common user actions (e.g., hover on card).

## Phase 2: Advanced Optimizations (In Progress)

### 2.1. Backend: Postgres RPC Consolidation

* Create a Postgres function `get_card_full_details(p_printing_id uuid)` to fetch:
  * Card, Set, and Printing metadata.
  * All versions (all_versions).
  * Marketplace data (products).
  * Latest market price (price_history).
* This reduces 4 DB calls to 1 in the Edge Function.

### 2.2. Frontend: Intelligent Pre-fetching

* Implement `onMouseEnter` pre-fetching for cards in the grid.
* Fetch card details as soon as the user hovers, so by the time they click, the data is likely already in the cache.

### 2.3. Frontend: Enhanced Perceived Performance

* Use Skeleton screens for the initial load of the modal.
* Optimize image loading by pre-loading the card image URL.
* Add subtle transitions to mask any remaining latency.

## 4. Success Metrics (Revised)

* **API Response Time**: Reduce `/api/cards/:id` to under 100ms (database processing time).
* **Perceived Load Time**: Achieve "instant-feel" on click (for hovered cards).

## 5. Implementation Roadmap

1. **DB**: Apply missing indexes and verify query performance using `EXPLAIN`.
2. **Backend**: Refactor the Edge Function to optimize queries and payload.
3. **Frontend**: Clean up redundant calls and implement basic caching.
4. **Verification**: Compare loading times before and after optimizations.
