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
