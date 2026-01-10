import pytest
from unittest.mock import MagicMock, patch
from src.api.services.valuation_service import ValuationService

@pytest.mark.asyncio
async def test_valuation_calculation_logic():
    """Test that the Two-Factor calculation prioritizes specific sources and averages correctly."""
    
    # Mock data resembling Supabase response from price_history
    mock_prices = [
        {'source': 'geekorium', 'price_usd': 100.0, 'scraped_at': '2026-01-10T00:00:00Z'},
        {'source': 'cardkingdom', 'price_usd': 120.0, 'scraped_at': '2026-01-10T00:00:00Z'}
    ]
    
    mock_supabase = MagicMock()
    mock_supabase.table().select().eq().order().limit().execute.return_value.data = mock_prices
    
    with patch('src.api.services.valuation_service.supabase', mock_supabase):
        result = await ValuationService.get_two_factor_valuation("test-id")
        
        assert result['store_price'] == 100.0
        assert result['market_price'] == 120.0
        assert result['valuation_avg'] == 110.0

@pytest.mark.asyncio
async def test_valuation_fallback_to_aggregated():
    """Test that it falls back to aggregated prices if specific sources are missing."""
    
    # Empty price history for specific sources
    mock_prices = []
    # Aggregated price available
    mock_agg = [{'avg_market_price_usd': 50.0}]
    
    mock_supabase = MagicMock()
    # First call for price_history
    mock_supabase.table().select().eq().order().limit().execute.return_value.data = mock_prices
    # Second call for aggregated_prices
    mock_supabase.table().select().eq().execute.return_value.data = mock_agg
    
    with patch('src.api.services.valuation_service.supabase', mock_supabase):
        result = await ValuationService.get_two_factor_valuation("test-id")
        
        # Both should take the fallback
        assert result['store_price'] == 50.0
        assert result['market_price'] == 50.0
        assert result['valuation_avg'] == 50.0
