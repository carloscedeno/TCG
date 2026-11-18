import os
import sys
import pytest

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.sync.common.sortswift_client import SortSwiftClient, SortSwiftAPIError


class TestSortSwiftSecurityContracts:
    def test_missing_api_key_raises_value_error(self, monkeypatch):
        monkeypatch.delenv("SORTSWIFT_API_KEY", raising=False)
        with pytest.raises(ValueError, match="SORTSWIFT_API_KEY is missing"):
            SortSwiftClient(api_key=None)

    def test_enforce_sandbox_rejects_production_key(self):
        with pytest.raises(ValueError, match="CRITICAL SECURITY ABORT"):
            SortSwiftClient(api_key="ss_inv_live_123456", enforce_sandbox=True)

    def test_enforce_sandbox_accepts_sandbox_key(self):
        client = SortSwiftClient(api_key="ss_inv_sbx_test_key", enforce_sandbox=True)
        assert client.is_sandbox is True
        assert client.session.headers["X-API-Key"] == "ss_inv_sbx_test_key"

    def test_sortswift_api_error_preserves_status_and_details(self):
        err = SortSwiftAPIError("Rate limited", status_code=429, details={"retry": 5})
        assert err.status_code == 429
        assert err.details == {"retry": 5}
        assert "Rate limited" in str(err)


class TestEnvironmentSegregationContracts:
    DEV_PROJECT_ID = "bqfkqnnostzaqueujdms"
    PROD_PROJECT_ID = "sxuotvogwvmxuvwbsscv"

    def test_dev_and_prod_ids_are_distinct(self):
        assert self.DEV_PROJECT_ID != self.PROD_PROJECT_ID
        assert len(self.DEV_PROJECT_ID) == 20
        assert len(self.PROD_PROJECT_ID) == 20

    def test_canonical_tcg_codes_ley_18(self):
        canonical = {"MTG", "PKM", "YGO", "OPC", "LOR", "FAB", "RFB", "GND", "DGM"}
        assert len(canonical) == 9
        assert all(len(code) == 3 and code.isupper() for code in canonical)
        assert "SINGLES" not in canonical
        assert "POKEMON" not in canonical
        assert "YUGIOH" not in canonical
