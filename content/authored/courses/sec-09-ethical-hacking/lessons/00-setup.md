---
id: sec-09-ethical-hacking.l00
title: "Setup: Kali and legal practice ranges"
summary: Set up a Kali Linux VM in an isolated lab, understand what a security distribution is, and use purpose-built legal ranges (TryHackMe, Hack The Box, PortSwigger, VulnHub) for all practice.
objectives:
  - Run Kali Linux in an isolated lab VM
  - Understand that the tools are neutral and authorisation is everything
  - Choose legal, provided practice ranges rather than real targets
estimatedMinutes: 45
topics: [sec09.setup]
resources:
  - { title: "Kali Linux (get and docs)", url: "https://www.kali.org/get-kali/", free: true, official: true }
  - { title: "TryHackMe (guided, beginner-friendly labs)", url: "https://tryhackme.com/", free: true, official: false }
  - { title: "Hack The Box (practice labs and Academy)", url: "https://www.hackthebox.com/", free: true, official: false }
  - { title: "PortSwigger Web Security Academy (free)", url: "https://portswigger.net/web-security", free: true, official: true }
  - { title: "VulnHub (downloadable vulnerable VMs)", url: "https://www.vulnhub.com/", free: true, official: false }
---

Builds on the isolated lab from Stage 1. This course is **methodology and defence**: understanding the authorised
offensive process so you can test, prevent and detect. All hands-on practice happens on **provided legal ranges** or
**your own lab**, never on systems you do not own or have written permission to test.

## The one rule, again

The techniques in this field are only lawful with **explicit, written, scoped authorisation** (lesson 1). The tools do
not know the difference; *you* are responsible for only ever pointing them at targets you are allowed to test. Breaking
this is a crime in most countries regardless of intent. Everything below keeps you on legal ground.

## Step 1: Kali Linux in an isolated VM

**Kali Linux** is a Debian-based distribution that bundles security-testing tools so professionals do not assemble
them by hand. It is just a toolbox — ordinary software — and installing it changes nothing about the law.

1. Download a prebuilt **virtual machine** image from kali.org/get-kali (VirtualBox/VMware), or the installer ISO.
2. Import it into your hypervisor (Stage 1). Default prebuilt credentials are `kali` / `kali` — change the password.
3. Set networking to **host-only / internal** so Kali can reach your lab targets but **not** the internet or your home
   network. Snapshot the clean state.

## Step 2: Legal practice ranges (use these, not real targets)

The professional and legal way to build skill is on ranges built for it, where authorisation is provided by design:

- **TryHackMe** — guided, explained rooms, excellent for beginners; a free tier plus subscription.
- **Hack The Box** — practice machines and a structured Academy; free and paid tiers.
- **PortSwigger Web Security Academy** — free, high-quality web-security labs (also used in Stage 6).
- **VulnHub** — downloadable intentionally vulnerable VMs you run **inside your own isolated lab**.
- **Capture the Flag (CTF)** events — time-boxed legal challenges (lesson 4).

These give you real targets to practise against with full authorisation, which is exactly what you cannot do on the
open internet.

## Step 3: Keep a tester's notebook

From the start, practise **documentation**: what you tried, what you found, timestamps, and evidence. In a real
engagement the notes become the report (lesson 4), and in CTFs they help you learn. VS Code on your host (AI course
setup) is a fine place to keep structured notes and screenshots.

## Check your setup

- Kali boots in an isolated VM with a changed password and a clean snapshot.
- Kali can reach a lab target but cannot reach the internet on host-only networking.
- You have an account on at least one provided legal range to practise against.
