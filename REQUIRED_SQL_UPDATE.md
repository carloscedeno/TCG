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
