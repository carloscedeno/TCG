# CardKingdom Integration Guide

## Overview
The GeekoSystem integrates **CardKingdom** as the primary external market reference for the **Two-Factor Valuation** system. This allows users to compare their collection's value against both internal store prices (Geekorium) and live market data (CardKingdom).

---

## Architecture

### 1. Data Sources
- **Geekorium Store Prices**: Internal benchmark prices managed via bulk import.
- **CardKingdom Market Prices**: External market data fetched via CardKingdom API v2.

### 2. Database Schema
The `price_history` table stores all price data with the following key fields:
- `printing_id`: Links to the specific card printing.
- `source_id`: References `price_sources` table (e.g., `21` for CardKingdom).
- `price_usd`: The price in USD.
- `url`: Direct link to the product on the marketplace (e.g., CardKingdom product page).
- `is_foil`: Boolean indicating foil variant.
- `stock_quantity`: Available stock (if provided by the source).

**Required Migration**: The `url` column was added to support direct marketplace links. See `REQUIRED_SQL_UPDATE.md`.

---

## Integration Flow

### Step 1: Fetch CardKingdom Pricelist
The `CardKingdomAPI` client downloads the full pricelist from CardKingdom's public API:
```python
from scrapers.cardkingdom_api import CardKingdomAPI

ck_client = CardKingdomAPI()
pricelist = ck_client.fetch_full_pricelist()
```

**Features**:
- **Local Caching**: Pricelist is cached for 24 hours to reduce API calls.
- **Scryfall ID Matching**: Uses Scryfall IDs for accurate card matching.

### Step 2: Match Cards in Database
The system queries the `card_printings` table for cards with `scryfall_id`:
```python
db_cards = supabase.table('card_printings').select(
    'printing_id, scryfall_id'
).not_.is_('scryfall_id', 'null').limit(100).execute().data
```

### Step 3: Update Price History
For each matched card, the system inserts a new price entry:
```python
price_entry = {
    "printing_id": db_card['printing_id'],
    "source_id": ck_source_id,  # CardKingdom source ID
    "price_usd": match['price_retail'],
    "url": match.get('url'),  # Direct product link
    "is_foil": match.get('is_foil', False),
    "stock_quantity": match.get('qty_retail', 0)
}
supabase.table('price_history').insert(price_entry).execute()
```

---

## Two-Factor Valuation Logic

### Backend (`ValuationService`)
The `get_two_factor_valuation` method calculates:
1. **Store Price**: Latest price from source `geekorium`.
2. **Market Price**: Latest price from source `cardkingdom`.
3. **Valuation Average**: `(store_price + market_price) / 2`.

**Batch Optimization**: The `get_batch_valuations` method eliminates N+1 queries when loading large collections.

### Frontend (`PortfolioStats`)
The dashboard displays:
- **Global Total**: Average valuation across the entire collection.
- **Store Value**: Total value based on Geekorium prices.
- **Market Value**: Total value based on CardKingdom prices.
- **Top Gainers**: Cards with the highest profit potential (valuation vs. purchase price).

---

## Running the Sync

### Via Admin Dashboard
1. Navigate to `/admin` in the frontend.
2. Click **"Run CardKingdom Sync"**.
3. Monitor progress in the **GeekoSystem Terminal**.

### Via CLI
```bash
python scripts/market_sync.py
```

### Via API
```bash
POST /api/admin/run-scraper
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "source": "cardkingdom"
}
```

---

## Performance Considerations

### Batch Size
- Default: 100 cards per sync.
- Adjustable via `limit()` parameter in the query.

### Caching
- CardKingdom pricelist is cached locally for 24 hours.
- Cache location: `data/cache/ck_pricelist.json`.

### Rate Limiting
- CardKingdom API has no strict rate limits for the pricelist endpoint.
- However, we implement a 1-second delay between individual scrapes (if using the scraper fallback).

---

## Troubleshooting

### No Prices Updated
**Cause**: Cards in the database may not have `scryfall_id` populated.
**Solution**: Ensure the Scryfall sync has been run for MTG cards.

### URL Column Error
**Cause**: The `url` column does not exist in `price_history`.
**Solution**: Run the SQL migration in `REQUIRED_SQL_UPDATE.md`.

### API Rate Limit (429)
**Cause**: Too many requests to CardKingdom API.
**Solution**: The system will use the local cache if available. Wait 24 hours or clear the cache to force a fresh download.

---

## Future Enhancements
- [ ] Support for other marketplaces (TCGPlayer, Cardmarket).
- [ ] Real-time price alerts when market shifts significantly.
- [ ] Historical price charts for individual cards.
- [ ] Automated daily sync via GitHub Actions.

---

## References
- **CardKingdom API**: `https://api.cardkingdom.com/api/v2/pricelist`
- **Scryfall API**: `https://api.scryfall.com/`
- **PRD**: `PRD.md` (Section 2.2 - Price Tracking & Analysis)
