# Incident Report: Nesting Sort Failure in PostgREST

## 🛑 The Bug

When attempting to sort the "Knowledge base" (Oracle Search) by `release_date`, the API returned a 500 error:
`{"detail":"{'message': '\"failed to parse order (card_printings.sets.release_date)\", expected \"asc\", \"desc\", \"nullsfirst\" or \"nullslast\"'}"}`

## 🔍 Root Cause Analysis

Our data model is: `cards` (1) -> `card_printings` (N) -> `sets` (1).

1. The `CardService` queries the `cards` table as the root.
2. It attempts to order by a field located two levels deep: `card_printings -> sets -> release_date`.
3. **PostgREST Limitation**: You cannot use the `order` parameter on the root table to reference fields in a nested join that is not part of the primary select or is deep in a One-to-Many relationship without specific SQL views or computed columns.

## 🛠️ Solution Implemented

1. **Short-term**: Added a safety check in `CardService`. If `sort=release_date` is requested, the system falls back to `name` or an optimized query if available, preventing the crash.
2. **Long-term recommendation**:
    - Create a Database View `cards_with_latest_release` that flattens this hierarchy.
    - Or add a `latest_release_date` column directly to the `cards` table, updated via a trigger whenever a new printing is added.

## ✅ Verification

Tested with `curl.exe "http://127.0.0.1:8000/api/cards?sort=release_date&limit=1"`
Before: 500 Error.
After: 200 OK (Falls back to name sorting safely).

---
**Date**: 2026-01-25
**Module**: `src/api/services/card_service.py`
