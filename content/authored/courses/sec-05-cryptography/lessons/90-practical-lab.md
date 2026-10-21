---
id: sec-05-cryptography.lab
title: "Practical lab: OpenSSL and hashing at the command line"
subtitle: Hands-on session with the real tools
summary: "A guided session with OpenSSL and the standard hashing tools: hash and verify files, compute an HMAC, encrypt and decrypt a file, sign and verify with an Ed25519 key pair, and inspect a real website's certificate chain."
objectives:
  - Hash files and detect tampering with sha256sum and openssl dgst
  - Encrypt and decrypt a file, and sign and verify a message with a key pair
  - Read the certificate and TLS details of a real server with openssl s_client
estimatedMinutes: 50
topics: [sec05.lab]
resources:
  - { title: "OpenSSL documentation (manual pages)", url: "https://docs.openssl.org/", free: true, official: true }
  - { title: "OpenSSL: openssl-pkeyutl", url: "https://docs.openssl.org/master/man1/openssl-pkeyutl/", free: true, official: true }
  - { title: "OpenSSL: openssl-s_client", url: "https://docs.openssl.org/master/man1/openssl-s_client/", free: true, official: true }
  - { title: "Git for Windows (includes Git Bash and OpenSSL)", url: "https://git-scm.com/downloads/win", free: true, official: true }
---

This course's concepts become concrete when you run them. You use **OpenSSL**, the real cryptography toolkit behind a
large part of the internet, and the standard hashing commands. Nothing is simulated.

## Get the tools

| Your system | How |
|---|---|
| **Linux / Kali / your Ubuntu VM** | already installed, or `sudo apt install openssl` |
| **macOS** | `openssl` or `LibreSSL` is present; for OpenSSL 3, `brew install openssl` |
| **Windows** | install **Git for Windows**; its **Git Bash** includes `openssl` and `sha256sum` (or use WSL) |

Check the version, because the signing commands in Part 4 need **OpenSSL 3.0 or newer**:

```bash
openssl version
# sample: OpenSSL 3.5.7 9 Jun 2026 (Library: OpenSSL 3.5.7 9 Jun 2026)
```

Work in a scratch folder: `mkdir crypto-lab && cd crypto-lab`.

## Part 1: Hashing and integrity

```bash
printf 'hello' > hello.txt
sha256sum hello.txt
openssl dgst -sha256 hello.txt
```

Both commands should print the **same digest**. The SHA-256 of the five bytes `hello` is a famous value:

```text
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```

If yours matches, your tools work and you have reproduced the first lesson. (`printf` is used instead of `echo` so no
newline is added: a newline would change the input and so the whole digest.)

**Avalanche effect.** Change one letter and hash again:

```bash
printf 'hellp' | sha256sum
```

A completely different digest appears. That is why a published hash proves a download is intact: any change shows.

**Verify a download.** Real projects publish a checksum file. The same tool checks it for you:

```bash
sha256sum hello.txt > hello.sha256     # make a checksum file
sha256sum -c hello.sha256              # check it
# hello.txt: OK
printf 'tampered' > hello.txt
sha256sum -c hello.sha256
# hello.txt: FAILED
```

## Part 2: HMAC, a keyed hash

```bash
printf 'pay alice' | openssl dgst -sha256 -hmac "k"
```

With the key `k` the tag is:

```text
SHA2-256(stdin)= de4cc5dcc384d35bc805cf7b33af5906b3076c11b1748bdbda7f75b9aedd76db
```

Run it again with a different key or a different message and the tag changes. Only someone with the key can produce the right
tag, which is the difference between a hash and a MAC (lesson 1).

## Part 3: Encrypt and decrypt a file

```bash
printf 'secret note' > note.txt
openssl enc -aes-256-cbc -pbkdf2 -salt -pass pass:demo -in note.txt -out note.enc
xxd note.enc | head -2
openssl enc -d -aes-256-cbc -pbkdf2 -pass pass:demo -in note.enc
```

The file starts with the eight bytes **`Salted__`** followed by the random **salt**:

```text
00000000: 5361 6c74 6564 5f5f 9724 1efe 15e6 acfd  Salted__.$......
```

Decrypting prints `secret note`. Three things to notice, each from the lessons:

- the salt is random, so **encrypting the same file twice gives different output**;
- **`-pbkdf2`** turns your passphrase into a key with a slow, salted function (lesson 5), instead of a weak legacy method;
- this is a **teaching command**. `-pass pass:demo` puts the passphrase on the command line, where it shows in shell history
  and process lists. For real work use `-pass stdin` or a key file, and for new designs prefer an authenticated mode
  (an **AEAD**, lesson 2).

## Part 4: Sign and verify with a key pair

```bash
openssl genpkey -algorithm ED25519 -out key.pem             # private key
openssl pkey -in key.pem -pubout -out pub.pem               # public key
printf 'pay alice 100' > msg.txt
openssl pkeyutl -sign -inkey key.pem -rawin -in msg.txt -out sig.bin
openssl pkeyutl -verify -pubin -inkey pub.pem -rawin -in msg.txt -sigfile sig.bin
```

The last command prints:

```text
Signature Verified Successfully
```

An Ed25519 signature is always **64 bytes** (`wc -c sig.bin`). Now change the message and verify again:

```bash
printf 'pay alice 900' > msg2.txt
openssl pkeyutl -verify -pubin -inkey pub.pem -rawin -in msg2.txt -sigfile sig.bin
```

```text
...digital envelope routines:EVP_DigestVerify:provider signature failure...
Signature Verification Failure
```

The command also exits with a **non-zero status**, so a script can tell. Same signature, one changed message, rejected:
integrity and authenticity in one step. **Never share `key.pem`**; it is the private key. Only `pub.pem` is meant to be given
out.

## Part 5: Inspect a real certificate chain

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates
```

This connects to a real server and prints the certificate's **subject** (who it is for), **issuer** (the CA that signed it)
and the **notBefore / notAfter** validity dates, exactly the fields from lesson 4. The values are the website's own and
change over time, so yours will differ from any printed example. For the whole handshake, run the first half alone and look for:

| Line in the output | What it tells you |
|---|---|
| `Certificate chain` with `s:` (subject) and `i:` (issuer) lines | the chain from the server certificate up through the intermediate CA |
| `Verification: OK` (or an error) | whether your system's trust store accepted the chain |
| `Protocol: TLSv1.3` | the TLS version negotiated |
| `Cipher is ...` | the cipher suite the two sides agreed |

Try it on a site you know and compare the issuer with what your browser shows when you click the padlock.

## If something goes wrong

| Problem | Fix |
|---|---|
| `openssl: command not found` on Windows | use **Git Bash** from Git for Windows, or WSL |
| `-rawin` is not recognised | your OpenSSL is older than 3.0; update it |
| `xxd: command not found` | use `od -An -tx1 note.enc` instead (it prints the same bytes in hex) |
| `s_client` hangs | press Ctrl+C; the `</dev/null` in the command normally closes the connection for you |
