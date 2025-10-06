from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List
from app import models, database, auth
from app.models import User

router = APIRouter()
db = database.SessionLocal()

class ScoreCreate(BaseModel):
    task_id: int
    score: int

class LeaderboardEntry(BaseModel):
    user_name: str
    total_score: int
    task_count: int

@router.post("/save")
def save_score(score_data: ScoreCreate, current_user: User = Depends(auth.get_current_user)):
    """Save a score for the current user"""
    
    # Validate score range
    if score_data.score < 0 or score_data.score > 100:
        raise HTTPException(status_code=400, detail="Score must be between 0 and 100")
    
    # Check if task exists
    task = db.query(models.Task).filter(models.Task.id == score_data.task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Create new result record
    new_result = models.Result(
        user_id=current_user.id,
        task_id=score_data.task_id,
        score=score_data.score
    )
    
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    
    return {"message": "Score saved successfully", "score": score_data.score}

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(limit: int = 10):
    """Get top users by total score"""
    
    # Query to get total scores per user
    leaderboard_query = (
        db.query(
            models.User.name.label('user_name'),
            func.sum(models.Result.score).label('total_score'),
            func.count(models.Result.id).label('task_count')
        )
        .join(models.Result, models.User.id == models.Result.user_id)
        .group_by(models.User.id, models.User.name)
        .order_by(func.sum(models.Result.score).desc())
        .limit(limit)
        .all()
    )
    
    return [
        LeaderboardEntry(
            user_name=entry.user_name,
            total_score=entry.total_score or 0,
            task_count=entry.task_count or 0
        )
        for entry in leaderboard_query
    ]

@router.get("/my-total")
def get_my_total_score(current_user: User = Depends(auth.get_current_user)):
    """Get current user's total score"""
    
    total_score = (
        db.query(func.sum(models.Result.score))
        .filter(models.Result.user_id == current_user.id)
        .scalar()
    ) or 0
    
    task_count = (
        db.query(func.count(models.Result.id))
        .filter(models.Result.user_id == current_user.id)
        .scalar()
    ) or 0
    
    return {
        "total_score": total_score,
        "task_count": task_count,
        "user_name": current_user.name
    }