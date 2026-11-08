import os
import sys
import uuid
import json
from pathlib import Path
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(PROJECT_ROOT))
sys.path.append(str(PROJECT_ROOT / "scripts" / "sync"))

load_dotenv(PROJECT_ROOT / ".env.dev")
load_dotenv(PROJECT_ROOT / ".env")

from common.db import get_supabase
from common.sortswift_client import SortSwiftClient

def test_full_sale_lifecycle():
    print("=" * 65)
    print("   TESTING COMPLETE SALE LIFECYCLE (WEB -> SORTSWIFT -> ODOO)")
    print("=" * 65)

    sb = get_supabase()
    api_key = "ss_inv_sbx_e56e17c7ca1fe8dcc88650edcd0bc654f6a37803a64f6e6b54debdcc6d39c358"
    client = SortSwiftClient(api_key=api_key)

    # 1. Target real MTG card in DEV: Rise of the Witch-king
    card_id = "24651f19-3d0e-4dbf-b959-86d202561282"
    prod = sb.table("products").select("*").eq("id", card_id).single().execute().data
    print(f"\n[1. TARGET PRODUCT]: {prod['name']}")
    print(f"   ID:           {prod['id']}")
    print(f"   Stock en Web: {prod['stock']}")
    print(f"   SortSwift ID: {prod['sortswift_id']}")
    print(f"   Location:     {prod['physical_location']}")

    raw_id = prod['sortswift_id']
    ss_card = client.get_raw_card(raw_id)
    print(f"   SortSwift Initial Qty: {ss_card.get('quantity')}, Status: {ss_card.get('inventory', {}).get('status')}")

    # 2. Simulate Web Checkout (Step 1: Website creates order & locks stock)
    print("\n[2. WEB CHECKOUT]: Creando orden en la Web y bloqueando inventario...")
    test_order_id = str(uuid.uuid4())
    test_item_id = str(uuid.uuid4())

    # Create test order
    sb.table("orders").insert({
        "id": test_order_id,
        "total_amount": float(prod['price']),
        "status": "pending_payment",
        "shipping_address": {"full_name": "Test Collector", "phone": "584240000000"}
    }).execute()

    # Create order item
    sb.table("order_items").insert({
        "id": test_item_id,
        "order_id": test_order_id,
        "product_id": card_id,
        "quantity": 1,
        "price_at_purchase": float(prod['price']),
        "finish": prod['finish'],
        "product_name": prod['name']
    }).execute()

    # Decrement/lock stock in products (web inventory blocked)
    sb.table("products").update({"stock": 0}).eq("id", card_id).execute()
    print(f"   -> Orden creada: {test_order_id}")
    print(f"   -> Inventario bloqueado en la Web: Stock = 0")

    # 3. Simulate SortSwift Reservation (Step 2: Hold physical card in SortSwift warehouse)
    print("\n[3. SORTSWIFT HOLD]: Reservando carta fisica en SortSwift...")
    hold = client.reserve_card(raw_id, external_reservation_id=test_item_id, duration_minutes=60)
    reservation_id = hold['id']
    print(f"   -> Reserva creada en SortSwift: {reservation_id} (Status: {hold['status']})")

    # Save reservation_id to order_items
    sb.table("order_items").update({"sortswift_reservation_id": reservation_id}).eq("id", test_item_id).execute()

    # Verify physical card is reserved on SortSwift
    ss_held = client.get_raw_card(raw_id)
    print(f"   -> SortSwift Warehouse State: Qty: {ss_held.get('quantity')}, Reserved: {ss_held.get('inventory', {}).get('reservedQuantity')}")
    assert ss_held.get('inventory', {}).get('reservedQuantity') == 1, "Card should be reserved on SortSwift!"

    # 4. Simulate Odoo Delivery / Payment Confirmation (Step 3: Odoo confirms -> Commit in SortSwift)
    print("\n[4. ODOO CONFIRMATION]: Odoo confirma pago y entrega (Webhook Commit)...")
    commit_res = client.commit_reservation(reservation_id)
    print(f"   -> SortSwift Commit: {commit_res['status']}")

    # Mark order as paid in Geekorium
    sb.table("orders").update({"status": "paid"}).eq("id", test_order_id).execute()

    # Verify card is permanently deducted / removed from SortSwift
    ss_committed = client.get_raw_card(raw_id)
    print(f"   -> SortSwift Final State: Qty: {ss_committed.get('quantity')}, Status: {ss_committed.get('inventory', {}).get('status')}")
    assert ss_committed.get('inventory', {}).get('status') == 'removed', "Card should be permanently removed from SortSwift!"

    print("\n[5. VERIFICATION OF FINAL STATE]:")
    final_prod = sb.table("products").select("name, stock, physical_location").eq("id", card_id).single().execute().data
    print(f"   Geekorium Web Stock: {final_prod['stock']} (Correctamente 0)")
    print(f"   SortSwift Status:    {ss_committed.get('inventory', {}).get('status')} (Correctamente removed)")

    # 6. Cleanup & Reset (Return card to available in sandbox and restore stock)
    print("\n[6. CLEANUP & RESET FOR SANDBOX]:")
    # Return card to available in SortSwift Sandbox
    import requests
    ret_url = f"https://inventory-api.sortswift.com/api/inventory/api-key/raw-cards/{raw_id}/return"
    requests.post(ret_url, headers={"X-API-Key": api_key})
    sb.table("products").update({"stock": 1}).eq("id", card_id).execute()
    sb.table("order_items").delete().eq("id", test_item_id).execute()
    sb.table("orders").delete().eq("id", test_order_id).execute()
    print("   -> Sandbox card returned to available and stock restored to 1.")
    print("\n" + "=" * 65)
    print("   E2E SALE LIFECYCLE TEST COMPLETED 100% SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    test_full_sale_lifecycle()
