from fastapi import APIRouter, Depends, Header, HTTPException, Query
from typing import Optional
from ..services.admin_service import AdminService
import os

router = APIRouter(prefix="/api/admin", tags=["Admin"])

async def get_current_admin(authorization: str = Header(None)):
    return await AdminService.verify_admin(authorization)

@router.get("/stats")
async def get_stats(admin_id: str = Depends(get_current_admin)):
    return await AdminService.get_stats()

@router.post("/catalog/sync/{game_code}")
async def sync_catalog(game_code: str, admin_id: str = Depends(get_current_admin)):
    return await AdminService.run_sync(game_code)

@router.get("/tasks")
async def list_tasks(admin_id: str = Depends(get_current_admin)):
    return AdminService.list_tasks()

@router.get("/tasks/{task_id}/logs")
async def get_task_logs(task_id: str, admin_id: str = Depends(get_current_admin)):
    task = AdminService.get_task_status(task_id)
    return {"id": task_id, "logs": task["logs"]}

@router.post("/scraper/run/{source}")
async def run_scraper(source: str, admin_id: str = Depends(get_current_admin)):
    return await AdminService.run_scraper(source, admin_id)
