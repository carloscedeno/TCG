# PRD - Admin Stock Quick Access (User Menu)

## 1. Context & Objective

Administrators need a way to quickly verify stock levels and adjust prices without navigating away from their current task. Integrating a "Quick Stock" section into the profile dropdown (top-right "globe/bubble") provides this efficiency.

---

## 2. Technical Requirements

### 2.1. User Interface (UI)

- **Menu Integration**: The `UserMenu` dropdown (only for admins) will include a new section titled "Gestión Rápida de Stock".
- **Product Search**: A lightweight search input to filter products by name.
- **Stock Display**: Show the current stock level for filtered/recent products.
- **Inline Price Editing**: Clickable price labels that transform into input fields for immediate updates.
- **Visual Feedback**: Success/error states when updating prices.

### 2.2. Functional Requirements

- **Admin Only**: This section must be hidden/disabled for non-admin users.
- **Real-time Updates**: Changes to prices must be persisted to the `products` table in Supabase immediately.
- **Price Fallback Logic**: Remind the admin that Geekorium prices default to Card Kingdom unless overwritten.

---

## 3. Implementation Details

### 3.1. Components

- **UserMenu.tsx**: Extend the dropdown to include the new section.
- **QuickStockItem.tsx**: (New component) A compact row for displaying and editing a single product's stock and price.

### 3.2. Data Fetching

- Use a new or existing RPC (like `get_inventory_list`) with a small limit for the quick view.
- Implementation of a debounced search to avoid excessive database calls.

---

## 4. Acceptance Criteria

1. Admins see the "Gestión Rápida de Stock" section in the profile dropdown.
2. Searching for a card name shows the relevant inventory items.
3. Changing a price in the dropdown updates the database.
4. Non-admins cannot see this section.

---

## 5. Future Enhancements

- Batch price updates.
- "Low Stock" alerts highlighted in the dropdown.
- Direct link to `InventoryPage` for full management.
