"""
Unit tests for CartService and CollectionService commerce flows.
Uses mocks — does NOT touch Supabase or require network access.
"""
import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from src.api.services.cart_service import CartService
from src.api.services.collection_service import CollectionService


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FAKE_USER_ID = "a0000000-0000-0000-0000-000000000001"   # valid-looking UUID
FAKE_CART_ID = "b0000000-0000-0000-0000-000000000002"
FAKE_PRODUCT_ID = "c0000000-0000-0000-0000-000000000003"
FAKE_ORDER_ID = "d0000000-0000-0000-0000-000000000004"
FAKE_PRINTING_ID = "e0000000-0000-0000-0000-000000000005"


def _cart_supabase_mock():
    """Returns a Supabase mock wired for CartService call chains."""
    mock = MagicMock()

    def table_side(name):
        tbl = MagicMock()
        if name == 'carts':
            # get_or_create_cart: select returns nothing → insert creates
            tbl.select.return_value.eq.return_value.execute.return_value.data = []
            tbl.insert.return_value.execute.return_value.data = [{'id': FAKE_CART_ID}]
        elif name == 'products':
            tbl.select.return_value.eq.return_value.execute.return_value.data = [{
                'id': FAKE_PRODUCT_ID,
                'printing_id': FAKE_PRINTING_ID,
                'name': 'Test Lightning Bolt',
                'price': 100.0,
                'stock': 10
            }]
            # update stock
            tbl.update.return_value.eq.return_value.execute.return_value.data = [{'stock': 8}]
        elif name == 'cart_items':
            tbl.upsert.return_value.execute.return_value.data = [{
                'cart_id': FAKE_CART_ID, 'product_id': FAKE_PRODUCT_ID, 'quantity': 2
            }]
            # get_cart_items select chain
            item = {
                'id': 'item-1',
                'quantity': 2,
                'product_id': FAKE_PRODUCT_ID,
                'cart_id': FAKE_CART_ID,
                'products': {'id': FAKE_PRODUCT_ID, 'name': 'Test Lightning Bolt', 'price': 100.0, 'stock': 10}
            }
            tbl.select.return_value.eq.return_value.execute.return_value.data = [item]
            tbl.delete.return_value.eq.return_value.execute.return_value.data = []
        elif name == 'orders':
            tbl.insert.return_value.execute.return_value.data = [{'id': FAKE_ORDER_ID}]
        elif name == 'order_items':
            tbl.insert.return_value.execute.return_value.data = []
        return tbl

    mock.table.side_effect = table_side
    return mock


# ---------------------------------------------------------------------------
# Tests: CartService
# ---------------------------------------------------------------------------

class TestCommerceFlow:
    def test_01_cart_and_checkout(self):
        mock_sb = _cart_supabase_mock()

        async def run_flow():
            with patch('src.api.services.cart_service.supabase', mock_sb):
                # 1. Add to cart
                result = await CartService.add_to_cart(FAKE_USER_ID, FAKE_PRODUCT_ID, 2)
                assert result['success'] is True

                # 2. Checkout — needs the cart items query to return the item
                order = await CartService.checkout(FAKE_USER_ID)
                assert order['success'] is True
                assert order['total'] == 200.0
                assert order['order_id'] == FAKE_ORDER_ID

            return True

        success = asyncio.get_event_loop().run_until_complete(run_flow())
        assert success


# ---------------------------------------------------------------------------
# Tests: CollectionService / InventoryManagement
# ---------------------------------------------------------------------------

class TestInventoryManagement:
    def test_inventory_crud(self):
        """Verifies import_data correctly processes and returns success."""

        # Build a mock for supabase_admin used inside collection_service
        mock_admin = MagicMock()

        # cards table — batch card lookup
        card_resp = MagicMock()
        card_resp.data = [{'card_id': 1, 'card_name': 'Lightning Bolt', 'game_id': 1, 'rarity': 'Common'}]

        # card_printings table
        printing_resp = MagicMock()
        printing_resp.data = [{
            'printing_id': FAKE_PRINTING_ID,
            'card_id': 1,
            'collector_number': '61',
            'image_url': None,
            'sets': {'set_name': 'Limited Edition Alpha', 'set_code': 'LEA'}
        }]

        # user_collections existing check (returns empty → new insert)
        existing_resp = MagicMock()
        existing_resp.data = []

        # upsert response
        upsert_resp = MagicMock()
        upsert_resp.data = [{'id': 'col-1'}]

        def table_side(name):
            tbl = MagicMock()
            if name == 'cards':
                tbl.select.return_value.filter.return_value.execute.return_value = card_resp
            elif name == 'card_printings':
                tbl.select.return_value.filter.return_value.execute.return_value = printing_resp
            elif name == 'user_collections':
                tbl.select.return_value.eq.return_value.filter.return_value.execute.return_value = existing_resp
                tbl.upsert.return_value.execute.return_value = upsert_resp
            return tbl

        mock_admin.table.side_effect = table_side

        async def run_crud():
            with patch('src.api.services.collection_service.supabase_admin', mock_admin):
                with patch('src.api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock) as mock_match:
                    mock_match.return_value = {}
                    res = await CollectionService.import_data(
                        FAKE_USER_ID,
                        [{'name': 'Lightning Bolt', 'quantity': '4', 'set': 'LEA', 'price': '5.0', 'condition': 'NM'}],
                        {'name': 'name', 'quantity': 'quantity', 'set': 'set', 'price': 'price', 'condition': 'condition'},
                        import_type='collection'
                    )
            assert res['success'] is True
            return True

        success = asyncio.get_event_loop().run_until_complete(run_crud())
        assert success


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
