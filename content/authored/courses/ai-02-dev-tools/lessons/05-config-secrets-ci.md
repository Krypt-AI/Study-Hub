---
id: ai-02-dev-tools.l05
title: Configuration, secrets and continuous integration
summary: Keeping settings out of code, loading API keys from the environment, and running tests automatically with GitHub Actions.
objectives:
  - Separate configuration from code and validate it at start-up
  - Load secrets from environment variables and keep them out of Git
  - Write a GitHub Actions workflow that lints and tests every push
estimatedMinutes: 45
topics: [ai02.config]
resources:
  - { title: "GitHub Actions: Building and testing Python", url: "https://docs.github.com/en/actions/tutorials/build-and-test-code/python", free: true, official: true }
  - { title: "GitHub Docs: Using secrets in GitHub Actions", url: "https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions", free: true, official: true }
  - { title: "OWASP Secrets Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html", free: true, official: true }
  - { title: "The Twelve-Factor App: Config", url: "https://12factor.net/config", free: true, official: true }
---

## Configuration is not code

Learning rates, model names, file paths and endpoints change between experiments and environments. Hard-coding them
means editing code to run an experiment. Instead:

- Put **non-secret settings** in a config file (`configs/default.toml`) or CLI options, with defaults.
- Put **secrets** (API keys, database passwords) in **environment variables**, supplied by your shell, a `.env` file
  that is git-ignored, or the platform's secret store.
- **Validate** configuration once at start-up and fail with a clear message.

```python
import os
import tomllib
from dataclasses import dataclass

@dataclass(frozen=True)
class Settings:
    model: str
    temperature: float
    api_key: str

def load_settings(path="configs/default.toml") -> Settings:
    with open(path, "rb") as f:
        cfg = tomllib.load(f)
    key = os.environ.get("LLM_API_KEY")
    if not key:
        raise RuntimeError("LLM_API_KEY is not set; copy .env.example to .env and fill it in")
    return Settings(model=cfg["model"], temperature=float(cfg.get("temperature", 0.0)), api_key=key)
```

Commit a `.env.example` listing the variable **names** with empty values, never the real `.env`. Libraries such as
`python-dotenv` read `.env` into the environment during development.

## If a secret leaks

1. **Revoke or rotate it at the provider immediately.** Deleting the commit is not enough: it is in history and may
   already have been scraped.
2. Check the provider's usage logs for misuse.
3. Then clean up history if needed, and add protection: GitHub secret scanning and push protection, or a pre-commit
   hook that scans for keys.

Never paste secrets into notebooks, issue trackers, chat or prompts to an AI assistant.

## Continuous integration with GitHub Actions

CI runs your checks on a clean machine for every push and pull request:

```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
      - run: uv sync --locked
      - run: uv run ruff check .
      - run: uv run pytest -q
        env:
          LLM_API_KEY: ${{ secrets.LLM_API_KEY }}
```

- `uv sync --locked` fails if the lock file is out of date, so CI proves the environment is reproducible.
- Secrets come from the repository's encrypted secrets and are masked in logs. Pull requests from forks do not
  receive them.
- Keep unit tests independent of paid APIs (use fakes); run the few integration tests that call a real model only
  where secrets are available.
