---
id: sec-05-cryptography.l01
title: Hashing and integrity
summary: What a cryptographic hash is, the properties that make it useful, where hashes are used, and why some common hashes are broken.
objectives:
  - State the three security properties of a cryptographic hash
  - Use SHA-256 and HMAC from a trusted library
  - Explain where hashing is and is not the right tool
estimatedMinutes: 45
topics: [sec05.hashing]
resources:
  - { title: "NIST FIPS 180-4 (Secure Hash Standard)", url: "https://csrc.nist.gov/pubs/fips/180-4/upd1/final", free: true, official: true }
  - { title: "NIST FIPS 198-1 (HMAC)", url: "https://csrc.nist.gov/pubs/fips/198-1/final", free: true, official: true }
  - { title: "Python hashlib documentation", url: "https://docs.python.org/3/library/hashlib.html", free: true, official: true }
---

## What a hash is

A **cryptographic hash function** takes any input and returns a fixed-size value, the **digest** (for SHA-256, 256
bits / 32 bytes). The same input always gives the same digest; a different input almost always gives a different one.

```python
import hashlib
hashlib.sha256(b"hello").hexdigest()
# '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
hashlib.sha256(b"hellp").hexdigest()   # one letter changed → a completely different digest
```

Changing a single bit of the input changes about half the output bits (the **avalanche effect**).

## Three properties

| Property | Meaning |
|---|---|
| **Pre-image resistance** | Given a digest, you cannot find an input that produces it. |
| **Second pre-image resistance** | Given an input, you cannot find a *different* input with the same digest. |
| **Collision resistance** | You cannot find *any* two different inputs with the same digest. |

A hash gives **integrity**, not confidentiality: the digest does not hide the data (short inputs can be guessed), and
the input cannot be recovered from the digest.

## Where hashes are used

- **File integrity**: publish a file's SHA-256 so downloaders can detect tampering or corruption.
- **Digital signatures** (lesson 3): you sign the hash of a document, not the whole document.
- **Password storage** (lesson 5): with a *slow, salted* password hash, never a plain fast hash.
- **Data structures**: hash tables, Git commit ids, blockchain blocks and Merkle trees.

## Keyed hashing: HMAC

A plain hash proves integrity only if the digest itself cannot be tampered with. A **message authentication code (MAC)**
adds a secret key, so only someone with the key can produce or verify the tag. The standard construction is **HMAC**:

```python
import hmac, hashlib
key = b"shared-secret"
tag = hmac.new(key, b"transfer 100 to alice", hashlib.sha256).hexdigest()
hmac.compare_digest(tag, tag)   # constant-time comparison, to avoid timing leaks
```

Always compare secrets with `hmac.compare_digest`, not `==`: a normal comparison can leak how many leading bytes
matched through its timing.

## Broken and fit-for-purpose hashes

- **MD5** and **SHA-1** are broken for security: practical collisions exist. Never use them to protect integrity or in
  signatures. You may still meet them as non-security checksums.
- **SHA-256 / SHA-3** are the current general-purpose choices.
- For **passwords**, a general hash is the wrong tool because it is fast; use a password hash (lesson 5).

The rule for all of this: **use a vetted library** (`hashlib`, your platform's crypto library). Writing your own hash
or cipher is how real systems get broken.
