from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── UserProfile ────────────────────────────────────────────────────────────

class UserProfileCreate(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    body_type: Optional[str] = None
    skin_tone: Optional[str] = None
    age_range: Optional[str] = None
    budget_range: Optional[str] = None
    style_preferences: Optional[str] = None  # JSON string


class UserProfileUpdate(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    body_type: Optional[str] = None
    skin_tone: Optional[str] = None
    age_range: Optional[str] = None
    budget_range: Optional[str] = None
    style_preferences: Optional[str] = None  # JSON string


class UserProfileResponse(BaseModel):
    id: int
    height: Optional[float] = None
    weight: Optional[float] = None
    body_type: Optional[str] = None
    skin_tone: Optional[str] = None
    age_range: Optional[str] = None
    budget_range: Optional[str] = None
    style_preferences: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── ConversationHistory ─────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    role: str
    content: str
    has_image: bool = False
    image_path: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    role: str
    content: str
    has_image: bool
    image_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    image_base64: Optional[str] = None
    image_media_type: Optional[str] = None   # e.g. "image/jpeg"


class ChatResponse(BaseModel):
    reply: str
    updated_profile: Optional[dict] = None


# ─── Profile photo analysis ──────────────────────────────────────────────────

class PhotoAnalysisRequest(BaseModel):
    image_base64: str
    image_media_type: str


class PhotoAnalysisResponse(BaseModel):
    body_type: Optional[str] = None
    skin_tone: Optional[str] = None
    analysis_text: str
