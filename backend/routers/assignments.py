from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from core.supabase_client import get_supabase

router = APIRouter()