from fastapi import APIRouter, Depends, Header, HTTPException, Body
from typing import List, Dict, Any, Optional
from ..services.collection_service import CollectionService
from ..services.admin_service import AdminService

router = APIRouter(prefix="/api/collections", tags=["Collections"])

async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    # In production, validate JWT. For local/demo, we use the token as user_id.
    # Note: AdminService has a verify_admin, we can use a simpler one here.
    from ..utils.supabase_client import supabase
    try:
        # print(f"Validating token: {authorization[:20]}...") 
        user_resp = supabase.auth.get_user(authorization.replace("Bearer ", ""))
        # print(f"User validated: {user_resp.user.id}")
        return user_resp.user.id
    except Exception as e:
        print(f"Auth Error: {type(e).__name__}: {e}")
        # If token is invalid or missing, we must fail here to avoid 
        # foreign key constraint errors in the database later.
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

@router.get("/")
async def get_collection(user_id: str = Depends(get_current_user)):
    return await CollectionService.get_user_collection(user_id)

@router.post("/import")
async def import_collection(
    import_type: str = 'collection',
    data: List[Dict[str, Any]] = Body(...),
    mapping: Dict[str, str] = Body(...),
    user_id: str = Depends(get_current_user)
):
    return await CollectionService.import_data(user_id, data, mapping, import_type)

@router.patch("/{item_id}")
async def update_item(
    item_id: str,
    quantity: int = Body(..., embed=True),
    condition: Optional[str] = Body(None, embed=True),
    user_id: str = Depends(get_current_user)
):
    return await CollectionService.update_item(user_id, item_id, quantity, condition)

@router.delete("/{item_id}")
async def delete_item(item_id: str, user_id: str = Depends(get_current_user)):
    return await CollectionService.remove_item(user_id, item_id)
