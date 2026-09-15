from fastapi import APIRouter
from pydantic import BaseModel

from services.chat_service import ChatService

router = APIRouter()

chat_service = ChatService()


class ChatRequest(BaseModel):
    message: str
    language: str = "en"


class ChatResponse(BaseModel):
    response: str


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    answer = chat_service.answer(
        request.message,
        language=request.language,
    )

    return {
        "response": answer
    }