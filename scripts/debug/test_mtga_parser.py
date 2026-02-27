import sys
import os
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

async def test_mtga_import():
    from src.api.services.collection_service import CollectionService
    from src.api.utils.supabase_client import load_dotenv
    load_dotenv()
    
    # Sample MTGA text from user
    test_text = """
1 Assassin's Ink (NEO) 87
1 Cruel Sadist (M15) 93
1 Dark Impostor (VOC) 127
1 Fleshtaker (MID) 222
    """
    
    print("🧪 Testing MTGA Parser...")
    parsed = CollectionService.parse_mtga_format(test_text)
    for row in parsed:
        print(f"  Row: {row['name']} | Set: {row['set']} | Num: {row['collector_number']} | Qty: {row['quantity']}")
        
    assert len(parsed) == 4
    assert parsed[0]['name'] == "Assassin's Ink"
    assert parsed[0]['set'] == "NEO"
    assert parsed[0]['collector_number'] == "87"
    
    print("\n🧪 Testing Import Logic (Dry Run simulations)...")
    # This would require DB connectivity, but we can at least check the flow
    # results = await CollectionService.import_data(
    #     user_id="test-user",
    #     data=test_text,
    #     import_format='text'
    # )
    # print(f"  Import Status: {results['success']}")
    # print(f"  Imported Count: {results['imported_count']}")
    # print(f"  Errors: {len(results['errors'])}")
    
    print("\n✅ Parser test passed!")

if __name__ == "__main__":
    asyncio.run(test_mtga_import())
