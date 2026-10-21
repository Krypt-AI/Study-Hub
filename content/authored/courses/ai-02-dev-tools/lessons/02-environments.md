---
id: ai-02-dev-tools.l02
title: Reproducible Python environments
summary: Virtual environments, pip and uv, pyproject.toml, lock files and pinning, and what "it works on my machine" really means.
objectives:
  - Create and use a virtual environment with venv or uv
  - Declare dependencies in pyproject.toml and lock them
  - Explain version specifiers and why ML projects pin versions
estimatedMinutes: 45
topics: [ai02.env]
resources:
  - { title: "venv: creation of virtual environments", url: "https://docs.python.org/3/library/venv.html", free: true, official: true }
  - { title: "Python Packaging User Guide", url: "https://packaging.python.org/en/latest/", free: true, official: true }
  - { title: "uv documentation", url: "https://docs.astral.sh/uv/", free: true, official: true }
---

## The problem

Project A needs `numpy 1.26`, project B needs `numpy 2.x`, and your operating system has its own Python. Installing
everything into one interpreter breaks something. A **virtual environment** is a folder with its own interpreter link
and its own `site-packages`, so each project gets exactly the packages it declares.

## venv and pip (always available)

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
python -m pip install numpy pandas scikit-learn
python -m pip freeze > requirements.txt   # exact versions currently installed
deactivate
```

Use `python -m pip` rather than bare `pip` so you are sure which interpreter you install into.

## pyproject.toml: declaring a project

```toml
[project]
name = "spam-classifier"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "numpy>=2.0",
  "scikit-learn>=1.5,<2",
  "pandas~=2.2",
]

[dependency-groups]
dev = ["pytest", "ruff"]
```

| Specifier | Meaning |
|---|---|
| `==2.2.3` | exactly this version |
| `>=2.0` | 2.0 or newer |
| `>=1.5,<2` | at least 1.5, below 2 |
| `~=2.2` | compatible release: `>=2.2, ==2.*` |

`pyproject.toml` says what the project **accepts**. A **lock file** records what was actually **resolved**: the exact
version (and hash) of every package, including indirect ones. Commit both.

## uv: a fast, all-in-one tool

`uv` (from Astral) manages Python versions, virtual environments, dependencies and lock files:

```bash
uv init spam-classifier && cd spam-classifier
uv add numpy scikit-learn         # updates pyproject.toml and uv.lock, installs into .venv
uv add --dev pytest ruff
uv run python train.py            # runs inside the project environment
uv sync                           # recreate the exact locked environment (for example on a new machine or in CI)
```

pip with `requirements.txt` and uv with `uv.lock` solve the same problem; pick one per project and use it
consistently. Conda is common when you need non-Python libraries (CUDA toolkits, GDAL) managed together.

## Reproducibility checklist for ML

- Pin the Python version (`requires-python`, `.python-version`).
- Lock dependencies and commit the lock file.
- Record random seeds, data versions and hardware (CPU or which GPU) with each result.
- Deep learning libraries ship different builds for CPU and for each CUDA version; write down which one you used.
- Rebuild the environment from scratch occasionally (`uv sync` in a fresh clone, or CI does it for you).
