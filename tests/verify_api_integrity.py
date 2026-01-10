from fastapi.testclient import TestClient
import sys
import os
from pathlib import Path

# Add src to sys.path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from api.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "version" in response.json()

def test_cards_route_exists():
    # We expect 200 even if empty (with fallback warning or empty list)
    response = client.get("/api/cards")
    if response.status_code != 200:
        print(f"Error 500 detail: {response.text}")
    assert response.status_code == 200
    assert "cards" in response.json()

def test_admin_stats_protected():
    # Should fail with 401 (Unauthorized) without header
    response = client.get("/api/admin/stats")
    assert response.status_code == 401

def test_webhook_protected():
    response = client.post("/api/webhook/sync?token=invalid")
    assert response.status_code == 401

if __name__ == "__main__":
    print("🚀 Starting API Integrity Verification...")
    try:
        test_health()
        print("✅ Health Check passed")
        test_root()
        print("✅ Root Route passed")
        test_cards_route_exists()
        print("✅ Cards API exists and reachable")
        test_admin_stats_protected()
        print("✅ Admin Stats security check passed")
        test_webhook_protected()
        print("✅ Webhook security check passed")
        print("\n✨ ALL CORE API INTEGRITY TESTS PASSED! No regression detected.")
    except Exception as e:
        import traceback
        print(f"\n❌ REGRESSION DETECTED!")
        traceback.print_exc()
        sys.exit(1)
