---
id: sec-02-networking.l03
title: DNS, DHCP and routing
summary: How names become addresses, how devices get their configuration, how packets find their way across networks, and the security issues in each.
objectives:
  - Describe the DNS resolution process and its security risks
  - Explain what DHCP configures and how it can be abused
  - Explain routing, default gateways and why path security matters
estimatedMinutes: 50
topics: [sec02.dns]
resources:
  - { title: "RFC 1034/1035 (DNS)", url: "https://datatracker.ietf.org/doc/html/rfc1035", free: true, official: true }
  - { title: "Cloudflare Learning: how DNS works", url: "https://www.cloudflare.com/learning/dns/what-is-dns/", free: true, official: false }
  - { title: "RFC 2131 (DHCP)", url: "https://datatracker.ietf.org/doc/html/rfc2131", free: true, official: true }
---

## DNS: names to addresses

People use names (`example.com`); networks use IP addresses. **DNS** translates between them. A lookup walks a
hierarchy:

1. Your device asks a **resolver** (often your ISP's or a public one like 1.1.1.1).
2. The resolver asks a **root** server, then the **.com** TLD server, then the domain's **authoritative** server.
3. The answer (an **A**/**AAAA** record for addresses; others include **MX** for mail, **CNAME** for aliases, **TXT**
   for verification) is returned and **cached** with a time-to-live.

### DNS security concerns

DNS was designed without security, so it is a frequent target and signal:

- **Spoofing / cache poisoning**: feeding a resolver false answers to send users to attacker servers. **DNSSEC** signs
  records to detect tampering.
- **Privacy**: plain DNS is cleartext, so queries reveal browsing. **DNS over HTTPS/TLS (DoH/DoT)** encrypts them.
- **Abuse as a signal**: malware often uses DNS to reach command-and-control servers, so unusual DNS (rare domains,
  high volume, long random names) is a strong detection signal for defenders.

## DHCP: automatic configuration

**DHCP** hands a device joining a network its **IP address**, **subnet mask**, **default gateway** and **DNS servers**,
automatically. Because a client trusts whatever DHCP server answers first, a **rogue DHCP server** can hand out a
malicious gateway or DNS and quietly intercept traffic — one reason wired/Wi-Fi access control and monitoring matter.

## Routing: finding the path

A host sends traffic for its own subnet directly; anything else goes to its **default gateway** (router). Routers
forward packets hop by hop toward the destination, each consulting its **routing table** and decrementing the packet's
**TTL** (which prevents loops). Across the internet, routers exchange reachability with **BGP**.

- `traceroute` / `tracert` reveals the hops a packet takes.
- Attacks on routing — rogue gateways on a LAN, BGP hijacks on the internet — can divert traffic through an attacker,
  which is why authentication and encryption (TLS) matter even when you "trust the network": you often should not.

The theme across all three: these foundational protocols were built for a smaller, more trusting internet, so modern
security adds authentication and encryption on top (DNSSEC, DoH, TLS) and watches them closely for abuse.
