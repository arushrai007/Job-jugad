# Job Jugaad:Fresher-First AI Job Platform

Job Jugaad is a production-ready, microservices-based platform designed exclusively for freshers (0-2 years experience). It leverages Java for core business logic, Python for AI/ML/Scraping, and Next.js for a high-performance interactive frontend.

## 🚀 Key Features

- **Vertical Job Feed (Reels)**: Discover jobs with an Instagram-style vertical scroll.
- **AI Resume Matcher**: NLP-powered analysis of resumes against job descriptions.
- **Salary Predictor**: ML model to estimate fresher packages based on role, location, and skills.
- **Fresher-Only Filtering**: Real-time scraping optimized strictly for entry-level and internship roles.
- **Core API Gateway**: Centralized Java Spring Boot backend for auth, tracking, and profile management.

## 🏗️ Architecture

- **Frontend**: Next.js 15, Framer Motion, Tailwind CSS, Shadcn/UI.
- **Backend Core**: Java 17, Spring Boot, Spring Security (JWT), MongoDB.
- **AI Services**: Python 3.9, FastAPI, Spacy (NLP), Scikit-Learn (ML), Playwright/BS4 (Scraping).
- **Database**: MongoDB (NoSQL) for high-velocity job data and user engagement.

## 📁 Project Structure

```text
job-jugaad/
├── ai-services/           # Python AI/ML/Scraper Services
│   ├── main.py            # FastAPI Entry Point
│   ├── matcher.py         # NLP Resume Matching logic
│   ├── scraper.py         # Real-time Job Scraping logic
│   └── salary_model.py    # ML Salary Prediction logic
├── backend-core/          # Java Spring Boot Core Service
│   ├── src/main/java/...  # Models, Controllers, Services
│   └── pom.xml            # Maven Configuration
├── src/                   # Next.js Frontend (App Router)
│   ├── app/               # Pages (Feed, Salary, Resume)
│   └── components/        # UI Components
├── docker-compose.yml     # Microservices Orchestration
└── Dockerfile             # Frontend Containerization
```

## 🛠️ Setup & Usage

### Prerequisites
- Docker & Docker Compose installed.

### One-Command Start
Run the following command in the root directory:
```bash
docker-compose up --build
```

This will start:
1. **MongoDB** at `localhost:27017`
2. **AI Services (Python)** at `localhost:8000`
3. **Core API (Java)** at `localhost:8080`
4. **Frontend (Next.js)** at `localhost:3000`

### API Endpoints
- **Job Feed**: `GET /api/jobs/fresher-feed` (via Java Core)
- **Scrape Trigger**: `GET /jobs/scrape` (via Python AI)
- **Resume Match**: `POST /resume/match` (via Python AI)
- **Salary Predict**: `POST /salary/predict` (via Python AI)

## 🔒 Security
- JWT-based authentication implemented in the Java Core Service.
- Rate limiting and ethical scraping delays enforced in the Python Scraper.
- MongoDB data volume persistence configured for production safety.

## 🎨 UI/UX Highlights
- Mobile-first responsive design.
- Parallax hero sections and smooth staggered animations.
- TikTok-style vertical job discovery.
- Dark/Light theme support.
