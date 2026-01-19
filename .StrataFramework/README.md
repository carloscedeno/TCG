# Strata Dev Framework – Project TCG

This repository follows the **Strata Dev Framework** principles. It is a full‑stack application built on **Supabase** (PostgreSQL + Auth + Edge Functions) and a **React** front‑end managed with **Node.js**.

## Quick start
```bash
# Clone the repo
git clone https://github.com/your-org/TCG.git
cd TCG

# Install dependencies
npm install

# Set up Supabase
# (see supabase/config.json for details)

# Run the dev server
npm run dev
```

The framework enforces:
- **Disk‑based knowledge** – all specifications live in `docs/`.
- **Atomic stories** – each feature is described in `docs/specs/stories.json`.
- **PPRE cycle** – Plan → Prepare → Run → Evaluate.
- **Continuous learning** – after each bug fix, update the corresponding markdown file.

---
*Generated automatically by Antigravity.*
