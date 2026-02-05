# Backend & API Standards

## 🚀 Architecture

- **Framework**: FastAPI (Python).
- **Communication**: RESTful JSON API.
- **Asynchronous**: Use `async`/`await` for all I/O bound operations (database, external requests).

## 🛡️ Best Practices

- **Validation**: Use Pydantic for request and response validation.
- **Error Handling**: Standardized error responses (e.g., `{ "error": "Message", "code": 400 }`).
- **Documentation**: Automatic OpenAPI (Swagger) documentation.
- **Services**: Business logic belongs in `services/`, not in routes.

## 💾 Database

- **ORM**: SQLAlchemy or Supabase Client.
- **Migrations**: Always use Alembic for database changes.
- **Security**: Implement RLS (Row Level Security) on Supabase.

- **Local API First**: Frontend MUST fetch via Python API for complex/large queries (Cards/Sets) to avoid Supabase Postgrest timeouts (Error 57014).
- **Optimization**: Use `count: 'estimated'` or `count: 'planned'` on large tables.
- **Fail-safe**: Implement direct Supabase fallbacks in `frontend/src/utils/api.ts` for ALL methods (even `fetchSets`). If `VITE_API_BASE` is empty or unreachable, the fallback must gracefully switch to direct DB access.
- **CI/CD Hygiene**: Deployment to Production (GitHub Pages) requires all environment variables to be explicitly set in Repository Secrets. Missing `VITE_API_BASE` will break local relative paths.
- **TS Compliance**: Use underscore prefix (`_variable`) for any parameters required by interfaces but unused in implementation (e.g. in mocks) to satisfy `noUnusedParameters: true`.
