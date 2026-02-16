# PRD: Comprehensive Data Ingestion & Missing Set Recovery

## 1. Problem Statement

Users are experiencing "missed loads" where cards that validly exist in Scryfall and Card Kingdom fail to import into the system. Error logs show cards like `1 Martyr of Dusk (LCC) 132`, where `LCC` is the set code for *Lost Caverns of Ixalan Commander*.

Investigation reveals that these sets are missing from the `sets` database table. The root cause is the `load_mtgs_sets_from_scryfall.py` script which explicitly filters out sets that have a `parent_set_code` (child sets), erroneously excluding legitimate expansion subsets like Commander decks.

## 2. Objective

To ensure 100% coverage of valid Magic: The Gathering sets in the database, enabling the successful import of all cards, including those from Commander decks, special guests, and other child sets.

## 3. Scope

- **Backend (Python/Supabase)**: Modify data ingestion scripts to include child sets.
- **Data Recovery**: Run a full sync to populate missing sets and their cards.
- **Observability**: Enhance error reporting to clearly indicate "Set Not Found" vs "Card Not Found".

## 4. Technical Requirements

### 4.1. Update Set Loader Logic

The script `data/loaders/load_mtgs_sets_from_scryfall.py` currently contains:

```python
# Filtrar solo sets principales (sin parent_set_code)
mtg_sets = [s for s in all_sets if s.get('parent_set_code') is None]
```

**Required Change**:
Remove this filter or adjust it to only exclude non-playable types (e.g., `memorabilia`, `token`) if necessary.
The new logic should allow sets where `set_type` include `commander`, `expansion`, `core`, `masters`, `draft_innovation`, `funny`, `starter`, `box`, `promo`, etc.

### 4.2. Verify & Backfill Data

Once the loader is updated:

1. Run `load_mtgs_sets_from_scryfall.py` to insert the missing sets (e.g., `LCC`).
2. Run `load_mtgs_cards_from_scryfall.py` (or equivalent) to fetch cards for these newly added sets.
3. Verify specific missing cards (e.g., `Martyr of Dusk (LCC)`) exist in the DB.

### 4.3. Targeted Set Sync Tool

Create a new utility script `data/loaders/sync_set.py` that accepts a set code (e.g., `LCC`) as an argument.
This script will:

1. Fetch the specific set metadata from Scryfall.
2. Insert/Upsert it into the `sets` table.
3. Immediately fetch and insert all cards for that set.
This avoids the need for a time-consuming `--full` sync of the entire database when only one set is missing.

### 4.4. On-Demand Sync (Optional / Phase 2)

Implement a mechanic where if an import encounters an unknown set code:

1. The backend checks Scryfall for that specific code.
2. If valid, it inserts the set and queues a card fetch for that set.
3. The import is retried or the user is notified to retry after sync.

## 5. Acceptance Criteria

1. **Set Existence**: The `sets` table must contain `LCC` (Lost Caverns of Ixalan Commander) and other child sets.
2. **Card Existence**: Querying for `Martyr of Dusk` with set code `LCC` and collector number `132` in the `card_printings` table returns a valid result.
3. **Import Success**: The file `failed_import_rows_2026-02-12 (1).txt` can be re-imported without errors.

## 6. Implementation Plan

1. **Modify Script**: Edit `data/loaders/load_mtgs_sets_from_scryfall.py`.
2. **Exec Sync**: Run the set loader locally to update the DB.
3. **Exec Card Load**: Run the card loader for the new sets.
4. **Verify**: Use the `verify_missing_card.py` script to confirm existence.
5. **Re-test Import**: Attempt to import the previously failed rows.
