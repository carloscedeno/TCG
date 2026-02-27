import pytest
from unittest.mock import MagicMock, patch, AsyncMock
import sys
import os
from pathlib import Path

# Add src to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

# We mock supabase_client before importing service to avoid connection errors
with patch('api.utils.supabase_client.get_supabase_admin', return_value=MagicMock()):
    from api.services.collection_service import CollectionService

FAKE_USER_ID = "a0000000-0000-0000-0000-000000000001"
FAKE_PRINTING_ID = "e0000000-0000-0000-0000-000000000005"


def _make_admin_mock(card_name_to_find="Black Lotus", found_printing_id=FAKE_PRINTING_ID):
    """
    Build a supabase_admin mock that matches the service's actual call chain:
      1. table('cards').select().filter(...).execute()  → card list
      2. table('card_printings').select().filter(...).execute() → printing list
      3. table('user_collections').select().eq().filter(...).execute() → existing (empty)
      4. table('user_collections').upsert(...).execute() → success
    """
    mock = MagicMock()

    def table_side(name):
        tbl = MagicMock()
        if name == 'cards':
            tbl.select.return_value.filter.return_value.execute.return_value = MagicMock(data=[
                {'card_id': 1, 'card_name': card_name_to_find, 'game_id': 22, 'rarity': 'Rare'}
            ])
        elif name == 'card_printings':
            tbl.select.return_value.filter.return_value.execute.return_value = MagicMock(data=[{
                'printing_id': found_printing_id,
                'card_id': 1,
                'collector_number': '1',
                'image_url': None,
                'sets': {'set_name': 'Limited Edition Alpha', 'set_code': 'LEA'}
            }])
        elif name == 'user_collections':
            # existing check
            tbl.select.return_value.eq.return_value.filter.return_value.execute.return_value = MagicMock(data=[])
            # upsert
            tbl.upsert.return_value.execute.return_value = MagicMock(data=[{'id': 'col-1'}])
        return tbl

    mock.table.side_effect = table_side
    return mock


@pytest.fixture
def mock_supabase():
    with patch('api.services.collection_service.supabase_admin') as mock:
        yield mock


@pytest.mark.asyncio
async def test_import_mapping_logic():
    """Verifica que el mapeo de columnas transforme correctamente los datos del CSV"""
    user_id = FAKE_USER_ID
    raw_data = [
        {"Nombre": "Black Lotus", "Expansión": "LEA", "Cant": "1", "Estado": "NM", "Precio": "20000"},
    ]
    mapping = {
        "name": "Nombre",
        "set": "Expansión",
        "quantity": "Cant",
        "condition": "Estado",
        "price": "Precio"
    }

    admin_mock = _make_admin_mock("Black Lotus", FAKE_PRINTING_ID)

    # MatcherService is lazy-imported inside import_data — patch at source module level
    with patch('api.services.collection_service.supabase_admin', admin_mock):
        with patch('api.services.matcher_service.MatcherService.match_cards', new_callable=AsyncMock) as mock_match:
            mock_match.return_value = {}
            result = await CollectionService.import_data(user_id, raw_data, mapping, import_type='collection')

    assert result["success"] is True
    assert result["imported_count"] == 1
    assert len(result["errors"]) == 0


@pytest.mark.asyncio
async def test_import_with_missing_mandatory_fields():
    """Verifica el manejo de errores cuando faltan campos obligatorios tras el mapeo"""
    user_id = FAKE_USER_ID
    raw_data = [{"WrongHeader": "Something"}]
    mapping = {"name": "CorrectHeader"}

    admin_mock = MagicMock()
    with patch('api.services.collection_service.supabase_admin', admin_mock):
        result = await CollectionService.import_data(user_id, raw_data, mapping)

    assert result["imported_count"] == 0
    assert len(result["errors"]) == 1
