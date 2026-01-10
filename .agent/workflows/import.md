---
description: Workflow for implementing and verifying the Bulk Import feature.
---

# Bulk Import Workflow

This workflow ensures the "Bulk Import" feature is implemented consistently across frontend and backend.

## 1. UI Implementation
- Create `BulkImport` component in `frontend/src/components/features/collections/`.
- Use `GlassCard` for the container.
- Implement drag-and-drop using standard HTML5 or a library if preferred.
- Aesthetic: Neon borders and glassmorphism consistent with "Geekorium Premium".

## 2. Parsing Logic
- Implement client-side CSV/TXT parsing.
- Support "Geekorium Price List" format and standard export formats (TCGPlayer, Cardmarket).
- Create a "Mapping Step" where users can match their CSV headers to system fields (Name, Set, Price/Value, Condition).

## 3. Backend Integration
- Create endpoint `POST /api/collections/import`.
- Implement batch processing to handle thousands of records without timeouts.
- Use Supabase transactions for data integrity.

## 4. Verification
- Test with a sample MTG CSV.
- Test with the "Geekorium Prices" format.
- Verify through the Portfolio Dashboard that values are updated correctly.
