from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app import models, database, auth
from app.models import User
from jose import jwt, JWTError

router = APIRouter()
db = database.SessionLocal()

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str

class UserRoleUpdate(BaseModel):
    role: str

class UserNameUpdate(BaseModel):
    name: str

class Config:
    orm_mode = True

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(auth.get_current_user)):
    return current_user

# Regisztráció
@router.post("/register")
def register(user: UserCreate):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(name=user.name, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

# Bejelentkezés
@router.post("/login")
def login(user: UserLogin):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = auth.create_access_token({"sub": db_user.email, "role": db_user.role})
    return {"access_token": token, "token_type": "bearer"}

# Admin endpoints
@router.get("/", response_model=List[UserOut])
def list_all_users(current_user: User = Depends(auth.get_current_user)):
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    users = db.query(models.User).all()
    return users

@router.delete("/{user_id}")
def delete_user(user_id: int, current_user: User = Depends(auth.get_current_user)):
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Prevent admin from deleting themselves
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user_to_delete = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user_to_delete)
    db.commit()
    return {"message": "User deleted successfully"}

@router.put("/{user_id}/role")
def update_user_role(user_id: int, role_update: UserRoleUpdate, current_user: User = Depends(auth.get_current_user)):
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Validate role
    valid_roles = ["student", "teacher", "admin"]
    if role_update.role not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role. Must be one of: student, teacher, admin")
    
    # Prevent admin from changing their own role
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_to_update.role = role_update.role
    db.commit()
    db.refresh(user_to_update)
    return {"message": f"User role updated to {role_update.role} successfully"}

@router.put("/{user_id}/name")
def update_user_name(user_id: int, name_update: UserNameUpdate, current_user: User = Depends(auth.get_current_user)):
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Validate name (not empty and reasonable length)
    if not name_update.name or not name_update.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    
    if len(name_update.name.strip()) > 100:
        raise HTTPException(status_code=400, detail="Name too long (max 100 characters)")
    
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    old_name = user_to_update.name
    user_to_update.name = name_update.name.strip()
    db.commit()
    db.refresh(user_to_update)
    return {"message": f"User name updated from '{old_name}' to '{name_update.name.strip()}' successfully"}
