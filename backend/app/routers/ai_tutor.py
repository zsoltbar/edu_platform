from fastapi import APIRouter
from pydantic import BaseModel
import openai
from app.routers.tasks import get_task, create_task, TaskCreate, get_tasks
from app.config import get_settings
import difflib
import json

settings = get_settings()
openai.api_key = settings.OPENAI_API_KEY

router = APIRouter()

class TutorRequest(BaseModel):
    id: int
    student_answer: str

@router.post("/")
def ai_tutor(req: TutorRequest):
    task = get_task(req.id)  # Lookup the task by id
    response = openai.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": f"You are a {task.subject} tutor for 10-14 year old students. Answer always in Hungarian if the question is in Hungarian, otherwise answer in English."},
            {"role": "user", "content": f"Question: {task.title}\nStudent Answer: {req.student_answer}"}
        ],
        max_tokens=200
    )
    return {"explanation": response.choices[0].message.content}

class NextQuestionRequest(BaseModel):
    id: int
    previous_question: str
    student_answer: str

@router.post("/next-question")
def generate_next_question(req: NextQuestionRequest):
    task = get_task(req.id)  # Lookup the task by id

    role = f"""
        You are a {task.subject} tutor for 10-14 year old students. 
        Based on the student's previous answer, generate a suitable next question in {task.subject} topic to help them learn.
        Answer in Hungarian if the question is in Hungarian, otherwise answer in English.
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
    response = openai.chat.completions.create(
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
    for existing_task in get_tasks():
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
        create_task(new_task)

    return {
        "explanation": feedback,
        "next_question": next_question,
        "next_description": description,
        "similar_found": similar_found,
        "score": score
    }

class GenerateTaskRequest(BaseModel):
    topic: str
    difficulty: str  # e.g., "easy", "medium", "hard"
    language: str    # e.g., "en", "hu"

@router.post("/generate-task")
def generate_task(req: GenerateTaskRequest):
    response = openai.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": f"You are a math and logic tutor for 10-14 year old students. Generate a new task for the topic '{req.topic}' at '{req.difficulty}' difficulty. Provide both the question and the correct answer in {req.language}."},
            {"role": "user", "content": f"Please generate a new task for topic '{req.topic}' at '{req.difficulty}' difficulty. Respond in {req.language}. Format: Question: ... Answer: ..."}
        ],
        max_tokens=200
    )
    content = response.choices[0].message.content
    # Optionally, you can parse the content to separate question and answer if needed
    return {"task": content}
