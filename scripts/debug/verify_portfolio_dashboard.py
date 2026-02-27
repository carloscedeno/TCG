"""
Quick verification script for Portfolio Dashboard implementation
Tests the core functionality without requiring a full server setup
"""
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all new modules can be imported"""
    print("🔍 Testing imports...")
    try:
        from src.api.services.valuation_service import ValuationService
        from src.api.services.collection_service import CollectionService
        print("  ✓ ValuationService imported")
        print("  ✓ CollectionService imported")
        return True
    except Exception as e:
        print(f"  ✗ Import failed: {e}")
        return False

def test_valuation_structure():
    """Test that ValuationService has the expected methods"""
    print("\n🔍 Testing ValuationService structure...")
    try:
        from src.api.services.valuation_service import ValuationService
        
        # Check for batch method
        assert hasattr(ValuationService, 'get_batch_valuations'), "Missing get_batch_valuations method"
        print("  ✓ get_batch_valuations method exists")
        
        # Check for single method
        assert hasattr(ValuationService, 'get_two_factor_valuation'), "Missing get_two_factor_valuation method"
        print("  ✓ get_two_factor_valuation method exists")
        
        return True
    except Exception as e:
        print(f"  ✗ Structure test failed: {e}")
        return False

def test_collection_structure():
    """Test that CollectionService has the expected methods"""
    print("\n🔍 Testing CollectionService structure...")
    try:
        from src.api.services.collection_service import CollectionService
        
        assert hasattr(CollectionService, 'get_user_collection'), "Missing get_user_collection method"
        print("  ✓ get_user_collection method exists")
        
        assert hasattr(CollectionService, 'import_data'), "Missing import_data method"
        print("  ✓ import_data method exists")
        
        return True
    except Exception as e:
        print(f"  ✗ Structure test failed: {e}")
        return False

def test_admin_cardkingdom_integration():
    """Test that AdminService has CardKingdom integration"""
    print("\n🔍 Testing AdminService CardKingdom integration...")
    try:
        from src.api.services.admin_service import AdminService
        
        assert hasattr(AdminService, 'run_scraper'), "Missing run_scraper method"
        print("  ✓ run_scraper method exists")
        
        # Check the source code for cardkingdom handling
        import inspect
        source = inspect.getsource(AdminService.run_scraper)
        assert 'cardkingdom' in source.lower(), "CardKingdom not found in run_scraper"
        print("  ✓ CardKingdom integration detected in run_scraper")
        
        return True
    except Exception as e:
        print(f"  ✗ Integration test failed: {e}")
        return False

def test_frontend_files():
    """Test that frontend files exist"""
    print("\n🔍 Testing frontend files...")
    try:
        frontend_path = Path(__file__).parent / "frontend" / "src"
        
        # Check for new service
        service_file = frontend_path / "services" / "CollectionService.ts"
        assert service_file.exists(), "CollectionService.ts not found"
        print("  ✓ CollectionService.ts exists")
        
        # Check for new component
        component_file = frontend_path / "components" / "Profile" / "PortfolioStats.tsx"
        assert component_file.exists(), "PortfolioStats.tsx not found"
        print("  ✓ PortfolioStats.tsx exists")
        
        # Check Profile page was updated
        profile_file = frontend_path / "pages" / "Profile.tsx"
        assert profile_file.exists(), "Profile.tsx not found"
        content = profile_file.read_text()
        assert 'PortfolioStats' in content, "PortfolioStats not imported in Profile.tsx"
        print("  ✓ Profile.tsx updated with PortfolioStats")
        
        return True
    except Exception as e:
        print(f"  ✗ Frontend test failed: {e}")
        return False

def test_documentation():
    """Test that documentation was created"""
    print("\n🔍 Testing documentation...")
    try:
        docs_path = Path(__file__).parent / "docs"
        
        ck_doc = docs_path / "CardKingdom_Integration.md"
        assert ck_doc.exists(), "CardKingdom_Integration.md not found"
        print("  ✓ CardKingdom_Integration.md exists")
        
        test_doc = docs_path / "Testing_Portfolio_Dashboard.md"
        assert test_doc.exists(), "Testing_Portfolio_Dashboard.md not found"
        print("  ✓ Testing_Portfolio_Dashboard.md exists")
        
        return True
    except Exception as e:
        print(f"  ✗ Documentation test failed: {e}")
        return False

def main():
    print("=" * 60)
    print("Portfolio Dashboard - Verification Script")
    print("=" * 60)
    
    tests = [
        test_imports,
        test_valuation_structure,
        test_collection_structure,
        test_admin_cardkingdom_integration,
        test_frontend_files,
        test_documentation
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 60)
    print(f"Results: {sum(results)}/{len(results)} tests passed")
    print("=" * 60)
    
    if all(results):
        print("\n✅ All verification checks passed!")
        print("\n📋 Next Steps:")
        print("  1. Apply SQL migration (see REQUIRED_SQL_UPDATE.md)")
        print("  2. Start backend: python -m src.api.main")
        print("  3. Start frontend: cd frontend && npm run dev")
        print("  4. Run CardKingdom sync from /admin dashboard")
        print("  5. View portfolio at /profile")
        return 0
    else:
        print("\n⚠️  Some verification checks failed. Review the output above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
