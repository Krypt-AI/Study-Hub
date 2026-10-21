---
id: sec-06-web-security.l03
title: Injection and cross-site scripting
summary: The injection family (SQL, command, etc.) and cross-site scripting, the single idea behind them, and the defences — parameterisation, output encoding, validation and CSP.
objectives:
  - Explain injection as data being treated as code, and its defence
  - Describe the XSS types and how to prevent them
  - Apply allowlist validation and context-aware encoding
estimatedMinutes: 55
topics: [sec06.injection]
resources:
  - { title: "OWASP Top 10:2025 — Injection", url: "https://owasp.org/Top10/2025/", free: true, official: true }
  - { title: "OWASP SQL Injection Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", free: true, official: true }
  - { title: "OWASP Cross Site Scripting Prevention Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html", free: true, official: true }
  - { title: "MDN: Content Security Policy (CSP)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP", free: true, official: true }
---

## One idea behind the whole family

**Injection** happens when untrusted input is mixed into a command or query so that the input is interpreted as
**code** rather than **data**. The interpreter — a SQL database, a shell, an LDAP server, the browser's HTML/JS engine
— cannot tell the developer's intended structure from the attacker's added structure, and executes both. SQL
injection, command injection, LDAP injection and cross-site scripting are all this one bug against different
interpreters.

The fix is always the same shape: **keep data and code separate** so input can never change the structure.

## SQL injection and its defence

If a query is built by pasting input into a string, input containing SQL syntax changes the query's meaning. The
defence is **parameterised queries (prepared statements)**: the SQL structure is fixed and the input is bound as a
pure value that can never become code.

```python
# Vulnerable: input is concatenated into the SQL string.
cursor.execute("SELECT * FROM users WHERE name = '" + name + "'")

# Safe: the structure is fixed; `name` is bound as data, not code.
cursor.execute("SELECT * FROM users WHERE name = ?", (name,))
```

Use parameterisation everywhere, add least-privilege database accounts (Stage 7) and input validation as defence in
depth, and never rely on escaping by hand. The same principle applies to OS commands (use safe APIs with argument
arrays, never build a shell string from input).

## Cross-site scripting (XSS)

**XSS** is injection into the **browser**: an attacker gets their script to run in another user's page, where it can
steal session cookies, act as the user, or deface the page. Types:

- **Stored** — the malicious script is saved by the app (e.g. in a comment) and served to every viewer.
- **Reflected** — the script rides in a request (e.g. a URL parameter) and is echoed straight back into the response.
- **DOM-based** — client-side JavaScript writes untrusted data into the page unsafely.

### Defending against XSS

- **Context-aware output encoding.** When user data is placed into HTML, attributes, JavaScript or URLs, encode it for
  that context so it is rendered as text, never executed. Modern frameworks (React, Angular) auto-encode by default —
  do not defeat them with `dangerouslySetInnerHTML`/`bypassSecurityTrust` on untrusted data.
- **Content Security Policy (CSP).** An HTTP header that restricts where scripts may load from and blocks inline
  script, limiting damage even if an injection slips through — defence in depth.
- **Input validation** (below) and `HttpOnly` cookies (so stolen-cookie impact is reduced).

## Validation: allowlist, not denylist

Validate input against **what is allowed**, not against a list of known-bad strings:

- **Allowlist**: accept only input matching the expected shape (e.g. a date, a known category, `^[a-z0-9_]{3,20}$`),
  reject everything else. Hard to bypass because it defines "good".
- **Denylist**: block bad patterns. Attackers slip past with encodings and cases the list did not foresee.

Validation is **defence in depth**, not the primary fix: parameterisation and encoding address the actual structural
bug, while validation reduces the inputs that ever reach them. Do validation (and all security decisions) on the
server.
