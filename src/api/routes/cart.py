from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from ..services.cart_service import CartService
from ..utils.supabase_client import supabase # For Auth verify in MVP

router = APIRouter(prefix="/api/cart", tags=["Cart"])

class CartAddRequest(BaseModel):
    printing_id: str
    quantity: int = 1

async def get_current_user_id(authorization: Optional[str] = Header(None)):
    """Extracts user ID from Supabase JWT or returns demo ID."""
    if not authorization or not authorization.startswith("Bearer "):
        return "00000000-0000-0000-0000-000000000000"
    
    token = authorization.split(" ")[1]
    try:
        # Verify with Supabase (or just decode since Supabase client does it)
        user = supabase.auth.get_user(token)
        if user and user.user:
            return str(user.user.id)
    except Exception as e:
        print(f"Auth error: {e}")
        
    return "00000000-0000-0000-0000-000000000000"

@router.get("/")
async def get_cart(user_id: str = Depends(get_current_user_id)):
    items = await CartService.get_cart_items(user_id)
    return {"items": items}

@router.post("/add")
async def add_to_cart(request: CartAddRequest, user_id: str = Depends(get_current_user_id)):
    return await CartService.add_to_cart(user_id, request.printing_id, request.quantity)

@router.post("/checkout")
async def checkout(user_id: str = Depends(get_current_user_id)):
    return await CartService.checkout(user_id)
