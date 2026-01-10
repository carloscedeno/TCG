import pytest
from unittest.mock import MagicMock, patch
import sys
import os
from pathlib import Path

# Add src to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent / "src"))

# We mock supabase before importing service to avoid connection errors
with patch('supabase.create_client'):
    from api.services.collection_service import CollectionService

@pytest.fixture
def mock_supabase():
    with patch('api.services.collection_service.supabase') as mock:
        yield mock

@pytest.mark.asyncio
async def test_import_mapping_logic(mock_supabase):
    """Verifica que el mapeo de columnas transforme correctamente los datos del CSV"""
    user_id = "test-user"
    raw_data = [
        {"Nombre": "Black Lotus", "Expansión": "LEA", "Cant": "1", "Estado": "NM", "Precio": "20000"},
        {"Nombre": "Mox Emerald", "Expansión": "LEA", "Cant": "2", "Estado": "LP", "Precio": "5000"}
    ]
    mapping = {
        "name": "Nombre",
        "set": "Expansión",
        "quantity": "Cant",
        "condition": "Estado",
        "price": "Precio"
    }

    # Mock de la respuesta de búsqueda de cartas
    mock_search_response = MagicMock()
    # Simplified data structure returned by Supabase client
    mock_search_response.data = [{
        "printing_id": "p-123", 
        "cards": {"card_name": "Black Lotus", "game_id": 22}, 
        "sets": {"set_name": "Limited Edition Alpha", "set_code": "LEA"}
    }]
    
    # Setup chain: supabase.table().select().ilike().execute()
    mock_supabase.table.return_value.select.return_value.ilike.return_value.execute.return_value = mock_search_response
    
    # Mock for checking existing collection: supabase.table().select().match().execute()
    mock_supabase.table.return_value.select.return_value.match.return_value.execute.return_value = MagicMock(data=[])
    
    # Mock for insert: supabase.table().insert().execute()
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

    result = await CollectionService.import_data(user_id, raw_data, mapping, import_type='collection')

    assert result["success"] is True
    assert result["imported_count"] == 2
    assert len(result["errors"]) == 0

@pytest.mark.asyncio
async def test_import_with_missing_mandatory_fields(mock_supabase):
    """Verifica el manejo de errores cuando faltan campos obligatorios tras el mapeo"""
    user_id = "test-user"
    raw_data = [{"WrongHeader": "Something"}]
    mapping = {"name": "CorrectHeader"}

    result = await CollectionService.import_data(user_id, raw_data, mapping)
    
    assert result["imported_count"] == 0
    assert len(result["errors"]) == 1
