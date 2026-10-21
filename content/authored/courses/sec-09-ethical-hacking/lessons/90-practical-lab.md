---
id: sec-09-ethical-hacking.lab
title: "Practical lab: Kali, legal ranges and your first finding"
subtitle: Hands-on session with the real tools
summary: "Set up Kali safely, learn how to find and read the documentation of any tool in it, run one authorised scan, join the legal practice platforms, and write up a finding in the professional format, the habit that matters most."
objectives:
  - Prepare Kali safely and learn to find help for any tool in it
  - Choose a legal practice range and keep disciplined, dated notes
  - Write a security finding with evidence, risk and remediation
estimatedMinutes: 60
topics: [sec09.lab]
resources:
  - { title: "Kali Linux documentation", url: "https://www.kali.org/docs/", free: true, official: true }
  - { title: "Kali tools catalogue", url: "https://www.kali.org/tools/", free: true, official: true }
  - { title: "TryHackMe (guided rooms, free tier)", url: "https://tryhackme.com/", free: true, official: false }
  - { title: "Hack The Box Academy", url: "https://academy.hackthebox.com/", free: true, official: false }
  - { title: "PortSwigger Web Security Academy", url: "https://portswigger.net/web-security", free: true, official: true }
  - { title: "Nmap legal issues", url: "https://nmap.org/book/legal-issues.html", free: true, official: true }
---

This course taught the **method and the rules**. This session is where you use the real tools in the right way. The most
valuable skill here is not running a tool; it is **staying inside the rules, keeping records and reporting clearly**, so that is
what you practise. No environment is built for you: you use real Kali and the real, published, legal practice platforms.

> **Every action in this lab is against something you own, or something published for practice.** Before each step ask: *whose
> system is this, and who said I may test it?* If you cannot answer, do not run it.

## Part 1: Prepare Kali

You imported the Kali VM in the setup lesson. Open a terminal in it.

| Step | Command | Why |
|---|---|---|
| Change the default password | `passwd` | prebuilt VMs ship with a **known** username and password |
| Update (VM briefly on **NAT**) | `sudo apt update && sudo apt full-upgrade -y` | patch the tools themselves; a security distribution should be patched like any server |
| Back to isolation | set the adapter to **Host-only** again, then `ping -c 1 8.8.8.8` | the ping must **fail** for a contained lab |
| Snapshot | take a snapshot named `kali-clean` | a known-good state to return to |

## Part 2: Find help for any tool

You will never memorise the tools; you will look them up. Practise on tools you already know from earlier stages:

```bash
nmap --help | head -20          # a short usage summary
man nmap                        # the full manual (q to quit)
apropos "packet capture"        # search manual-page descriptions for a topic
which wireshark nmap            # where each program lives
```

Then open the **Kali tools catalogue** page for one tool. Each entry gives the tool's purpose, version, the packages it ships
in, and usage examples. For any tool you meet, the order is: **purpose and scope first, usage second, authorisation always.**

## Part 3: One authorised scan, from the right place

Your Kali VM is isolated, so it has no internet; do this step **from your host**, where you installed Nmap in the networking
lab, against the Nmap Project's own test host and nothing else:

```bash
nmap scanme.nmap.org
```

Save the output, and in your notes record the **date, time, target, tool version (`nmap --version`) and command**, then read the
port table exactly as in the networking lab. The Nmap Project permits **Nmap scanning only** of that host, kept light. Do not
run it repeatedly, and do not try anything else against it. Next, run the same kind of scan against **your own lab VM** from
Kali over the host-only network, and compare what a target you control exposes with what a public test host exposes.

## Part 4: Join the legal ranges

These platforms exist so you can practise offensive skills on targets set up and authorised for it:

| Platform | What it gives you | Note |
|---|---|---|
| **PortSwigger Web Security Academy** | free explained web labs, each with a hosted target | the web topics from Stage 6, with guided exercises |
| **TryHackMe** | guided "rooms" with explanations; a free tier and a paid tier | a gentle start; follow the platform's own introductory path |
| **Hack The Box Academy** | structured modules with exercise targets | free and paid material |

Create an account on at least one and **complete its own introductory material first**: each platform explains how to connect
to its targets (a browser-based machine, or a VPN to their lab) and its rules. Read the **rules of the platform** before you
start: they are your rules of engagement for that range.

## Part 5: Keep a tester's notebook

From your very first session keep dated notes. This is the habit that turns practice into professional work:

```text
Date/time (UTC):   2026-10-21 10:40
Platform/target:   PortSwigger Academy, lab "<name>"
Authorisation:     platform-provided lab (rules read: yes)
Goal:              <what you are trying to learn or show>
Actions (command or step, in order):
  1. ...
Observations / evidence (paste output, name screenshots):
  ...
Result and what I learned:
  ...
```

## Part 6: Write up one finding

Take the **cookie flag** or **missing header** you found in the web security lab, and write it as a finding, the structure from
lesson 4. Here is a worked example to copy the format from:

| Field | Example |
|---|---|
| **Title** | Session cookie set without the `HttpOnly` flag |
| **Severity** | Medium (likelihood depends on an XSS flaw existing; impact is session theft) |
| **Affected asset** | `http://localhost:3000`, the `Set-Cookie` response header (lab app) |
| **Description** | the session cookie is readable by JavaScript, so any script injected into a page could read it |
| **Evidence** | `curl -I` output with the `Set-Cookie` line, captured on the date above; ZAP baseline alert named in the report |
| **Business impact** | an XSS flaw anywhere in the app would let an attacker take over a user's session |
| **Remediation** | set `HttpOnly` (and `Secure` and `SameSite`) on the session cookie; add a Content-Security-Policy as defence in depth |
| **References** | OWASP Session Management and Cookie guidance; MDN on cookie attributes |

A reader should be able to **reproduce your evidence and apply your fix without asking you anything**. Add an **executive
summary** of two sentences for a manager above the technical detail. That one-page write-up is a better portfolio piece than a
screenshot of a "pwned" banner.

## If something goes wrong

| Problem | Fix |
|---|---|
| Kali has no internet after the update step | correct, you restored host-only networking; use NAT briefly only for updates |
| `man nmap` shows nothing | the man pages may not be installed on a minimal image: `sudo apt install man-db` |
| You are unsure whether a target is allowed | it is **not**. Stop and ask the owner, or use a provided range |
