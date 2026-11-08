import os
import sys
import logging
import requests
from typing import List, Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger("SortSwiftClient")

class SortSwiftAPIError(Exception):
    """Custom exception for SortSwift API errors."""
    def __init__(self, message: str, status_code: int = None, details: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.details = details

class SortSwiftClient:
    """Official SortSwift Inventory API Client (v1.12.0) for Geekorium."""
    
    BASE_URL = "https://inventory-api.sortswift.com/api/inventory"
    
    def __init__(self, api_key: Optional[str] = None, enforce_sandbox: bool = False):
        self.api_key = api_key or os.environ.get("SORTSWIFT_API_KEY")
        if not self.api_key:
            raise ValueError("SORTSWIFT_API_KEY is missing from environment or parameters.")
            
        self.is_sandbox = self.api_key.startswith("ss_inv_sbx_")
        
        # Enforce sandbox safety if in DEV
        if enforce_sandbox and not self.is_sandbox:
            raise ValueError(
                "CRITICAL SECURITY ABORT: Non-sandbox SortSwift key detected in an environment requiring sandbox! "
                "Sandbox keys MUST start with 'ss_inv_sbx_'."
            )
            
        self.session = requests.Session()
        self.session.headers.update({
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Geekorium-Sync/1.0"
        })
        logger.info(f"Initialized SortSwiftClient (Sandbox: {self.is_sandbox})")

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10),
           retry=retry_if_exception_type((requests.exceptions.ConnectionError, requests.exceptions.Timeout)))
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        url = f"{self.BASE_URL}{endpoint}" if endpoint.startswith("/") else f"{self.BASE_URL}/{endpoint}"
        kwargs.setdefault("timeout", 15)
        
        response = self.session.request(method, url, **kwargs)
        
        if response.status_code == 204:
            return {}
            
        try:
            data = response.json()
        except Exception:
            data = {"raw_text": response.text}
            
        if response.status_code >= 400:
            err_msg = data.get("message") or data.get("error", {}).get("message") or f"HTTP {response.status_code}"
            logger.error(f"SortSwift API {method} {endpoint} failed [{response.status_code}]: {err_msg}")
            raise SortSwiftAPIError(err_msg, status_code=response.status_code, details=data)
            
        return data

    def get_health(self) -> Dict[str, Any]:
        """Check inventory API health status."""
        url = "https://inventory-api.sortswift.com/health"
        r = requests.get(url, timeout=5)
        return r.json()

    def get_inventory(self, include_zero: bool = True, limit: int = 100, cursor: Optional[str] = None) -> Dict[str, Any]:
        """Fetch full or incremental inventory grouped by catalog product."""
        params = {"includeZeroQuantity": str(include_zero).lower(), "limit": limit}
        if cursor:
            params["cursor"] = cursor
        return self._request("GET", "/api-key/inventory", params=params)

    def get_raw_cards(self, updated_after: Optional[str] = None, limit: int = 100,
                      cursor: Optional[str] = None, include_deleted: bool = False) -> Dict[str, Any]:
        """List and incrementally synchronise granular RAW cards."""
        params = {"limit": limit, "includeDeleted": str(include_deleted).lower()}
        if updated_after:
            params["updatedAfter"] = updated_after
        if cursor:
            params["cursor"] = cursor
        return self._request("GET", "/api-key/raw-cards", params=params)

    def get_raw_card(self, raw_card_id: str) -> Dict[str, Any]:
        """Fetch one single RAW card by its SortSwift ID."""
        return self._request("GET", f"/api-key/raw-cards/{raw_card_id}")

    def patch_raw_card(self, raw_card_id: str, external_id: Optional[str] = None, barcode: Optional[str] = None) -> Dict[str, Any]:
        """
        Attach Geekorium UUID (externalId) and store barcode to a SortSwift RAW card.
        This enables two-way synchronization and barcode gun scanning.
        """
        payload = {}
        if external_id is not None:
            payload["externalId"] = external_id
        if barcode is not None:
            payload["barcode"] = barcode
            
        if not payload:
            return {}
            
        return self._request("PATCH", f"/api-key/raw-cards/{raw_card_id}", json=payload)

    def reserve_card(self, raw_card_id: str, external_reservation_id: str,
                     duration_minutes: int = 15) -> Dict[str, Any]:
        """
        Reserve one physical card on SortSwift during web checkout.
        Expires automatically after duration_minutes.
        """
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)).isoformat()
        payload = {
            "rawCardId": raw_card_id,
            "externalReservationId": external_reservation_id,
            "expiresAt": expires_at
        }
        return self._request("POST", "/api-key/raw-card-reservations", json=payload)

    def release_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Release a reservation, returning the card to the sellable pool."""
        return self._request("DELETE", f"/api-key/raw-card-reservations/{reservation_id}")

    def commit_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Commit a reservation permanently (deducts stock) once order is paid/confirmed."""
        return self._request("POST", f"/api-key/raw-card-reservations/{reservation_id}/commit", json={})

    def deduct_card(self, raw_card_id: str, reference_id: str) -> Dict[str, Any]:
        """
        Direct POS sale deduction: reserves for 5 min and immediately commits.
        Used when a physical in-store sale occurs without a prior web checkout reservation.
        """
        res = self.reserve_card(raw_card_id, external_reservation_id=f"pos_direct_{reference_id}", duration_minutes=5)
        res_id = res.get("id")
        if not res_id:
            return res
        return self.commit_reservation(res_id)

    def reset_sandbox(self) -> Dict[str, Any]:
        """Reset the sandbox fixture back to its documented pristine test state."""
        if not self.is_sandbox:
            raise ValueError("reset_sandbox can only be invoked with a Sandbox API key (ss_inv_sbx_).")
        return self._request("POST", "/api-key/sandbox/reset", json={})
