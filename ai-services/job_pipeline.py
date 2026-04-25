import json
import logging
import os
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

FRESHER_KEYWORDS = [
    "fresher",
    "entry level",
    "entry-level",
    "graduate",
    "new grad",
    "intern",
    "internship",
    "junior",
    "trainee",
    "associate",
    "apprentice",
    "0-1 year",
    "0-1 years",
    "0 to 1 year",
    "0 to 1 years",
    "0-2 years",
    "0 to 2 years",
]

DEFAULT_USER_AGENT = "JobJugaadBot/1.0 (+https://job-jugad.local)"


@dataclass
class RawJob:
    title: str
    company: str
    link: str
    date: str
    source: str
    location: str = ""
    description: str = ""

    def to_record(self) -> Dict[str, Any]:
        normalized_title = normalize_text(self.title)
        normalized_company = normalize_text(self.company)
        return {
            "title": self.title.strip(),
            "company": self.company.strip(),
            "link": self.link.strip(),
            "date": self.date,
            "source": self.source.strip(),
            "location": self.location.strip(),
            "description": self.description.strip(),
            "job_key": f"{normalized_title}::{normalized_company}",
        }


def normalize_text(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def strip_html(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()


def parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc)

    if isinstance(value, str):
        cleaned = value.strip()
        if not cleaned:
            return None
        if cleaned.endswith("Z"):
            cleaned = cleaned.replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(cleaned)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc)
        except ValueError:
            pass

        for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%Y-%m-%d", "%d %b %Y", "%d %B %Y"):
            try:
                parsed = datetime.strptime(cleaned, fmt)
                if parsed.tzinfo is None:
                    parsed = parsed.replace(tzinfo=timezone.utc)
                return parsed.astimezone(timezone.utc)
            except ValueError:
                continue

    return None


def recent_enough(value: Any, max_age_hours: int) -> bool:
    parsed = parse_datetime(value)
    if not parsed:
        return False
    return parsed >= datetime.now(timezone.utc) - timedelta(hours=max_age_hours)


def is_fresher_job(title: str, description: str) -> bool:
    haystack = f"{normalize_text(title)} {normalize_text(description)}"
    return any(keyword in haystack for keyword in FRESHER_KEYWORDS)


def normalize_job(job: RawJob, max_age_hours: int) -> Optional[RawJob]:
    if not job.title or not job.company or not job.link:
        return None
    if not recent_enough(job.date, max_age_hours):
        return None
    if not is_fresher_job(job.title, job.description):
        return None

    parsed = parse_datetime(job.date)
    if not parsed:
        return None

    return RawJob(
        title=job.title.strip(),
        company=job.company.strip(),
        link=job.link.strip(),
        date=parsed.isoformat(),
        source=job.source.strip(),
        location=strip_html(job.location),
        description=strip_html(job.description),
    )


def dedupe_jobs(jobs: Iterable[RawJob]) -> List[RawJob]:
    unique_jobs: Dict[str, RawJob] = {}
    for job in jobs:
        key = f"{normalize_text(job.title)}::{normalize_text(job.company)}"
        existing = unique_jobs.get(key)
        if not existing:
            unique_jobs[key] = job
            continue

        existing_date = parse_datetime(existing.date) or datetime.min.replace(tzinfo=timezone.utc)
        new_date = parse_datetime(job.date) or datetime.min.replace(tzinfo=timezone.utc)
        if new_date >= existing_date:
            unique_jobs[key] = job

    return sorted(
        unique_jobs.values(),
        key=lambda job: parse_datetime(job.date) or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True,
    )


def parse_company_page_configs() -> List[Dict[str, Any]]:
    raw = os.getenv("COMPANY_CAREER_PAGES", "[]").strip()
    if not raw:
        return []
    try:
        configs = json.loads(raw)
        if isinstance(configs, list):
            return configs
    except json.JSONDecodeError as exc:
        logger.warning("Invalid COMPANY_CAREER_PAGES JSON: %s", exc)
    return []


def build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": os.getenv("SCRAPER_USER_AGENT", DEFAULT_USER_AGENT),
            "Accept": "application/json, text/html;q=0.9,*/*;q=0.8",
        }
    )
    return session


def fetch_adzuna_jobs(session: requests.Session) -> List[RawJob]:
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    country = os.getenv("ADZUNA_COUNTRY", "in")
    if not app_id or not app_key:
        logger.info("Skipping Adzuna: missing credentials")
        return []

    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": os.getenv("ADZUNA_RESULTS_PER_PAGE", "50"),
        "what": os.getenv("ADZUNA_QUERY", '"fresher" OR "entry level" OR "intern"'),
        "sort_by": "date",
        "max_days_old": os.getenv("ADZUNA_MAX_DAYS_OLD", "2"),
        "content-type": "application/json",
    }
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
    response = session.get(url, params=params, timeout=20)
    response.raise_for_status()
    payload = response.json()

    jobs: List[RawJob] = []
    for item in payload.get("results", []):
        jobs.append(
            RawJob(
                title=item.get("title", ""),
                company=(item.get("company") or {}).get("display_name", ""),
                link=item.get("redirect_url", ""),
                date=item.get("created", ""),
                source="adzuna",
                location=(item.get("location") or {}).get("display_name", ""),
                description=strip_html(item.get("description", "")),
            )
        )
    return jobs


def fetch_jooble_jobs(session: requests.Session) -> List[RawJob]:
    api_key = os.getenv("JOOBLE_API_KEY")
    country = os.getenv("JOOBLE_COUNTRY", "in")
    if not api_key:
        logger.info("Skipping Jooble: missing credentials")
        return []

    url = f"https://jooble.org/api/{api_key}"
    payload = {
        "keywords": os.getenv("JOOBLE_KEYWORDS", "fresher OR \"entry level\" OR intern"),
        "location": os.getenv("JOOBLE_LOCATION", "India"),
        "page": 1,
    }
    response = session.post(url, json=payload, timeout=20)
    response.raise_for_status()
    data = response.json()

    jobs: List[RawJob] = []
    for item in data.get("jobs", []):
        jobs.append(
            RawJob(
                title=item.get("title", ""),
                company=item.get("company", ""),
                link=item.get("link", ""),
                date=item.get("updated") or item.get("pubdate") or item.get("created", ""),
                source="jooble",
                location=item.get("location", ""),
                description=strip_html(item.get("snippet", "")),
            )
        )
    return jobs


def extract_text(element: Optional[BeautifulSoup]) -> str:
    return re.sub(r"\s+", " ", element.get_text(" ", strip=True) if element else "").strip()


def fetch_static_company_jobs(session: requests.Session, config: Dict[str, Any]) -> List[RawJob]:
    url = config.get("url")
    item_selector = config.get("item_selector")
    if not url or not item_selector:
        return []

    response = session.get(url, timeout=20)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    jobs: List[RawJob] = []
    for node in soup.select(item_selector):
        title = extract_text(node.select_one(config.get("title_selector", "")))
        company = config.get("company") or extract_text(node.select_one(config.get("company_selector", "")))
        link_node = node.select_one(config.get("link_selector", "a"))
        link = ""
        if link_node:
            href = link_node.get("href", "")
            link = requests.compat.urljoin(url, href)
        posted = extract_text(node.select_one(config.get("date_selector", ""))) or datetime.now(timezone.utc).isoformat()
        location = extract_text(node.select_one(config.get("location_selector", "")))
        description = extract_text(node.select_one(config.get("description_selector", "")))

        jobs.append(
            RawJob(
                title=title,
                company=company or config.get("source", "company-careers"),
                link=link,
                date=posted,
                source=config.get("source", "company-careers"),
                location=location,
                description=description,
            )
        )
    return jobs


def fetch_dynamic_company_jobs(config: Dict[str, Any]) -> List[RawJob]:
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service
    except Exception as exc:
        logger.warning("Skipping Selenium scraper for %s: %s", config.get("url"), exc)
        return []

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument(
        f"user-agent={os.getenv('SCRAPER_USER_AGENT', DEFAULT_USER_AGENT)}"
    )

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.get(config["url"])

    jobs: List[RawJob] = []
    try:
        elements = driver.find_elements(By.CSS_SELECTOR, config["item_selector"])
        for node in elements:
            title = node.find_element(By.CSS_SELECTOR, config["title_selector"]).text if config.get("title_selector") else ""
            company = config.get("company", "")
            link = ""
            if config.get("link_selector"):
                link_node = node.find_element(By.CSS_SELECTOR, config["link_selector"])
                link = link_node.get_attribute("href") or ""
            date_text = (
                node.find_element(By.CSS_SELECTOR, config["date_selector"]).text
                if config.get("date_selector")
                else datetime.now(timezone.utc).isoformat()
            )
            location = node.find_element(By.CSS_SELECTOR, config["location_selector"]).text if config.get("location_selector") else ""
            description = node.find_element(By.CSS_SELECTOR, config["description_selector"]).text if config.get("description_selector") else ""

            jobs.append(
                RawJob(
                    title=title,
                    company=company or config.get("source", "company-careers"),
                    link=link,
                    date=date_text,
                    source=config.get("source", "company-careers"),
                    location=location,
                    description=description,
                )
            )
    finally:
        driver.quit()

    return jobs


def fetch_company_jobs(session: requests.Session) -> List[RawJob]:
    jobs: List[RawJob] = []
    for config in parse_company_page_configs():
        try:
            mode = config.get("mode", "static")
            if mode == "dynamic":
                jobs.extend(fetch_dynamic_company_jobs(config))
            else:
                jobs.extend(fetch_static_company_jobs(session, config))
        except Exception as exc:
            logger.warning("Company page scrape failed for %s: %s", config.get("url"), exc)
    return jobs


class SupabaseStore:
    def __init__(self) -> None:
        self.url = os.getenv("SUPABASE_URL", "").rstrip("/")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self.table = os.getenv("SUPABASE_JOBS_TABLE", "jobs")

    def configured(self) -> bool:
        return bool(self.url and self.service_key)

    def upsert_jobs(self, jobs: List[RawJob]) -> int:
        if not jobs:
            return 0
        if not self.configured():
            raise RuntimeError("Supabase is not configured")

        endpoint = f"{self.url}/rest/v1/{self.table}"
        payload = [job.to_record() for job in jobs]
        headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        }
        response = requests.post(
            endpoint,
            headers=headers,
            params={"on_conflict": "job_key"},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        return len(payload)


def run_job_pipeline(max_age_hours: Optional[int] = None) -> Dict[str, Any]:
    hours = max_age_hours or int(os.getenv("JOB_MAX_AGE_HOURS", "48"))
    session = build_session()
    all_jobs: List[RawJob] = []

    source_results: Dict[str, int] = {}
    collectors = {
        "adzuna": fetch_adzuna_jobs,
        "jooble": fetch_jooble_jobs,
        "company_pages": fetch_company_jobs,
    }

    for source_name, collector in collectors.items():
        try:
            collected = collector(session) if source_name != "company_pages" else collector(session)
            source_results[source_name] = len(collected)
            all_jobs.extend(collected)
        except Exception as exc:
            logger.warning("%s collection failed: %s", source_name, exc)
            source_results[source_name] = 0

    cleaned_jobs = [job for job in (normalize_job(job, hours) for job in all_jobs) if job]
    unique_jobs = dedupe_jobs(cleaned_jobs)

    store = SupabaseStore()
    inserted = 0
    if unique_jobs and store.configured():
        inserted = store.upsert_jobs(unique_jobs)

    return {
        "collected": len(all_jobs),
        "filtered": len(cleaned_jobs),
        "deduplicated": len(unique_jobs),
        "inserted": inserted,
        "sources": source_results,
        "jobs": [asdict(job) for job in unique_jobs],
    }
