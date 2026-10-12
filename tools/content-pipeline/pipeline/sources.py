"""Registry of the study materials the pipeline knows how to import.

Each PDF gets a stable `id` that is used in cache paths, page-image URLs and the
provenance (`source`) of every generated content item, so an item in the app can
always be traced back to the exact page of your book it came from.

Import phases:
  1. First milestone: HSK 1-2 textbooks, JLPT N5-N4 (新にほんご500問 + official sample tests)
  2. Remaining textbooks: HSK 3-6, 新にほんご500問 N3-N1, JLPT N3-N1 sample tests
  3. Workbooks and teacher's books (exercise answer keys)
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from .config import MATERIALS_DIR

Language = Literal["zh", "ja"]
SourceKind = Literal[
    "hsk-textbook",
    "hsk-workbook",
    "hsk-teacher",
    "shin500",
    "jlpt-sample-vocab",
    "jlpt-sample-grammar",
    "jlpt-sample-reading",
    "jlpt-sample-listening",
    "jlpt-sample-script",
    "jlpt-sample-answers",
]


@dataclass(frozen=True)
class Source:
    id: str
    title: str
    path: str  # relative to MATERIALS_DIR
    language: Language
    level: str  # "HSK1" ... "HSK6", "N5" ... "N1"
    kind: SourceKind
    phase: int
    long_side_px: int = 2600  # render size for OCR; dense pages need more pixels

    @property
    def file(self) -> Path:
        return MATERIALS_DIR / self.path


def _hsk_level(level: int, volumes: dict[str, tuple[str, str, str]], textbook_phase: int) -> list[Source]:
    """volumes maps a volume suffix ("" or "A"/"B") to (textbook, workbook, teacher's book) paths."""
    sources: list[Source] = []
    for volume, (textbook, workbook, teacher) in volumes.items():
        slug = f"hsk{level}{volume.lower()}"
        name = f"HSK Standard Course {level}{volume}"
        folder = f"HSK/HSK {level}"
        sources += [
            Source(f"{slug}-textbook", name, f"{folder}/{textbook}", "zh", f"HSK{level}", "hsk-textbook", textbook_phase, 3000),
            Source(f"{slug}-workbook", f"{name} Workbook", f"{folder}/{workbook}", "zh", f"HSK{level}", "hsk-workbook", 3, 3000),
            Source(f"{slug}-teacher", f"{name} Teacher's Book", f"{folder}/{teacher}", "zh", f"HSK{level}", "hsk-teacher", 3, 3000),
        ]
    return sources


def _jlpt_sample(level: str, phase: int, files: dict[SourceKind, str]) -> list[Source]:
    folder = f"JLPT/Workbook/JLPT WORKBOOK {level[1]}"
    labels = {
        "jlpt-sample-vocab": "Language Knowledge (Vocabulary)",
        "jlpt-sample-grammar": "Language Knowledge (Grammar)",
        "jlpt-sample-reading": "Reading",
        "jlpt-sample-listening": "Listening",
        "jlpt-sample-script": "Listening Script",
        "jlpt-sample-answers": "Answer Key",
    }
    return [
        Source(
            f"jlpt-{level.lower()}-sample-{kind.removeprefix('jlpt-sample-')}",
            f"JLPT {level} Sample Test: {labels[kind]}",
            f"{folder}/{file}",
            "ja",
            level,
            kind,
            phase,
        )
        for kind, file in files.items()
    ]


def _shin500(levels: str, file_level: str, phase: int) -> Source:
    return Source(
        f"shin500-{levels.lower().replace('-', '')}",
        f"新にほんご500問 {levels}",
        f"JLPT/Minna no Nihongo/新にほんご500問 {file_level}.pdf",
        "ja",
        levels,
        "shin500",
        phase,
    )


SOURCES: list[Source] = [
    *_hsk_level(1, {"": ("HSK 1 Standard Course.pdf", "HSK Standard Course 1 Workbook.pdf", "HSK Standard Course 1 Teachers Book.pdf")}, 1),
    *_hsk_level(2, {"": ("HSK 2 Standard Course.pdf", "HSK Standard Course 2 Workbook.pdf", "HSK Standard Course 2 Teachers Book.pdf")}, 1),
    *_hsk_level(3, {"": ("HSK 3 Standard Course.pdf", "HSK Standard Course 3 Workbook.pdf", "HSK Standard Course 3 Teachers Book.pdf")}, 2),
    *_hsk_level(
        4,
        {
            "A": ("HSK 4A Standard Course.pdf", "HSK Standard Course 4A Workbook.pdf", "HSK Standard Course 4A Teachers Book.pdf"),
            "B": ("HSK 4B Standard Course.pdf", "HSK Standard Course 4B Workbook.pdf", "HSK Standard Course 4B Teachers Book.pdf"),
        },
        2,
    ),
    *_hsk_level(
        5,
        {
            "A": ("Hsk Standard Course 5A.pdf", "HSK Standard Course 5A Workbook.pdf", "HSK Standard Course 5A Teachers Book.pdf"),
            "B": ("HSK Standard Course 5B.pdf", "HSK Standard Course 5B - Workbook.pdf", "HSK Standard Course 5B Teachers Book.pdf"),
        },
        2,
    ),
    *_hsk_level(
        6,
        {
            "A": ("HSK Standard Course 6A.pdf", "HSK Standard Course 6A Workbook.pdf", "HSK Standard Course 6A Teachers Book.pdf"),
            "B": ("HSK Standard Course 6B.pdf", "HSK Standard Course 6B Workbook.pdf", "HSK Standard Course 6B Teachers Book.pdf"),
        },
        2,
    ),
    _shin500("N4-N5", "N4-N5", 1),
    _shin500("N3", "N3", 2),
    _shin500("N2", "N2", 2),
    _shin500("N1", "N1", 2),
    *_jlpt_sample(
        "N5",
        1,
        {
            "jlpt-sample-vocab": "N5V-notes.pdf",
            "jlpt-sample-grammar": "N5G-notes.pdf",
            "jlpt-sample-reading": "N5R-notes.pdf",
            "jlpt-sample-listening": "N5L-notes.pdf",
            "jlpt-sample-script": "N5script.pdf",
            "jlpt-sample-answers": "N5answer.pdf",
        },
    ),
    *_jlpt_sample(
        "N4",
        1,
        {
            "jlpt-sample-vocab": "N4V-notes.pdf",
            "jlpt-sample-grammar": "N4G-notes.pdf",
            "jlpt-sample-reading": "N4R-notes.pdf",
            "jlpt-sample-listening": "N4L-notes.pdf",
            "jlpt-sample-script": "N4script.pdf",
            "jlpt-sample-answers": "N4answer.pdf",
        },
    ),
    *_jlpt_sample(
        "N3",
        2,
        {
            "jlpt-sample-vocab": "N3V-notes.pdf",
            "jlpt-sample-grammar": "N3G-notes.pdf",
            "jlpt-sample-reading": "N3R-notes.pdf",
            "jlpt-sample-listening": "N3L-notes.pdf",
            "jlpt-sample-script": "N3script.pdf",
            "jlpt-sample-answers": "N3answer.pdf",
        },
    ),
    *_jlpt_sample(
        "N2",
        2,
        {
            "jlpt-sample-vocab": "N2V.pdf",
            "jlpt-sample-grammar": "N2G.pdf",
            "jlpt-sample-reading": "N2R.pdf",
            "jlpt-sample-listening": "N2L.pdf",
            "jlpt-sample-script": "N2 script.pdf",
            "jlpt-sample-answers": "N2 answer.pdf",
        },
    ),
    *_jlpt_sample(
        "N1",
        2,
        {
            "jlpt-sample-vocab": "N1V.pdf",
            "jlpt-sample-grammar": "N1G.pdf",
            "jlpt-sample-reading": "N1R.pdf",
            "jlpt-sample-listening": "N1L.pdf",
            "jlpt-sample-script": "N1script.pdf",
            "jlpt-sample-answers": "N1 answer.pdf",
        },
    ),
]

SOURCES_BY_ID: dict[str, Source] = {source.id: source for source in SOURCES}


def select_sources(*, phase: int | None = None, ids: list[str] | None = None) -> list[Source]:
    """Sources for an explicit id list, or every source up to and including `phase`."""
    if ids:
        unknown = [source_id for source_id in ids if source_id not in SOURCES_BY_ID]
        if unknown:
            raise SystemExit(f"Unknown source id(s): {', '.join(unknown)}")
        return [SOURCES_BY_ID[source_id] for source_id in ids]
    if phase is None:
        return list(SOURCES)
    return [source for source in SOURCES if source.phase <= phase]
