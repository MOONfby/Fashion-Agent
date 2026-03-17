from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import UserProfileResponse, UserProfileUpdate, PhotoAnalysisRequest, PhotoAnalysisResponse
from services.profile_service import (
    get_or_create_profile,
    update_profile,
    profile_to_dict,
    calculate_completeness,
)
from services.claude_service import claude_service

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=UserProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    profile = get_or_create_profile(db)
    return profile


@router.put("", response_model=UserProfileResponse)
def put_profile(updates: UserProfileUpdate, db: Session = Depends(get_db)):
    profile = update_profile(db, updates)
    return profile


@router.get("/completeness")
def get_completeness(db: Session = Depends(get_db)):
    profile = get_or_create_profile(db)
    score = calculate_completeness(profile)
    return {"completeness": score}


@router.post("/analyze-photo", response_model=PhotoAnalysisResponse)
async def analyze_photo(request: PhotoAnalysisRequest, db: Session = Depends(get_db)):
    try:
        result = await claude_service.analyze_image_for_profile(
            image_base64=request.image_base64,
            image_media_type=request.image_media_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Photo analysis error: {str(e)}")

    # If Claude returned body_type or skin_tone, persist them automatically
    if result.get("body_type") or result.get("skin_tone"):
        update_data = UserProfileUpdate(
            body_type=result.get("body_type"),
            skin_tone=result.get("skin_tone"),
        )
        update_profile(db, update_data)

    return PhotoAnalysisResponse(
        body_type=result.get("body_type"),
        skin_tone=result.get("skin_tone"),
        analysis_text=result.get("analysis_text", ""),
    )
