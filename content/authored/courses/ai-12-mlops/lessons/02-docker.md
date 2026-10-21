---
id: ai-12-mlops.l02
title: Containers
summary: What containers are and why they matter for ML, images and the Dockerfile, reproducible builds, image size, and running containers in production.
objectives:
  - Explain containers versus virtual machines and why ML uses them
  - Read a Dockerfile and build a reproducible image
  - Apply image-size and security basics
estimatedMinutes: 50
topics: [ai12.docker]
resources:
  - { title: "Docker: get started", url: "https://docs.docker.com/get-started/", free: true, official: true }
  - { title: "Docker: build best practices", url: "https://docs.docker.com/build/building/best-practices/", free: true, official: true }
  - { title: "Kubernetes: concepts overview", url: "https://kubernetes.io/docs/concepts/overview/", free: true, official: true }
---

## What a container is

A **container** packages your application with everything it needs — code, dependencies, libraries, runtime — into one
unit that runs the same on any machine with a container runtime. It solves ML's chronic "works on my machine" problem:
the exact Python version, the exact library versions (Stage 2), even system libraries, travel with the app.

Containers differ from **virtual machines**: a VM virtualises a whole machine with its own OS (heavy, slow to start,
Stage 1); a container shares the host kernel and isolates just the application (lightweight, starts in seconds). For
deploying many services, containers are the standard unit.

## Images and the Dockerfile

A container is created from an **image**, a read-only template built from a **Dockerfile** — a recipe of steps:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # dependencies first (cached layer)
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

Each instruction is a cached **layer**; ordering matters — copy and install dependencies **before** copying your code,
so changing code does not re-install everything. `docker build` makes the image; `docker run` starts a container from
it. The model file is baked into the image or mounted/loaded from a registry (Stage 6).

## Reproducible, lean and secure images

- **Pin versions** (Stage 2) — a fixed base image tag and locked dependencies, so a rebuild months later is identical
  and no upstream change silently alters behaviour.
- **Keep images small** — use a slim base, install only what you need, use a `.dockerignore`, and consider
  **multi-stage builds** (build in one stage, copy only the artifacts into a minimal final stage). Smaller images
  deploy faster and have less attack surface (Cybersecurity course).
- **Security basics** — do not bake secrets into the image (pass them at runtime, Stage 2); run as a **non-root**
  user; scan images for known vulnerabilities; start from trusted base images.

## Running in production

One container per machine via `docker run` is fine for small deployments. At scale you need **orchestration** —
scheduling containers across machines, restarting failed ones, scaling up and down, and routing traffic.
**Kubernetes** is the dominant orchestrator (the KCNA/CKA certifications and the Linux Administration pathway go
deep). Managed platforms (cloud container/serverless services) run containers for you without managing the cluster
yourself.

Containers are the packaging that makes everything after this lesson possible: CI/CD builds and ships images (lesson
3), deployments roll out new image versions (lesson 4), and the same image you tested is exactly what runs in
production — the reproducibility that MLOps depends on.
