# Scraper Architecture & Data Acquisition

## CardKingdom Integration Strategy (API First)

Following extensive research into the CardKingdom secondary market infrastructure, we implement an **API-First** approach for data acquisition. This is more reliable, faster, and less resource-intensive than web scraping.

### 1. Official API Endpoints
We prioritize the following JSON endpoints for CardKingdom data:

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Singles** | `https://api.cardkingdom.com/api/v2/pricelist` | Full catalog of single cards, retail and buylist prices. |
| **Sealed** | `https://api.cardkingdom.com/api/sealed_pricelist` | Booster boxes, packs, and preconstructed decks. |

### 2. Data Model & Identifiers
The CardKingdom API v2 provides critical fields for synchronization:
- **scryfall_id**: The primary key for matching with our local database.
- **price_retail**: The reference "Market Price" for our Two-Factor Valuation.
- **price_buy**: Useful for future arbitrage or trade-in value features.
- **is_foil**: Boolean flag for variant pricing.

### 3. Implementation Rules
1. **Prefer API over Scraping**: Only use the `BeautifulSoup` scraper if the API does not contain the specific data needed (e.g. historical trends not in the feed).
2. **Handle Strings as Floats**: CardKingdom often returns prices as strings. Cast them to `double/float64` during ingestion.
3. **Identity Matching**: Use the `scryfall_id` field provided in the API to bypass "fuzzy matching" logic. This is the source of truth for card identity.
4. **Rate Limiting**: Respect the `Crawl-delay` and server health. Since the pricelist is a large JSON file, it is better to download it once and process it in a batch for the whole catalog.

### 4. Hybrid Architecture
- **Daily Batch**: Use the API to sync the entire catalog daily at 12:30 AM PT.
- **On-Demand Scrape**: Use the web scraper only for "Real-time verification" if a user requests a price refresh for a specific card and we suspect the daily cache is stale.

## Evolution toward MTGJSON/Scryfall Aggregation
While direct API access is preferred for "Live" inventory, we use **MTGJSON** and **Scryfall** as secondary layers for historical normalization and data enrichment.
