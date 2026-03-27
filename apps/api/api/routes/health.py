from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "service": "bharatbi-api", "timestamp": datetime.utcnow().isoformat()}