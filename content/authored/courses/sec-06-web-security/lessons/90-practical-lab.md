---
id: sec-06-web-security.lab
title: "Practical lab: Juice Shop, a proxy and a passive scan"
subtitle: Hands-on session with the real tools
summary: "Run OWASP Juice Shop in Docker on your own machine, look at its traffic through ZAP or Burp, inspect its headers and cookies with curl, and run ZAP's passive baseline scan, then read the findings as a defender."
objectives:
  - Run a deliberately vulnerable app locally and keep it contained
  - Read HTTP requests, responses, cookies and security headers in a real proxy and with curl
  - Run a passive scan and turn its alerts into fixes
estimatedMinutes: 60
topics: [sec06.lab]
resources:
  - { title: "OWASP Juice Shop", url: "https://owasp.org/www-project-juice-shop/", free: true, official: true }
  - { title: "ZAP baseline scan", url: "https://www.zaproxy.org/docs/docker/baseline-scan/", free: true, official: true }
  - { title: "ZAP getting started", url: "https://www.zaproxy.org/getting-started/", free: true, official: true }
  - { title: "Burp Suite Community Edition", url: "https://portswigger.net/burp/communitydownload", free: true, official: true }
  - { title: "MDN: HTTP security headers", url: "https://developer.mozilla.org/en-US/docs/Web/Security", free: true, official: true }
  - { title: "PortSwigger Web Security Academy (free guided labs)", url: "https://portswigger.net/web-security", free: true, official: true }
---

You set up Docker, ZAP or Burp and Juice Shop in this course's setup lesson. Here you use them together, on a target that
is **yours** and **contained**. No custom environment is built: these are the real tools. This session is about
**observing and defending**; the Web Security Academy (linked above) is where you practise exploitation on targets built and
authorised for it.

> **Scope.** Only the Juice Shop container you start below is a target. Do not point ZAP, Burp or any scanner at a real site.

## Part 1: Start the target, contained

```bash
docker network create webinsec
docker run --rm -d --name juice --network webinsec -p 127.0.0.1:3000:3000 bkimminich/juice-shop
```

- `-p 127.0.0.1:3000:3000` publishes the app to **your machine only**, so nobody else on your network can reach it.
- The private **`webinsec`** network lets a second container (the scanner in Part 4) reach it by the name `juice`.
- `--rm` deletes the container when you stop it, which resets the app: a clean slate every time.

Open `http://localhost:3000`. You should see a juice shop. Browse a little: products, search, a basket, register an account.

## Part 2: Watch the traffic in a proxy

Start **ZAP** (or Burp) and use its built-in browser so no certificates or system settings need changing:

| In ZAP | In Burp |
|---|---|
| **Quick Start → Manual Explore**, enter `http://localhost:3000`, **Launch Browser** | **Proxy → Intercept → Open browser** |

Use the app in that browser, then look at what the proxy recorded (ZAP's **History** tab, Burp's **HTTP history**). Click a
request and read it in the same shape as the lesson on how the web works:

- the **request line** (method and path), the **headers** (`Host`, `Cookie`, `User-Agent`) and any **body**;
- the **response status** (200, 304, 404), the **response headers** and the **body**.

Questions to answer from the real traffic: *Is the site served over HTTP or HTTPS? Which request set a cookie, and with which
flags? What do the API calls look like (the `/rest/...` and `/api/...` paths)? What does a request for something that does
not exist return?* Notice that the client sends **everything** you can see here, and could send anything else: this is why the
server must never trust it.

## Part 3: Read the headers with curl

```bash
curl -I http://localhost:3000
```

`-I` fetches just the **response headers**. The block below is **illustrative** of the shape of the output: run the command
to see the app's real headers, which depend on its version, and fill in the table from what **you** see.

```text
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Feature-Policy: payment 'self'
Content-Type: text/html; charset=UTF-8
```

Compare with the **security headers** from the OWASP lesson and check each one:

| Header | Present? | What its absence or value means |
|---|---|---|
| `Content-Security-Policy` | | limits where scripts may load from; missing means less defence against XSS |
| `Strict-Transport-Security` | | only makes sense on HTTPS; missing on a real site means downgrade is easier |
| `X-Content-Type-Options: nosniff` | | stops MIME sniffing |
| `X-Frame-Options` or CSP `frame-ancestors` | | stops clickjacking |
| `Access-Control-Allow-Origin: *` | | lets **any** origin read responses: a **CORS** setting to question |

Also check the cookies: `curl -I` shows any `Set-Cookie` header; look for **`HttpOnly`**, **`Secure`** and **`SameSite`**.

## Part 4: A passive baseline scan

ZAP's **baseline scan** crawls the target for a minute and then reports what it saw. By its documentation it is **passive**:
it performs no actual attacks. Run it as a container on the same private network:

```bash
docker run --rm --network webinsec -v "$(pwd):/zap/wrk:rw" -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://juice:3000 -r report.html
```

- `-t` is the **target**, including the protocol; `juice` is the container's name on the private network.
- `-r report.html` writes an HTML report into your current folder (that is what the `-v` mount is for).
- On Windows PowerShell use `${PWD}` in place of `$(pwd)`.

When it finishes, the console lists each rule as **PASS**, **WARN-NEW** or **FAIL-NEW** and ends with a count. Open
`report.html` in a browser.

## Part 5: Turn alerts into fixes

For three alerts in the report, fill in a row like this (the rule names vary with the ZAP version and the app):

| Alert | Where | Risk | Why it matters | Fix |
|---|---|---|---|---|
| e.g. missing Content-Security-Policy | response headers | Medium | limits XSS damage | add a CSP header |
| e.g. cross-domain misconfiguration | `Access-Control-Allow-Origin: *` | Medium | any site may read responses | allow only trusted origins |
| e.g. cookie without HttpOnly | `Set-Cookie` | Low to Medium | script can read the cookie | set HttpOnly (and Secure, SameSite) |

That table is the beginning of a real security finding (Stage 9 lesson 4). A passive scan finds **misconfigurations and missing
defences**; it cannot find logic flaws such as broken access control, which need a human to test with intent. Know what a tool
does *not* tell you.

## Clean up

```bash
docker stop juice
docker network rm webinsec
```

## If something goes wrong

| Problem | Fix |
|---|---|
| `docker: command not found` | start **Docker Desktop** (setup lesson) and reopen the terminal |
| Port 3000 is already in use | stop whatever uses it, or publish another port such as `127.0.0.1:3001:3000` |
| ZAP cannot reach `juice` | the scanner must be on the same `--network webinsec` as the app; `localhost` inside a container is the container itself |
| Browser shows a certificate warning | you used `https://`; Juice Shop here is plain `http://localhost:3000` |
