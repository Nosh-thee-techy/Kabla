from fastapi import APIRouter

from kabla.models import ChatRequest
from kabla.services.chat import answer

router = APIRouter(tags=["chat"])


@router.post("/chat")
def chat(body: ChatRequest) -> dict:
    return answer(body.question, body.contract_id, body.lang)
