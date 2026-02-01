import unittest
import asyncio
from src.api.services.cart_service import CartService
from src.api.services.collection_service import CollectionService
from src.api.utils.supabase_client import supabase
from fastapi import HTTPException

class TestCommerceFlow(unittest.TestCase):
    def setUp(self):
        self.user_id = "test-auth-user"
        self.printing_id = "00000000-0000-0000-0000-000000000000" # Dummy valid UUID if needed, but we use a real one in the test
        # Get a real printing_id from the DB for the test
        res = supabase.table('card_printings').select('printing_id').limit(1).execute()
        if res.data:
            self.printing_id = res.data[0]['printing_id']
        
    def test_01_cart_and_checkout(self):
        loop = asyncio.get_event_loop()
        
        # 1. Add to cart
        async def run_flow():
            # Clear cart first
            carts = supabase.table('carts').select('id').eq('user_id', self.user_id).execute()
            if carts.data:
                supabase.table('cart_items').delete().eq('cart_id', carts.data[0]['id']).execute()
            
            # Create a product with correct schema
            print("Creating test product...")
            prod_res = supabase.table('products').upsert({
                'printing_id': self.printing_id,
                'name': 'Test Lightning Bolt',
                'price': 100.0,
                'stock': 10,
                'game': 'MTG'
            }).execute()
            product_id = prod_res.data[0]['id']
            
            # Add item
            print(f"Adding product {product_id} to cart...")
            cart = await CartService.add_to_cart(self.user_id, product_id, 2)
            self.assertIsNotNone(cart)
            
            # 2. Checkout
            print("Processing checkout...")
            order_data = await CartService.checkout(self.user_id)
            self.assertTrue(order_data['success'])
            self.assertEqual(order_data['total'], 200.0)
            
            # 3. Verify stock reduced
            prod = supabase.table('products').select('stock').eq('id', product_id).execute().data[0]
            print(f"Verified stock: {prod['stock']}")
            self.assertEqual(prod['stock'], 8)
            
            # 4. Cleanup (Simple)
            supabase.table('orders').delete().eq('id', order_data['order_id']).execute()
            
            return True

        success = loop.run_until_complete(run_flow())
        self.assertTrue(success)

class TestInventoryManagement(unittest.TestCase):
    def setUp(self):
        self.user_id = "test-auth-user"
        self.printing_id = 952

    def test_inventory_crud(self):
        loop = asyncio.get_event_loop()
        
        async def run_crud():
            # 1. Add via import (simulated)
            print("Importing to collection...")
            res = await CollectionService.import_data(self.user_id, 
                [{'name': 'Lightning Bolt', 'quantity': 4, 'set': 'LEA', 'price': 5.0}], 
                {'name': 'name', 'quantity': 'quantity', 'set': 'set', 'price': 'price'}
            )
            self.assertTrue(res['success'])
            
            # Get item id
            item = supabase.table('user_collections').select('id').eq('user_id', self.user_id).execute().data[0]
            item_id = item['id']
            
            # 2. Update quantity
            print(f"Updating item {item_id}...")
            updated = await CollectionService.update_item(self.user_id, item_id, 10, "NM")
            self.assertEqual(updated['quantity'], 10)
            
            # 3. Delete
            print(f"Removing item {item_id}...")
            success = await CollectionService.remove_item(self.user_id, item_id)
            self.assertTrue(success)
            
            return True

        success = loop.run_until_complete(run_crud())
        self.assertTrue(success)

if __name__ == "__main__":
    unittest.main()
