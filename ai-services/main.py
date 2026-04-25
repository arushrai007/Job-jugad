import logging
import os
from contextlib import asynccontextmanager
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel

import matcher
import salary_engine
import io
from pypdf import PdfReader

from job_pipeline import run_job_pipeline
from job_scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.getenv("JOB_SCHEDULER_ENABLED", "true").lower() == "true":
        start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(title="Job Jugaad AI Services", lifespan=lifespan)

class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str

class SalaryPredictionRequest(BaseModel):
    role: str
    skills: List[str]
    location: str
    experience: int
    education: Optional[str] = "bachelors"
    college_tier: Optional[str] = "tier3"
    company_type: Optional[str] = "service"

@app.get("/")
async def root():
    return {"message": "Job Jugaad AI Services are live"}

@app.post("/resume/extract-text")
async def extract_text(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        
        return {"text": text.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/scrape")
async def trigger_scrape():
    result = run_job_pipeline()
    return {"status": "success", **result}


@app.post("/jobs/sync")
async def sync_jobs():
    result = run_job_pipeline()
    return {"status": "success", **result}

@app.post("/resume/match")
async def match_resume(request: JobMatchRequest):
    result = matcher.calculate_match_score(request.resume_text, request.job_description)
    return result

@app.post("/salary/predict")
async def predict_salary(request: SalaryPredictionRequest):
    prediction = salary_engine.predict(
        request.role, 
        request.skills, 
        request.location, 
        request.experience,
        request.education,
        request.college_tier,
        request.company_type
    )
    return {"predicted_salary": prediction}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
