from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from ..services.email_service import EmailService
from ...core.config import settings

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class CheckoutNotificationRequest(BaseModel):
    order_id: str
    user_email: Optional[str] = None
    admin_email: Optional[str] = None
    order_total: float
    items: List[Dict[str, Any]]
    current_user_id: Optional[str] = "guest"

@router.post("/checkout")
async def send_checkout_notifications(request: CheckoutNotificationRequest, background_tasks: BackgroundTasks):
    """
    Triggers asynchronous email notifications for a completed checkout.
    """
    try:
        # 1. Send Order Confirmation to Buyer
        if request.user_email:
            background_tasks.add_task(
                EmailService.send_order_confirmation,
                user_email=request.user_email,
                order_id=request.order_id,
                order_total=request.order_total,
                items=request.items
            )
        
        # 2. Send New Order Alert to Admin
        admin_notifier_email = request.admin_email or settings.EMAILS_FROM_EMAIL
        if admin_notifier_email:
            background_tasks.add_task(
                EmailService.send_new_order_notification,
                admin_email=admin_notifier_email,
                order_id=request.order_id,
                current_user_id=request.current_user_id or "guest",
                order_total=request.order_total,
                items=request.items
            )

        return {"success": True, "message": "Notifications queued"}
    except Exception as e:
        print(f"Error queueing notifications: {e}")
        # We don't want to fail the checkout if notifications fail, but we should log it
        raise HTTPException(status_code=500, detail=f"Failed to queue notifications: {str(e)}")
