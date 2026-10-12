"""Command-line entry point: `python -m pipeline <command> [options]`.

Commands:
  sources    List registered source PDFs and their OCR cache status.
  ocr        OCR (or text-extract) pages into the cache. Resumable.
  manifest   Write cache/sources.json, the source list read by the TypeScript importers.
  pages      Render page images (WebP) for the web app's "view original page" feature.
  course-pages  Render the documents (past papers) of private University courses.
  audio      Extract JLPT listening audio and map each clip to its question.
  phase      Run ocr + manifest + pages + audio for one import phase.
"""

from __future__ import annotations

import argparse
import sys

import pymupdf

from . import assets, ocr
from .sources import select_sources


def _add_selection_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--phase", type=int, help="include every source up to this import phase (1-3)")
    parser.add_argument("--source", action="append", dest="sources", help="source id (repeatable)")


def _require_selection(args: argparse.Namespace) -> None:
    if args.phase is None and not args.sources:
        raise SystemExit("Choose sources with --phase N or --source ID.")


def _command_sources(args: argparse.Namespace) -> None:
    for source in select_sources(phase=args.phase, ids=args.sources):
        if not source.file.exists():
            status = "missing file"
        else:
            with pymupdf.open(source.file) as doc:
                cached = sum(1 for n in range(1, doc.page_count + 1) if ocr.cache_path(source, n).exists())
                status = f"{cached}/{doc.page_count} pages cached"
        print(f"phase {source.phase}  {source.id:<34} {status:<22} {source.title}")


def _command_ocr(args: argparse.Namespace) -> None:
    _require_selection(args)
    ocr.run(select_sources(phase=args.phase, ids=args.sources), force=args.force, threads=args.threads)


def _command_manifest(_: argparse.Namespace) -> None:
    assets.write_manifest()


def _command_pages(args: argparse.Namespace) -> None:
    _require_selection(args)
    assets.export_page_images(select_sources(phase=args.phase, ids=args.sources), force=args.force)


def _command_course_pages(args: argparse.Namespace) -> None:
    assets.export_course_document_pages(force=args.force)


def _command_audio(args: argparse.Namespace) -> None:
    levels = args.levels or sorted({source.level for source in select_sources(phase=args.phase) if source.language == "ja"})
    assets.extract_audio([level for level in levels if level in assets.AUDIO_SOURCES], force=args.force)


def _command_phase(args: argparse.Namespace) -> None:
    sources = select_sources(phase=args.phase)
    ocr.run(sources, threads=args.threads)
    assets.write_manifest()
    assets.export_page_images(sources)
    levels = sorted({source.level for source in sources if source.language == "ja"})
    assets.extract_audio([level for level in levels if level in assets.AUDIO_SOURCES])
    print("Done. Next: `npm run content:import` and `npm run content:build` in the project root.", flush=True)


def main(argv: list[str] | None = None) -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(prog="pipeline", description="Study Hub content pipeline")
    commands = parser.add_subparsers(dest="command", required=True)

    sources_parser = commands.add_parser("sources", help="list registered sources")
    _add_selection_arguments(sources_parser)
    sources_parser.set_defaults(handler=_command_sources)

    ocr_parser = commands.add_parser("ocr", help="OCR pages into the cache")
    _add_selection_arguments(ocr_parser)
    ocr_parser.add_argument("--force", action="store_true", help="re-process pages that are already cached")
    ocr_parser.add_argument("--threads", type=int, help="OCR threads (default: half the logical cores)")
    ocr_parser.set_defaults(handler=_command_ocr)

    manifest_parser = commands.add_parser("manifest", help="write the source manifest for the importers")
    manifest_parser.set_defaults(handler=_command_manifest)

    pages_parser = commands.add_parser("pages", help="render page images for the web app")
    _add_selection_arguments(pages_parser)
    pages_parser.add_argument("--force", action="store_true", help="re-render existing images")
    pages_parser.set_defaults(handler=_command_pages)

    course_pages_parser = commands.add_parser("course-pages", help="render pages of private course documents (past papers)")
    course_pages_parser.add_argument("--force", action="store_true", help="re-render existing images")
    course_pages_parser.set_defaults(handler=_command_course_pages)

    audio_parser = commands.add_parser("audio", help="extract JLPT listening audio")
    audio_parser.add_argument("--phase", type=int, help="levels used by sources up to this phase")
    audio_parser.add_argument("--level", action="append", dest="levels", help="JLPT level, e.g. N5 (repeatable)")
    audio_parser.add_argument("--force", action="store_true", help="re-extract existing audio")
    audio_parser.set_defaults(handler=_command_audio)

    phase_parser = commands.add_parser("phase", help="run every asset stage for an import phase")
    phase_parser.add_argument("phase", type=int, help="import phase (1-3)")
    phase_parser.add_argument("--threads", type=int, help="OCR threads (default: half the logical cores)")
    phase_parser.set_defaults(handler=_command_phase)

    args = parser.parse_args(argv)
    args.handler(args)


if __name__ == "__main__":
    main()
