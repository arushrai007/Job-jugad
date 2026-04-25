import logging
import os

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from job_pipeline import run_job_pipeline

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return

    interval_hours = int(os.getenv("JOB_SYNC_INTERVAL_HOURS", "4"))
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        run_job_pipeline,
        IntervalTrigger(hours=interval_hours),
        id="job_sync_pipeline",
        replace_existing=True,
        max_instances=1,
    )
    scheduler.start()
    _scheduler = scheduler
    logger.info("Job scheduler started with %s hour interval", interval_hours)


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None
