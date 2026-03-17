from sqlalchemy.orm import Session
from models import UserProfile
from schemas import UserProfileCreate, UserProfileUpdate
from datetime import datetime


SINGLE_USER_ID = 1


def get_or_create_profile(db: Session) -> UserProfile:
    """Always work with user id=1 (single-user app)."""
    profile = db.query(UserProfile).filter(UserProfile.id == SINGLE_USER_ID).first()
    if not profile:
        profile = UserProfile(id=SINGLE_USER_ID)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


def update_profile(db: Session, updates: UserProfileUpdate) -> UserProfile:
    profile = get_or_create_profile(db)

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


def profile_to_dict(profile: UserProfile) -> dict:
    return {
        "id": profile.id,
        "height": profile.height,
        "weight": profile.weight,
        "body_type": profile.body_type,
        "skin_tone": profile.skin_tone,
        "age_range": profile.age_range,
        "budget_range": profile.budget_range,
        "style_preferences": profile.style_preferences,
        "created_at": profile.created_at.isoformat() if profile.created_at else None,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
    }


def calculate_completeness(profile: UserProfile) -> int:
    """Return an integer 0-100 representing how complete the profile is."""
    fields = [
        profile.height,
        profile.weight,
        profile.body_type,
        profile.skin_tone,
        profile.age_range,
        profile.budget_range,
        profile.style_preferences,
    ]
    filled = sum(1 for f in fields if f is not None and str(f).strip() != "")
    return round((filled / len(fields)) * 100)
