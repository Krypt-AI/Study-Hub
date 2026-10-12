"""Asset stages: source manifest, page images and listening audio for the web app.

Page images let every extracted item link back to the original page, so OCR output
can always be checked against the book. Everything written here comes from your own
materials and is git-ignored (personal use only).
"""

from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path

import pymupdf
from PIL import Image

from .audio_timing import measure_silences
from .config import CACHE_DIR, MATERIALS_DIR, PRIVATE_COURSES_DIR, PUBLIC_MATERIALS_DIR
from .sources import SOURCES, Source

PAGE_IMAGE_WIDTH = 1100
PAGE_IMAGE_QUALITY = 72
MANIFEST_PATH = CACHE_DIR / "sources.json"


def write_manifest() -> Path:
    """Describe every source for the TypeScript importers (id, title, level, page count...)."""
    entries = []
    for source in SOURCES:
        entry = {
            "id": source.id,
            "title": source.title,
            "language": source.language,
            "level": source.level,
            "kind": source.kind,
            "phase": source.phase,
            "file": str(source.file),
            "pageCount": None,
        }
        if source.file.exists():
            with pymupdf.open(source.file) as doc:
                entry["pageCount"] = doc.page_count
        entries.append(entry)
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {MANIFEST_PATH} ({len(entries)} sources)", flush=True)
    return MANIFEST_PATH


def page_image_path(source_id: str, page_number: int) -> Path:
    return PUBLIC_MATERIALS_DIR / "pages" / source_id / f"p{page_number:04d}.webp"


def _render_page_images(pdf: Path, source_id: str, *, force: bool) -> int:
    """Render every page of a PDF as a WebP served at /materials/pages/<source_id>/; returns how many were written."""
    written = 0
    with pymupdf.open(pdf) as doc:
        for index in range(doc.page_count):
            target = page_image_path(source_id, index + 1)
            if target.exists() and not force:
                continue
            page = doc[index]
            zoom = PAGE_IMAGE_WIDTH / page.rect.width
            pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), colorspace=pymupdf.csRGB, alpha=False)
            image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            target.parent.mkdir(parents=True, exist_ok=True)
            image.save(target, "WEBP", quality=PAGE_IMAGE_QUALITY, method=4)
            written += 1
    return written


def export_page_images(sources: list[Source], *, force: bool = False) -> None:
    for source in sources:
        if source.file.exists():
            written = _render_page_images(source.file, source.id, force=force)
            print(f"[pages] {source.id}: {written} new image(s)", flush=True)


def course_document_id(course_id: str, document: Path) -> str:
    """Page-image id of a private course document: "cmpd363" + "midterm-sem1-2526.pdf" -> "cmpd363-midterm-sem1-2526"."""
    return f"{course_id}-{document.stem}"


def export_course_document_pages(*, force: bool = False) -> None:
    """Render the PDFs in each private course's `documents/` folder (past papers and the like)."""
    for document in sorted(PRIVATE_COURSES_DIR.glob("*/documents/*.pdf")):
        source_id = course_document_id(document.parent.parent.name, document)
        written = _render_page_images(document, source_id, force=force)
        print(f"[pages] {source_id}: {written} new image(s)", flush=True)


# Listening audio ------------------------------------------------------------------

# "04-もんだい１ー１ばん.mp3", "06-まんだい１-３ばん.mp3" (typo in the original), "25-問題４ーれい.mp3"
_CLIP = re.compile(r"(?:もんだい|まんだい|問題)\s*([0-9０-９])\s*[ー－\-−]\s*(?:([0-9０-９]+)ばん|(れい))")
# N2/N1 come as one recording per section: "Audio file 3 Summary comprehension.mp3"
_SECTION_CLIP = re.compile(r"^Audio file\s+(\d)\b", re.IGNORECASE)
_FULL_WIDTH_DIGITS = str.maketrans("０１２３４５６７８９", "0123456789")

AUDIO_SOURCES: dict[str, list[str]] = {
    "N5": ["JLPT/Workbook/JLPT WORKBOOK 5/N5-listening-mp3s.zip"],
    "N4": ["JLPT/Workbook/JLPT WORKBOOK 4/N4-listening.zip"],
    "N3": ["JLPT/Workbook/JLPT WORKBOOK 3/N3-practice-listening.zip"],
    "N2": ["JLPT/Workbook/JLPT WORKBOOK 2/JLPT Workbbok N2 Listening"],
    "N1": ["JLPT/Workbook/JLPT WORKBOOK 1/JLPT N1 Listenening"],
}


def classify_clip(file_name: str) -> dict | None:
    """Map an audio file name to its listening section (mondai) and question number (0 = example).
    A recording of a whole section has a section but no question."""
    section_match = _SECTION_CLIP.search(file_name)
    if section_match:
        return {"section": int(section_match.group(1))}
    match = _CLIP.search(file_name)
    if not match:
        return None
    section = int(match.group(1).translate(_FULL_WIDTH_DIGITS))
    question = 0 if match.group(3) else int(match.group(2).translate(_FULL_WIDTH_DIGITS))
    return {"section": section, "question": question}


def extract_audio(levels: list[str], *, force: bool = False) -> None:
    for level in levels:
        target_dir = PUBLIC_MATERIALS_DIR / "audio" / level.lower()
        manifest_path = target_dir / "manifest.json"
        if manifest_path.exists() and not force:
            print(f"[audio] {level}: already extracted", flush=True)
            continue
        target_dir.mkdir(parents=True, exist_ok=True)
        clips = []
        for relative in AUDIO_SOURCES.get(level, []):
            location = MATERIALS_DIR / relative
            for name, read in _iter_mp3(location):
                index = len(clips) + 1
                file_name = f"{index:02d}.mp3"
                (target_dir / file_name).write_bytes(read())
                clip = {"file": file_name, "originalName": name, **(classify_clip(name) or {})}
                # A whole-section recording: record its pauses so the importer can find each question in it.
                if "section" in clip and "question" not in clip:
                    clip.update(measure_silences(target_dir / file_name))
                clips.append(clip)
        manifest_path.write_text(json.dumps(clips, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[audio] {level}: {len(clips)} clip(s)", flush=True)


def _iter_mp3(location: Path):
    """Yield (original file name, reader) for each MP3 in a zip archive or folder, in name order."""
    if location.is_file() and location.suffix.lower() == ".zip":
        with zipfile.ZipFile(location) as archive:
            for info in sorted(archive.infolist(), key=lambda item: item.filename):
                if not info.is_dir() and info.filename.lower().endswith(".mp3"):
                    yield Path(info.filename).name, (lambda info=info: archive.read(info))
    elif location.is_dir():
        for path in sorted(location.glob("*.mp3")):
            yield path.name, (lambda path=path: path.read_bytes())
