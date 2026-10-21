---
id: ai-03-math.l00
title: "Setup: Jupyter notebooks, NumPy and Matplotlib in VS Code"
summary: Create a maths workspace with a virtual environment, NumPy, SymPy and Matplotlib, and run Jupyter notebooks inside VS Code.
objectives:
  - Install NumPy, Matplotlib, SymPy and ipykernel into a project environment
  - Create and run a Jupyter notebook in VS Code with the right kernel
  - Plot a function and check a derivative symbolically
estimatedMinutes: 30
topics: [ai03.setup]
resources:
  - { title: "VS Code: Jupyter Notebooks", url: "https://code.visualstudio.com/docs/datascience/jupyter-notebooks", free: true, official: true }
  - { title: "NumPy: Installing", url: "https://numpy.org/install/", free: true, official: true }
  - { title: "Matplotlib: Quick start guide", url: "https://matplotlib.org/stable/users/explain/quick_start.html", free: true, official: true }
  - { title: "SymPy tutorial", url: "https://docs.sympy.org/latest/tutorials/intro-tutorial/index.html", free: true, official: true }
---

Builds on **Python and Programming Fundamentals, lesson 0** (VS Code, Python, the Python and Jupyter extensions). The
exercises in this course run in the browser, but experimenting with plots in a notebook makes the maths much easier to
see.

## Step 1: Create the workspace

```powershell
mkdir $HOME\code\ai-math; cd $HOME\code\ai-math
uv init                                   # or: python -m venv .venv
uv add numpy matplotlib sympy ipykernel   # or: python -m pip install numpy matplotlib sympy ipykernel
code .
```

`ipykernel` lets Jupyter run code with **this** environment's packages.

## Step 2: Your first notebook

1. **Ctrl+Shift+P → Create: New Jupyter Notebook**, save it as `explore.ipynb`.
2. Click **Select Kernel** (top right) → **Python Environments** → the `.venv` one.
3. Type in a cell and press **Shift+Enter** to run it and move on:

```python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-6, 6, 200)
sigmoid = 1 / (1 + np.exp(-x))
plt.plot(x, sigmoid, label="sigmoid")
plt.plot(x, sigmoid * (1 - sigmoid), label="derivative")
plt.legend(); plt.grid(True); plt.show()
```

The plot appears under the cell. Note that the derivative peaks at 0.25 (lesson 2 explains why that matters).

4. Click **Variables** in the notebook toolbar to see every variable, its type and shape; arrays open in the Data Viewer.

## Step 3: Check derivatives with SymPy

```python
import sympy as sp
x = sp.symbols("x")
sp.diff((3 * x + 1) ** 2, x)          # 18*x + 6, which is 6(3x + 1)
sp.diff(1 / (1 + sp.exp(-x)), x)      # exp(-x)/(1 + exp(-x))**2, which equals σ(x)(1 − σ(x))
```

SymPy is a good way to check your hand derivations in lessons 2 and 3.

## Notebook habits

- **Restart Kernel and Run All** before you trust a result (hidden state, see Stage 2 lesson 4).
- **Clear All Outputs** before committing a notebook to Git.
- Keep functions you reuse in a `.py` file and `import` them.

## Check your setup

```python
import numpy, matplotlib, sympy
print(numpy.__version__, matplotlib.__version__, sympy.__version__)
```
