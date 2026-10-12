"""Filesystem locations and performance settings for the content pipeline.

Every path can be overridden with an environment variable so the pipeline works
on another machine without code changes.
"""

from __future__ import annotations

import os
from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = PIPELINE_DIR.parent.parent

MATERIALS_DIR = Path(os.environ.get("STUDY_MATERIALS_DIR", r"C:\Coding\Language\EXTRA"))
CACHE_DIR = Path(os.environ.get("PIPELINE_CACHE_DIR", PIPELINE_DIR / "cache"))
OCR_CACHE_DIR = CACHE_DIR / "ocr"

# Generated course JSON (consumed by `npm run content:build`) and the page images /
# audio served to the web app. Both hold material extracted from your own books,
# so both are git-ignored and must not be published.
GENERATED_CONTENT_DIR = PROJECT_DIR / "content" / "generated"
PUBLIC_MATERIALS_DIR = PROJECT_DIR / "public" / "materials"
# University subjects written from your own course materials (git-ignored). A course's
# `documents/` folder holds PDFs whose pages its lessons show, such as past papers.
PRIVATE_COURSES_DIR = PROJECT_DIR / "content" / "private" / "courses"


def ocr_threads() -> int:
    """Threads given to the OCR engine. Defaults to half the logical cores so the
    machine stays usable while a long import runs in the background."""
    configured = os.environ.get("OCR_THREADS")
    if configured:
        return max(1, int(configured))
    return max(1, (os.cpu_count() or 2) // 2)
