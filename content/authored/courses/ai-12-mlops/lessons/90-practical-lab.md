---
id: ai-12-mlops.lab
title: "Practical lab: package and serve a model in Docker"
subtitle: Hands-on session with the real tools
summary: "Install Docker Desktop, run the official hello-world container, then build and run a small prediction API as an image, call it with curl, read its logs and clean up, the exact workflow behind the serving and container lessons."
objectives:
  - Run containers with Docker and inspect them with docker ps and docker logs
  - Write a Dockerfile for a small prediction API, build it and call it
  - Apply the image-hygiene rules from the lesson to your own Dockerfile
estimatedMinutes: 60
topics: [ai12.lab]
resources:
  - { title: "Docker Desktop install guide", url: "https://docs.docker.com/desktop/", free: true, official: true }
  - { title: "Docker: get started", url: "https://docs.docker.com/get-started/", free: true, official: true }
  - { title: "Dockerfile reference", url: "https://docs.docker.com/reference/dockerfile/", free: true, official: true }
  - { title: "Docker build best practices", url: "https://docs.docker.com/build/building/best-practices/", free: true, official: true }
  - { title: "FastAPI", url: "https://fastapi.tiangolo.com/", free: true, official: true }
---

Everything in this lab is the **real Docker**, building a real image from a real Dockerfile. You do not need a GPU, a cloud
account or a custom setup: just Docker Desktop and VS Code.

> **Install check.** Docker Desktop is free for personal use, education and small businesses. On Windows it needs
> virtualisation enabled and the WSL 2 backend; the install guide above lists the exact requirements for your system.

## Part 1: Prove the install

Start **Docker Desktop**, wait until it says it is running, then in a terminal:

```bash
docker --version
docker run hello-world
```

The `hello-world` image is Docker's own test. It downloads, runs, prints a message beginning `Hello from Docker!` that says your
installation appears to be working, and exits. Then look around:

```bash
docker images          # the images you have downloaded
docker ps -a           # all containers, including the stopped hello-world one
```

An **image** is the read-only template; a **container** is a running (or finished) instance of it. You just saw both.

## Part 2: A tiny model service

In VS Code create a folder `demo-model` with three files.

**`app.py`**, a stand-in "model": a pure function exposed over HTTP:

```python
from fastapi import FastAPI

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/predict")
def predict(x: float):
    return {"prediction": 2 * x + 1}
```

**`requirements.txt`**: pin the versions. Find the ones to use by installing in a scratch virtual environment and running
`pip freeze`, then keep only the lines for `fastapi` and `uvicorn`:

```text
fastapi==<version from pip freeze>
uvicorn==<version from pip freeze>
```

**`Dockerfile`**:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
RUN useradd --create-home appuser
USER appuser
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Read it as the container lesson taught: a **pinned base tag**, dependencies installed **before** the code is copied (so the
dependency layer is cached when only `app.py` changes), and a **non-root user**. The model would be loaded once at startup in
a real service; this stand-in keeps the lab small.

## Part 3: Build, run, call

```bash
docker build -t demo-model .
docker run --rm -d --name demo -p 127.0.0.1:8000:8000 demo-model
curl http://127.0.0.1:8000/health
curl "http://127.0.0.1:8000/predict?x=3"
```

You should see:

```text
{"status":"ok"}
{"prediction":7.0}
```

(2 × 3 + 1 = 7.) `-p 127.0.0.1:8000:8000` publishes the service to **your machine only**; `--rm` removes the container when it
stops; `-d` runs it in the background. Now inspect it:

```bash
docker ps                      # the running container, its image and ports
docker logs demo               # the service's log: each request appears as a line
docker exec -it demo sh -c "whoami"     # which user the process runs as (expect: appuser)
```

Try a bad request, `curl "http://127.0.0.1:8000/predict?x=abc"`, and read the response: FastAPI **validates the input** and
returns a clear `422` error rather than crashing, the input-validation habit from the serving lesson. Look for that request in
`docker logs demo`.

## Part 4: Clean up

```bash
docker stop demo          # --rm deletes the container
docker images             # demo-model is still here
docker rmi demo-model     # remove the image when you are done
```

## Part 5: Review your own Dockerfile

Check it against the lesson's checklist, and decide for each line whether it is fine:

| Check | Why |
|---|---|
| base image tag is **pinned** (not `latest`) | a rebuild later is identical |
| dependencies are installed **before** copying the code | layer caching |
| a **non-root** `USER` is set | a compromised service gets fewer rights |
| **no secrets** in `ENV`, `ARG` or `COPY` | anything in an image can be read by whoever has the image |
| a **`.dockerignore`** excludes `.git`, `.env`, `__pycache__` | smaller image, no leaked files |

## If something goes wrong

| Problem | Fix |
|---|---|
| `docker: command not found` or "cannot connect to the Docker daemon" | start Docker Desktop and wait for it to finish starting |
| `port is already allocated` | another program uses 8000; publish `127.0.0.1:8001:8000` and call port 8001 |
| `pip` fails in the build | check the pinned versions exist, and your network can reach the package index |
| `curl` is not found on Windows | use PowerShell's `curl.exe` or open the URL in a browser |
