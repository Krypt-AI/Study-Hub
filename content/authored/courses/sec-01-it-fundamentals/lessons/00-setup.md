---
id: sec-01-it-fundamentals.l00
title: "Setup: a safe virtual lab"
summary: Build an isolated virtual-machine lab with VirtualBox, Ubuntu and a Windows evaluation VM, use snapshots and host-only networking, and learn the rules that keep practice legal and contained.
objectives:
  - Install a hypervisor and create isolated virtual machines
  - Use snapshots and host-only networking to keep the lab safe and contained
  - State the rules for legal, authorised practice
estimatedMinutes: 45
topics: [sec01.setup]
resources:
  - { title: "VirtualBox downloads and manual", url: "https://www.virtualbox.org/wiki/Downloads", free: true, official: true }
  - { title: "Ubuntu downloads", url: "https://ubuntu.com/download", free: true, official: true }
  - { title: "Windows 11 Enterprise evaluation (90-day)", url: "https://www.microsoft.com/en-us/evalcenter/evaluate-windows-11-enterprise", free: true, official: true }
  - { title: "VS Code download", url: "https://code.visualstudio.com/download", free: true, official: true }
---

Every later Cybersecurity course assumes you have a **virtual lab**: throwaway machines, isolated from your real
network, that you can break and reset. Build it once here.

## Why a lab, and the rules first

Security tools and intentionally vulnerable targets must only ever touch systems **you own or are explicitly
authorised to test**. Running scans or attacks against systems you do not have written permission for is illegal in
most countries. A lab gives you targets that are yours, kept off the real network, so practice is both safe and
lawful. These rules are repeated in every hands-on course for good reason.

## Step 1: A hypervisor

A **hypervisor** runs virtual machines (VMs). **VirtualBox** is free and cross-platform:

```text
Download from virtualbox.org → install → also install the Extension Pack (same version).
```

On Windows, VirtualBox needs hardware virtualization enabled in the BIOS/UEFI, and it conflicts with some Hyper-V
features; the VirtualBox manual explains how to resolve that. (Apple-silicon Macs: use UTM or VMware Fusion instead.)

## Step 2: A Linux VM

1. Download the **Ubuntu Desktop** ISO.
2. New VM → Linux / Ubuntu (64-bit), give it 2–4 vCPU, 4 GB+ RAM, 40 GB disk.
3. Attach the ISO and install Ubuntu inside the VM.
4. Install the VirtualBox **Guest Additions** for a better display and shared clipboard.

## Step 3: A Windows VM

Microsoft offers a free **90-day Windows Enterprise evaluation** ISO for testing. Install it in a second VM. Keeping a
Windows and a Linux machine side by side lets you see how each handles users, permissions, services and logs.

## Step 4: Snapshots and isolation — the two safety habits

- **Snapshot** a VM when it is in a known-good state (Machine → Take Snapshot). After any risky change you can
  **restore** it in seconds. Snapshot before each experiment.
- **Isolate the network.** For a lab with vulnerable targets, set the VMs' network to **Host-Only** or **Internal
  Network** so they can talk to each other but **not** reach the internet or your home network. Only switch a VM to
  NAT briefly when it genuinely needs updates, then switch back.

## Step 5: Your tools live on the host

Install **VS Code** on your host machine for writing notes, scripts and reports (see the AI Engineering course's setup
lesson for VS Code, Git and Python). Treat downloaded tools and files as untrusted: keep them inside the lab VMs, not
on your main system.

## Check your lab

- Both VMs boot and you can log in.
- Each VM has a clean snapshot you can restore.
- With host-only networking, the vulnerable VM **cannot** reach the internet (`ping` a public address fails) but the
  two lab VMs can reach each other.
