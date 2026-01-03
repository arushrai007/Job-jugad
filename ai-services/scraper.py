import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
from db import get_db
import os

def scrape_fresher_jobs():
    """
    Scrapes real entry-level jobs from the Arbeitnow API and updates MongoDB.
    Then triggers the Next.js sync to update Supabase.
    """
    db = get_db()
    jobs_collection = db.jobs
    
    # 1. Fetch real jobs from an external API (Arbeitnow)
    api_url = "https://www.arbeitnow.com/api/job-board-api"
    try:
        response = requests.get(api_url, timeout=10)
        response.raise_for_status()
        api_data = response.json().get('data', [])
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        api_data = []

    real_jobs_count = 0
    for job in api_data:
        # 2. Filter logic: Look for Fresher/Junior roles in Title or Description
        title = job.get('title', '').lower()
        description = job.get('description', '').lower()
        
        keywords = ["junior", "fresher", "intern", "associate", "entry level", "0-1 years", "0-2 years"]
        
        if any(kw in title for kw in keywords) or any(kw in description for kw in keywords):
            job_data = {
                "title": job.get('title'),
                "company": job.get('company_name'),
                "location": job.get('location', 'Remote'),
                "description": job.get('description', '')[:1000], 
                "applyLink": job.get('url'),
                "source": "Arbeitnow",
                "postedDate": datetime.utcnow(),
                "isActive": True
            }
            
            # 3. Upsert to MongoDB (using applyLink as unique ID)
            jobs_collection.update_one(
                {"applyLink": job_data["applyLink"]},
                {"$set": job_data},
                upsert=True
            )
            real_jobs_count += 1

    # 4. Trigger the Next.js Sync Route to update Supabase
    # This bridges the gap between your Python backend and Next.js frontend
    try:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        requests.get(f"{frontend_url}/api/jobs/sync", timeout=5)
    except Exception as e:
        print(f"Note: Could not trigger Next.js sync automatically: {e}")

    return list(jobs_collection.find({"isActive": True}, {"_id": 0}))