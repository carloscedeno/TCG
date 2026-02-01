from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from ..utils.supabase_client import supabase

class CartService:
    @staticmethod
    async def get_or_create_cart(user_id: str) -> str:
        """Retrieves active cart ID or creates one if it doesn't exist."""
        try:
            res = supabase.table('carts').select('id').eq('user_id', user_id).execute()
            if res.data:
                return res.data[0]['id']
            
            new_cart = supabase.table('carts').insert({'user_id': user_id}).execute()
            return new_cart.data[0]['id']
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Cart retrieval error: {str(e)}")

    @staticmethod
    async def add_to_cart(user_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
        """Adds or updates an item in the cart."""
        cart_id = await CartService.get_or_create_cart(user_id)
        
        # Check stock first
        prod = supabase.table('products').select('stock').eq('id', product_id).single().execute()
        if not prod.data or prod.data['stock'] < quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        try:
            # Upsert into cart_items
            res = supabase.table('cart_items').upsert({
                'cart_id': cart_id,
                'product_id': product_id,
                'quantity': quantity
            }, on_conflict='cart_id,product_id').execute()
            
            return {"success": True, "item": res.data[0]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_cart_items(user_id: str) -> List[Dict[str, Any]]:
        """Retrieves items in the user's cart with product details."""
        cart_id = await CartService.get_or_create_cart(user_id)
        res = supabase.table('cart_items').select(
            'id, quantity, product_id, products(id, name, price, image_url, stock)'
        ).eq('cart_id', cart_id).execute()
        return res.data or []

    @staticmethod
    async def checkout(user_id: str) -> Dict[str, Any]:
        """Finalizes the purchase, reduces stock, and clears the cart."""
        items = await CartService.get_cart_items(user_id)
        if not items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        total = sum(item['quantity'] * item['products']['price'] for item in items)
        
        try:
            # 1. Create Order record
            order = supabase.table('orders').insert({
                'user_id': user_id,
                'total_amount': total,
                'status': 'completed'
            }).execute()
            
            # 2. Update Stock (Atomically if possible, but here we do it in a loop for MVP)
            for item in items:
                new_stock = item['products']['stock'] - item['quantity']
                supabase.table('products').update({'stock': new_stock}).eq('id', item['product_id']).execute()
            
            # 3. Clear Cart
            cart_id = items[0]['cart_id'] if 'cart_id' in items[0] else None # Need to fix select above to include cart_id
            # Re-fetch cart_id since it wasn't in the select
            cart_id = await CartService.get_or_create_cart(user_id)
            supabase.table('cart_items').delete().eq('cart_id', cart_id).execute()
            
            return {"success": True, "order_id": order.data[0]['id'], "total": total}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")
