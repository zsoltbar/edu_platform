from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app import models, database
# from app.auth import get_current_user  # Temporarily disabled

router = APIRouter()

# Dependency to get database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class TaskCreate(BaseModel):
    id: int = None
    title: str
    description: str
    subject: str
    class_grade: int
    difficulty: str

# Diákok: feladatok listázása
@router.get("/", response_model=List[TaskCreate])
def get_tasks(db: Session = Depends(get_db)):
    try:
        tasks = db.query(models.Task).all()
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tasks: {str(e)}")

# Admin: feladat létrehozás
@router.post("/")
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    try:
        new_task = models.Task(
            title=task.title,
            description=task.description,
            subject=task.subject,
            class_grade=task.class_grade,
            difficulty=task.difficulty,
            created_by=1  # Admin ID (később JWT-ből)
        )
        db.add(new_task)
        db.commit()
        db.refresh(new_task)
        return {"message": "Task created successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

# Admin: feladat módosítása
@router.put("/{task_id}")
def update_task(task_id: int, task: TaskCreate, db: Session = Depends(get_db)):
    try:
        existing_task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not existing_task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        existing_task.title = task.title
        existing_task.description = task.description
        existing_task.subject = task.subject
        existing_task.class_grade = task.class_grade
        existing_task.difficulty = task.difficulty
        db.commit()
        return {"message": "Task updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

# Admin: feladat törlés
@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    try:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        db.delete(task)
        db.commit()
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

# Diák: feladat részletek
@router.get("/{task_id}", response_model=TaskCreate)
def get_task(task_id: int, db: Session = Depends(get_db)):
    try:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching task: {str(e)}")
