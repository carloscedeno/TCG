# 🧠 TCG Hub - Developer Knowledge Base (Lessons Learned)

Este documento registra los desafíos técnicos encontrados durante el desarrollo y sus soluciones para evitar regresiones y optimizar el rendimiento futuro.

## 🛠 Entorno y Dependencias

### 1. Conflictos de Versión en CI/CD (GitHub Actions)

- **Problema**: `numpy==2.4.0` fallaba en GitHub con "No matching distribution found" a pesar de estar disponible localmente.
- **Causa**: Versiones muy recientes de librerías a veces tardan horas/días en estar disponibles en todos los mirrors de PyPI para Linux/x64, o requieren Python 3.12+.
- **Lección**:
  - Sincronizar la versión de Python del runner (3.12) con la local.
  - Usar versionamiento flexible (`>=2.0.0`) en `requirements.txt` para entornos de despliegue.

## 🗄️ Base de Datos y Supabase

### 2. "Precios Invisibles" (Agregación Fallida)

- **Problema**: El script de sincronización insertaba precios pero no se reflejaban en la UI.
- **Causa**: El trigger SQL `calculate_aggregated_prices` filtraba por `timestamp >= NOW() - INTERVAL '7 days'` y requería un `condition_id` válido. Los inserts manuales omitían estos campos, dejando los precios en un limbo.
- **Lección**: Todo script de ingesta de precios debe incluir:
  - `timestamp`: ISO string (UTC).
  - `condition_id`: ID numérico correspondiente (ej: 16 para Near Mint).
  - `is_foil`: Booleano explícito.

### 3. Timeouts en Filtros (Performance)

- **Problema**: Error 500 al filtrar por Color o Tipo de Carta.
- **Causa**: Escaneo secuencial de ~236,000 registros en la tabla `card_printings` al realizar joins `!inner` sobre columnas sin índices.
- **Lección**:
  - **Índices Críticos**: Se requiere `GIN` para arrays (`colors`) y `B-TREE` para `rarity`, `type_line` y `game_id`.
  - **Estrategia de Consulta**: Para tablas masivas, es más rápido hacer una subconsulta a la tabla de referencia (`cards`) para obtener IDs y luego filtrar `card_printings` por esos IDs, evitando joins pesados.

## 🌐 Frontend y API

### 4. Coherencia en el Fallback de Supabase

- **Problema**: El fallback directo a Supabase en `api.ts` fallaba con "Column id does not exist".
- **Causa**: El API de FastAPI devuelve `card_id` como alias de `printing_id`, pero el cliente de Supabase directo intentaba ordenar por `id` (estándar de Postgres) que no existe en esta estructura específica.
- **Lección**: Mantener mapeos de nombres de columnas idénticos entre la respuesta del API local y el código de fallback de Supabase.
- **Batch Insertion Conflicts**: When using `UPSERT` with `ON CONFLICT`, ensure the batch itself does not contain duplicate primary keys. Use a dictionary to deduplicate by ID within the batch before sending to the database.
- **Moxfield-Style Card Details**: Users expect a card modal that shows the latest edition by default but provides a scrollable list of all other printings (editions) with their respective prices.
- **English-Only Priority**: For initial data synchronization across TCGs, prioritize English versions (`lang: 'en'`) to maintain consistency and avoid display confusion in the UI.

### 5. Counting Strategy & Timeouts

- **Problema**: `count='exact'` bloqueaba la base de datos en tablas grandes (Error 500 / 57014: statement timeout).
- **Lección**:
  - Usar `count='planned'` o `count='estimated'` en Supabase/Postgrest. `estimated` es superior para tablas con joins dinámicos donde el planificador de Postgres ya tiene estadísticas.
  - **Fallas en Filtros**: Si un filtro complejo sigue dando timeout con `planned`, desactivar el conteo (`count: null`) y manejar la paginación con "Infinite Scroll" o botones de "Siguiente".

## 🚀 Despliegue y CI/CD

### 6. TypeScript Strict Build (TS6133)

- **Problema**: `npm run build` fallaba con `error TS6133: 'cb' is declared but its value is never read`.
- **Causa**: Configuración de `tsconfig.json` con `noUnusedParameters: true`.
- **Lección**: Siempre prefijar variables no utilizadas con un guion bajo (ej: `_cb`) en mocks o funciones de callback para permitir la compilación exitosa.

### 7. Variables de Entorno en GitHub Actions

- **Problema**: El frontend funcionaba localmente pero en producción los dropdowns (Sets) estaban vacíos y las búsquedas fallaban.
- **Causa**: Falta del secret `VITE_API_BASE` en el entorno `github-pages` del repositorio. El frontend intentaba llamar a `/api/...` relativo al dominio de GitHub Pages (que devolvía 404).
- **Lección**:
  - **Secretos Mirror**: Cada variable local en `.env` debe tener un mirror en los GitHub Repository Secrets y estar mapeada en `deploy.yml`.
  - **Resiliencia de Fallback**: Todo endpoint crítico (`fetchSets`, `fetchCards`, etc.) DEBE tener un bloque `try/catch` que recurra directamente a Supabase si el API base falla o no está definido.
