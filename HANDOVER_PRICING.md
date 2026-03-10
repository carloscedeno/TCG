# TCG Pricing Sync Handover

I have prepared the environment and the database for synchronized pricing from Card Kingdom. To finish the process and keep prices updated in the future while saving tokens, you can run the following commands in your terminal.

## Prerequisites

Ensure your current terminal is in the project root: `c:\Users\carlo\OneDrive\Documents\Antigravity\TCG`

## Commands

### 1. Initial Data Backfill (Run once)

This script is currently running and has updated about 50,000 cards. If you stop the current terminal or want to ensure everything is perfect, you can run this:

```powershell
python scripts/update_prices_batched.py
```

### 2. Daily Price Sync (Schedule or run manually)

This script fetches the latest daily prices from Card Kingdom's API, updates the history, and refreshes the database columns used by the frontend:

```powershell
python scripts/sync_cardkingdom_api.py
```

## What was accomplished

- **Database Schema**: Added `foil_price`, `non_foil_price`, `avg_market_price_usd`, and `avg_market_price_foil_usd` to `card_printings`.
- **Source ID Alignment**: Standardized Card Kingdom as `source_id: 1` to match the massive existing price history.
- **Improved Scripts**: Updated sync scripts to connect directly via the Supabase pooler for reliability and speed.
