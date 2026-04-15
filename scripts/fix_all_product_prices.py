import os
import psycopg2

def fix_all_product_prices():
    env_dict = {}
    with open('e:/TCG Web App/.env', 'r') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_dict[k] = v
                
    db_url = f"postgresql://{env_dict.get('user')}:{env_dict.get('password')}@{env_dict.get('host')}:{env_dict.get('port')}/{env_dict.get('dbname')}"

    try:
        conn = psycopg2.connect(db_url)
        with conn.cursor() as cur:
            cur.execute("""
            UPDATE public.products p
            SET 
              price_usd = COALESCE(
                  CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd 
                       ELSE cp.avg_market_price_usd 
                  END, 
                  p.price_usd, p.price, 0),
              price = COALESCE(
                  CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd 
                       ELSE cp.avg_market_price_usd 
                  END, 
                  p.price, p.price_usd, 0)
            FROM public.card_printings cp
            WHERE p.printing_id = cp.printing_id
              AND (
                 COALESCE(p.price_usd, 0) != COALESCE(CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price_usd, 0)
                 OR
                 COALESCE(p.price, 0) != COALESCE(CASE WHEN LOWER(COALESCE(p.finish, 'nonfoil')) IN ('foil', 'etched') THEN cp.avg_market_price_foil_usd ELSE cp.avg_market_price_usd END, p.price, 0)
              );
            """)
            print(f"Updated {cur.rowcount} product prices (including out-of-stock).")
            conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_all_product_prices()
