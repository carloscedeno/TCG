# GeekoSystem Evolution Plan

## 🎯 Global Methodology: Commit & Verify
>
> **Rule**: No task is "Done" until:
>
> 1. It is committed to Git.
> 2. It is verified in BOTH Local and Production environments.
> 3. The PRD and PLAN are updated.

---

## ✅ Completed Tasks

- [x] **Refactoring & Structuring**: Aligned folders with `PROJECT_STRUCTURE.md`. Modularized API into Services/Routes.
- [x] **Bulk Import Tool (v1)**:
  - [x] Premium Terminal UI with Glassmorphism.
  - [x] Smart Column Mapping (User-defined headers).
  - [x] Multi-TCG Support (MTG, PKM, etc.).
  - [x] Example Templates for MTG, PKM, and Geekorium.
  - [x] Fixed CSV Download logic (Blob handling fixes).
- [x] **API Integrity Verification**: Suite of automated tests in `tests/` to prevent regressions.
- [x] **Supabase Backend Migration**: Centralized API into Edge Functions, enabling a 100% serverless frontend-to-cloud architecture.
- [x] **Autonomous Nightly Workflow**: Created `/nightly-sync` with `turbo-all` for agent-led maintenance and evaluation.

---

## 🚀 Active Phase: User Collection & Portfolio Dashboard

*Current Objective: Transform the imported data into visual intelligence for the user.*

### Task 2.1: Portfolio Dashboard

- [x] **Dual-Valuation Engine**: Logic to calculate value based on Geekorium Price + CardKingdom Market Price.
- [x] **Value Widgets**: Implementation of "Store Value", "Market Value", and "Global Total" cards.
- [x] **Top Performers**: Display cards in collection with most significant price jumps (Gainers vs Losers).

### Task 2.2: Backend Processor Hardening

- [x] **Batch Collection Fetch**: Optimized `CollectionService` to eliminate N+1 queries when loading user portfolios.
- [x] **Batch Database Upsert**: Optimized the `import_data` logic to handle 1000+ rows efficiently with batch queries.
- [x] **Printing Matcher AI**: Improved search logic using `pg_trgm` fuzzy matching to handle typos and partial names.
- [x] **Autonomous Mode**: Enabled `AUTO_APPROVE=true` and updated methodology for 100% agentic execution.

### Task 2.3: Market Data Integration (CardKingdom)

- [x] **Scraper Refinement**: Integrated CardKingdom API v2 into the `AdminService` workflow with batch processing and error handling.
- [x] **Price Aggregation**: CardKingdom prices are stored as a distinct marketplace source with URLs for direct product links.
- [x] **GitHub Sync Integration**: Connected the app triggers with daily automated sync via GitHub Actions.

---

## 📅 Roadmap for Next Sessions

1. [x] **Price Alerts**: Real-time notifications for market shifts (Backend + Automation).
2. [x] **Advanced Analytics**: Portfolio performance tracking and dual-valuation engine.

---

## 🕒 Current Verification State

- [x] **Local**: Portfolio Dashboard UI, Dual-Valuation Logic, CardKingdom API Integration, Nested Sorting Fix.
- [x] **Production**: Deployment verified with incident reporting active.
