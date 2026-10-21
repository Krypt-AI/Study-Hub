---
id: sec-07-defence.l05
title: Endpoint and email defence
summary: Endpoint protection and EDR, email as the top attack vector, anti-phishing and authentication (SPF/DKIM/DMARC), and user awareness as a control.
objectives:
  - Explain endpoint protection, EDR and application control
  - Describe email threats and the layered defences against them
  - Treat user awareness as a measurable control
estimatedMinutes: 50
topics: [sec07.endpoint]
resources:
  - { title: "NIST SP 800-177 (Trustworthy Email)", url: "https://csrc.nist.gov/pubs/sp/800/177/r1/final", free: true, official: true }
  - { title: "CISA: phishing guidance", url: "https://www.cisa.gov/news-events/news/avoiding-social-engineering-and-phishing-attacks", free: true, official: true }
  - { title: "NIST SP 800-83 (Malware Incident Prevention)", url: "https://csrc.nist.gov/pubs/sp/800/83/r1/final", free: true, official: true }
---

## Endpoints: where the users are

Laptops, desktops and servers — **endpoints** — are where people click, where credentials live, and where many attacks
land. Layered endpoint defence:

- **Antivirus / anti-malware** — catches known malware by signature and some by behaviour. Necessary but not
  sufficient.
- **EDR (Endpoint Detection and Response)** — records endpoint activity (processes, network, file changes), detects
  suspicious **behaviour**, and lets responders investigate and act (isolate the host, kill a process) remotely. This
  is the modern core of endpoint defence and feeds the SIEM/SOC (lesson 4). **XDR** extends it across email, network
  and cloud.
- **Application control / allowlisting** — only approved programs may run, which stops most malware that is not on the
  list.
- **Host hardening** — disk encryption, host firewall, least privilege, automatic updates (earlier lessons), and OS
  exploit mitigations.

## Email: the number-one way in

Most intrusions begin with **email** — phishing, malicious attachments and links, and **business email compromise**
(convincing someone to pay or share data). Defence is layered because no single filter is perfect:

**Technical filtering**

- Spam/phishing filters, attachment sandboxing, link rewriting and URL checking.
- **Email authentication** stops spoofing of sender domains:
  - **SPF** lists which servers may send for a domain.
  - **DKIM** signs messages so tampering and forgery are detectable.
  - **DMARC** ties SPF/DKIM together, tells receivers what to do with failures, and reports back. Publishing a strong
    DMARC policy stops attackers spoofing *your* domain.
- Blocking or sandboxing risky attachment types; stripping active content.

**People and process**

- **Security awareness training** and realistic **phishing simulations**, measured over time.
- An easy **report-phish** button and a no-blame culture, so threats surface fast.
- Process controls for high-risk actions: out-of-band verification for payment or account changes defeats most
  business email compromise.

## Awareness is a control, not a slogan

People are part of the system. Treated as a real control, awareness is **measured** (simulation click and report
rates, trends by team), **targeted** (more help where the numbers are worse), and **supported by design** (make the
safe action easy, phishing-resistant MFA so a phished password alone fails — Stage 5). "The user is the weakest link"
is a cop-out; a program that measures and improves human response, backed by technical controls that assume some
clicks will happen anyway, is the defence. This endpoint-and-email layer, over hardened, segmented, patched, monitored
systems, is defence in depth made concrete.
