# Testing the Portfolio Dashboard

## Prerequisites
1. SQL migration for `url` column has been applied (see `REQUIRED_SQL_UPDATE.md`)
2. Backend API is running (`python -m src.api.main`)
3. Frontend dev server is running (`npm run dev` in `frontend/`)
4. You have at least one user account with some cards in their collection

## Test Steps

### 1. Import Test Collection
Navigate to `/import` and upload a test CSV with the following format:
```csv
Card Name,TCG,Set,Condition,Quantity,Price
Sol Ring,MTG,Commander Masters,NM,1,1.50
Black Lotus,MTG,Alpha,NM,1,20000
Charizard,Pokemon,Base Set,LP,1,500
```

### 2. Run CardKingdom Sync
- Go to `/admin` (requires admin role)
- Click **"Run CardKingdom Sync"**
- Wait for completion (check terminal logs)

### 3. View Portfolio Dashboard
- Navigate to `/profile`
- You should see:
  - **Portfolio Value**: Average of store + market prices
  - **Store Value**: Based on Geekorium prices (from import)
  - **Market Value**: Based on CardKingdom prices (from sync)
  - **Top Gainers**: Cards with highest profit potential

### 4. Verify Data Integrity
Check the database to ensure:
```sql
-- Verify price_history has CardKingdom data with URLs
SELECT 
    ph.price_usd, 
    ph.url, 
    ps.source_code,
    cp.scryfall_id
FROM price_history ph
JOIN price_sources ps ON ph.source_id = ps.source_id
JOIN card_printings cp ON ph.printing_id = cp.printing_id
WHERE ps.source_code = 'cardkingdom'
LIMIT 10;
```

## Expected Results
- Portfolio widgets display non-zero values
- Market URLs are clickable and lead to CardKingdom product pages
- Top Gainers list shows cards with positive gain percentage
- No console errors in browser or backend

## Troubleshooting
- **No market prices**: Ensure cards have `scryfall_id` populated
- **Missing URLs**: Verify SQL migration was applied
- **Empty collection**: Import test data first
- **API errors**: Check backend logs for detailed error messages
