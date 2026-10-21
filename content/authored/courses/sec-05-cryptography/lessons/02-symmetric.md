---
id: sec-05-cryptography.l02
title: Symmetric encryption
summary: Confidentiality with a shared key, stream versus block ciphers, why modes and nonces matter, authenticated encryption, and the XOR idea behind one-time pads.
objectives:
  - Explain symmetric encryption and the key-distribution problem
  - Say why AES needs a mode and a unique nonce, and prefer authenticated encryption
  - Understand why reusing a keystream is catastrophic
estimatedMinutes: 50
topics: [sec05.symmetric]
resources:
  - { title: "NIST FIPS 197 (AES)", url: "https://csrc.nist.gov/pubs/fips/197/final", free: true, official: true }
  - { title: "NIST SP 800-38D (GCM mode)", url: "https://csrc.nist.gov/pubs/sp/800/38/d/final", free: true, official: true }
  - { title: "Python secrets module", url: "https://docs.python.org/3/library/secrets.html", free: true, official: true }
---

## One key, kept secret

**Symmetric encryption** uses the *same* secret key to encrypt and decrypt. It is fast and does the bulk work of
protecting data at rest and in transit. Its hard problem is **key distribution**: both sides need the key, and getting
it to them securely is exactly the problem encryption was meant to solve. Public-key cryptography (lesson 3) solves
that.

## The XOR intuition and the one-time pad

The simplest idea: XOR each byte of the message with a byte of key material (a **keystream**). XOR is its own inverse,
so the same operation decrypts:

```python
def xor(data: bytes, keystream: bytes) -> bytes:
    return bytes(d ^ k for d, k in zip(data, keystream))
```

If the keystream is truly random, as long as the message, and **never reused**, this is a **one-time pad** and is
provably unbreakable. Those conditions are impractical, so real ciphers generate a keystream from a short key. This is
a teaching tool, not something to protect real data with.

**Never reuse a keystream.** If two messages are XORed with the same keystream, XORing the ciphertexts cancels the key
and leaks the XOR of the plaintexts. Key/nonce reuse is one of the most common real-world crypto failures.

## AES: the standard block cipher

**AES** encrypts fixed 128-bit blocks with a 128-, 192- or 256-bit key. A bare block cipher only handles one block, so
it is used in a **mode of operation**:

| Mode | Notes |
|---|---|
| ECB | Encrypts each block independently. **Never use it**: identical plaintext blocks give identical ciphertext, so patterns leak (the famous "ECB penguin"). |
| CTR / CFB / OFB | Turn AES into a stream cipher; need a unique **nonce** per message. |
| CBC | Chains blocks; needs a random IV and separate integrity protection. |
| **GCM** | Counter mode **plus** built-in authentication. The modern default. |

## Authenticated encryption (AEAD)

Encryption alone stops eavesdropping but not tampering: an attacker can flip ciphertext bits to change the plaintext.
**Authenticated encryption with associated data (AEAD)** — AES-GCM or ChaCha20-Poly1305 — encrypts *and* produces an
authentication tag, so any tampering is detected on decryption. Always prefer an AEAD mode; "encrypt then MAC" by hand
is error-prone.

Key points for using symmetric crypto correctly:

- Use a library's AEAD interface (for example `cryptography`'s `AESGCM`), not a hand-built mode.
- Generate keys and nonces with a **cryptographically secure** random source (`secrets`, `os.urandom`), never
  `random`.
- Use each (key, nonce) pair **once**.
- A key is only as safe as where it is stored (lesson 4 and the Secrets Management work in AI Stage 2).
