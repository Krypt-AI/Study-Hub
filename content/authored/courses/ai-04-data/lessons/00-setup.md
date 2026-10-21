---
id: ai-04-data.l00
title: "Setup: data tools in VS Code"
summary: A data workspace with pandas, NumPy, Matplotlib and seaborn, plus the VS Code extensions for viewing CSV files and DataFrames.
objectives:
  - Create a data project with pandas, Matplotlib, seaborn and Jupyter
  - Inspect CSV files and DataFrames with Rainbow CSV and Data Wrangler
  - Keep raw data out of Git and in a predictable folder layout
estimatedMinutes: 30
topics: [ai04.setup]
resources:
  - { title: "pandas: Installation", url: "https://pandas.pydata.org/docs/getting_started/install.html", free: true, official: true }
  - { title: "VS Code: Data Wrangler", url: "https://code.visualstudio.com/docs/datascience/data-wrangler", free: true, official: true }
  - { title: "VS Code: Data science in VS Code tutorial", url: "https://code.visualstudio.com/docs/datascience/data-science-tutorial", free: true, official: true }
  - { title: "seaborn: Installing and getting started", url: "https://seaborn.pydata.org/installing.html", free: true, official: true }
---

Builds on lesson 0 of Stages 1–3 (VS Code, Python, Git, Jupyter).

## Step 1: Project and packages

```powershell
mkdir $HOME\code\data-prep; cd $HOME\code\data-prep
uv init
uv add pandas numpy matplotlib seaborn pyarrow ipykernel
mkdir data\raw, data\processed, notebooks
code .
```

- `pyarrow` lets pandas read and write **Parquet**, a compact, typed file format that is much better than CSV for
  intermediate data.
- macOS/Linux: `mkdir -p data/raw data/processed notebooks`.

Add to `.gitignore`:

```gitignore
data/raw/
data/processed/
```

Commit a small `data/README.md` that says where the raw data comes from and how to download it.

## Step 2: Extensions

| Extension | ID | Why |
|---|---|---|
| Data Wrangler | `ms-toolsai.datawrangler` | Spreadsheet-like view of DataFrames and CSVs with column statistics; generates pandas code for cleaning steps |
| Rainbow CSV | `mechatroner.rainbow-csv` | Colours CSV columns and aligns them, so broken quoting and shifted columns stand out |
| Jupyter | `ms-toolsai.jupyter` | Installed in Stage 1 |

## Step 3: Get a practice dataset

Download any public CSV (for example a dataset from data.gov.my, the Malaysian government's open-data portal, or a
UCI Machine Learning Repository dataset) into `data/raw/`. Then in a notebook:

```python
import pandas as pd
df = pd.read_csv("../data/raw/your_file.csv")
df.info()
df.head()
```

After running a cell that creates `df`, click **Open 'df' in Data Wrangler** under the output (or use the Variables
view). Data Wrangler shows missing values, distributions and unique counts per column; any cleaning step you make there
can be exported as pandas code into the notebook, which is how you keep the cleaning reproducible.

## Check your setup

```python
import pandas as pd, numpy as np, matplotlib, seaborn
print(pd.__version__, np.__version__, matplotlib.__version__, seaborn.__version__)
pd.DataFrame({"a": [1, 2]}).to_parquet("check.parquet")   # proves pyarrow works; then delete the file
```
