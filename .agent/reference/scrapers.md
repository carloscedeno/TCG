# Scrapers & Data Standards

This document defines the quality and ethics standards for the TCG scrapers.

## 🛡️ Anti-Bot & Ethics
- **Rotation**: Always use `AntiBotManager` with rotating User-Agents and Proxies.
- **Rate Limiting**: Respect `requests_per_minute` and `requests_per_hour` limits.
- **Detection**: Log and handle CAPTCHAs immediately.

## 💎 Data Quality
- **Incremental Updates**: Use `IncrementalUpdateManager` to avoid redundant requests.
- **Anomalies**: Prices fluctuating more than 30% in 24h must be flagged as anomalies.
- **Retention**: Follow the `DataRetentionManager` policies for snapshot archiving.

## 🃏 Variant Detection
- Always use `VariantDetector` to distinguish between Foil, Etched, Alt Art, etc.
- Support all 7 primary TCGs (MTG, Pokémon, YGO, Lorcana, FaB, One Piece, Wixoss).

## 🔄 Marketplace Mapping
- Standardize all conditions to: `Near Mint (NM)`, `Lightly Played (LP)`, `Moderately Played (MP)`, `Heavily Played (HP)`, `Damaged`.
- Map source-specific conditions (e.g., Cardmarket "Excellent") correctly to standard values.
