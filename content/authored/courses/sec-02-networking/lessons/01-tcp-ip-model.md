---
id: sec-02-networking.l01
title: The TCP/IP model
summary: The four layers of the TCP/IP model, how data is encapsulated, the OSI mapping, and TCP versus UDP including the three-way handshake.
objectives:
  - Name the TCP/IP layers and what each adds
  - Explain encapsulation as a packet goes down the stack
  - Compare TCP and UDP and describe the TCP handshake
estimatedMinutes: 50
topics: [sec02.model]
resources:
  - { title: "RFC 1122 (Internet host requirements)", url: "https://datatracker.ietf.org/doc/html/rfc1122", free: true, official: true }
  - { title: "RFC 9293 (TCP)", url: "https://datatracker.ietf.org/doc/html/rfc9293", free: true, official: true }
  - { title: "Cloudflare Learning: the OSI model", url: "https://www.cloudflare.com/learning/ddos/glossary/open-systems-interconnection-model-osi/", free: true, official: false }
---

## Layers: divide and conquer

Networking is split into **layers**, each with one job, each talking to the matching layer on the other machine. The
**TCP/IP model** has four:

| Layer | Job | Examples | Address |
|---|---|---|---|
| Application | What the data means | HTTP, DNS, SSH, TLS | — |
| Transport | End-to-end delivery between programs | TCP, UDP | Port |
| Internet | Routing between networks | IP, ICMP | IP address |
| Link | One physical hop | Ethernet, Wi-Fi | MAC address |

The older **OSI model** has seven layers; people often say "layer 7" (application) or "layer 3" (network) from it.
Attacks and defences are often described by layer — a layer-3/4 DDoS versus a layer-7 application attack, for example.

## Encapsulation

As your data goes **down** the stack to be sent, each layer wraps it with its own **header** (and the link layer a
trailer):

```text
[ Ethernet | IP | TCP | HTTP request ]   ← on the wire
   link      net  transport application
```

The receiver reverses this on the way **up**, each layer reading and stripping its own header. Wireshark shows exactly
these nested layers for each packet, which is why capturing traffic (lesson 0) makes the model concrete.

## TCP versus UDP

Both are transport-layer protocols that use **port numbers** to deliver data to the right program, but they differ:

| | TCP | UDP |
|---|---|---|
| Connection | Yes (handshake first) | No |
| Reliability | Ordered, retransmits lost data | Best-effort, may lose/reorder |
| Overhead | Higher | Lower |
| Suits | Web, email, file transfer, SSH | DNS queries, live voice/video, games |

### The TCP three-way handshake

TCP sets up a connection before sending data:

```text
Client → SYN →      Server      "let's talk"
Client ← SYN,ACK ←  Server      "ok, and you?"
Client → ACK →      Server      "ok — connected"
```

Recognising this handshake (and its abuse, such as floods of half-open SYNs) is basic traffic literacy. A clean
connection then transfers data and ends with a FIN exchange.

## Why layers matter for security

Each layer is a place to observe and to defend: filter by IP at layer 3 (firewalls), inspect ports at layer 4, and
understand application content at layer 7 (web security, Stage 6). Encryption with TLS protects the application data
but not the lower-layer metadata — the IP addresses and ports are still visible — which is exactly what traffic
analysis and monitoring rely on.
