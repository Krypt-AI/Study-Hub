"""Silence measurement for listening recordings that cover a whole test section.

Some workbooks (JLPT N2, N1) ship one MP3 per listening section instead of one per
question. The official recordings leave fixed-length pauses for reading and answering,
so the silences of a recording describe its structure. This module only measures them;
the importer, which knows how many questions each section has, turns them into
per-question time ranges.
"""

from __future__ import annotations

from pathlib import Path

import miniaudio
import numpy as np

SAMPLE_RATE = 8000
WINDOW_SECONDS = 0.05
MIN_SILENCE_SECONDS = 1.0
# A window is silent when it is this many dB above the recording's quiet level (30th percentile):
# the recordings have a low noise floor and speech sits well above it.
THRESHOLD_ABOVE_QUIET_DB = 6.0


def measure_silences(path: Path) -> dict:
    """Duration and silent stretches (start, length in seconds, rounded to 0.05 s) of an MP3."""
    decoded = miniaudio.decode_file(str(path), output_format=miniaudio.SampleFormat.SIGNED16, nchannels=1, sample_rate=SAMPLE_RATE)
    samples = np.frombuffer(decoded.samples, dtype=np.int16).astype(np.float32)
    window = int(SAMPLE_RATE * WINDOW_SECONDS)
    count = len(samples) // window
    rms = np.sqrt((samples[: count * window].reshape(count, window) ** 2).mean(axis=1))
    level_db = 20 * np.log10(rms + 1)
    silent = level_db < np.percentile(level_db, 30) + THRESHOLD_ABOVE_QUIET_DB

    silences: list[list[float]] = []
    start = None
    for index, is_silent in enumerate([*silent, False]):
        if is_silent and start is None:
            start = index
        elif not is_silent and start is not None:
            if (index - start) * WINDOW_SECONDS >= MIN_SILENCE_SECONDS:
                silences.append([round(start * WINDOW_SECONDS, 2), round((index - start) * WINDOW_SECONDS, 2)])
            start = None
    return {"duration": round(count * WINDOW_SECONDS, 2), "silences": silences}
