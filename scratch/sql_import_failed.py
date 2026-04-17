import csv
import psycopg2
import os
import sys
import io

# Forzar UTF-8 en la salida de consola para evitar errores en Windows con emojis
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# DB Config
DB_CONFIG = {
    "user": "postgres.sxuotvogwvmxuvwbsscv",
    "password": "jLta9LqEmpMzCI5r",
    "host": "aws-0-us-west-2.pooler.supabase.com",
    "port": "6543",
    "dbname": "postgres"
}

CSV_FILE = r"e:\TCG Web App\scratch\failed_lote_strixhaven.csv"

def map_condition(raw_cond: str) -> str:
    mapping = {
        'near_mint': 'NM',
        'lightly_played': 'LP',
        'moderately_played': 'MP',
        'heavily_played': 'HP',
        'damaged': 'DMG'
    }
    return mapping.get(raw_cond.lower(), 'NM')

def map_finish(is_foil: str) -> str:
    if not is_foil: return 'nonfoil'
    is_foil = is_foil.lower()
    if is_foil == 'foil': return 'foil'
    if is_foil == 'etched': return 'etched'
    return 'nonfoil'

def sql_import():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print(f"📖 Reading CSV: {CSV_FILE}")
    imported_count = 0
    
    with open(CSV_FILE, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get('Name')
            set_code = row.get('Set code')
            quantity = int(row.get('Quantity') or 1)
            rarity = row.get('Rarity')
            condition = map_condition(row.get('Condition') or '')
            finish = map_finish(row.get('Foil') or '')
            scryfall_id = row.get('Scryfall ID')
            
            # Lookup metadata from catalog
            cur.execute("""
                SELECT p.image_url, p.prices->'usd' as price
                FROM card_printings p
                WHERE p.printing_id = %s
            """, (scryfall_id,))
            cat_row = cur.fetchone()
            
            image_url = cat_row[0] if cat_row else None
            # If price is null or 0, check foil price if finish is foil
            price = cat_row[1] if cat_row and cat_row[1] else 0
            
            # Purchase price if provided in CSV
            p_price = row.get('Purchase price')
            if p_price and float(p_price) > 0:
                price = float(p_price)
            
            # Use 0.25 as default for tokens if price is still missing
            if (not price or float(price) == 0) and set_code.lower() == 'tsos':
                price = 0.25
            
            print(f"  Upserting: {name} ({condition}, {finish}) x{quantity} @ ${price}")
            
            cur.execute("""
                INSERT INTO public.products (printing_id, name, game, set_code, price, stock, image_url, rarity, condition, finish)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (printing_id, condition, finish) DO UPDATE SET
                    stock = public.products.stock + EXCLUDED.stock,
                    price = CASE WHEN EXCLUDED.price > 0 THEN EXCLUDED.price ELSE public.products.price END,
                    image_url = COALESCE(EXCLUDED.image_url, public.products.image_url),
                    updated_at = now()
            """, (scryfall_id, name, 'MTG', set_code, price, quantity, image_url, rarity, condition, finish))
            imported_count += 1
            
    conn.commit()
    cur.close()
    conn.close()
    print(f"\n🎉 Successfully imported/updated {imported_count} products via SQL.")

if __name__ == "__main__":
    sql_import()
