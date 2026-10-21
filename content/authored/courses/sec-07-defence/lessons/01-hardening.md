---
id: sec-07-defence.l01
title: Hardening
summary: Reducing attack surface, secure configuration baselines, disabling unneeded services, account and authentication hardening, and using benchmarks like CIS.
objectives:
  - Harden a system by reducing its attack surface
  - Apply a secure configuration baseline
  - Harden accounts, authentication and remote access
estimatedMinutes: 50
topics: [sec07.hardening]
resources:
  - { title: "CIS Benchmarks", url: "https://www.cisecurity.org/cis-benchmarks", free: true, official: true }
  - { title: "NIST SP 800-123 (General Server Security)", url: "https://csrc.nist.gov/pubs/sp/800/123/final", free: true, official: true }
  - { title: "DISA STIGs", url: "https://public.cyber.mil/stigs/", free: true, official: true }
---

## Hardening is subtraction

**Hardening** means configuring a system so there is less to attack and less that a successful attacker can do. The
core move is **subtraction**: every service, account, feature, port and privilege you remove is one an attacker can no
longer use. A default install is built for convenience, not security; hardening tightens it to your actual needs.

## A hardening checklist

- **Remove or disable what you do not need.** Unused services, default sample apps, extra software, guest accounts.
  Fewer listening ports (`ss -tulpn`, Stage 1) means a smaller attack surface.
- **Secure configuration baseline.** Replace insecure defaults: no default passwords, strong TLS settings, secure
  service options. Apply the same baseline to every machine of a type.
- **Least privilege.** Standard accounts for daily use, dedicated low-privilege service accounts, admin only when
  needed (Stage 4).
- **Account and authentication hardening.** Enforce MFA, strong unique credentials, lockout/rate limiting, and remove
  dormant accounts promptly (joiner/mover/leaver process).
- **Harden remote access.** For SSH: keys not passwords, no root login, limited users, and expose it only to trusted
  networks (Stage 2). For RDP: restrict, require MFA, never expose directly to the internet.
- **Turn on the built-in protections.** Host firewall, disk encryption, Secure Boot, automatic security updates
  (Stage 1), and OS exploit mitigations.
- **Enable logging** (lesson 4) — hardening without visibility is half the job.

## Baselines and benchmarks

You do not invent hardening from scratch. Use published, vetted standards:

- **CIS Benchmarks** — detailed, consensus secure-configuration guides for operating systems, cloud, databases and
  applications, with specific settings and rationale. Free to download.
- **DISA STIGs** — the US government's hardening guides, very thorough.
- Vendor security baselines (Microsoft security baselines, cloud provider well-architected security guidance).

Apply a baseline, then measure against it: configuration-assessment tools score a system's compliance and flag drift.
On Linux, mandatory access control (**SELinux**/**AppArmor**) confines services so a compromised one still cannot
roam — hardening beyond the basics covered here, and part of the Linux Administration pathway.

## Make it repeatable

Hardening one machine by hand does not scale and drifts over time. The durable approach is **configuration as code**:
define the hardened state in a tool (Ansible, Group Policy, cloud config) so every machine is built the same way and
re-converges if it drifts. That links hardening to patch and configuration management in the next lessons: a system is
only "hardened" if it stays that way.
