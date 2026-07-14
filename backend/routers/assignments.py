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

class ReorderItem(BaseModel):
    assignment_id: str
    slot_order: int

class ReorderIn(BaseModel):
    items: List[ReorderItem]

@router.post("/")
async def assignSlot(payload: AssignmentsIn):
    db = get_supabase()

    slot = payload.slot_detail
    if not slot:
        ref = db.table("reference_items").select("title").eq("id", payload.reference_item_id).single().execute()
        if ref.data:
            slot = ref.data["title"]

    existing = db.table("assignments").select("slot_order") \
        .eq("reference_item_id", payload.reference_item_id) \
        .order("slot_order", desc=True).limit(1).execute()
    next_order = (existing.data[0]["slot_order"] + 1) if existing.data else 0

    asn_result = db.table("assignments").insert({
        "ekadashi_id": payload.ekadashi_id,
        "reference_item_id": payload.reference_item_id,
        "registration_id": payload.registration_id,
        "slot_detail": slot,
        "slot_order": next_order,
    }).execute()

    if not asn_result.data:
        raise HTTPException(status_code=500, detail="Failed to create assignment")

    return asn_result.data[0]

@router.get("/ekadashi/{ekadashi_id}")
async def get_assignments(ekadashi_id : str):
    db = get_supabase()

    res = db.table("assignments").select(
        "*, reference_items(title, section, order_index), registrations(first_name, last_name)"
    ).eq("ekadashi_id", ekadashi_id).order("slot_order").execute()
    return res.data

@router.patch("/reorder")
async def reorder_assignments(payload: ReorderIn):
    db = get_supabase()

    for item in payload.items:
        db.table("assignments").update({"slot_order": item.slot_order}).eq("id", item.assignment_id).execute()

    return {"success": True}


@router.delete("/{assignment_id}")
async def remove_assignment(assignment_id: str):
    db = get_supabase()

    del_res = db.table("assignments").delete().eq("id", assignment_id).execute()
    if not del_res.data:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return {"success": True}




