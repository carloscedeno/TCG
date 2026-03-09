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
            if table_name == 'aggregated_prices': return mock_agg
            if table_name == 'card_printings': return mock_cp
            return MagicMock()

        mock_supabase.table.side_effect = table_side_effect
        
        # Test get_two_factor_valuation
        result = await ValuationService.get_two_factor_valuation('test-id')
        print(f"Result 1 (Prioritize Geekorium): {result}")
        
        # We expect 15.0 because it's the geek_price (prioritized)
        assert result['valuation_avg'] == 15.0, f"Expected 15.0, got {result['valuation_avg']}"
        assert result['store_price'] == 15.0
        assert result['market_price'] == 10.0
        
        print("✅ Single valuation test passed!")

        # Test with ONLY CK price
        mock_history.execute.return_value = MagicMock(data=[
            {'price_usd': 10.0, 'url': 'https://www.cardkingdom.com/1', 'source_id': 1, 'printing_id': 'test-id-2'}
        ])
        result = await ValuationService.get_two_factor_valuation('test-id-2')
        print(f"Result 2 (Only CK): {result}")
        assert result['valuation_avg'] == 12.0, f"Expected 12.0, got {result['valuation_avg']}"
        
        print("✅ Fallback to market price test passed!")
        
        # Test batch valuations (with NO store price, should fallback to market price from agg)
        mock_agg = create_mock_chain([{'printing_id': 'test-id', 'avg_market_price_usd': 12.0}])
        mock_supabase.table.side_effect = table_side_effect # Refresh side effect
        
        result = await ValuationService.get_batch_valuations(['test-id'])
        print(f"Result 3 (Batch - No Store): {result}")
        assert result['test-id']['valuation_avg'] == 12.0, f"Expected 12.0, got {result['test-id']['valuation_avg']}"
        
        print("✅ Batch valuation (fallback) test passed!")

        # Test batch valuations (WITH store price)
        mock_history.execute.return_value = MagicMock(data=[
            {'price_usd': 15.0, 'url': 'http://geekorium.shop/1', 'source_id': 2, 'printing_id': 'test-id'}
        ])
        result = await ValuationService.get_batch_valuations(['test-id'])
        print(f"Result 4 (Batch - With Store): {result}")
        assert result['test-id']['valuation_avg'] == 15.0, f"Expected 15.0, got {result['test-id']['valuation_avg']}"
        
        print("✅ Batch valuation (prioritize store) test passed!")

if __name__ == "__main__":
    asyncio.run(test_valuation_logic())
