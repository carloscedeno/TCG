from fastapi import APIRouter, Query
from typing import Optional
from ..services.product_service import ProductService

router = APIRouter(prefix="/api/products", tags=["Inventory"])

@router.get("")
async def get_products(
    q: Optional[str] = Query(None, description="Search products"),
    game: Optional[str] = Query(None, description="Game filter"),
    in_stock: bool = Query(True, description="Only items in stock"),
    limit: int = Query(50, description="Limit results"),
    offset: int = Query(0, description="Offset"),
    sort: str = Query("newest", description="Sort: newest, name, price_asc, price_desc")
):
    return await ProductService.get_products(q, game, in_stock, limit, offset, sort)
