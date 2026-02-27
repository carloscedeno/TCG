# Required Database Schema Update

The automated synchronization with CardKingdom now supports storing direct product URLs. However, the `price_history` table in Supabase needs a schema update to support this.

Please run the following SQL command in your Supabase Dashboard's SQL Editor:

```sql
-- Add URL column to price_history table to store marketplace links
ALTER TABLE public.price_history 
ADD COLUMN IF NOT EXISTS url text;

COMMENT ON COLUMN public.price_history.url IS 'Direct link to the product on the source marketplace';
```

After running this, the system will automatically save and retrieve the direct links to CardKingdom (and other marketplaces) for every price update.

## ⚡ Performance Optimization (Highly Recommended)

If the card filtering or search feels slow or returns a "timeout" error in the console, please execute these commands to create necessary indexes:

```sql
-- Indexes for faster filtering and searching
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON public.cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_type_line ON public.cards(type_line);
CREATE INDEX IF NOT EXISTS idx_cards_game_id ON public.cards(game_id);
CREATE INDEX IF NOT EXISTS idx_cards_colors ON public.cards USING GIN (colors);
CREATE INDEX IF NOT EXISTS idx_cards_card_name_trgm ON public.cards USING gin (card_name gin_trgm_ops); -- Requires pg_trgm extension
```
