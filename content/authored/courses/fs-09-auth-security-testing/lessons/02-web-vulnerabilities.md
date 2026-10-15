---
{
  "id": "fs-09-auth-security-testing.l02",
  "title": "Common web vulnerabilities",
  "summary": "The attacks behind most real incidents, how each works and the defence that stops it.",
  "objectives": [
    "Recognise injection, XSS, CSRF and broken access control",
    "Apply the standard defence for each",
    "Use the OWASP Top 10 as a checklist"
  ],
  "estimatedMinutes": 50,
  "topics": [
    "fs-09-auth-security-testing.web-vulnerabilities"
  ],
  "resources": [
    {
      "title": "OWASP Top 10",
      "url": "https://owasp.org/www-project-top-ten/",
      "free": true,
      "official": true
    },
    {
      "title": "OWASP Cheat Sheet Series",
      "url": "https://cheatsheetseries.owasp.org/",
      "free": true,
      "official": true
    }
  ]
}
---

## Think like an attacker, defend like an engineer

Everything arriving from outside (form fields, headers, cookies, URLs, uploaded files, API responses from third parties) is **untrusted input**. Most vulnerabilities are untrusted input reaching an interpreter or a decision.

| Vulnerability | What happens | Defence |
|---|---|---|
| **SQL injection** | input changes the structure of a query | parameterised queries; least-privilege DB user |
| **XSS** (cross-site scripting) | attacker's script runs in a victim's page | escape on output (frameworks do); avoid `innerHTML` and `dangerouslySetInnerHTML`; Content-Security-Policy |
| **CSRF** | another site makes the browser send an authenticated request | `SameSite` cookies, CSRF tokens, check `Origin` |
| **Broken access control** | a user reads or changes someone else's data | check ownership on **every** request on the server |
| **IDOR** | `/invoices/17` works for any logged-in user | authorise the object, not just the user |
| **SSRF** | server fetches an attacker-chosen URL | allow-list destinations; block internal ranges |
| **Mass assignment** | request sets fields it should not (`isAdmin`) | accept an explicit allow-list of fields |
| **Vulnerable dependencies** | a library has a known flaw | `npm audit`, automated updates, lock files |
| **Secrets in code** | keys leak through the repository | environment variables, secret scanning, rotation |

## Broken access control in code

```ts
// vulnerable: any signed-in user can read any note
app.get("/api/notes/:id", auth, async (req, res) => res.json(await notes.find(req.params.id)));

// correct: scope by the owner
app.get("/api/notes/:id", auth, async (req, res) => {
  const note = await notes.findOne({ id: req.params.id, userId: req.user.id });
  if (!note) return res.status(404).end();
  res.json(note);
});
```

## Security headers

`Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. Serve everything over HTTPS and configure CORS to name the origins you trust, never `*` with credentials.

## Defence in depth

No single control is enough: validate input, encode output, use least privilege, log and monitor, and keep dependencies updated. Test your own application with the OWASP ZAP scanner or deliberately vulnerable practice sites, and only ever against systems you own or are authorised to test.
