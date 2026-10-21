---
id: sec-02-networking.l04
title: Core protocols and ports
summary: Ports and sockets, the application protocols you must know, their default ports, which are cleartext versus encrypted, and reading traffic for security.
objectives:
  - Explain ports and sockets and name the well-known ports
  - Pair each common protocol with its encrypted replacement
  - Use ports and protocols to reason about exposure and traffic
estimatedMinutes: 50
topics: [sec02.protocols]
resources:
  - { title: "IANA service name and port registry", url: "https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml", free: true, official: true }
  - { title: "RFC 9110 (HTTP semantics)", url: "https://datatracker.ietf.org/doc/html/rfc9110", free: true, official: true }
  - { title: "Mozilla: HTTP (MDN)", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP", free: true, official: true }
---

## Ports and sockets

An IP address finds the **host**; a **port** (0–65535) finds the **program** on it. A connection is identified by a
**socket**: the tuple (source IP, source port, destination IP, destination port, protocol). A server **listens** on a
well-known port; the client uses a temporary high port. Listing listening ports (`ss -tulpn`, Stage 1) tells you what
a machine exposes.

## Well-known ports to memorise

| Port | Protocol | Purpose | Cleartext? |
|---|---|---|---|
| 22 | SSH | Secure remote shell / SFTP | Encrypted |
| 25 / 587 | SMTP | Sending email | Often with TLS |
| 53 | DNS | Name resolution | Cleartext (unless DoT/DoH) |
| 80 | HTTP | Web | **Cleartext** |
| 443 | HTTPS | Web over TLS | Encrypted |
| 110 / 143 | POP3 / IMAP | Receiving email | Use TLS variants (995/993) |
| 3389 | RDP | Windows remote desktop | Encrypted, high-value target |
| 445 | SMB | Windows file sharing | Internal; a frequent attack vector |

Memorising the common ports lets you read Nmap output and firewall rules at a glance.

## Cleartext versus encrypted

Several classic protocols send everything, including credentials, in the clear. Always prefer the encrypted
equivalent:

| Avoid (cleartext) | Use instead |
|---|---|
| Telnet (23) | SSH (22) |
| FTP (21) | SFTP (over SSH) or FTPS |
| HTTP (80) | HTTPS (443) |
| plain POP3/IMAP | POP3S/IMAPS, or TLS |

In Wireshark (lesson 0) you can literally read a Telnet or HTTP login; the same capture of SSH or HTTPS shows only
ciphertext. That demonstration is the fastest way to convince anyone why encryption in transit is non-negotiable.

## Reading traffic for security

Protocols and ports are the vocabulary of network defence:

- **Exposure**: which ports are open to which networks? Close or firewall everything not needed (Stage 7).
- **Expectation**: a database server suddenly talking out to the internet on an odd port, or SMB traffic where there
  should be none, is worth investigating.
- **Evidence**: flow records and packet captures, read by protocol and port, are core incident-response data (Stage
  8).

You do not need every port memorised, but fluency with the common dozen and the cleartext-versus-encrypted pairs is
baseline networking literacy for security work, and squarely on the Network+ and CCNA exams.
