"""OCR stage: turn every page of a source PDF into positioned text lines.

Results are cached as one JSON file per page, so the stage is resumable: an
interrupted run continues where it stopped, and later stages (parsers) never
need to re-run OCR. Pages that carry a real text layer are read directly instead.

Cached page format (all coordinates are relative to the page, 0..1):
    {"source": id, "page": n, "method": "ocr" | "text-layer", "engine": str,
     "lines": [{"text": str, "score": float, "bbox": [x0, y0, x1, y1]}]}
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pymupdf

from .config import OCR_CACHE_DIR, ocr_threads
from .sources import Source

ENGINE_NAME = "rapidocr/PP-OCRv6-small/openvino"
MIN_TEXT_LAYER_CHARS = 120
MAX_IMAGE_COVERAGE_FOR_TEXT_LAYER = 0.5


@dataclass
class Line:
    text: str
    score: float
    bbox: list[float]  # x0, y0, x1, y1 relative to page size


@dataclass
class PageText:
    source: str
    page: int
    method: str
    engine: str
    lines: list[Line]


def cache_path(source: Source, page_number: int) -> Path:
    return OCR_CACHE_DIR / source.id / f"p{page_number:04d}.json"


def load_page(source: Source, page_number: int) -> PageText | None:
    path = cache_path(source, page_number)
    if not path.exists():
        return None
    raw = json.loads(path.read_text(encoding="utf-8"))
    return PageText(
        source=raw["source"],
        page=raw["page"],
        method=raw["method"],
        engine=raw["engine"],
        lines=[Line(**line) for line in raw["lines"]],
    )


def build_engine(threads: int):
    # Imported lazily so commands that only read the cache do not load the models.
    from rapidocr import EngineType, LangDet, LangRec, ModelType, OCRVersion, RapidOCR

    return RapidOCR(
        params={
            "Global.log_level": "warning",
            # Pages are always upright. The angle classifier misreads short, faint
            # pinyin lines as upside-down ("dú" -> "np"), so it is disabled.
            "Global.use_cls": False,
            "Global.max_side_len": 3200,
            # OpenVINO gives identical text to ONNX Runtime and is ~2.5x faster on Intel CPUs.
            "EngineConfig.openvino.inference_num_threads": threads,
            "Det.engine_type": EngineType.OPENVINO,
            "Det.ocr_version": OCRVersion.PPOCRV6,
            "Det.model_type": ModelType.SMALL,
            "Det.lang_type": LangDet.CH,
            "Rec.engine_type": EngineType.OPENVINO,
            "Rec.ocr_version": OCRVersion.PPOCRV6,
            "Rec.model_type": ModelType.SMALL,
            "Rec.lang_type": LangRec.CH,
        }
    )


def _image_coverage(page: pymupdf.Page) -> float:
    page_area = page.rect.width * page.rect.height
    covered = 0.0
    for info in page.get_image_info():
        clipped = pymupdf.Rect(info["bbox"]) & page.rect
        covered += clipped.width * clipped.height
    return min(1.0, covered / page_area) if page_area else 0.0


def _looks_like_real_text(text: str) -> bool:
    """Reject text layers produced by fonts without a usable Unicode mapping."""
    meaningful = [ch for ch in text if not ch.isspace()]
    if len(meaningful) < MIN_TEXT_LAYER_CHARS:
        return False
    garbage = sum(1 for ch in meaningful if ch == "�" or 0xE000 <= ord(ch) <= 0xF8FF)
    return garbage / len(meaningful) < 0.02


def read_text_layer(page: pymupdf.Page) -> list[Line] | None:
    if _image_coverage(page) > MAX_IMAGE_COVERAGE_FOR_TEXT_LAYER:
        return None
    if not _looks_like_real_text(page.get_text("text")):
        return None
    width, height = page.rect.width, page.rect.height
    lines: list[Line] = []
    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            text = "".join(span["text"] for span in line["spans"]).strip()
            if not text:
                continue
            x0, y0, x1, y1 = line["bbox"]
            lines.append(Line(text, 1.0, [round(x0 / width, 4), round(y0 / height, 4), round(x1 / width, 4), round(y1 / height, 4)]))
    return lines


def render_page(page: pymupdf.Page, long_side_px: int) -> np.ndarray:
    zoom = long_side_px / max(page.rect.width, page.rect.height)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), colorspace=pymupdf.csRGB, alpha=False)
    return np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3).copy()


def ocr_page(engine, page: pymupdf.Page, long_side_px: int) -> list[Line]:
    image = render_page(page, long_side_px)
    height, width = image.shape[:2]
    result = engine(image)
    if result.boxes is None:
        return []
    lines: list[Line] = []
    for box, text, score in zip(result.boxes, result.txts, result.scores):
        xs = [float(point[0]) for point in box]  # numpy float32 is not JSON-serialisable
        ys = [float(point[1]) for point in box]
        lines.append(
            Line(
                text=text,
                score=round(float(score), 3),
                bbox=[round(min(xs) / width, 4), round(min(ys) / height, 4), round(max(xs) / width, 4), round(max(ys) / height, 4)],
            )
        )
    lines.sort(key=lambda line: (line.bbox[1], line.bbox[0]))
    return lines


def _write_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    os.replace(temporary, path)


def _format_duration(seconds: float) -> str:
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours}h{minutes:02d}m" if hours else f"{minutes}m{seconds:02d}s"


def run(sources: list[Source], *, force: bool = False, threads: int | None = None) -> None:
    pending: list[tuple[Source, int]] = []
    for source in sources:
        if not source.file.exists():
            print(f"[skip] {source.id}: file not found ({source.file})", flush=True)
            continue
        with pymupdf.open(source.file) as doc:
            pending += [(source, n) for n in range(1, doc.page_count + 1) if force or not cache_path(source, n).exists()]

    total = len(pending)
    print(f"OCR: {total} page(s) to process with {threads or ocr_threads()} thread(s)", flush=True)
    if not total:
        return

    engine = None
    started = time.perf_counter()
    open_doc: tuple[str, pymupdf.Document] | None = None
    try:
        for done, (source, page_number) in enumerate(pending, start=1):
            if open_doc is None or open_doc[0] != source.id:
                if open_doc:
                    open_doc[1].close()
                open_doc = (source.id, pymupdf.open(source.file))
            page = open_doc[1][page_number - 1]

            lines = read_text_layer(page)
            method, engine_name = "text-layer", "pymupdf"
            if lines is None:
                if engine is None:
                    engine = build_engine(threads or ocr_threads())
                lines = ocr_page(engine, page, source.long_side_px)
                method, engine_name = "ocr", ENGINE_NAME

            record = PageText(source.id, page_number, method, engine_name, lines)
            _write_atomic(cache_path(source, page_number), asdict(record))

            elapsed = time.perf_counter() - started
            remaining = elapsed / done * (total - done)
            print(
                f"[{done}/{total}] {source.id} p{page_number} {method} {len(lines)} lines | "
                f"elapsed {_format_duration(elapsed)} | ETA {_format_duration(remaining)}",
                flush=True,
            )
    finally:
        if open_doc:
            open_doc[1].close()
