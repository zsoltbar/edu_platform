import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, tasks, ai_tutor, scores, rag

# Disable tokenizers parallelism to avoid forking issues with sentence-transformers
os.environ["TOKENIZERS_PARALLELISM"] = "false"

app = FastAPI(
    title="OkosTanítás Platform Backend",
    description="Online felvételi gyakorló platform diákoknak",
    version="1.0.0",
    debug=True
)

# CORS beállítások (frontend localhost vagy deploy URL)
origins = [
    "http://localhost:3000",  # Next.js frontend
    "http://127.0.0.1:3000",
    "http://192.168.68.66:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerek összekapcsolása
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(ai_tutor.router, prefix="/api/ai-tutor", tags=["AI Tutor"])
app.include_router(scores.router, prefix="/api/scores", tags=["scores"])
app.include_router(rag.router, prefix="/api", tags=["RAG"])

@app.get("/")
def read_root():
    return {"message": "Edu Platform Backend is running"}
