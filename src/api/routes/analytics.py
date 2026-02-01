from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..services.portfolio_service import PortfolioService
from ..services.alert_service import AlertService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Demo User ID for verification
DEFAULT_USER = "00000000-0000-0000-0000-000000000000"

@router.get("/portfolio")
async def get_portfolio_summary(user_id: str = DEFAULT_USER):
    return await PortfolioService.get_portfolio_analytics(user_id)

@router.get("/alerts")
async def list_alerts(user_id: str = DEFAULT_USER):
    return await AlertService.get_user_alerts(user_id)

@router.post("/alerts/create")
async def create_alert(printing_id: str, target: float, type: str, user_id: str = DEFAULT_USER):
    return await AlertService.create_alert(user_id, printing_id, target, type)

@router.post("/process-alerts")
async def trigger_alert_processing():
    """Admin endpoint to manually trigger alert check."""
    return await AlertService.process_all_alerts()
