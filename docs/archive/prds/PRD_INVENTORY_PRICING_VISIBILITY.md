# PRD: Inventory Pricing Automation & Enhanced Visibility

## 1. Introduction

This document outlines the requirements for automating inventory pricing using Card Kingdom data and improving the visual representation of stock levels in the user interface.

## 2. Problem Statement

* **Pricing:** Currently, imported items default to a price of 0 or require manual input. The business requirement is to use Card Kingdom's pricing as the default source of truth when no specific purchase price is provided.
* **Visibility:** Users cannot easily see the quantity of stock available for a card from the main catalog/grid view, forcing them to click into details which slows down inventory management.

## 3. Goals

1. **Automate Pricing:** Enhance the import logic to automatically fetch and apply Card Kingdom prices for items imported with a price of 0.
2. **Improve UI:** Display the stock count directly on the card component in the grid view, located conspicuously above the market price.

## 4. Technical Requirements

### 4.1. Import Logic (Backend)

* **Service:** `CollectionService`
* **Trigger:** When `import_type='inventory'` and an item's `purchase_price` is 0 or missing.
* **Logic:**
    1. Identify items with 0 price.
    2. Perform a lookup against `aggregated_prices` (or `card_printings` if pricing data is denormalized there) to find the current Card Kingdom price.
    3. If a CK price is found, use it as the `price` for the new inventory item.
    4. If no CK price is found, fallback to 0 (or a configured default).
    5. **Optimization:** Perform this lookup in batch to avoid N+1 queries.

### 4.2. User Interface (Frontend)

* **Component:** `Card.tsx`
* **Design:**
  * Add a visual indicator for "Stock".
  * Location: Above the "Market" price label or integrated into the price section.
  * Style: High-contrast badge or text (e.g., "STOCK: 4") to distinguish it from the price.
  * Condition: Only show if `total_stock > 0`.

## 5. Acceptance Criteria

* [x] Importing a file with a card at price 0 results in the product having a non-zero price in the database (matching CK data).
* [x] The inventory grid clearly shows the number of copies available for each card without needing to hover or click.
* [x] Performance impact on import is negligible (batch processing used).
