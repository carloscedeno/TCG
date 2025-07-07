# Supabase DB Management Script

Este script unifica la gestión de la base de datos de Supabase para el proyecto TCG Web App.

## Requisitos
- Python 3.7+
- CLI de Supabase instalada y autenticada (`supabase login`)
- Acceso a los archivos de migraciones y seeds en `docs/TechDocs/database/`

## Uso

```bash
python manage_supabase_db.py <comando>
```

### Comandos disponibles
- `migrate`  : Aplica todas las migraciones SQL en orden.
- `seed`     : Ejecuta los scripts de seeds SQL.
- `reset`    : Resetea la base de datos local y aplica migraciones + seeds.
- `status`   : Muestra el estado de la base de datos Supabase.
- `deploy`   : Despliega funciones Edge y migraciones a Supabase.
- `help`     : Muestra la ayuda y uso del script.

## Ejemplos

```bash
python manage_supabase_db.py migrate
python manage_supabase_db.py seed
python manage_supabase_db.py reset
python manage_supabase_db.py status
python manage_supabase_db.py deploy
```

## Notas
- El script asume que la estructura de carpetas no ha cambiado.
- Si usas Windows, ejecuta los comandos desde una terminal con permisos adecuados.
- Para entornos de CI/CD, puedes invocar este script en los pasos de setup/deploy. 