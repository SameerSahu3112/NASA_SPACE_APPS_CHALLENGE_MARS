"""
MIRA AI Copilot API Route
Endpoint: /api/copilot/chat
"""

from fastapi import APIRouter, HTTPException
import httpx

from app.schemas.copilot import CopilotChatRequest, CopilotChatResponse
from app.services.ai_copilot_service import process_copilot_chat

router = APIRouter(prefix="/copilot", tags=["copilot"])

@router.post("/chat", response_model=CopilotChatResponse)
async def chat_copilot(req: CopilotChatRequest):
    """
    Handles MIRA AI Copilot inquiries, natural language action recognition,
    scientific grounding, and speech normalization in Python.
    """
    try:
        async with httpx.AsyncClient(timeout=14.0) as client:
            resp = await process_copilot_chat(req, client=client)
            return resp
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot service error: {str(e)}")
