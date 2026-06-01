from fastapi import APIRouter

from models.schemas import ResolveRequest, ResolveResponse
from services.crossref import resolve_doi


router = APIRouter()


@router.post("/resolve", response_model=ResolveResponse)
async def resolve(req: ResolveRequest):
    return await resolve_doi(req.doi)
