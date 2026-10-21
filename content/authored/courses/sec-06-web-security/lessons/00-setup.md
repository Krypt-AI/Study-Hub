---
id: sec-06-web-security.l00
title: "Setup: a web security lab"
summary: Stand up an intentionally vulnerable target (OWASP Juice Shop) in Docker and an intercepting proxy (Burp Suite or OWASP ZAP), all isolated, plus the PortSwigger Web Security Academy for guided practice.
objectives:
  - Run an intentionally vulnerable web app locally in a container
  - Install and configure an intercepting proxy
  - Know where to practise legally and safely
estimatedMinutes: 45
topics: [sec06.setup]
resources:
  - { title: "OWASP Juice Shop", url: "https://owasp.org/www-project-juice-shop/", free: true, official: true }
  - { title: "Docker Desktop", url: "https://www.docker.com/products/docker-desktop/", free: true, official: true }
  - { title: "OWASP ZAP", url: "https://www.zaproxy.org/download/", free: true, official: true }
  - { title: "Burp Suite Community Edition", url: "https://portswigger.net/burp/communitydownload", free: true, official: true }
  - { title: "PortSwigger Web Security Academy (free labs)", url: "https://portswigger.net/web-security", free: true, official: true }
---

Builds on the lab from Stage 1. Everything here runs on **your own machine**; you test only targets you deployed.

## Scope first

Web attack techniques may be practised **only** against applications you own or are explicitly authorised to test.
Point them at a deliberately vulnerable app you run yourself, or at a provider's own practice range — never at a live
site. This is the line between learning security and committing an offence.

## Step 1: A vulnerable target — OWASP Juice Shop

**Juice Shop** is a modern web app built to contain the OWASP Top 10, made for learning. Run it in Docker, bound to
localhost only:

```bash
docker pull bkimminich/juice-shop
docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

Browse to `http://localhost:3000`. The `127.0.0.1:` prefix keeps it reachable only from your own machine. (If you do
not use Docker, Juice Shop can also run from source with Node.js.)

## Step 2: An intercepting proxy

A proxy sits between your browser and the app so you can see and modify requests — the core tool of web testing.
Choose one:

- **OWASP ZAP** — free and open source, from zaproxy.org (needs Java 17+).
- **Burp Suite Community Edition** — the free tier of the industry-standard tool.

Point your browser (or the tool's built-in browser) through the proxy, and you will see each HTTP request and response
and can inspect or alter them. Keep the proxy aimed only at your lab target.

## Step 3: Guided practice — Web Security Academy

PortSwigger's **Web Security Academy** is a free, high-quality set of explained, hosted labs covering every topic in
this course, with a safe target provided for each. It is the best place to practise the specific vulnerability classes
after you understand the theory here. Because the targets are provided and sandboxed by PortSwigger, practising there
is authorised by design.

## Step 4: Keep it isolated

Run the whole lab with the networking set so the vulnerable app cannot reach your real network or the internet (Stage
1's host-only approach, or simply the localhost binding above). Snapshot or just re-pull the container to reset.

## Check your setup

- Juice Shop loads at `http://localhost:3000`.
- Your proxy captures a request when you browse the target.
- You can reach the Web Security Academy and open a lab.
