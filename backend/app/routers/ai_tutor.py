from fastapi import APIRouter
from pydantic import BaseModel
import openai
import os
from dotenv import load_dotenv
from app.routers.tasks import get_task, create_task, TaskCreate, get_tasks
import difflib

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

router = APIRouter()

class TutorRequest(BaseModel):
    id: int
    student_answer: str

@router.post("/")
def ai_tutor(req: TutorRequest):
    task = get_task(req.id)  # Lookup the task by id
    response = openai.chat.completions.create(
        model="gpt-4o",
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
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"You are a {task.subject} tutor for 10-14 year old students. Based on the student's previous answer, generate a suitable next question in {task.subject} topic in Hungarian to help them learn."},
            {"role": "user", "content": f"Previous Question: {req.previous_question}\nStudent Answer: {req.student_answer}\nPlease provide feedback after 'Feedback:' and the next possible question after 'Next Question:', and give a 'Description:' addressed to students for the next question both in Hungarian."}
        ],
        max_tokens=1000
    )
    content = response.choices[0].message.content

    feedback = ""
    next_question = ""
    description = ""
    if "Feedback:" in content and "Next Question:" in content and "Description:" in content:
        feedback_start = content.find("Feedback:")
        next_question_start = content.find("Next Question:") 
        description_start = content.find("Description:")

        feedback = content[feedback_start + len("Feedback:"):next_question_start].strip()
        next_question = content[next_question_start + len("Next Question:"): description_start].strip()
        description = content[description_start + len("Description:"):].strip()
    else:
        feedback = content

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
    else:
        print("Similar question found, not adding to database.")

    return {
        "explanation": feedback,
        "next_question": next_question,
        "next_description": description,
        "similar_found": similar_found
    }

class GenerateTaskRequest(BaseModel):
    topic: str
    difficulty: str  # e.g., "easy", "medium", "hard"
    language: str    # e.g., "en", "hu"

@router.post("/generate-task")
def generate_task(req: GenerateTaskRequest):
    response = openai.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": f"You are a math and logic tutor for 10-14 year old students. Generate a new task for the topic '{req.topic}' at '{req.difficulty}' difficulty. Provide both the question and the correct answer in {req.language}."},
            {"role": "user", "content": f"Please generate a new task for topic '{req.topic}' at '{req.difficulty}' difficulty. Respond in {req.language}. Format: Question: ... Answer: ..."}
        ],
        max_tokens=200
    )
    content = response.choices[0].message.content
    # Optionally, you can parse the content to separate question and answer if needed
    return {"task": content}
