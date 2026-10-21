---
id: ai-02-dev-tools.l00
title: "Setup: Git, GitHub, uv and testing in VS Code"
summary: Connect VS Code to GitHub, install uv and the GitHub CLI, add the tooling extensions, and run pytest from VS Code's Testing view.
objectives:
  - Install uv and the GitHub CLI, and sign in to GitHub from VS Code
  - Use the Source Control view for staging, committing, branching and pull requests
  - Configure pytest and Ruff so tests and lint run inside VS Code
estimatedMinutes: 40
topics: [ai02.setup]
resources:
  - { title: "VS Code: Source control", url: "https://code.visualstudio.com/docs/sourcecontrol/overview", free: true, official: true }
  - { title: "VS Code: Python testing", url: "https://code.visualstudio.com/docs/python/testing", free: true, official: true }
  - { title: "uv: Installation", url: "https://docs.astral.sh/uv/getting-started/installation/", free: true, official: true }
  - { title: "GitHub CLI", url: "https://cli.github.com/", free: true, official: true }
  - { title: "GitHub Docs: Connecting to GitHub with SSH", url: "https://docs.github.com/en/authentication/connecting-to-github-with-ssh", free: true, official: true }
---

This lesson assumes the base setup from **Python and Programming Fundamentals, lesson 0** (VS Code, Python, Git and
the Python extension). Here you add the tools for real project work.

## Step 1: Install uv

```powershell
winget install --id=astral-sh.uv -e
# or the standalone installer:
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`. Open a new terminal and check `uv --version`.

## Step 2: GitHub account and the GitHub CLI

1. Create a free account at github.com and turn on two-factor authentication (Settings → Password and
   authentication).
2. Install the CLI and sign in; it also configures Git to use your GitHub credentials:
   ```powershell
   winget install --id GitHub.cli -e      # macOS: brew install gh   Ubuntu: see cli.github.com
   gh auth login                           # choose GitHub.com, HTTPS, and log in with a web browser
   gh auth status
   ```
3. Optional, SSH instead of HTTPS: `ssh-keygen -t ed25519 -C "you@example.com"`, then add the **public** key
   (`~/.ssh/id_ed25519.pub`) under GitHub → Settings → SSH and GPG keys. Never share the private key.

## Step 3: Extensions for this course

| Extension | ID | Why |
|---|---|---|
| GitHub Pull Requests | `GitHub.vscode-pull-request-github` | Review and create PRs inside VS Code |
| GitHub Actions | `GitHub.vscode-github-actions` | Validate workflow YAML and watch CI runs |
| Even Better TOML | `tamasfe.even-better-toml` | Highlighting and validation for `pyproject.toml` |
| YAML | `redhat.vscode-yaml` | Schema-aware YAML (workflows, configs) |
| Mypy Type Checker | `ms-python.mypy-type-checker` | Shows mypy errors as you type |
| Ruff | `charliermarsh.ruff` | Already installed in Stage 1 |

## Step 4: Git inside VS Code

Open the **Source Control** view (**Ctrl+Shift+G**):

- **+** next to a file stages it (`git add`); type a message and **✓ Commit**.
- The branch name in the bottom-left status bar opens **create / switch branch**.
- **Sync Changes** pulls and pushes. **Publish Branch** pushes a new branch to GitHub.
- Merge conflicts open in the **merge editor**: choose *Accept Current*, *Accept Incoming* or edit the result, then
  stage the file.
- Command Palette → **GitHub Pull Requests: Create Pull Request** opens a PR for your branch.

The terminal commands from lesson 1 do exactly the same; use whichever you prefer, but learn the commands, because
servers and CI only have a terminal.

## Step 5: A uv project with tests in VS Code

```powershell
uv init --package spam-classifier
cd spam-classifier
uv add --dev pytest ruff mypy
code .
```

Select the interpreter in `.venv` (**Python: Select Interpreter**). Then open the **Testing** view (beaker icon) →
**Configure Python Tests** → **pytest** → choose the `tests` folder. Tests appear in a tree with ▷ buttons; failures
link to the failing line, and **Debug Test** stops at breakpoints inside tests.

Workspace settings (`.vscode/settings.json`, which you can commit so the team shares them):

```json
{
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": ["tests"],
  "[python]": { "editor.defaultFormatter": "charliermarsh.ruff", "editor.formatOnSave": true }
}
```

## Check your setup

```powershell
uv --version
gh auth status
uv run pytest -q          # in the project: "no tests ran" is fine at this point
uv run ruff check .
```
