from sqlalchemy import (
    Column, Integer, Float, String, Text, Boolean,
    DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    height = Column(Float, nullable=True)           # cm
    weight = Column(Float, nullable=True)           # kg
    body_type = Column(String, nullable=True)       # 沙漏型/苹果型/梨形/直筒型/倒三角型
    skin_tone = Column(String, nullable=True)       # 冷白/暖白/小麦/深色
    age_range = Column(String, nullable=True)       # 18-24/25-30/31-35/36-45/45+
    budget_range = Column(String, nullable=True)    # 经济/中等/高端
    style_preferences = Column(String, nullable=True)  # JSON array as string, e.g. '["简约","法式"]'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("ConversationHistory", back_populates="user")


class ConversationHistory(Base):
    __tablename__ = "conversation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=True)
    role = Column(String, nullable=False)     # "user" or "assistant"
    content = Column(Text, nullable=False)
    has_image = Column(Boolean, default=False)
    image_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserProfile", back_populates="conversations")


class StyleFavorite(Base):
    __tablename__ = "style_favorites"

    id = Column(Integer, primary_key=True, index=True)
    style_tag = Column(String, nullable=False)   # e.g. "法式", "极简"
    source = Column(String, nullable=False)      # "chat_feedback" or "inspiration"
    created_at = Column(DateTime, default=datetime.utcnow)
