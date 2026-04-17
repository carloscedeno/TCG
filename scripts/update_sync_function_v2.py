import psycopg2

def update_sync_function_v2():
    try:
        conn = psycopg2.connect(
            user="postgres.sxuotvogwvmxuvwbsscv",
            password="jLta9LqEmpMzCI5r",
            host="aws-0-us-west-2.pooler.supabase.com",
            port="6543",
            dbname="postgres"
        )
        cur = conn.cursor()
        
        sql = """
CREATE OR REPLACE FUNCTION public.sync_product_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
 DECLARE
     v_found BOOLEAN := false;
     v_ck_source_id INTEGER; -- CORRECTED TYPE TO MATCH price_sources.source_id (integer)
     v_new_price NUMERIC;
 BEGIN
     IF (TG_TABLE_NAME = 'products') THEN
         -- 1. Sync Price from CardKingdom History
         -- source_id is an integer (e.g., 17)
         SELECT source_id INTO v_ck_source_id FROM public.price_sources WHERE UPPER(source_code) = 'CARDKINGDOM' LIMIT 1;

         SELECT price_usd INTO v_new_price 
         FROM public.price_history 
         WHERE printing_id = NEW.printing_id AND source_id = v_ck_source_id 
         ORDER BY timestamp DESC LIMIT 1;

         IF v_new_price IS NULL OR v_new_price = 0 THEN
             SELECT ph.price_usd INTO v_new_price
             FROM public.price_history ph
             JOIN public.card_printings cp ON ph.printing_id = cp.printing_id
             WHERE cp.card_id = (SELECT card_id FROM public.card_printings WHERE printing_id = NEW.printing_id LIMIT 1)
               AND ph.source_id = v_ck_source_id
             ORDER BY 
                 CASE WHEN cp.set_code = (SELECT set_code FROM public.card_printings WHERE printing_id = NEW.printing_id LIMIT 1) THEN 0 ELSE 1 END,
                 ph.timestamp DESC 
             LIMIT 1;
         END IF;

         NEW.price := COALESCE(v_new_price, NEW.price, 0);
         NEW.price_usd := NEW.price;

         -- 2. Sync Metadata from Catalog (Extended with type_line, colors, release_date)
         SELECT 
             true,
             COALESCE(c.card_name, NEW.name, 'Unknown Card'),
             COALESCE(g.game_code, NEW.game, 'MTG'),
             COALESCE(s.set_code, NEW.set_code, 'UNK'),
             COALESCE(s.set_name, 'Unknown Set'),
             COALESCE(cp.rarity, NEW.rarity, 'common'),
             COALESCE(cp.image_url, cp.image_url_normal, NEW.image_url),
             COALESCE(c.type_line, NEW.type_line),
             COALESCE(c.colors, NEW.colors),
             COALESCE(cp.release_date, NEW.release_date)
         INTO 
             v_found, NEW.name, NEW.game, NEW.set_code, NEW.set_name, NEW.rarity, NEW.image_url,
             NEW.type_line, NEW.colors, NEW.release_date
         FROM public.card_printings cp
         LEFT JOIN public.cards c ON cp.card_id = c.card_id
         LEFT JOIN public.sets s ON cp.set_id = s.set_id
         LEFT JOIN public.games g ON s.game_id = g.game_id
         WHERE cp.printing_id = NEW.printing_id;

         RETURN NEW;
     END IF;

     RETURN NEW;
 END;
 $function$;
"""
        print("Actualizando funcioin sync_product_metadata (V2 - Integer fix)...")
        cur.execute(sql)
        conn.commit()
        print("Funcion actualizada con exito.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_sync_function_v2()
