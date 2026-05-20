from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

from core.supabase_client import get_supabase

router = APIRouter()

class ReferenceItemsIn(BaseModel):
    title: str
    section: Optional[str] = None
    is_volatile: bool = False
    is_splittable: bool = False
    split_config: Optional[dict] = None
    order_index: int

class EkadashiIn(BaseModel):
    title: str
    date: date
    start_time: str
    end_time: str
    reference_items: List[ReferenceItemsIn]

class EkadashiUpdate(BaseModel):
    is_registration_open: Optional[bool] = None

@router.post("/")
async def create_ekadashi(payload: EkadashiIn):
    db = get_supabase()

    if not payload.reference_items:
        raise HTTPException(status_code=400, detail="Reference items cannot be empty")

    ek_result = db.table("ekadashi").insert({
        "title": payload.title,
        "date": str(payload.date),
        "start_time": payload.start_time,
        "end_time": payload.end_time,
    }).execute()

    ekadashi_id = ek_result.data[0]["id"]

    items = [
        {**item.model_dump(), "ekadashi_id": ekadashi_id}
        for item in payload.reference_items
    ]
    db.table("reference_items").insert(items).execute()

    return {"id": ekadashi_id}

@router.get("/", name="List open ekadashis")
async def get_all_ek():
    db = get_supabase()

    ek = db.table("ekadashi").select("*").eq("is_registration_open", True).order("date", desc=True).execute()    
    return ek.data

@router.get("/all", name="List all ekadashis")
async def get_all():
    db = get_supabase()
    ek = db.table("ekadashi").select("*").order("date", desc=True).execute()
    return ek.data


@router.get("/{ekadashi_id}")
async def get_ekadashi(ekadashi_id: str):
    db = get_supabase()

    ek = db.table("ekadashi").select("*").eq("id", ekadashi_id).single().execute()
    if not ek.data:
        raise HTTPException(status_code=404, detail="Ekadashi not found")
    
    
    items = db.table("reference_items").select("*").eq("ekadashi_id", ekadashi_id).order("order_index").execute()
    return {**ek.data, "reference_items": items.data}

@router.get("/{ekadashi_id}/signups")
async def get_signups(ekadashi_id: str):
    db = get_supabase()
    ppl = db.table("registration_items").select("*, registrations(first_name, last_name)").eq("registrations.ekadashi_id", ekadashi_id).execute()

    signup_map = {}
    for row in ppl.data:
        ref_id = row["reference_item_id"]
        if ref_id not in signup_map:
            signup_map[ref_id] = []
        reg = row["registrations"]
        signup_map[ref_id].append({
            "registration_id": row["registration_id"],
            "name": f"{reg['first_name']} {reg['last_name']}"
    })
        
    items = db.table("reference_items").select("*").eq("ekadashi_id", ekadashi_id).order("order_index").execute()

    return [
        {**item, "signups": signup_map.get(item["id"], [])}
        for item in items.data
    ]


@router.patch("/{ekadashi_id}")
async def upd_ek(ekadashi_id: str, payload: EkadashiUpdate):
    db = get_supabase()

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = db.table("ekadashi").update(updates).eq("id", ekadashi_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Ekadashi not found")
    return result.data[0]
    



