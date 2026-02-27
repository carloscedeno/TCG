# Geekorium — TCG Marketplace

Plataforma de venta asistida de cartas coleccionables (TCG). Especializada en Magic: The Gathering con soporte catalog para múltiples juegos (Pokémon, Yu-Gi-Oh!, Lorcana, Flesh and Blood, Wixoss, One Piece).

## Features

- **Catálogo Premium**: Cartas con imágenes, versiones, foil, precios de mercado (Scryfall)
- **Card Modal Avanzado**: Selector de versiones, flip DFC, toggle Normal/Foil, precios dinámicos
- **Carrito Asistido**: Persistencia localStorage, validación de stock en tiempo real
- **Checkout Venezolano**: Cédula, estado, comprobante de pago + WhatsApp handshake
- **Bulk Import**: Parser ManaBox TXT/CSV con reporte de errores
- **Panel Admin**: Gestión de órdenes, inventario y QuickStock

## Arquitectura

```
frontend/               # React 18 + TypeScript (GitHub Pages)
  src/
    components/         # UI components (Card, CardModal, Navigation, etc.)
    pages/              # Páginas (Home, Admin, Checkout)
    utils/              # API client, helpers
  tests/e2e/            # Playwright E2E tests

supabase/
  functions/tcg-api/    # Edge Function principal (Deno/TypeScript)
  migrations/           # Migraciones SQL versionadas

src/                    # Scripts Python (sync, admin tools)
scripts/                # Deploy, sync, operaciones
  debug/                # Scripts de debugging (no producción)
docs/                   # Documentación activa
  archive/              # Documentación histórica
```

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Supabase Edge Functions (Deno) |
| Base de Datos | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Deploy | GitHub Pages + Supabase Cloud |
| Scripts | Python 3.12 |

## Desarrollo Local

### Requisitos

- Node.js 18+
- Python 3.12+
- Cuenta de Supabase (o variables en `.env`)

### Setup

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Completar VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.

# 2. Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173

# 3. Scripts Python (opcional)
pip install -e .
```

### Build para Producción

```bash
cd frontend
npm run build   # SIEMPRE verificar antes de push
```

## Testing

```bash
# E2E tests (Playwright)
cd frontend
npx playwright test

# Python scripts
pytest tests/
```

## Documentación

- [PRD Master](docs/PRD_MASTER.md) — Requerimientos y estado del producto
- [TechDocs](docs/TechDocs/) — Arquitectura, DB schema, APIs
- [Lessons Learned](.agent/lessons_learned.md) — Bugs críticos y anti-patrones
- [Archive](docs/archive/) — Documentación histórica

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- [Issues](https://github.com/yourusername/mtg-tcg-web-app/issues)
- [Discussions](https://github.com/yourusername/mtg-tcg-web-app/discussions)
- [Documentation](docs/)

## 🛡️ Shielded Components & Maintenance Patterns

To ensure high availability and prevent regressions in critical UI/UX paths, follow these strict development patterns:

### 1. Card Modal Layout & Data (Critical Path)

The Card Modal is a high-complexity component sensitive to layout shifts and API responses.

- **Layout Architecture**: Always use the "Controlled Flex" pattern (35% fixed height for versions list) defined in `docs/PRD_Mejoras_Visuales_y_Funcionales_Web.md`.
- **Data Robustness**: Never filter versions based on stock. Preserve the versions list (`all_versions`) in the frontend state when switching printing IDs to handle partial API responses.
- **Price Hierarchy**: Always show `market_price` as fallback if store stock is 0. Display `S/P` (Sin Precio) for null values.

### 2. TypeScript & CI/CD Integrity

- **Build First**: Before pushing any change to `frontend/src/components` or `frontend/src/utils`, run `npm run build`.
- **Typing**: Avoid `any` where possible. NEVER use implicit `any` in array mappings (`map`, `filter`, `forEach`) as it directly breaks the production deployment pipeline.

### 3. Agent Memory

Consult `frontend/src/agents.md` for a chronological log of critical bug fixes and architectural decisions to avoid repeated mistakes.

---

### Built with love for the TCG community
