
# Mana Symbols Support and Coverage

This document outlines the supported mana symbols in the application, mapping Scryfall API codes to `mana-font` CSS classes.

## Overview

The application uses `mana-font` (v1.18.0) to render Magic: The Gathering symbols. We parse the `mana_cost` and `oracle_text` strings provided by the API (or Scryfall) and convert them into the appropriate CSS classes.

## Supported Symbols

### Basic Mana

| Symbol | Scryfall Code | CSS Class | Notes |
|---|---|---|---|
| White | `{W}` | `ms-w` | |
| Blue | `{U}` | `ms-u` | |
| Black | `{B}` | `ms-b` | |
| Red | `{R}` | `ms-r` | |
| Green | `{G}` | `ms-g` | |
| Colorless | `{C}` | `ms-c` | Specific colorless mana (Wastes) |
| Generic | `{0}` - `{20}` | `ms-0` - `ms-20` | Generic mana costs |
| X Variable | `{X}` | `ms-x` | |
| Y Variable | `{Y}` | `ms-y` | |
| Z Variable | `{Z}` | `ms-z` | |
| Snow | `{S}` | `ms-s` | Snow mana |

### Special Symbols

| Symbol | Scryfall Code | CSS Class | Notes |
|---|---|---|---|
| Tap | `{T}` | `ms-tap` | Requires special CSS fix for visibility in text bubble |
| Untap | `{Q}` | `ms-untap` | |
| Energy | `{E}` | `ms-e` | Energy counters |
| Planeswalker | `{PW}` | `ms-planeswalker` | Loyalty ability |
| Chaos | `{CHAOS}` | `ms-chaos` | Planechase |
| Acorn | `{A}` | `ms-acorn` | Un-set security stamp |
| Ticket | `{TK}` | `ms-tk` | Un-set Ticket counter |
| Half | `{1/2}` | `ms-1-2` | Un-set fractional mana |
| Infinity | `{∞}` or `{infinity}` | `ms-infinity` | Un-set infinite mana |

### Hybrid & Phyrexian Mana

Hybrid and Phyrexian symbols are handled dynamically by processing the slash-separated codes.

| Type | Example Code | Resulting Class | Description |
|---|---|---|---|
| Hybrid | `{W/U}` | `ms-wu` | White or Blue |
| Twobrid | `{2/W}` | `ms-2w` | 2 Generic or White |
| Phyrexian | `{W/P}` | `ms-wp` | White or 2 Life |
| Phyrexian Hybrid | `{G/U/P}` | `ms-gup` | Green, Blue, or 2 Life |

## Implementation Details

### Parsing Logic (`ManaText.tsx`)

The `ManaText` component splits the text by `{}` brace patterns. It then determines the class name:

1. **Special Symbols Map**: Checks if the content matches a known special key (e.g., `T`, `Q`, `1/2`). If so, uses the mapped suffix.
2. **Dynamic Generation**: If not in the map, converts the content to lowercase and removes slashes (e.g., `W/U` -> `wu`).

### CSS Styling (`index.css`)

A global fix was applied to ensure the Tap symbol `{T}` renders correctly when used as a cost bubble within text:

```css
/* Fix for Mana Font Tap Symbol visibility */
.ms-cost.ms-tap {
  background-color: #cac5c0; /* Generic Mana Grey */
  color: #000000; /* Black Arrow */
  border-radius: 50%;
}
```

This ensures the `{T}` symbol (which `mana-font` renders as a glyph) is visible against the bubble background created by `ms-cost`.

## Verification

A comprehensive E2E test suite (`tests/e2e/mana_symbols_comprehensive.spec.ts`) was created to verify the rendering of all symbol categories, including:

- Basic colors
- Variables (X, Y, Z)
- Numbers (0-100)
- Special symbols (Tap, Untap, Energy, etc.)
- Complex hybrid symbols

The test verifies that the correct CSS classes are attached to the DOM elements.
