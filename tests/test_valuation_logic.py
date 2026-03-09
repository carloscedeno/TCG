import asyncio
from unittest.mock import MagicMock, patch
import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from api.services.valuation_service import ValuationService

async def test_valuation_logic():
    print("Testing ValuationService logic...")
    
    def create_mock_chain(return_data):
        mock = MagicMock()
        mock.select.return_value = mock
        mock.eq.return_value = mock
        mock.in_.return_value = mock
        mock.order.return_value = mock
        mock.limit.return_value = mock
        mock.single.return_value = mock
        mock.execute.return_value = MagicMock(data=return_data)
        return mock

    mock_sources = create_mock_chain([
        {'source_id': 1, 'source_code': 'cardkingdom'},
        {'source_id': 2, 'source_code': 'geekorium'}
    ])
    
    # Initial data for test 1
    mock_history_data = [
        {'price_usd': 15.0, 'url': 'http://geekorium.shop/1', 'source_id': 2, 'printing_id': 'test-id'}, # Geekorium
        {'price_usd': 10.0, 'url': 'https://www.cardkingdom.com/1', 'source_id': 1, 'printing_id': 'test-id'} # CK
    ]
    mock_history = create_mock_chain(mock_history_data)
    
    mock_agg = create_mock_chain([{'avg_market_price_usd': 12.0}])
    mock_cp = create_mock_chain([]) # For fallback URL block

    with patch('api.services.valuation_service.supabase') as mock_supabase:
        def table_side_effect(table_name):
            if table_name == 'sources': return mock_sources
            if table_name == 'price_history': return mock_history
            if table_name == 'card_printings': return mock_cp
            return MagicMock()

        mock_supabase.table.side_effect = table_side_effect
        
        # Test 1: Both Geekorium and CK exist, should pick CK
        result = await ValuationService.get_two_factor_valuation('test-id')
        print(f"Result 1 (Ignore Geekorium, pick CK): {result}")
        
        # We expect 10.0 because it's the CK NM price (single source of truth)
        assert result['valuation_avg'] == 10.0, f"Expected 10.0, got {result['valuation_avg']}"
        assert result['store_price'] == 10.0
        assert result['market_price'] == 10.0
        
        print("✅ Single valuation test passed (picked CK)!")

        # Test 2: Only CK price exists
        mock_history.execute.return_value = MagicMock(data=[
            {'price_usd': 10.0, 'url': 'https://www.cardkingdom.com/1', 'source_id': 1, 'printing_id': 'test-id-2'}
        ])
        result = await ValuationService.get_two_factor_valuation('test-id-2')
        print(f"Result 2 (Only CK): {result}")
        assert result['valuation_avg'] == 10.0, f"Expected 10.0, got {result['valuation_avg']}"
        
        print("✅ Only CK price test passed!")
        
        # Test 3: Batch valuations (Ignore Geekorium)
        mock_history.execute.return_value = MagicMock(data=[
            {'price_usd': 9.5, 'url': 'https://www.cardkingdom.com/1', 'source_id': 1, 'printing_id': 'test-id-3'},
            {'price_usd': 15.0, 'url': 'http://geekorium.shop/1', 'source_id': 2, 'printing_id': 'test-id-3'}
        ])
        mock_supabase.table.side_effect = table_side_effect # Refresh side effect
        
        result = await ValuationService.get_batch_valuations(['test-id-3'])
        print(f"Result 3 (Batch - Pick CK): {result}")
        assert result['test-id-3']['valuation_avg'] == 9.5, f"Expected 9.5, got {result['test-id-3']['valuation_avg']}"
        
        print("✅ Batch valuation (picked CK) test passed!")

if __name__ == "__main__":
    asyncio.run(test_valuation_logic())
