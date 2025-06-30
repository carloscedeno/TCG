## Migraciones recientes

### 005_add_artist_to_cards.sql
Agrega la columna `artist` a la tabla `cards` para almacenar el nombre del artista de la carta (especialmente útil para Magic: The Gathering y otros TCGs). El script es idempotente y seguro para ejecutar múltiples veces.

**Uso:**

Ejecuta el SQL en el panel de Supabase o desde tu CLI de PostgreSQL:

```sql
-- Copia y pega el contenido de docs/TechDocs/database/migrations/005_add_artist_to_cards.sql
```

### 006_add_rarity_to_cards.sql
Agrega la columna `rarity` a la tabla `cards` para almacenar la rareza de la carta (común, poco común, rara, mítica, etc). El script es idempotente y seguro para ejecutar múltiples veces.

**Uso:**

Ejecuta el SQL en el panel de Supabase o desde tu CLI de PostgreSQL:

```sql
-- Copia y pega el contenido de docs/TechDocs/database/migrations/006_add_rarity_to_cards.sql
```

### 007_add_flavor_text_to_card_printings.sql
Agrega la columna `flavor_text` a la tabla `card_printings` para almacenar el texto de ambientación de la carta (muy útil para MTG y otros TCGs). El script es idempotente y seguro para ejecutar múltiples veces.

**Uso:**

Ejecuta el SQL en el panel de Supabase o desde tu CLI de PostgreSQL:

```sql
-- Copia y pega el contenido de docs/TechDocs/database/migrations/007_add_flavor_text_to_card_printings.sql
```

--- 