from fastapi import APIRouter

from models.schemas import AbstractRequest, AbstractResponse
from services.semantic import fetch_abstract


router = APIRouter()


@router.post("/abstract", response_model=AbstractResponse)
async def get_abstract(req: AbstractRequest):
    return await fetch_abstract(doi=req.doi, title=req.title)
