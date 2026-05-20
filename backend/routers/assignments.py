from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from core.supabase_client import get_supabase

router = APIRouter()

class AssignmentsIn(BaseModel):
    ekadashi_id: str
    reference_item_id: str
    registration_id: str
    slot_detail: Optional[str] = None

@router.post("/")
async def assignSlot(payload: AssignmentsIn):
    db = get_supabase()

    asn_result = db.table("assignments").insert({
        "ekadashi_id": payload.ekadashi_id,
        "reference_item_id": payload.reference_item_id,
        "registration_id": payload.registration_id,
        "slot_detail": payload.slot_detail,
    }).execute()

    if not asn_result.data:
        raise HTTPException(status_code=500, detail="Failed to create assignment")

    return asn_result.data[0]

@router.get("/ekadashi/{ekadashi_id}")
async def get_assignments(ekadashi_id : str):
    db = get_supabase()

    res = db.table("assignments").select(
        "*, reference_items(title, section, order_index), registrations(first_name, last_name)"
    ).eq("ekadashi_id", ekadashi_id).execute()
    return res.data


@router.delete("/{assignment_id}")
async def remove_assignment(assignment_id: str):
    db = get_supabase()

    del_res = db.table("assignments").delete().eq("id", assignment_id).execute()
    if not del_res.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return {"success": True}




