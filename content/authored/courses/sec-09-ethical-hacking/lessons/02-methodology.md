---
id: sec-09-ethical-hacking.l02
title: The penetration-testing methodology
summary: The phased methodology taught by CEH and PenTest+ — reconnaissance, scanning and enumeration, gaining and maintaining access, and analysis — framed as a repeatable, authorised process.
objectives:
  - Walk through the standard penetration-testing phases
  - Distinguish passive and active reconnaissance and enumeration
  - Map each phase to the defensive control that counters it
estimatedMinutes: 55
topics: [sec09.methodology]
resources:
  - { title: "PTES (Penetration Testing Execution Standard)", url: "http://www.pentest-standard.org/", free: true, official: false }
  - { title: "OWASP Web Security Testing Guide", url: "https://owasp.org/www-project-web-security-testing-guide/", free: true, official: true }
  - { title: "NIST SP 800-115 (Technical Guide to Security Testing)", url: "https://csrc.nist.gov/pubs/sp/800/115/final", free: true, official: true }
---

## Why a methodology

A penetration test is not random poking; it is a **repeatable process** so that coverage is systematic, results are
comparable over time, and the work stays inside scope and the rules of engagement (lesson 1). CEH, CompTIA PenTest+,
PTES and NIST SP 800-115 describe essentially the same phases. The point here is to understand the process and, for
each phase, the **defensive control** that blunts it.

## The phases

**1. Reconnaissance (information gathering).**
Learn about the target before touching it.
- **Passive** recon uses only public sources — company websites, job ads, DNS/WHOIS, search engines, leaked-data
  checks, social media (OSINT). It does not interact with target systems, so it is low-risk and hard to detect.
- **Active** recon begins interacting (within scope). Defence: minimise public exposure, DNS hygiene, and awareness of
  what your organisation reveals.

**2. Scanning and enumeration.**
Map what exists and what it exposes: live hosts, open ports and services (Nmap, Stage 2), service versions, and then
**enumeration** of details (users, shares, endpoints, software versions). Defence: reduce attack surface, segment
(Stage 2/7), and detect scanning with IDS and monitoring (Stage 7).

**3. Vulnerability analysis.**
Match what you found to known weaknesses and misconfigurations (CVEs, weak settings), prioritising by exploitability
and impact. Defence: patch and configuration management (Stage 7), and run your own vulnerability scans first.

**4. Gaining access (exploitation).**
Demonstrate real impact by exploiting a validated weakness, within scope — confirming the risk is real, not
theoretical. The tester's goal is evidence of impact, not destruction. Defence: the hardening, input-handling and
least-privilege work of Stages 5–7 removes the conditions exploits rely on.

**5. Post-exploitation and maintaining access.**
Assess what the foothold allows: privilege escalation, access to data, and lateral movement (Stage 7) — and, in a red
team, whether persistence goes undetected. This measures **blast radius** and the defenders' visibility. Defence:
least privilege, segmentation, EDR and monitoring (Stage 7) to limit and catch it.

**6. Analysis and reporting.**
Turn findings into prioritised, reproducible, business-relevant recommendations (lesson 4). In a legitimate test,
"covering tracks" is replaced by **cleaning up** test artefacts and documenting everything done, so the client has a
complete, honest record.

## Methodology as a two-way mirror

Every offensive phase has a defensive counterpart, which is why this course sits late in the roadmap. Reading the
methodology as a defender tells you where to invest: shrink what recon can find, detect scanning, close the
vulnerabilities analysis would surface, remove the conditions exploitation needs, and limit and monitor what any
foothold could reach. A penetration test is ultimately a structured way to find those gaps before a real adversary
does — and the report (lesson 4), not the exploitation, is the product.
