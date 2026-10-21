---
id: sec-08-incident-response.l03
title: Digital forensics basics
summary: "The principles of sound evidence handling: order of volatility, forensic imaging and hashing, chain of custody, the main evidence sources, and the limits of DIY forensics."
objectives:
  - Apply the order of volatility and acquire evidence soundly
  - Maintain integrity with hashing and chain of custody
  - Know the main evidence sources and when to call in specialists
estimatedMinutes: 50
topics: [sec08.forensics]
resources:
  - { title: "NIST SP 800-86 (Integrating Forensic Techniques into IR)", url: "https://csrc.nist.gov/pubs/sp/800/86/final", free: true, official: true }
  - { title: "The Sleuth Kit / Autopsy (open-source forensics)", url: "https://www.sleuthkit.org/", free: true, official: false }
  - { title: "Volatility Foundation (memory forensics)", url: "https://www.volatilityfoundation.org/", free: true, official: false }
---

## The forensic mindset

Digital forensics is the disciplined collection and analysis of evidence so that findings are **accurate** and could
stand up to scrutiny (including in court). Two principles govern everything: **do not alter the evidence**, and **be
able to prove you did not**. Work only on systems you are **authorised** to examine, and only on **copies** wherever
possible.

## Order of volatility

Evidence disappears at different rates, so collect the most fragile first:

1. **CPU registers and cache** (fleeting).
2. **RAM / memory and running state** (network connections, processes) — lost at power-off.
3. **Disk** (files, including some "deleted" data).
4. **Remote logs, backups, archives** (most durable).

This is why you capture a **memory image before shutting a machine down** (Stage 1): keys, running malware and network
state live only in RAM.

## Acquisition and integrity

- **Forensic image.** Make a bit-for-bit copy of the disk (or memory), and analyse the copy, never the original. Use a
  **write blocker** so examining a disk cannot change it.
- **Hashing.** Compute a cryptographic hash (SHA-256, Cryptography course) of the image at acquisition. Re-hashing
  later and getting the same value proves the evidence was not altered. A mismatch means it is compromised.
- **Chain of custody.** A documented, unbroken record of who collected, held, transferred and accessed each item,
  when and why. Gaps or undocumented handling can render evidence worthless.

## Evidence sources

- **Disk**: files, deleted-file remnants, filesystem timestamps, browser and application artefacts.
- **Memory**: running processes, injected code, network connections, decryption keys, recently used data (tools like
  **Volatility**).
- **Logs**: system, security, network, application (Stage 7) — the timeline backbone.
- **Network**: flow records and packet captures (Stage 2).
- Open-source kits like **Autopsy / The Sleuth Kit** examine disk images; all such work stays on authorised systems
  and copies.

## Know your limits

Serious cases — potential prosecution, insider litigation, major breaches — have legal weight, and a mishandled first
response can destroy the case. For those, preserve the scene (capture volatile data if trained, otherwise leave it
running, isolate, and document) and **bring in qualified forensic specialists and legal counsel early**. As a
responder your job is often to recognise when an incident has crossed into territory where expert forensics and legal
process must take over, and to have preserved rather than trampled the evidence up to that point.
