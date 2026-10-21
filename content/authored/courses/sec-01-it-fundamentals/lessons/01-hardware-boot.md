---
id: sec-01-it-fundamentals.l01
title: Hardware, firmware and boot
summary: The components of a computer, volatile versus non-volatile storage, how a machine boots through firmware to the OS, and the security features rooted in hardware.
objectives:
  - Name the core hardware components and their security relevance
  - Explain the boot chain from firmware to operating system
  - Describe hardware-rooted protections (UEFI Secure Boot, TPM, disk encryption)
estimatedMinutes: 45
topics: [sec01.hardware]
resources:
  - { title: "NIST SP 800-147 (BIOS protection guidelines)", url: "https://csrc.nist.gov/pubs/sp/800/147/final", free: true, official: true }
  - { title: "UEFI specifications", url: "https://uefi.org/specifications", free: true, official: true }
  - { title: "Microsoft: BitLocker overview", url: "https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/", free: true, official: true }
---

## The components, through a security lens

| Component | What it does | Why security cares |
|---|---|---|
| CPU | Executes instructions | Enforces privilege rings (kernel vs user); provides virtualization support |
| RAM (memory) | Fast, **volatile** working store | Secrets live here while running; lost at power-off, so capture live for forensics |
| Storage (SSD/HDD) | **Non-volatile** persistent store | Where data, logs and malware persist; target of encryption |
| Firmware (UEFI/BIOS) | First code that runs | Compromise here survives OS reinstalls; hard to detect |
| Network interface | Connects to networks | The entry/exit point for most attacks |

The key distinction is **volatile** (RAM: cleared when power is lost) versus **non-volatile** (disks, flash: persists).
It drives two forensics rules: pull RAM contents *before* shutting a machine down, and remember that "deleted" files on
disk often persist until overwritten.

## The boot chain

1. **Firmware (UEFI)** runs from the motherboard, initialises hardware and finds a bootable device.
2. The **bootloader** (GRUB on Linux, Windows Boot Manager) loads the OS **kernel**.
3. The **kernel** starts, mounts the filesystem, and launches the first user-space process (`systemd` on Linux),
   which starts services and the login prompt.

Each stage trusts the next, so each is a target. Malware that inserts itself early (a **bootkit** or firmware implant)
runs before the OS and its defences exist.

## Hardware-rooted security

- **UEFI Secure Boot** checks a digital signature on the bootloader and kernel, so unsigned/tampered boot code is
  rejected — a defence against bootkits.
- **TPM (Trusted Platform Module)** is a chip that stores keys and measurements of the boot state. It can release a
  disk-encryption key only if the boot chain is unmodified.
- **Full-disk encryption** (BitLocker on Windows, LUKS on Linux) protects data **at rest**: a stolen laptop's disk is
  unreadable without the key. It does nothing once the machine is unlocked and running.

These establish a **root of trust**: security that rests on hardware you cannot easily rewrite, anchoring the software
above it. Understanding the boot chain tells you why "just reinstall the OS" does not always remove a deep compromise.
