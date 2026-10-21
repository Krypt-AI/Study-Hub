---
id: sec-09-ethical-hacking.l03
title: Techniques and how to defend them
summary: The major attack-technique categories CEH and PenTest+ cover, explained so you understand the mechanism and, for each, the defence that stops it.
objectives:
  - Recognise the main attack-technique categories at a conceptual level
  - State the defender's control for each category
  - Understand password-attack concepts and the layered defences against them
estimatedMinutes: 55
topics: [sec09.techniques]
resources:
  - { title: "MITRE ATT&CK (techniques and mitigations)", url: "https://attack.mitre.org/", free: true, official: true }
  - { title: "OWASP Testing Guide", url: "https://owasp.org/www-project-web-security-testing-guide/", free: true, official: true }
  - { title: "OWASP Password Storage Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html", free: true, official: true }
---

Each technique below is presented as a **defender's brief**: what the category *is*, why it works, and the control
that removes it. That is both how CEH/PenTest+ frame the exam objectives and how the knowledge is actually used — to
close gaps. The operational details of running attacks belong on the authorised ranges (lesson 0), not here.

## Social engineering

Manipulating people rather than machines — phishing, pretexting, baiting, tailgating. It works because humans are
trusting and busy. **Defence:** awareness training and measured phishing simulations, phishing-resistant MFA, and
process controls like out-of-band verification for payments (Stage 7). Usually the highest-return attack and so the
highest-return defence.

## Network attacks

Includes sniffing cleartext traffic, man-in-the-middle, and rogue devices (Stage 2). **Defence:** encrypt everything
in transit (TLS/SSH, Stage 5), authenticate endpoints, segment and control the LAN, and monitor for rogue
devices/ARP/DHCP anomalies.

## Password attacks

Attackers try to recover or guess credentials: **online** guessing against a live login, and **offline** cracking of
stolen password hashes by trying many candidates (dictionary, brute force, and rule-based guessing). This works when
passwords are weak or hashes are fast/unsalted. **Defence** is the layered set from the Cryptography course:

- store with a **slow, salted** password hash (Argon2id/bcrypt/scrypt) so offline guessing is expensive;
- **MFA**, ideally phishing-resistant passkeys, so a recovered password alone fails;
- **length-based** policies and **breached-password screening** so weak/known passwords are rejected;
- **rate limiting and lockout** plus monitoring so online guessing is throttled and alerted.

Understanding how guessing scales is exactly what tells you why each of these defences matters and which gives the
most protection.

## Web application attacks

Injection, XSS, broken access control, CSRF/SSRF and the rest of the OWASP Top 10 — covered in depth, with defences,
in the Web Application Security course (Stage 6). **Defence:** parameterised queries, output encoding, server-side
authorisation on every request, validation, and security headers.

## System and privilege-escalation attacks

After a foothold, attackers seek higher privilege and persistence via **misconfigurations**, unpatched local
vulnerabilities, weak file/service permissions, and credential reuse. **Defence:** patching (Stage 7), least
privilege and correct permissions (Stage 1/4), removing local admin, application control, and EDR to detect the
behaviour.

## Wireless and physical

Weak Wi-Fi configuration and physical access (plugging in a device, reaching an unlocked machine). **Defence:** strong
Wi-Fi authentication (WPA3/enterprise), network access control, disk encryption and screen locks, and physical
security.

## The pattern

Across every category the same defensive themes recur: **encrypt**, **authenticate strongly (MFA)**, **least
privilege**, **patch and harden**, **validate input**, **segment**, and **monitor**. An ethical hacker learns the
attack mechanisms so they can find where those are missing; the value delivered is the list of gaps and how to close
them — which is the report in the next lesson.
