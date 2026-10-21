---
id: sec-06-web-security.l01
title: How the web works, for security
summary: The HTTP request/response cycle, methods and status codes, cookies and sessions, same-origin policy, and where trust boundaries sit in a web app.
objectives:
  - Describe an HTTP request/response and the role of headers and cookies
  - Explain the client/server trust boundary and why client data is untrusted
  - Describe the same-origin policy and secure cookie attributes
estimatedMinutes: 50
topics: [sec06.http]
resources:
  - { title: "MDN: HTTP overview", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview", free: true, official: true }
  - { title: "MDN: Same-origin policy", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy", free: true, official: true }
  - { title: "OWASP Session Management Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html", free: true, official: true }
---

## The request/response cycle

The web runs on **HTTP**: the browser (client) sends a **request**, the server returns a **response**. A request has a
**method**, a **path**, **headers** and sometimes a **body**:

```http
POST /login HTTP/1.1
Host: shop.example
Content-Type: application/json
Cookie: session=abc123

{"user":"aina","pass":"..."}
```

Common **methods**: GET (read), POST (submit/create), PUT/PATCH (update), DELETE (remove). Common **status codes**:
200 OK, 302 redirect, 401 unauthenticated, 403 forbidden, 404 not found, 500 server error. Reading these fluently is
the foundation of web testing — your proxy (lesson 0) shows them for every exchange.

## The trust boundary: never trust the client

The single most important security idea on the web: **everything from the client is attacker-controlled.** The
browser, the form, the URL, headers, cookies, hidden fields and JavaScript all run on the user's machine, where they
can be changed at will with a proxy. Therefore:

- **All validation and authorisation must happen on the server.** Client-side checks are for user convenience only.
- Hidden form fields, disabled buttons and client-side price calculations are not security.
- The server must re-verify, on every request, that the user is allowed to do what they are asking (complete
  mediation, Stage 4).

Most web vulnerabilities are, at root, the server trusting something it should not have.

## Cookies and sessions

HTTP is **stateless**, so after login the server issues a **session** identifier, usually in a **cookie** the browser
returns on each request (Cryptography course, lesson 5). Protect it with cookie attributes:

- `HttpOnly` — JavaScript cannot read it (limits theft via XSS).
- `Secure` — sent only over HTTPS.
- `SameSite` — restricts sending it on cross-site requests (limits CSRF).

A stolen or predictable session id lets an attacker impersonate the user, so session ids must be long, random, rotated
on login, and expired properly.

## Same-origin policy

An **origin** is the scheme + host + port (`https://shop.example:443`). The **same-origin policy** stops a script on
one origin from reading data from another, which is what keeps a malicious page from reading your webmail in another
tab. **CORS** headers let a server deliberately relax this for specific trusted origins — misconfigured CORS (allowing
`*` or reflecting any origin with credentials) is a common flaw.

Keep the mental model: the browser enforces origin boundaries, but the **server** must enforce *authorisation*. The
next lessons are mostly about servers that forgot to.
