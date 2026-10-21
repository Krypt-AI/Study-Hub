---
id: sec-06-web-security.l02
title: Broken access control
summary: "The number-one web vulnerability: what it is, its common forms (IDOR, missing function-level checks, forced browsing), and how to design access control that holds."
objectives:
  - Explain why broken access control is the most common serious web flaw
  - Recognise IDOR, missing function-level authorisation and forced browsing
  - Design server-side access control that enforces on every request
estimatedMinutes: 50
topics: [sec06.access]
resources:
  - { title: "OWASP Top 10:2025 — A01 Broken Access Control", url: "https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/", free: true, official: true }
  - { title: "OWASP Authorization Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html", free: true, official: true }
  - { title: "PortSwigger Academy: access control vulnerabilities", url: "https://portswigger.net/web-security/access-control", free: true, official: true }
---

## Why it tops the list

**Broken access control** — a user doing something they should not be allowed to — is the most common serious web
vulnerability (A01 in the OWASP Top 10, 2021 and 2025). It is common because it is an **error of omission**: the
developer builds the feature and simply forgets to check, on the server, that *this* user is allowed to use it on
*this* data. Everything looks fine in normal use; the hole only shows when someone asks for what the UI never offered.

## Common forms

- **Insecure Direct Object Reference (IDOR).** The app exposes a record id and trusts it: `/invoice?id=1001`. Change
  it to `1002` and you see another user's invoice, because the server fetched the record without checking who owns it.
- **Missing function-level access control.** A normal user calls an admin action directly (`POST /admin/deleteUser`),
  because the control was only hiding the *button*, not protecting the *endpoint*.
- **Forced browsing.** Guessing or finding URLs/APIs that were never linked for this user but are not actually
  protected (`/admin`, `/api/v1/users`).
- **Metadata/parameter tampering.** Editing a cookie, JWT claim or hidden field like `role=user` to `role=admin`.

All share one root cause: **authorisation decided by what the client sends or sees, rather than enforced on the
server.**

## Designing access control that holds

- **Deny by default.** No access unless a rule grants it (fail-safe defaults, Stage 4).
- **Enforce on the server, on every request** (complete mediation). Never rely on hidden UI, client-side checks, or
  "they got here so they must be allowed".
- **Check ownership, not just authentication.** For every object, verify this user is entitled to this specific
  record — do not fetch by id alone.
- **Centralise the logic.** One authorisation layer the whole app goes through, not a scattered check copy-pasted
  (and sometimes forgotten) per endpoint.
- **Prefer indirect references or unguessable ids** where it reduces risk, but treat that as defence in depth, not the
  control itself — the ownership check is the control.
- **Log access-control failures** and alert on bursts (someone enumerating ids).

## Testing it (in your lab)

In an app you are authorised to test, access control is checked by logging in as a **low-privilege** user and trying to
reach another user's data or an admin function, then confirming the server returns 401/403 rather than the data. The
PortSwigger labs walk through exactly these cases on provided targets. The defender's takeaway is the same every time:
the server must independently decide "is this identity allowed to do this, to this object?" and must do it every time.
