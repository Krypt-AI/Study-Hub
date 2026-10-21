---
id: ai-02-dev-tools.l01
title: Git for AI projects
summary: Commits, branches, remotes and pull requests, and what never belongs in a repository (data, models, secrets).
objectives:
  - Explain the working tree, staging area and history
  - Use branches, merges and pull requests for a feature
  - Write a .gitignore that keeps data, model files and secrets out of Git
estimatedMinutes: 50
topics: [ai02.git]
resources:
  - { title: "Pro Git (free book)", url: "https://git-scm.com/book/en/v2", free: true, official: true }
  - { title: "GitHub Docs: Get started with Git", url: "https://docs.github.com/en/get-started/getting-started-with-git", free: true, official: true }
  - { title: "GitHub Skills (free interactive courses)", url: "https://skills.github.com/", free: true, official: true }
---

## Why version control matters more in AI

An AI project changes in three places at once: the **code**, the **data** and the **model**. Git tracks the code
precisely; data and models are tracked by reference (a path, a hash, a version in a registry). When a result
changes, you need to answer "which code, which data, which settings?", and that starts with a clean Git history.

## The three areas

| Area | What it holds | Command that moves things into it |
|---|---|---|
| Working tree | Your files as you edit them | (you edit) |
| Staging area (index) | The snapshot of the next commit | `git add` |
| History | Commits, each a full snapshot with a message | `git commit` |

```bash
git init                       # or: git clone https://github.com/you/project.git
git status                     # what changed, what is staged
git add src/train.py           # stage one file
git commit -m "Add early stopping to training loop"
git log --oneline --graph      # compact history
git diff                       # unstaged changes; git diff --staged for staged ones
```

A good commit is **one logical change** with a message that says *why*: "Fix label leakage in split" is useful,
"update" is not.

## Branches and pull requests

```bash
git switch -c feature/eval-metrics   # create and switch to a branch
# ...edit, add, commit...
git push -u origin feature/eval-metrics
# open a pull request on GitHub, get a review, merge
git switch main && git pull
```

- A **branch** is a movable pointer to a commit. Work on a branch keeps `main` working.
- A **merge** joins histories; a **conflict** happens when both sides changed the same lines. Edit the file, keep the
  correct version, `git add` it and commit.
- A **pull request** (PR) is where review, automated tests and discussion happen before merging.
- `git restore <file>` discards unstaged edits; `git revert <commit>` makes a new commit that undoes an old one (safe on
  shared branches). Avoid rewriting shared history with `reset --hard` or force pushes.

## What stays out of Git

```gitignore
# environments and caches
.venv/
__pycache__/
.ipynb_checkpoints/

# data and model artifacts: store them elsewhere and record their version
data/raw/
data/processed/
models/
*.pt
*.safetensors
mlruns/

# secrets
.env
*.pem
```

- **Data and models** are large and often private. Keep them in object storage, a dataset hub, a model registry or
  Git LFS / DVC, and commit only a small script or manifest that says where they are.
- **Secrets** (API keys, tokens, passwords) never go in a repository, even a private one. Lesson 5 shows how to load
  them from the environment.
- `.gitignore` only affects untracked files. If a file is already tracked, remove it from the index with
  `git rm --cached <file>` and commit.

## Remotes and collaboration

`origin` is the conventional name of the remote you cloned from. `git fetch` downloads new commits, `git pull` fetches
and merges, `git push` uploads your commits. On GitHub, protect `main` so changes arrive through reviewed PRs with
passing checks.
