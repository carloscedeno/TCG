from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add src to sys.path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from api.main import app

client = TestClient(app)

def test_nested_sort_fix():
    print("🔍 Verifying Nested Sort Fix...")
    # This used to cause a 500
    response = client.get("/api/cards?sort=release_date&limit=1")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}. Detail: {response.text}"
    print("✅ Nested Sort Fix verified (No 500 error)")

def test_products_api():
    print("🔍 Verifying Products API (Inventory)...")
    response = client.get("/api/products?limit=1")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}. Detail: {response.text}"
    data = response.json()
    assert "products" in data
    assert "total_count" in data
    print(f"✅ Products API verified. Total items found: {data['total_count']}")

if __name__ == "__main__":
    try:
        test_nested_sort_fix()
        test_products_api()
        print("\n✨ ALL ADVANCED API VERIFICATIONS PASSED!")
    except Exception as e:
        import traceback
        print(f"\n❌ VERIFICATION FAILED!")
        traceback.print_exc()
        sys.exit(1)
