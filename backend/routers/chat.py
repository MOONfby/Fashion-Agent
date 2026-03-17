from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import ConversationHistory
from schemas import ChatRequest, ChatResponse, MessageResponse
from services.claude_service import claude_service
from services.profile_service import get_or_create_profile, profile_to_dict
from typing import List

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def send_message(request: ChatRequest, db: Session = Depends(get_db)):
    # Load user profile
    profile = get_or_create_profile(db)
    user_profile_dict = profile_to_dict(profile)

    # Load recent conversation history (last 10 messages for Claude context)
    history_records = (
        db.query(ConversationHistory)
        .order_by(ConversationHistory.created_at.asc())
        .limit(10)
        .all()
    )

    # Convert to Claude-format message list
    conversation_history = [
        {"role": rec.role, "content": rec.content}
        for rec in history_records
    ]

    # Call Claude
    try:
        reply = await claude_service.chat(
            message=request.message,
            conversation_history=conversation_history,
            user_profile=user_profile_dict,
            image_base64=request.image_base64,
            image_media_type=request.image_media_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Claude API error: {str(e)}")

    # Save user message to DB
    user_msg = ConversationHistory(
        user_id=profile.id,
        role="user",
        content=request.message,
        has_image=bool(request.image_base64),
    )
    db.add(user_msg)

    # Save assistant reply to DB
    assistant_msg = ConversationHistory(
        user_id=profile.id,
        role="assistant",
        content=reply,
        has_image=False,
    )
    db.add(assistant_msg)
    db.commit()

    return ChatResponse(reply=reply)


@router.get("/history", response_model=List[MessageResponse])
def get_history(db: Session = Depends(get_db)):
    records = (
        db.query(ConversationHistory)
        .order_by(ConversationHistory.created_at.asc())
        .limit(20)
        .all()
    )
    return records


@router.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    deleted = db.query(ConversationHistory).delete()
    db.commit()
    return {"message": f"已清除 {deleted} 条对话记录"}
