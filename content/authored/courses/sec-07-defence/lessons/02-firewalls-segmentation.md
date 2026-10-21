---
id: sec-07-defence.l02
title: Firewalls and segmentation
summary: What firewalls do, stateful filtering, default-deny policy, network segmentation and DMZs, IDS/IPS, and VPNs for secure remote access.
objectives:
  - Write a default-deny firewall policy and explain stateful filtering
  - Design segmentation with a DMZ to contain breaches
  - Distinguish IDS, IPS and the role of VPNs
estimatedMinutes: 50
topics: [sec07.network]
resources:
  - { title: "NIST SP 800-41 (Firewalls and Firewall Policy)", url: "https://csrc.nist.gov/pubs/sp/800/41/r1/final", free: true, official: true }
  - { title: "NIST SP 800-125 (security of virtualization)", url: "https://csrc.nist.gov/pubs/sp/800/125/final", free: true, official: true }
  - { title: "Cloudflare Learning: what is a DMZ?", url: "https://www.cloudflare.com/learning/access-management/what-is-a-dmz/", free: true, official: false }
---

## Firewalls

A **firewall** enforces a policy on traffic crossing a boundary, allowing or denying by rules based on source and
destination address, port and protocol (Stage 2). The policy should be **default-deny**: block everything, then allow
only the specific flows the business needs. The opposite (allow-all, block known-bad) leaves unknown risks open.

```text
# Conceptual rule order (first match wins):
allow tcp any -> web-server:443
allow tcp web-server -> db-server:5432
deny  all                               # default: everything else blocked, and logged
```

Modern firewalls are **stateful**: they track connections, so the reply to an allowed outbound request is permitted
automatically without a separate rule. **Next-generation firewalls (NGFW)** add application awareness and can inspect
traffic content. Filter **outbound** too, not just inbound — that is how you catch data exfiltration and
command-and-control traffic (Stage 2's "unexpected outbound connection").

## Segmentation and the DMZ

Put the firewall to work on your internal structure (Stage 2's segmentation). A classic pattern is the **DMZ**
(demilitarised zone): internet-facing systems (web, mail) sit in a segment that the internet can reach, but that
cannot freely reach the **internal** network. So even if a public web server is compromised, the attacker is not
automatically inside the corporate LAN — they face another boundary.

Segmentation limits **lateral movement**: an attacker who lands on one host should not be able to roam to everything
else. **Microsegmentation** takes this to individual workloads, a building block of zero trust (Stage 4).

## IDS and IPS

- An **Intrusion Detection System (IDS)** watches traffic (or host activity) and **alerts** on suspicious patterns.
- An **Intrusion Prevention System (IPS)** sits inline and can **block** the traffic it flags.

They detect by **signatures** (known-bad patterns) and **anomalies** (deviation from a baseline, lesson 4). Both feed
the SIEM. The trade-off with an IPS is false positives blocking legitimate traffic, so tuning matters.

## VPNs for remote access

A **VPN** creates an encrypted tunnel so a remote user or site can reach the internal network safely over the
untrusted internet — protecting confidentiality and integrity in transit (Stage 5). A VPN authenticates and encrypts,
but once connected a user may get broad access, which is why zero-trust access (verify every request, segment tightly)
is increasingly preferred over "VPN in, then trusted". Whatever the model, the firewall and segmentation decide what a
connected identity can actually reach.
