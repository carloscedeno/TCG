# GeekoSystem Evolution Plan

## 🎯 Global Methodology: Commit & Verify
> **Rule**: No task is "Done" until:
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

---

## 🚀 Active Phase: User Collection & Portfolio Dashboard
*Current Objective: Transform the imported data into visual intelligence for the user.*

### Task 2.1: Portfolio Dashboard
- [ ] **Value Widgets**: Implementation of "Total Portfolio Value" and "24h Change" cards.
- [ ] **Top Performers**: Display cards in collection with most significant price jumps (Gainers vs Losers).
- [ ] **TCG Distribution**: Pie chart showing collection balance between MTG, Pokémon, One Piece, etc.

### Task 2.2: Backend Processor Hardening
- [ ] **Batch Database Upsert**: Optimize the `CollectionService` to handle 1000+ rows efficiently.
- [ ] **Printing Matcher AI**: Improve the search logic to match card names/sets even with slight typos.

---

## 📅 Roadmap for Next Sessions
1. **GitHub Sync Integration**: Connect the app triggers with the daily automated sync.
2. **Price Alerts**: Real-time notifications for market shifts.
3. **Advanced Analytics**: Compare collection value against market indexes.

---

## 🕒 Current Verification State
- [x] **Local**: Import UI, API Routes, Mapping Logic.
- [ ] **Production**: Deployment to GH Pages / Production Backend. (Need to verify after next commit).
