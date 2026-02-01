from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from ..services.cart_service import CartService
from ..utils.supabase_client import supabase # For Auth verify in MVP

router = APIRouter(prefix="/cart", tags=["Cart"])

# Simu-auth for MVP: In production, use standard FastAPI/Supabase JWT verification
def get_current_user_id():
    # Placeholder: In a real app, extract from Authorization header
    # For now, we expect a simple user_id header or similar for testing
    return "00000000-0000-0000-0000-000000000000" # Demo User

@router.get("/")
async def get_cart(user_id: str = Depends(get_current_user_id)):
    return await CartService.get_cart_items(user_id)

@router.post("/add")
async def add_to_cart(product_id: str, quantity: int = 1, user_id: str = Depends(get_current_user_id)):
    return await CartService.add_to_cart(user_id, product_id, quantity)

@router.post("/checkout")
async def checkout(user_id: str = Depends(get_current_user_id)):
    return await CartService.checkout(user_id)
