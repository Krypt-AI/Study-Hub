---
id: ai-07-deep-learning.l00
title: "Setup: PyTorch in VS Code (CPU, NVIDIA GPU or Apple silicon)"
summary: Install PyTorch with the right build for your hardware, check that it sees your GPU, and use VS Code's debugger and TensorBoard support for training code. Includes free cloud GPUs if you have none.
objectives:
  - Install the correct PyTorch build for CPU, NVIDIA CUDA or Apple MPS
  - Verify the install and pick the device in code
  - Debug training code in VS Code and view TensorBoard logs
estimatedMinutes: 40
topics: [ai07.setup]
resources:
  - { title: "PyTorch: Get started locally (install selector)", url: "https://pytorch.org/get-started/locally/", free: true, official: true }
  - { title: "uv: Using uv with PyTorch", url: "https://docs.astral.sh/uv/guides/integration/pytorch/", free: true, official: true }
  - { title: "NVIDIA drivers", url: "https://www.nvidia.com/en-us/drivers/", free: true, official: true }
  - { title: "PyTorch: Visualizing models, data and training with TensorBoard", url: "https://docs.pytorch.org/tutorials/intermediate/tensorboard_tutorial.html", free: true, official: true }
  - { title: "Google Colab (free GPU notebooks)", url: "https://colab.research.google.com/", free: true, official: true }
---

Builds on lesson 0 of Stages 1–6. Everything in this course runs on a CPU; a GPU only makes the larger experiments
(lessons 4–5) faster.

## Step 1: Which build do you need?

| Your machine | Build | Notes |
|---|---|---|
| No NVIDIA GPU (most laptops) | **CPU** | Fine for this course |
| NVIDIA GeForce/RTX GPU on Windows or Linux | **CUDA** | Install the latest NVIDIA driver first; the CUDA runtime comes inside the PyTorch wheel, so you do **not** need the separate CUDA Toolkit |
| Mac with Apple silicon (M1–M4 and later) | Default build | Uses the GPU through **MPS** (Metal) |
| AMD GPU on Linux | ROCm build | Choose ROCm in the selector |

Check for an NVIDIA GPU on Windows: open Task Manager → Performance, or run `nvidia-smi` in a terminal (it prints the
driver version and GPU name if a driver is installed).

## Step 2: Install

Open **pytorch.org/get-started/locally**, choose *Stable*, your OS, *Pip*, *Python* and your compute platform (CPU, a
CUDA version, or ROCm), and copy the command it shows. Run it inside your project's environment:

```powershell
mkdir $HOME\code\deep-learning; cd $HOME\code\deep-learning
python -m venv .venv; .venv\Scripts\activate
# paste the selector's command, for example the CPU build:
python -m pip install torch torchvision
# an NVIDIA build adds --index-url https://download.pytorch.org/whl/cu<version> (copy it from the selector)
python -m pip install matplotlib tensorboard ipykernel
```

With uv, follow uv's PyTorch guide, which shows how to point `pyproject.toml` at the CPU or CUDA index so `uv sync`
always installs the same build.

The CUDA wheels are large (several GB). If the download fails, rerun the command; pip resumes from its cache.

## Step 3: Verify

```python
import torch
print(torch.__version__)
print("CUDA:", torch.cuda.is_available())
print("MPS:", torch.backends.mps.is_available())

device = (
    "cuda" if torch.cuda.is_available()
    else "mps" if torch.backends.mps.is_available()
    else "cpu"
)
x = torch.rand(3, 3, device=device)
print(x @ x.T, x.device)
```

If you have an NVIDIA GPU but `CUDA: False`, you installed the CPU build or your driver is too old: reinstall using
the CUDA command from the selector and update the driver.

## Step 4: No GPU? Use a free cloud notebook

Google Colab and Kaggle Notebooks give free, time-limited GPU sessions in the browser. In Colab choose
*Runtime → Change runtime type → T4 GPU*. VS Code can also open Colab: install the **Jupyter** extension, open a
notebook, click **Select Kernel → Colab** if the Colab extension is available to you, or simply upload the notebook.
Never put API keys or private data in a shared notebook.

## Step 5: Debugging and monitoring in VS Code

- Put a breakpoint inside the training loop and press **F5**: hover over a tensor to see its shape, dtype and
  device. Most deep learning bugs are shape or device mismatches.
- Add `print(x.shape)` or use the Debug Console to run `x.shape` while paused.
- **TensorBoard**: log scalars with `torch.utils.tensorboard.SummaryWriter`, then run `tensorboard --logdir runs` and
  open http://localhost:6006 (or **Simple Browser: Show** inside VS Code).
- Watch GPU memory with `nvidia-smi -l 2` in a second terminal.

## Check your setup

The verification script prints a version, the device you will use, and a 3 × 3 tensor.
