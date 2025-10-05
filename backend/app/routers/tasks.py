from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app import models, database

router = APIRouter()
db = database.SessionLocal()

class TaskCreate(BaseModel):
    title: str
    description: str
    subject: str
    class_grade: int
    difficulty: str

# Diákok: feladatok listázása
@router.get("/", response_model=List[TaskCreate])
def get_tasks():
    tasks = db.query(models.Task).all()
    return tasks

# Admin: feladat létrehozás
@router.post("/")
def create_task(task: TaskCreate):
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

# Admin: feladat törlés
@router.delete("/{task_id}")
def delete_task(task_id: int):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}

# Diák: feladat részletek
@router.get("/{task_id}", response_model=TaskCreate)
def get_task(task_id: int):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
