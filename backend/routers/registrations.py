from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from core.supabase_client import get_supabase

router = APIRouter()

class RegistrationIn(BaseModel):
    ekadashi_id: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    comments: Optional[str] = None
    reference_item_ids: List[str]
    song_requests: Optional[dict] = {}

@router.post("/")
async def to_register(payload: RegistrationIn):
    db = get_supabase()

    ek = db.table("ekadashi").select("is_registration_open").eq("id", payload.ekadashi_id).single().execute()
    if not ek.data or not ek.data["is_registration_open"]:
        raise HTTPException(status_code=400, detail="Registration is closed for this Ekadashi")
    

    reg_res = db.table("registrations").insert({
        "ekadashi_id": payload.ekadashi_id,
        "first_name" : payload.first_name,
        "last_name" : payload.last_name, 
        "phone": payload.phone,
        "comments": payload.comments,
    }).execute()
    
    if not reg_res.data:
        raise HTTPException(status_code=500, detail="Failed to create registration")

    reg_id = reg_res.data[0]["id"]

    items = [
        {
            "registration_id": reg_id,
            "reference_item_id": ref_id,
            "song_request": (payload.song_requests or {}).get(ref_id) or None,
        }
        for ref_id in payload.reference_item_ids
    ]
    if payload.reference_item_ids:
        db.table("registration_items").insert(items).execute()

    return {"success": True, "registration_id": reg_id}
