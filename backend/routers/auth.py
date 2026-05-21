from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from core.supabase_client import get_supabase
from core.auth import verify_password, create_access_token, get_current_admin

router = APIRouter()

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_supabase()
    
    result = db.table("admins").select("*").eq("email", form_data.username).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    admin = result.data[0]
    if not verify_password(form_data.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": admin["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": {"id": admin["id"], "name": admin["name"], "email": admin["email"]}
    }

@router.get("/me")
async def me(current_admin: dict = Depends(get_current_admin)):
    return current_admin