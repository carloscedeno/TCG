import os
import json
import psycopg2
from dotenv import load_dotenv

# Load environment variables for database connection
load_dotenv()

# We will use the remote Supabase DB since local is not running
# Credentials can typically be derived from SUPABASE_URL and a password
# For testing the RPC, we can also use the supabase-py client which is easier with MCP-like keys.
DB_HOST = "aws-0-us-west-1.pooler.supabase.com" # Example based on region
DB_NAME = "postgres"
DB_USER = "postgres.sxuotvogwvmxuvwbsscv"
DB_PASS = os.getenv("SUPABASE_DB_PASSWORD") # Provided by user or found in config
DB_PORT = "6543"

DB_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def verify_foil_logic():
    """
    Simulates a bulk import request to test the foil prioritization logic.
    """
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()

        print("--- Testing Foil Prioritization Logic ---")

        # Mock data: A card with both foil and non-foil printings
        # We need to find a card in the current database that has both.
        # Let's search for "Hallowed Fountain" as it's common in recent logs.
        
        test_items = [
            {
                "name": "Hallowed Fountain",
                "set": "RNA", # Ravnica Allegiance
                "quantity": 1,
                "price": 15.0,
                "condition": "NM",
                "finish": "foil"
            },
            {
                "name": "Hallowed Fountain",
                "set": "RNA",
                "quantity": 2,
                "price": 10.0,
                "condition": "NM",
                "finish": "nonfoil"
            }
        ]

        # Call the RPC function
        cur.execute("SELECT bulk_import_inventory(%s);", (json.dumps(test_items),))
        result = cur.fetchone()[0]
        
        print(f"Import Result: {json.dumps(result, indent=2)}")

        # Verify correct printings were linked in 'products' table
        # We look for products inserted join with card_printings to check is_foil
        cur.execute("""
            SELECT p.stock, cp.is_foil, cp.set_code, c.card_name
            FROM products p
            JOIN card_printings cp ON p.printing_id = cp.printing_id
            JOIN cards c ON cp.card_id = c.card_id
            WHERE c.card_name = 'Hallowed Fountain' AND cp.set_code = 'RNA'
            ORDER BY cp.is_foil DESC;
        """)
        
        db_results = cur.fetchall()
        print("\n--- Database Verification ---")
        for row in db_results:
            stock, is_foil, set_code, name = row
            status = "FOIL" if is_foil else "NON-FOIL"
            print(f"Card: {name} [{set_code}] | Status: {status} | Stock in DB: {stock}")

        conn.commit()
    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    verify_foil_logic()
