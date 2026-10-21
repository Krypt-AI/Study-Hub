---
id: ai-02-dev-tools.l03
title: Project layout, tests and linting
summary: A src layout that scales, pytest with fixtures and parametrisation, Ruff for linting and formatting, and type checking.
objectives:
  - Organise a Python project with a src layout and a tests folder
  - Write pytest tests with fixtures, parametrize and approx
  - Run a linter, formatter and type checker before every commit
estimatedMinutes: 50
topics: [ai02.quality]
resources:
  - { title: "pytest: Get started", url: "https://docs.pytest.org/en/stable/getting-started.html", free: true, official: true }
  - { title: "Ruff documentation", url: "https://docs.astral.sh/ruff/", free: true, official: true }
  - { title: "mypy documentation", url: "https://mypy.readthedocs.io/en/stable/", free: true, official: true }
---

## A layout that scales

```text
spam-classifier/
├── pyproject.toml
├── uv.lock
├── README.md
├── src/
│   └── spam_classifier/
│       ├── __init__.py
│       ├── data.py          # loading and cleaning
│       ├── features.py      # turning text into features
│       ├── model.py         # training and prediction
│       └── cli.py           # command-line entry point
├── tests/
│   ├── test_data.py
│   └── test_features.py
├── notebooks/               # exploration only
└── configs/
    └── default.toml
```

The `src/` folder means tests import the **installed** package, the same way users will, so a missing file or wrong
import shows up in tests rather than in production. Keep notebooks for exploration and move anything reused into the
package (lesson 4).

## pytest essentials

```python
# tests/test_features.py
import pytest
from spam_classifier.features import normalise, word_counts

def test_normalise_lowercases_and_strips():
    assert normalise("  FREE Money!! ") == "free money"

@pytest.mark.parametrize("text, expected", [
    ("a a b", {"a": 2, "b": 1}),
    ("", {}),
])
def test_word_counts(text, expected):
    assert word_counts(text) == expected

@pytest.fixture
def tiny_dataset():
    return [("win cash now", 1), ("lunch at noon?", 0)]

def test_dataset_labels_are_binary(tiny_dataset):
    assert {label for _, label in tiny_dataset} <= {0, 1}

def test_probability_close():
    assert 0.1 + 0.2 == pytest.approx(0.3)   # never compare floats with ==

def test_rejects_negative_threshold():
    with pytest.raises(ValueError):
        ...
```

Run `uv run pytest` (or `python -m pytest`). Useful flags: `-x` stop at first failure, `-k name` select tests, `-q`
quiet.

### What to test in ML code

- **Deterministic pieces** thoroughly: parsing, cleaning, feature functions, metric code, data splits (no overlap).
- **Shapes and invariants**: output length matches input, probabilities in [0, 1], no NaNs.
- **A tiny overfit test**: a model should be able to fit 10 examples almost perfectly; if it cannot, the training
  loop is broken.
- Fix random seeds in tests so they do not flake.

## Linting, formatting and types

```bash
uv run ruff check .        # lint: unused imports, undefined names, bug-prone patterns
uv run ruff format .       # formatter: one consistent style, no debates
uv run mypy src            # static type checking using your type hints
```

A **linter** finds suspicious code, a **formatter** rewrites layout, a **type checker** proves that values match their
hints. Run them in CI (lesson 5) and, optionally, in a pre-commit hook so problems never reach review.
