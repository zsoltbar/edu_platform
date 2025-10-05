from fastapi import APIRouter
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()

class TutorRequest(BaseModel):
    question: str
    student_answer: str

@router.post("/")
def ai_tutor(req: TutorRequest):
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a math and logic tutor for 10-14 year old students."},
            {"role": "user", "content": f"Question: {req.question}\nStudent Answer: {req.student_answer}"}
        ],
        max_tokens=200
    )
    return {"explanation": response.choices[0].message.content}

class NextQuestionRequest(BaseModel):
    previous_question: str
    student_answer: str

@router.post("/next-question")
def generate_next_question(req: NextQuestionRequest):
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a math and logic tutor for 10-14 year old students. Based on the student's previous answer, generate a suitable next question to help them learn."},
            {"role": "user", "content": f"Previous Question: {req.previous_question}\nStudent Answer: {req.student_answer}\nPlease provide answer in the same language what student used."}
        ],
        max_tokens=100
    )
    return {"next_question": response.choices[0].message.content}

class GenerateTaskRequest(BaseModel):
    topic: str
    difficulty: str  # e.g., "easy", "medium", "hard"
    language: str    # e.g., "en", "hu"

@router.post("/generate-task")
def generate_task(req: GenerateTaskRequest):
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": f"You are a math and logic tutor for 10-14 year old students. Generate a new task for the topic '{req.topic}' at '{req.difficulty}' difficulty. Provide both the question and the correct answer in {req.language}."},
            {"role": "user", "content": f"Please generate a new task for topic '{req.topic}' at '{req.difficulty}' difficulty. Respond in {req.language}. Format: Question: ... Answer: ..."}
        ],
        max_tokens=200
    )
    content = response.choices[0].message.content
    # Optionally, you can parse the content to separate question and answer if needed
    return {"task": content}
