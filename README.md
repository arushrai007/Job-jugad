# Job Jugaad

Job Jugaad now includes a Supabase-backed fresher job aggregation pipeline:

- Pulls structured listings from Adzuna and Jooble.
- Optionally scrapes safer company career pages with `requests` + BeautifulSoup, or Selenium for dynamic pages.
- Filters for fresher-style roles using keywords like `fresher`, `entry level`, and `0-1 years`.
- Keeps only recent jobs from the last 24-48 hours.
- Deduplicates on `title + company`.
- Upserts cleaned jobs into Supabase table `jobs`.
- Serves the website feed from Supabase so the UI only reads already-cleaned data.

## Pipeline Overview

1. Python FastAPI service runs the sync pipeline.
2. A background scheduler runs it every `JOB_SYNC_INTERVAL_HOURS` hours.
3. The website can also trigger a manual refresh through `GET /api/jobs/sync`.
4. The frontend feed reads from Supabase through `GET /api/jobs/fresher-feed`.

## Supabase Setup

Run the SQL in [supabase/jobs.sql](/home/arush/Desktop/Job-jugad/supabase/jobs.sql) in your new Supabase project.

Required environment variables are listed in [.env.example](/home/arush/Desktop/Job-jugad/.env.example).

Important values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `JOOBLE_API_KEY`

## Company Career Page Config

Use `COMPANY_CAREER_PAGES` as a JSON array. Example:

```json
[
  {
    "source": "acme",
    "mode": "static",
    "company": "Acme",
    "url": "https://acme.com/careers",
    "item_selector": ".job-card",
    "title_selector": "h2",
    "link_selector": "a",
    "date_selector": "time",
    "location_selector": ".location",
    "description_selector": ".summary"
  }
]
```

For dynamic sites, set `"mode": "dynamic"` and keep the same selector fields.

## Local Run

```bash
docker-compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- AI services: `http://localhost:8000`
- Core backend: `http://localhost:8080`

## Job Endpoints

- `GET /api/jobs/fresher-feed`
- `GET /api/jobs/sync`
- `POST http://localhost:8000/jobs/sync`
- `GET http://localhost:8000/jobs/scrape`
