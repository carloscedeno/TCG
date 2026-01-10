"""
Pytest configuration and fixtures for TCG Web App tests
"""

import os
import pytest
from typing import Optional
from dotenv import load_dotenv

# Load .env file automatically for all tests
load_dotenv(override=True)


@pytest.fixture
def supabase_url() -> str:
    """Fixture for Supabase URL"""
    url = os.getenv('SUPABASE_URL')
    if not url:
        pytest.skip("SUPABASE_URL environment variable not set")
    return url


@pytest.fixture
def supabase_key() -> str:
    """Fixture for Supabase service role key"""
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not key:
        pytest.skip("SUPABASE_SERVICE_ROLE_KEY environment variable not set")
    return key


@pytest.fixture
def project_ref() -> str:
    """Fixture for Supabase project reference"""
    ref = os.getenv('SUPABASE_PROJECT_REF')
    if not ref:
        # Extract project ref from URL if available
        url = os.getenv('SUPABASE_URL')
        if url and '.supabase.co' in url:
            ref = url.split('//')[1].split('.')[0]
        else:
            pytest.skip("SUPABASE_PROJECT_REF environment variable not set")
    return ref


@pytest.fixture
def test_data() -> dict:
    """Fixture with test data for various tests"""
    return {
        'test_card': {
            'card_name': 'Test Card',
            'game_code': 'MTG',
            'set_code': 'TEST',
            'card_number': '001'
        },
        'test_price': {
            'price_usd': 10.50,
            'condition_id': 1,
            'source_id': 1
        },
        'test_user': {
            'user_id': 'test-user-123',
            'email': 'test@example.com'
        }
    }


@pytest.fixture
def mock_supabase_client(mocker):
    """Mock Supabase client for testing"""
    mock_client = mocker.Mock()
    mock_client.from_.return_value.select.return_value.eq.return_value.single.return_value = {
        'data': {'id': 1, 'name': 'test'},
        'error': None
    }
    return mock_client 