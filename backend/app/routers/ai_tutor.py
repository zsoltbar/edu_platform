from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from openai import OpenAI
from sqlalchemy.orm import Session
from app.routers.tasks import TaskCreate, get_db, get_task, get_tasks, create_task
from app.routers.rag import get_rag_pipeline
from app.config import get_settings
import difflib
import json
import asyncio

settings = get_settings()

# Initialize OpenAI client
if not settings.OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is required but not set in environment variables")

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

router = APIRouter()

async def get_educational_context(subject: str, topic: str, grade: int) -> str:
    """Get relevant educational context from RAG documents."""
    try:
        rag_pipeline = get_rag_pipeline()
        
        # Create a query to find relevant educational content
        query = f"{subject} {topic} {grade}. osztály"
        
        # Get relevant context from RAG
        context_docs = await rag_pipeline.retrieve_context(query, context_k=3)
        
        if context_docs:
            # Format the context for AI tutor
            context_text = "\n\n".join([
                f"📚 {doc.metadata.get('subject', 'Ismeretlen tantárgy')} - {doc.metadata.get('filename', 'Dokumentum')}:\n{doc.content[:300]}..."
                for doc in context_docs
            ])
            return f"\n\nRelevant educational content from uploaded documents:\n{context_text}"
        else:
            return "\n\nNo specific educational content found in uploaded documents for this topic."
            
    except Exception as e:
        # If RAG fails, continue without context
        return "\n\nNote: Could not retrieve additional educational context."

class TutorRequest(BaseModel):
    id: int
    student_answer: str

@router.post("/")
async def ai_tutor(req: TutorRequest, db: Session = Depends(get_db)):
    try:
        task = get_task(req.id, db)  # Lookup the task by id using tasks.py function
        
        # Get relevant educational context from RAG documents
        educational_context = await get_educational_context(
            subject=task.subject,
            topic=task.title,
            grade=task.class_grade
        )
        
        # Enhanced system prompt with educational context
        system_prompt = f"""You are a {task.subject} tutor for 10-14 year old students. 
        Answer always in Hungarian if the question is in Hungarian, otherwise answer in English.
        
        Use the following educational context from uploaded curriculum materials to provide more accurate and relevant feedback:
        {educational_context}
        
        Base your feedback on both the educational materials and pedagogical best practices."""
            
        response = openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Question: {task.title}\nStudent Answer: {req.student_answer}"}
            ],
            max_tokens=400  # Increased for more detailed responses
        )
        return {"explanation": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI tutor error: {str(e)}")

class NextQuestionRequest(BaseModel):
    id: int
    previous_question: str
    student_answer: str

@router.post("/next-question")
async def generate_next_question(req: NextQuestionRequest, db: Session = Depends(get_db)):
    try:
        task = get_task(req.id, db)  # Lookup the task by id using tasks.py function
        
        # Get relevant educational context from RAG documents
        educational_context = await get_educational_context(
            subject=task.subject,
            topic=task.title,
            grade=task.class_grade
        )

        role = f"""
            You are a {task.subject} tutor for 10-14 year old students. 
            Based on the student's previous answer, generate a suitable next question in {task.subject} topic to help them learn.
            Answer in Hungarian if the question is in Hungarian, otherwise answer in English.
            
            Use the following educational context from uploaded curriculum materials to create relevant follow-up questions:
            {educational_context}
            
            Create questions that build upon the curriculum content and are appropriate for the student's grade level.
            """
        prompt = f"""
            Previous Question: {req.previous_question}
            Student Answer: {req.student_answer}
            Please provide feedback and the next possible question, and give a description addressed to students for the next question both in Hungarian.
            Provide 0-100 score for the student's answer as well. 
            Format the entire response as dictionary with the following fields:
                Feedback: ...
                Next Question: ...
                Description: ...
                Score: ...
            """
        response = openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": role},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000
        )

        content = response.choices[0].message.content
        
        feedback = ""
        next_question = ""
        description = ""
        score = ""
        try:
            # The string must start with a valid JSON object (e.g., '{...}')
            # If the string starts with '{', it's likely valid JSON
            if content.strip().startswith("{"):
                data = json.loads(content)
            else:
                # Try to extract JSON from the string if it contains extra text
                json_start = content.find("{")
                json_end = content.rfind("}")
                if json_start != -1 and json_end != -1:
                    json_str = content[json_start:json_end+1]
                    data = json.loads(json_str)
                else:
                    raise ValueError("Response does not contain valid JSON.")
            feedback = data.get("Feedback", "")
            next_question = data.get("Next Question", "")
            description = data.get("Description", "")
            score = data.get("Score", "")
            # Ensure score is max 100
            try:
                score = min(int(float(score)), 100)
            except Exception:
                score = 0
        except Exception:
            feedback = content
            next_question = ""
            description = ""
            score = 0

        # Check for similar questions in the database (80% similarity threshold)
        similar_found = False
        existing_tasks = get_tasks(db)  # Using tasks.py function
        for existing_task in existing_tasks:
            similarity = difflib.SequenceMatcher(None, existing_task.title, next_question).ratio()
            if similarity >= 0.8:
                similar_found = True
                break

        # Store the next question only if not similar
        # Don't store if either next_question or description is empty
        if not similar_found and next_question and description:
            new_task = TaskCreate(
                title=next_question,
                description=description,
                subject=task.subject,
                class_grade=task.class_grade,
                difficulty=task.difficulty
            )
            create_task(new_task, db)  # Using tasks.py function

        return {
            "explanation": feedback,
            "next_question": next_question,
            "next_description": description,
            "similar_found": similar_found,
            "score": score
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Next question generation error: {str(e)}")

class GenerateTaskRequest(BaseModel):
    topic: str
    difficulty: str  # e.g., "easy", "medium", "hard"
    language: str    # e.g., "en", "hu"

@router.post("/generate-task")
async def generate_task(req: GenerateTaskRequest):
    try:
        # Get relevant educational context from RAG documents for the topic
        educational_context = await get_educational_context(
            subject=req.topic,
            topic=req.topic,
            grade="6"  # Default grade, could be made configurable
        )
        
        system_prompt = f"""You are a math and logic tutor for 10-14 year old students. 
        Generate a new task for the topic '{req.topic}' at '{req.difficulty}' difficulty. 
        Provide both the question and the correct answer in {req.language}.
        
        Use the following educational context from uploaded curriculum materials to create relevant tasks:
        {educational_context}
        
        Create tasks that align with the curriculum content and are appropriate for the student's grade level."""
        
        response = openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Please generate a new task for topic '{req.topic}' at '{req.difficulty}' difficulty. Respond in {req.language}. Format: Question: ... Answer: ..."}
            ],
            max_tokens=400  # Increased for more detailed tasks
        )
        content = response.choices[0].message.content
        # Optionally, you can parse the content to separate question and answer if needed
        return {"task": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task generation error: {str(e)}")
