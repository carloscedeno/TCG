# Lecciones Aprendidas - TCG Project

## 1. Gestión de Base de Datos Multi-Entorno

- **Problema**: Usar una sola base de datos de Supabase para producción y desarrollo causa riesgos de integridad de datos y colisión de estados (ej. tests afectando stock real).
- **Solución**: Segregación total mediante instancias independientes. `main` conectado a Prod, `dev` y previews conectados a Dev.
- **Aprendizaje**: El uso de "Environment Overrides" en Cloudflare Pages es la forma más limpia de inyectar diferentes secretos de Supabase según la rama sin cambiar el código frontend.

## 2. Replicación de Esquemas

- **Aprendizaje**: En una base de datos que ha evolucionado con scripts manuales y RPCs complejos, un dump de esquema (`supabase db pull`) es superior a intentar reconstruir el estado desde archivos de migración dispersos.
- **Mejor Práctica**: Mantener un `consolidated_schema.sql` como "fallback" pero confiar en el dump de producción como fuente de verdad para sincronizar nuevos entornos.

## 3. SEO en Entornos de Preview

- **Problema**: Los motores de búsqueda pueden indexar versiones de desarrollo si no se bloquean explícitamente.
- **Solución**: Usar variables de entorno (`VITE_ROBOTS`) para cambiar dinámicamente el tag `<meta name="robots">` a `noindex, nofollow` en ramas que no sean `main`.
