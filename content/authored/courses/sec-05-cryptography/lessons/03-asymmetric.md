---
id: sec-05-cryptography.l03
title: Public-key cryptography
summary: Key pairs, encryption versus signing, the maths intuition behind RSA and Diffie-Hellman, elliptic curves, and how public keys solve key distribution.
objectives:
  - Explain the roles of the public and private keys for encryption and for signatures
  - Describe key exchange and why it enables forward secrecy
  - Recognise RSA, Diffie-Hellman and elliptic-curve use cases
estimatedMinutes: 55
topics: [sec05.asymmetric]
resources:
  - { title: "NIST SP 800-56A (key establishment)", url: "https://csrc.nist.gov/pubs/sp/800/56/a/r3/final", free: true, official: true }
  - { title: "NIST FIPS 186-5 (Digital Signature Standard)", url: "https://csrc.nist.gov/pubs/fips/186-5/final", free: true, official: true }
  - { title: "Cloudflare: a (relatively easy to understand) primer on elliptic curve cryptography", url: "https://blog.cloudflare.com/a-relatively-easy-to-understand-primer-on-elliptic-curve-cryptography/", free: true, official: false }
---

## Two keys instead of one

Public-key (**asymmetric**) cryptography gives each party a **key pair**: a **public key** anyone may know, and a
**private key** kept secret. What one key does, only the other undoes. This removes the key-distribution problem:
there is no shared secret to smuggle across.

Two different uses, which must not be confused:

| Goal | Encrypt / sign with | Undo with |
|---|---|---|
| **Confidentiality** (send a secret to Alice) | Alice's **public** key | Alice's **private** key |
| **Authenticity** (prove Alice wrote it) | Alice's **private** key (sign) | Alice's **public** key (verify) |

A **digital signature** gives integrity, authentication and **non-repudiation**: only the private-key holder could have
produced it, so they cannot credibly deny it. In practice you sign the *hash* of the message (lesson 1), not the whole
message.

## The maths intuition

Public-key schemes rest on problems that are easy one way and hard to reverse:

- **RSA**: multiplying two large primes is easy; factoring the product back into those primes is infeasible at the
  right size. The public and private keys are built from that pair of primes.
- **Diffie–Hellman** and **elliptic-curve** schemes rest on the **discrete logarithm** problem.

A tiny, insecure RSA with toy numbers shows the shape (never use small numbers for real):

```python
# p=61, q=53 → n=3233, φ=3120. Public exponent e=17, private d=2753 (e·d ≡ 1 mod φ).
def modexp(base, exp, mod):
    result = 1
    base %= mod
    while exp:
        if exp & 1:
            result = result * base % mod
        base = base * base % mod
        exp >>= 1
    return result

n, e, d = 3233, 17, 2753
cipher = modexp(65, e, n)      # "encrypt" the number 65 with the public key → 2790
plain = modexp(cipher, d, n)   # "decrypt" with the private key → 65
```

Real RSA uses 2048-bit-or-larger keys and proper padding (OAEP for encryption, PSS for signatures); the toy version
above is only to see the structure.

## Key exchange and forward secrecy

**Diffie–Hellman** lets two parties who have never met agree on a shared secret over a public channel: each combines
their own secret with the other's public value, and both arrive at the same key, while an eavesdropper cannot. TLS uses
an **ephemeral** Diffie–Hellman key exchange (ECDHE) so each session gets a fresh key. That gives **forward secrecy**:
stealing the server's long-term private key later does not decrypt past recorded sessions.

## Elliptic curves and the future

**Elliptic-curve cryptography (ECC)** gives the same security as RSA with much smaller keys (a 256-bit ECC key is
roughly a 3072-bit RSA key), so it is now preferred (Ed25519 signatures, X25519 key exchange).

Asymmetric operations are **slow**, so systems use them only to authenticate and to agree a symmetric key, then switch
to fast symmetric encryption (lesson 2) for the data — exactly what TLS does (lesson 4).

> **Looking ahead:** a large quantum computer would break RSA and elliptic-curve cryptography. NIST has standardised
> **post-quantum** algorithms (ML-KEM, ML-DSA) and migration is beginning.
