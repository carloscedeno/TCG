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
        
        # Check stock first (try by id or printing_id)
        res = supabase.table('products').select('*').eq('id', product_id).execute()
        if not res.data:
            res = supabase.table('products').select('*').eq('printing_id', product_id).execute()
            
        if not res.data:
            raise HTTPException(status_code=400, detail="Product not found in inventory")
        
        prod = res.data[0]
        if prod['stock'] < quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")

        try:
            # Upsert into cart_items using the actual internal product UUID
            actual_product_id = prod['id']
            res_item = supabase.table('cart_items').upsert({
                'cart_id': cart_id,
                'product_id': actual_product_id,
                'quantity': quantity
            }, on_conflict='cart_id,product_id').execute()
            
            return {"success": True, "item": res_item.data[0]}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    async def get_cart_items(user_id: str) -> List[Dict[str, Any]]:
        """Retrieves items in the user's cart with product details."""
        cart_id = await CartService.get_or_create_cart(user_id)
        res = supabase.table('cart_items').select(
            'id, quantity, product_id, cart_id, products(id, name, price, image_url, stock)'
        ).eq('cart_id', cart_id).execute()
        return res.data or []

    @staticmethod
    async def checkout(user_id: str) -> Dict[str, Any]:
        """Finalizes the purchase, records items, reduces stock, and clears the cart."""
        items = await CartService.get_cart_items(user_id)
        if not items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        total = sum(item['quantity'] * item['products']['price'] for item in items)
        
        try:
            # 1. Create Order record
            order_res = supabase.table('orders').insert({
                'user_id': user_id,
                'total_amount': total,
                'status': 'completed'
            }).execute()
            
            order_id = order_res.data[0]['id']

            # 2. Record Order Items (New Step)
            order_items_payload = []
            for item in items:
                order_items_payload.append({
                    'order_id': order_id,
                    'product_id': item['product_id'],
                    'quantity': item['quantity'],
                    'price_at_purchase': item['products']['price']
                })
            
            if order_items_payload:
                supabase.table('order_items').insert(order_items_payload).execute()
            
            # 3. Update Stock (Atomically if possible, but here we do it in a loop for MVP)
            for item in items:
                new_stock = item['products']['stock'] - item['quantity']
                supabase.table('products').update({'stock': new_stock}).eq('id', item['product_id']).execute()
            
            # 4. Clear Cart
            # Re-fetch cart_id since we need to ensure we have it
            cart_id = items[0]['cart_id']
            supabase.table('cart_items').delete().eq('cart_id', cart_id).execute()
            
            return {"success": True, "order_id": order_id, "total": total}
        except Exception as e:
            # In a real app, we'd want a transaction or rollback mechanism here
            raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")
