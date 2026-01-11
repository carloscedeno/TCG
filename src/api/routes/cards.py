from fastapi import APIRouter, Query
from typing import Optional
from ..services.card_service import CardService
from ..utils.supabase_client import supabase

router = APIRouter(prefix="/api", tags=["Cards"])

@router.get("/cards")
async def get_cards(
    q: Optional[str] = Query(None, description="Search query for card name"),
    game: Optional[str] = Query(None, description="Game code filter"),
    set: Optional[str] = Query(None, description="Set name filter"),
    rarity: Optional[str] = Query(None, description="Rarity filter"),
    color: Optional[str] = Query(None, description="Color filter"),
    type: Optional[str] = Query(None, description="Card type filter"),
    limit: int = Query(50, description="Limit results"),
    offset: int = Query(0, description="Offset results")
):
    return await CardService.get_cards(q, game, set, rarity, color, type, limit, offset)

@router.get("/cards/{printing_id}")
async def get_card_details(printing_id: str):
    return await CardService.get_card_details(printing_id)

@router.get("/sets")
async def get_sets(
    game_code: Optional[str] = Query(None, description="Game code filter")
):
    try:
        query = supabase.table('sets').select('set_id, set_name, set_code, games(game_name, game_code)')
        if game_code:
            query = query.eq('games.game_code', game_code)
        response = query.execute()
        return {"sets": response.data}
    except Exception as e:
        return {"sets": [], "error": str(e)}
