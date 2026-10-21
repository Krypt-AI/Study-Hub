---
id: ai-01-python.l00
title: "Setup: VS Code, Python and Git"
summary: Install VS Code, Python and Git, add the Python extensions, create a virtual environment, and run and debug your first script. Every later AI Engineering course builds on this setup.
objectives:
  - Install VS Code, Python (with the Python install manager) and Git on Windows, macOS or Linux
  - Install the Python, Jupyter and Ruff extensions and select a project interpreter
  - Create a virtual environment, run a script and debug it with a breakpoint
estimatedMinutes: 45
topics: [py.setup]
resources:
  - { title: "Download Visual Studio Code", url: "https://code.visualstudio.com/download", free: true, official: true }
  - { title: "VS Code: Getting started with Python", url: "https://code.visualstudio.com/docs/python/python-tutorial", free: true, official: true }
  - { title: "Using Python on Windows (Python install manager)", url: "https://docs.python.org/3/using/windows.html", free: true, official: true }
  - { title: "Git downloads", url: "https://git-scm.com/downloads", free: true, official: true }
  - { title: "VS Code: Python environments", url: "https://code.visualstudio.com/docs/python/environments", free: true, official: true }
---

Study Hub's exercises run in the browser sandbox, so you can do this course without installing anything. Real
projects, though, live on your own machine in an editor. This lesson sets up the toolchain every AI Engineering
course uses: **VS Code**, **Python**, **Git**, and a per-project **virtual environment**.

## Step 1: Install VS Code

**Windows** (recommended: the *User Installer*, which needs no administrator rights):

1. Download it from [code.visualstudio.com/download](https://code.visualstudio.com/download), or in PowerShell run:
   ```powershell
   winget install -e --id Microsoft.VisualStudioCode
   ```
2. In the installer, tick **Add "Open with Code" action** (both boxes) and **Add to PATH**.
3. Open a **new** terminal and check: `code --version`.

**macOS**: download the Universal build, drag *Visual Studio Code* into Applications, then in VS Code open the
Command Palette (⇧⌘P) and run **Shell Command: Install 'code' command in PATH**.

**Linux (Ubuntu/Debian)**: install the `.deb` from the download page (`sudo apt install ./code_*.deb`), which also adds
Microsoft's repository for updates.

## Step 2: Install Python

**Windows**: use the **Python install manager** (the classic full installer is deprecated from Python 3.14):

```powershell
winget install 9NQ7512CXL7T -e --accept-package-agreements --disable-interactivity
```

or install *Python install manager* from the Microsoft Store, or the MSIX from python.org/downloads. Then open a new
terminal:

```powershell
py list              # installed runtimes; the first run offers to install the latest
py install 3.14      # install a specific version if you need one
python --version     # should print Python 3.x
```

**macOS**: the installer from python.org/downloads, or Homebrew (`brew install python`). Use `python3` if `python` is
not found.

**Linux**: Ubuntu already ships Python 3; add the venv module with `sudo apt install python3-venv python3-pip`.

## Step 3: Install Git

```powershell
winget install --id Git.Git -e --source winget      # Windows
```

macOS: `xcode-select --install` (or `brew install git`). Linux: `sudo apt install git`. Then tell Git who you are
(once per machine):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global init.defaultBranch main
```

## Step 4: Add the extensions

Open the Extensions view (**Ctrl+Shift+X**, ⇧⌘X on macOS), search, and install:

| Extension | ID | Why |
|---|---|---|
| Python | `ms-python.python` | Runs, debugs and tests Python; also installs Pylance (IntelliSense) and Python Debugger |
| Jupyter | `ms-toolsai.jupyter` | Notebooks inside VS Code (Stages 3–8) |
| Ruff | `charliermarsh.ruff` | Fast linting and formatting |

Or from a terminal:

```bash
code --install-extension ms-python.python
code --install-extension ms-toolsai.jupyter
code --install-extension charliermarsh.ruff
```

Only install extensions from publishers you trust (the ID tells you the publisher); extensions run with your
user's permissions.

## Step 5: Create a project with a virtual environment

```powershell
mkdir $HOME\code\python-basics      # macOS/Linux: mkdir -p ~/code/python-basics
cd $HOME\code\python-basics
code .
```

In VS Code open the terminal (**Ctrl+`**) and create the environment:

```bash
python -m venv .venv
```

Then **Ctrl+Shift+P → Python: Select Interpreter** and choose the one marked `.venv`. New terminals now activate it
automatically (the prompt starts with `(.venv)`). Install packages into it with `python -m pip install <name>`.

> **PowerShell says "running scripts is disabled"?** Allow locally created scripts for your user only:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then open a new terminal.

## Step 6: Run and debug

Create `hello.py`:

```python
def mastery(correct: int, total: int) -> float:
    return correct / total if total else 0.0

scores = {"kanji": (8, 10), "grammar": (3, 10)}
for topic, (right, total) in scores.items():
    print(f"{topic}: {mastery(right, total):.0%}")
```

- **Run**: click ▷ (*Run Python File*) at the top right, or `python hello.py` in the terminal.
- **Debug**: click in the gutter left of line 6 to set a breakpoint (or press **F9**), then press **F5** and choose
  *Python Debugger: Current File*. Step with **F10**, step into with **F11**, and inspect variables in the left panel.

## Step 7: Recommended settings

**Ctrl+Shift+P → Preferences: Open User Settings (JSON)** and add:

```json
{
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true
  },
  "files.trimTrailingWhitespace": true,
  "python.terminal.activateEnvironment": true
}
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `python` opens the Microsoft Store or is "not found" | Install the Python install manager (Step 2) and open a **new** terminal; check *App execution aliases* in Windows Settings |
| `code` is not recognised | Reopen the terminal; on Windows rerun the installer with *Add to PATH* ticked |
| VS Code uses the wrong Python | **Python: Select Interpreter** and pick `.venv` |
| `ModuleNotFoundError` after installing a package | It went into another interpreter: activate `.venv` and use `python -m pip install` |
