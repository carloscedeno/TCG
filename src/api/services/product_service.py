from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from ..utils.supabase_client import supabase

class ProductService:
    @staticmethod
    async def get_products(
        q: Optional[str] = None,
        game: Optional[str] = None,
        in_stock: bool = True,
        limit: int = 50,
        offset: int = 0,
        sort: str = "newest"
    ) -> Dict[str, Any]:
        try:
            query = supabase.table('products').select('*', count='planned')
            
            if q:
                query = query.ilike('name', f'%{q}%')
            
            if game:
                query = query.eq('game', game)
                
            if in_stock:
                query = query.gt('stock', 0)
            
            # Sorting
            if sort == "price_asc":
                query = query.order('price', desc=False)
            elif sort == "price_desc":
                query = query.order('price', desc=True)
            elif sort == "newest":
                query = query.order('created_at', desc=True)
            else:
                query = query.order('name', desc=False)
                
            query = query.range(offset, offset + limit - 1)
            response = query.execute()
            
            return {
                "products": response.data,
                "total_count": response.count or 0
            }
        except Exception as e:
            print(f"❌ [ProductService Error]: {e}")
            raise HTTPException(status_code=500, detail=str(e))
