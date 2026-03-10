import requests
import json
import socket

def check_link_local():
    """Checks if localhost is reachable."""
    try:
        socket.create_connection(("localhost", 54321), timeout=2)
        return True
    except:
        return False

def verify_price_congruence():
    """
    Verifies that the API returns consistent pricing between search and detail views,
    and adheres to the CK NM source of truth rule with foil fallbacks.
    """
    # Assuming Supabase Local Edge Functions are running at this default port
    # In a real environment, we'd use service-to-service auth or a local proxy
    base_url = "http://localhost:54321/functions/v1/api"
    
    print("--- Starting Price Congruence Verification ---")
    
    if not check_link_local():
        print("[WARNING] Local Supabase functions not detected at localhost:54321.")
        print("This script assumes a local environment. Skipping live API tests.")
        return

    # 1. Search for a card
    search_payload = {"query": "Sol Ring", "limit": 1}
    try:
        search_res = requests.post(f"{base_url}/search", json=search_payload)
        search_res.raise_for_status()
        results = search_res.json().get('results', [])
        
        if not results:
            print("[FAIL] No search results for 'Sol Ring'")
            return
            
        card = results[0]
        printing_id = card['card_id']
        search_price = float(card.get('avg_price_usd', 0))
        search_foil_price = float(card.get('avg_price_foil_usd', 0))
        
        print(f"[INFO] Found card: {card['card_name']} ({printing_id})")
        print(f"[INFO] Search Prices - Normal: ${search_price}, Foil: ${search_foil_price}")

        # 2. Get card details
        detail_res = requests.get(f"{base_url}/cards/{printing_id}")
        detail_res.raise_for_status()
        details = detail_res.json()
        
        detail_market = float(details.get('valuation', {}).get('market_price', 0))
        detail_market_foil = float(details.get('valuation', {}).get('market_price_foil', 0))
        detail_final = float(details.get('price', 0))
        
        print(f"[INFO] Detail Prices - Normal: ${detail_market}, Foil: ${detail_market_foil}, Final: ${detail_final}")

        # 3. Verify Congruence
        # Search price should match detail market price
        if abs(search_price - detail_market) > 0.01:
            print(f"[FAIL] Mismatch in normal price: Search ${search_price} vs Detail ${detail_market}")
        else:
            print("[PASS] Normal prices match.")

        if abs(search_foil_price - detail_market_foil) > 0.01:
            print(f"[FAIL] Mismatch in foil price: Search ${search_foil_price} vs Detail ${detail_market_foil}")
        else:
            print("[PASS] Foil prices match.")

        # 4. Verify Fallback Logic
        expected_final = search_price if search_price > 0 else search_foil_price
        if abs(detail_final - expected_final) > 0.01:
            print(f"[FAIL] Fallback logic mismatch: Expected ${expected_final} based on search, got ${detail_final}")
        else:
            print(f"[PASS] Fallback logic verified: Final price is ${detail_final}")

    except Exception as e:
        print(f"[ERROR] Verification failed during API calls: {e}")

if __name__ == "__main__":
    verify_price_congruence()
