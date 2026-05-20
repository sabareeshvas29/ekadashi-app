from fastapi import APIRouter, HTTPException
from core.supabase_client import get_supabase

router = APIRouter()

@router.get("/{ekadashi_id}")
async def get_schedule(ekadashi_id: str):
    db = get_supabase()

    ek = db.table("ekadashi").select("*").eq("id", ekadashi_id).single().execute()
    if not ek.data:
        raise HTTPException(status_code=404, detail="Ekadashi not found")

    assignments = db.table("assignments").select(
        "*, reference_items(id, title, section, order_index), registrations(first_name, last_name)"
    ).eq("ekadashi_id", ekadashi_id).execute()

    grouped = {}
    for a in assignments.data:
        ri = a["reference_items"]
        ref_id = ri["id"]

        if ref_id not in grouped:
            grouped[ref_id] = {
                "title": ri["title"],
                "section": ri["section"],
                "order_index": ri["order_index"],
                "slots": []
            }

        reg = a["registrations"]
        grouped[ref_id]["slots"].append({
            "assignment_id": a["id"],
            "person_name": f"{reg['first_name']} {reg['last_name']}",
            "slot_detail": a["slot_detail"]
        })

    sections = sorted(grouped.values(), key=lambda x: x["order_index"])

    return {
        "ekadashi": ek.data,
        "sections": sections
    }