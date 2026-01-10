from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
import os
from ..services.admin_service import AdminService

router = APIRouter(prefix="/api/webhook", tags=["Webhooks"])

@router.post("/sync")
async def public_sync_webhook(token: str = Query(...), game_code: str = "MTG"):
    """
    Public webhook (protected by token) to trigger syncs.
    Useful for GitHub Actions or external cron services.
    """
    expected_token = os.getenv("SYNC_WEBHOOK_TOKEN")
    if not expected_token or token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid sync token")
    
    return await AdminService.run_sync(game_code)
