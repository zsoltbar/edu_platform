Okostanitas - Backend Starter (FastAPI)
=====================================
This is a starter backend for the okostanitas platform.

Contents:
- FastAPI app with basic auth (register/login)
- SQLite dev DB (configurable)

How to run backend - http://localhost:8000/docs
1. python3 -m venv .venv
2. . .venv/bin/activate
3. pip install -r requirements.txt
5. uvicorn app.main:app --reload --port 8000

How to run frontend - http://localhost:3000/
1. brew install node
2. npm install 
3. npm run dev 