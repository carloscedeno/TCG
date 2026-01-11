"""
Quick API Test - Portfolio Dashboard Endpoints
Tests the new collection and valuation endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print(f"  ✓ Health check passed: {response.json()}")
            return True
        else:
            print(f"  ✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_api_docs():
    """Test that API docs are accessible"""
    print("\n🔍 Testing API documentation...")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print(f"  ✓ API docs accessible at {BASE_URL}/docs")
            return True
        else:
            print(f"  ✗ API docs failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_collections_endpoint():
    """Test collections endpoint (will fail without auth, but should return 401 not 404)"""
    print("\n🔍 Testing collections endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/collections/")
        # We expect 401 (unauthorized) not 404 (not found)
        if response.status_code in [401, 403]:
            print(f"  ✓ Collections endpoint exists (auth required as expected)")
            return True
        elif response.status_code == 404:
            print(f"  ✗ Collections endpoint not found")
            return False
        else:
            print(f"  ℹ Unexpected status: {response.status_code}")
            return True
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_admin_stats():
    """Test admin stats endpoint"""
    print("\n🔍 Testing admin stats endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        # Should return 401 or data
        if response.status_code in [200, 401, 403]:
            print(f"  ✓ Admin stats endpoint exists")
            if response.status_code == 200:
                print(f"    Data: {response.json()}")
            return True
        elif response.status_code == 404:
            print(f"  ✗ Admin stats endpoint not found")
            return False
        else:
            print(f"  ℹ Status: {response.status_code}")
            return True
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("Portfolio Dashboard - API Endpoint Tests")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print()
    
    tests = [
        test_health,
        test_api_docs,
        test_collections_endpoint,
        test_admin_stats
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)
    
    if all(results):
        print("\n✅ All API endpoints are accessible!")
        print("\n📋 Next Steps:")
        print(f"  1. Open browser to: http://localhost:5173/TCG/")
        print(f"  2. Navigate to /profile to see Portfolio Dashboard")
        print(f"  3. Navigate to /import to add test data")
        print(f"  4. Navigate to /admin to run CardKingdom sync")
        print(f"\n📚 API Documentation: {BASE_URL}/docs")
        return 0
    else:
        print("\n⚠️  Some endpoints failed. Check if backend is running.")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
