---
{
  "id": "fs-09-auth-security-testing.l01",
  "title": "Authentication and sessions",
  "summary": "Storing passwords, sessions versus tokens, cookies and the flows users expect.",
  "objectives": [
    "Store passwords with a slow salted hash",
    "Compare cookie sessions and JWTs",
    "Set cookie flags and design sign-in flows safely"
  ],
  "estimatedMinutes": 45,
  "topics": [
    "fs-09-auth-security-testing.authentication"
  ],
  "resources": [
    {
      "title": "OWASP Authentication cheat sheet",
      "url": "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
      "free": true,
      "official": true
    },
    {
      "title": "Cookies (MDN)",
      "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies",
      "free": true,
      "official": true
    }
  ]
}
---

## Authentication versus authorisation

**Authentication** answers "who are you?"; **authorisation** answers "what may you do?". Both are checked **on the server** for every request.

## Passwords

- Never store passwords or reversible encryption. Store a **salted, slow hash**: **Argon2id**, scrypt or bcrypt. A fast hash such as SHA-256 lets attackers try billions of guesses per second.
- The salt is random per user, so identical passwords produce different hashes.
- Compare in constant time (the library does it), rate-limit sign-in attempts and offer **multi-factor authentication**.
- Return the same message for "no such user" and "wrong password".

## Sessions or tokens

| | Server session | Signed token (JWT) |
|---|---|---|
| State | stored on the server, looked up by an id in a cookie | self-contained, verified by signature |
| Revocation | delete the session | hard until expiry; needs a deny-list or short lifetime |
| Best for | typical web apps with a first-party UI | APIs consumed by several services or apps |

A JWT is **signed, not encrypted**: anyone can read it, so never put secrets in one. Keep access tokens short-lived and rotate refresh tokens.

## Cookies

```http
Set-Cookie: sid=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
```

- `HttpOnly`: JavaScript cannot read it, which limits theft through XSS.
- `Secure`: sent only over HTTPS.
- `SameSite=Lax` or `Strict`: not sent on most cross-site requests, which limits CSRF.

## Use proven building blocks

Prefer a maintained library or identity provider (OAuth 2.0 / OpenID Connect, "Sign in with Google", Auth.js, Clerk, Supabase Auth) to writing your own. Authentication is where small mistakes become account takeovers.
