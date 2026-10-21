---
id: sec-05-cryptography.l05
title: Passwords and authentication
summary: Why passwords are hashed with slow salted functions, the authentication factors, multi-factor and phishing-resistant methods, and how sessions and tokens keep you signed in.
objectives:
  - Store passwords with a salted, slow password hash and explain why
  - Distinguish the authentication factors and choose strong MFA
  - Explain sessions, tokens and why defence favours the verifier
estimatedMinutes: 50
topics: [sec05.auth]
resources:
  - { title: "OWASP Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", free: true, official: true }
  - { title: "NIST SP 800-63B (Digital Identity: authentication)", url: "https://pages.nist.gov/800-63-4/sp800-63b.html", free: true, official: true }
  - { title: "OWASP Authentication Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html", free: true, official: true }
  - { title: "FIDO Alliance: passkeys", url: "https://fidoalliance.org/passkeys/", free: true, official: true }
---

## Never store passwords, store verifiers

A service should never be able to read your password. It stores a **verifier**: a hash it can check a login against but
cannot reverse. Three rules make that safe:

1. **Hash, do not encrypt.** Encryption is reversible; if the key leaks, every password is exposed.
2. **Salt** each password with a unique random value, stored alongside the hash. Salting means two users with the same
   password get different hashes, and precomputed **rainbow tables** are useless.
3. **Use a slow, purpose-built password hash** — **Argon2id** (preferred), **scrypt**, **bcrypt** or **PBKDF2** — tuned
   so each guess is expensive. A fast hash like plain SHA-256 lets an attacker try billions of guesses per second on
   stolen data.

```python
# Illustration of the shape only; in real code call a vetted library (argon2-cffi, bcrypt).
import hashlib, os
salt = os.urandom(16)
stored = salt + hashlib.scrypt(b"correct horse", salt=salt, n=2**14, r=8, p=1, dklen=32)
```

Modern guidance (NIST SP 800-63B) also favours **length over forced complexity**, screening new passwords against
known-breached lists, and *not* forcing periodic resets without cause.

## Authentication factors

Authentication proves who you are using one or more **factors**:

- **Something you know** — password, PIN.
- **Something you have** — phone authenticator, hardware security key, passkey.
- **Something you are** — fingerprint, face.

**Multi-factor authentication (MFA)** combines *different* factor types, so a stolen password alone is not enough. Not
all MFA is equal:

| Method | Strength |
|---|---|
| SMS one-time code | Weakest MFA: vulnerable to SIM-swap and interception, but far better than none. |
| Authenticator app (TOTP) | Good: a 6-digit code from a shared seed, rotating every 30 s. |
| **Passkeys / FIDO2 security keys** | Strongest: public-key based and **phishing-resistant** — the credential is bound to the real site's origin, so a look-alike site cannot use it. |

## Sessions and tokens

After you sign in, the server issues a **session**: a random session id in a cookie, or a signed **token** (such as a
JWT). The browser sends it with each request so you are not asked to log in every time. Protecting it matters:

- Cookies: set `HttpOnly` (JavaScript cannot read it), `Secure` (HTTPS only) and `SameSite` (limits cross-site
  sending). These defend against theft and CSRF (covered in the Web Application Security course).
- Tokens must be validated (signature, expiry, audience) on every request and kept out of URLs and logs.
- Support logout and session expiry, and re-authenticate for sensitive actions.

## The defender's advantage

Password cracking against a *stolen* database is a known offline threat, which is exactly why defenders make each guess
expensive (slow salted hashes), cap and monitor **online** login attempts (rate limiting, lockouts, anomaly
detection), and move users to phishing-resistant passkeys. Studying how guessing works is what tells you which of these
defences actually matters — and all of that practice belongs on systems and accounts you own or are authorised to
test.
