# Performance & Architecture Patterns: TCG Hub

## 1. Local API First Strategy
- **Rule**: All frontend data fetching for complex or large datasets (Cards, Sets, Prices) MUST go through the **Modular Python API** (`src/api`) instead of direct Supabase Postgrest calls.
- **Reason**: Direct Supabase queries on tables with 50k+ rows frequently hit the `57014: statement timeout` (Postgrest limit). The Python API utilizes optimized connection pooling and service-layer logic to handle these loads.
- **Implementation**: Reference `frontend/src/utils/api.ts`. Use `VITE_API_BASE` for endpoints.

## 2. Supabase Fallback Pattern
- **Rule**: When implementing API clients, always provide a fallback to direct Supabase if the local API is unreachable.
- **Optimization**: Use `count: 'planned'` instead of `count: 'exact'` for large tables in fallbacks to avoid heavy count operations.

## 3. Bulk Data Handling
- **Mapping**: Column mapping should occur in the frontend, but validation must happen in the `CollectionService`.
- **Batching**: Always report partial successes and specific row errors instead of failing the entire batch.

## 4. Frontend Resilience
- **Timeouts**: If a request takes longer than 5s, the UI must show a helpful message or trigger the fallback mechanism.
- **State Reset**: Always reset pagination and loading states when filters change to prevent "ghost" data.
