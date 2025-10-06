from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
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

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None

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

@router.put("/{user_id}")
def update_user(user_id: int, user_update: UserUpdate, current_user: User = Depends(auth.get_current_user)):
    """
    Update user information. Only provided fields will be updated.
    Supports partial updates - you can update just name, email, password, role, or any combination.
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Prevent admin from changing their own role or deleting themselves
    if current_user.id == user_id and user_update.role is not None:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    # Find the user to update
    user_to_update = db.query(models.User).filter(models.User.id == user_id).first()
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")
    
    updates_made = []
    
    # Update name if provided
    if user_update.name is not None:
        if not user_update.name.strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        if len(user_update.name.strip()) > 100:
            raise HTTPException(status_code=400, detail="Name too long (max 100 characters)")
        
        old_name = user_to_update.name
        user_to_update.name = user_update.name.strip()
        updates_made.append(f"name from '{old_name}' to '{user_update.name.strip()}'")
    
    # Update email if provided
    if user_update.email is not None:
        if not user_update.email.strip():
            raise HTTPException(status_code=400, detail="Email cannot be empty")
        if "@" not in user_update.email or "." not in user_update.email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        if len(user_update.email.strip()) > 255:
            raise HTTPException(status_code=400, detail="Email too long (max 255 characters)")
        
        # Check if email is already taken by another user
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email.strip(),
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        old_email = user_to_update.email
        user_to_update.email = user_update.email.strip()
        updates_made.append(f"email from '{old_email}' to '{user_update.email.strip()}'")
    
    # Update password if provided
    if user_update.password is not None:
        if len(user_update.password) < 4:
            raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")
        if len(user_update.password) > 10:
            raise HTTPException(status_code=400, detail="Password too long (max 10 characters)")
        
        hashed_password = auth.get_password_hash(user_update.password)
        user_to_update.hashed_password = hashed_password
        updates_made.append("password")
    
    # Update role if provided
    if user_update.role is not None:
        valid_roles = ["student", "teacher", "admin"]
        if user_update.role not in valid_roles:
            raise HTTPException(status_code=400, detail="Invalid role. Must be one of: student, teacher, admin")
        
        old_role = user_to_update.role
        user_to_update.role = user_update.role
        updates_made.append(f"role from '{old_role}' to '{user_update.role}'")
    
    # Check if any updates were actually made
    if not updates_made:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
    
    # Save changes
    db.commit()
    db.refresh(user_to_update)
    
    return {
        "message": f"User {user_to_update.name} updated successfully",
        "updates": updates_made
    }
