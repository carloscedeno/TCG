import pytest
from unittest.mock import MagicMock, patch, call
from src.api.services.valuation_service import ValuationService


def _make_supabase_mock(sources_data, prices_data, agg_data=None):
    """
    Build a MagicMock that returns the right data for each table() call.
    ValuationService.get_two_factor_valuation calls:
      1. supabase.table('sources').select(...).execute()        → sources_data
      2. supabase.table('price_history').select(...).eq().order().limit().execute() → prices_data
      3. (only if prices missing) supabase.table('aggregated_prices').select(...).eq().execute() → agg_data
      4. (only if no ck_url) supabase.table('card_printings').select(...).eq().single().execute()
    """
    mock = MagicMock()

    def table_side_effect(name):
        tbl = MagicMock()
        if name == 'sources':
            tbl.select.return_value.execute.return_value.data = sources_data
        elif name == 'price_history':
            chain = tbl.select.return_value.eq.return_value.order.return_value.limit.return_value
            chain.execute.return_value.data = prices_data
        elif name == 'aggregated_prices':
            tbl.select.return_value.eq.return_value.execute.return_value.data = agg_data or []
        elif name == 'card_printings':
            # Return empty so the fallback URL block exits cleanly
            tbl.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
        return tbl

    mock.table.side_effect = table_side_effect
    return mock


@pytest.mark.asyncio
async def test_valuation_calculation_logic():
    """Verifica que la valuación de dos factores prioriza fuentes correctas."""

    # Sources: id 1 = geekorium, id 2 = cardkingdom
    sources_data = [
        {'source_id': 1, 'source_code': 'geekorium'},
        {'source_id': 2, 'source_code': 'cardkingdom'},
    ]

    # Price history uses source_id (not 'source' string)
    prices_data = [
        {'source_id': 1, 'price_usd': 100.0, 'url': None},
        {'source_id': 2, 'price_usd': 120.0, 'url': 'https://www.cardkingdom.com/mtg/set/card'},
    ]

    mock_supabase = _make_supabase_mock(sources_data, prices_data)

    with patch('src.api.services.valuation_service.supabase', mock_supabase):
        result = await ValuationService.get_two_factor_valuation("test-id")

        # Regla de negocio actual: CK NM es la fuente de verdad única (120.0)
        assert result['store_price'] == 120.0
        assert result['market_price'] == 120.0
        assert result['valuation_avg'] == 120.0


@pytest.mark.asyncio
async def test_valuation_fallback_to_ck():
    """Verifica que si no hay precio de tienda, usa el de Card Kingdom como fallback."""

    sources_data = [
        {'source_id': 1, 'source_code': 'geekorium'},
        {'source_id': 2, 'source_code': 'cardkingdom'},
    ]
    # Solo precio de Card Kingdom
    prices_data = [
        {'source_id': 2, 'price_usd': 50.0, 'url': 'https://www.cardkingdom.com/card'}
    ]

    mock_supabase = _make_supabase_mock(sources_data, prices_data)

    with patch('src.api.services.valuation_service.supabase', mock_supabase):
        result = await ValuationService.get_two_factor_valuation("test-id")

        # Regla de negocio: store_price hereda market_price si es 0
        assert result['store_price'] == 50.0
        assert result['market_price'] == 50.0
        assert result['valuation_avg'] == 50.0


@pytest.mark.asyncio
async def test_valuation_no_aggregated_fallback():
    """Verifica que YA NO se usa aggregated_prices (Goldfish)."""

    sources_data = [
        {'source_id': 1, 'source_code': 'geekorium'},
        {'source_id': 2, 'source_code': 'cardkingdom'},
    ]
    prices_data = []  # No source prices
    agg_data = [{'avg_market_price_usd': 50.0}] # Legacy data present but should be ignored

    mock_supabase = _make_supabase_mock(sources_data, prices_data, agg_data)

    with patch('src.api.services.valuation_service.supabase', mock_supabase):
        result = await ValuationService.get_two_factor_valuation("test-id")

        # Debería ser 0 porque quitamos el fallback a aggregated_prices
        assert result['store_price'] == 0
        assert result['market_price'] == 0
        assert result['valuation_avg'] == 0

