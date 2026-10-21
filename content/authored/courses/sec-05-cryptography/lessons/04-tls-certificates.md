---
id: sec-05-cryptography.l04
title: Certificates and TLS
summary: How a browser trusts a server's public key, what a certificate contains, the chain of trust, the TLS handshake, and common certificate problems.
objectives:
  - Explain what a certificate binds and who vouches for it
  - Walk through the TLS handshake at a high level
  - Diagnose common certificate warnings
estimatedMinutes: 50
topics: [sec05.tls]
resources:
  - { title: "RFC 8446 (TLS 1.3)", url: "https://datatracker.ietf.org/doc/html/rfc8446", free: true, official: true }
  - { title: "Mozilla: TLS (MDN)", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security", free: true, official: true }
  - { title: "Let's Encrypt: How it works", url: "https://letsencrypt.org/how-it-works/", free: true, official: true }
  - { title: "Mozilla SSL Configuration Generator", url: "https://ssl-config.mozilla.org/", free: true, official: true }
---

## The problem certificates solve

Public-key crypto lets you encrypt to a server's public key, but how do you know a given public key really belongs to
`bank.example` and not an impostor in the middle? A **certificate** binds a public key to an identity (a domain name)
and is **signed by a certificate authority (CA)** that the client already trusts.

## What a certificate contains

An X.509 certificate includes:

- the **subject** (the domain, e.g. `example.com`, in Subject Alternative Names),
- the **public key**,
- a **validity period** (not before / not after),
- the **issuer** (the CA),
- the CA's **digital signature** over all of the above.

Your browser and operating system ship with a **trust store** of root CA certificates. The browser verifies the
server certificate's signature up a **chain**: server → intermediate CA → root CA in the trust store. If every
signature checks out, the name matches, and the dates are valid, the key is trusted.

## The TLS handshake (1.3, simplified)

1. **ClientHello**: the client offers supported versions and cipher suites and sends its key-exchange share.
2. **ServerHello**: the server picks the parameters, sends its key-exchange share, and sends its **certificate** plus
   a signature proving it holds the matching private key.
3. Both sides derive the same session keys from the ephemeral key exchange (ECDHE — forward secrecy, lesson 3).
4. **Finished**: a MAC over the handshake proves nothing was tampered with; application data now flows under fast
   symmetric **AEAD** encryption (lesson 2).

TLS 1.3 dropped old, weak options and does this in one round trip. Earlier versions (SSL, TLS 1.0/1.1) are deprecated.

## HTTPS and what it does and does not protect

HTTPS is HTTP over TLS. It protects data **in transit**: confidentiality, integrity and server authentication. It does
**not** hide which site you connected to (the domain is visible), protect data **at rest** on either end, or make a
site trustworthy — a phishing site can have a perfectly valid certificate for its own look-alike domain.

## Common certificate problems

| Warning | Cause |
|---|---|
| Expired / not yet valid | Outside the validity dates; renew (Let's Encrypt automates this). |
| Name mismatch | The certificate is not for the domain you requested. |
| Untrusted issuer / self-signed | The CA is not in the trust store (common for internal/dev certificates). |
| Incomplete chain | The server did not send the intermediate certificate. |
| Revoked | The CA withdrew the certificate (checked via CRL/OCSP). |

Teach learners never to click through a certificate warning on a site handling anything sensitive: it is exactly the
signal that someone may be intercepting the connection.
