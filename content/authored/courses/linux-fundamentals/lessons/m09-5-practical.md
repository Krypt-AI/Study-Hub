---
id: linux-fundamentals.m09.l5
title: "Practical assessment: network the office server"
summary: Give the server a fixed identity on the network, expose only the right services, and troubleshoot a reported outage.
objectives:
  - Configure static addressing, name resolution and a host firewall to a specification
  - Troubleshoot connectivity systematically and record the evidence
estimatedMinutes: 75
topics: [linux.m09]
---

## Part A — specification

1. `lab01` has the static address `192.168.56.10/24` on the host-only adapter (netplan), and the NAT adapter keeps DHCP.
2. Hostname `lab01`; `/etc/hosts` maps `192.168.56.1` to `hostpc`.
3. Listening services: SSH on all interfaces; nginx on port 80; `kira-status` on loopback only.
4. ufw: default deny incoming; SSH only from `192.168.56.0/24`, rate-limited; HTTP from anywhere; nothing else.
5. Evidence: `ip -br a`, `ip route`, `sudo ss -tulpn`, `sudo ufw status verbose`, and a test from your laptop of SSH, HTTP and port 8080 (must fail).

## Part B — the outage

Your instructor (or a classmate) applies **one** of these faults without telling you; or apply one yourself with a coin toss and work as if you did not know:

- `sudo ip link set enp0s8 down`
- `sudo ufw delete allow 80/tcp`
- `sudo systemctl stop nginx`
- an `/etc/hosts` line `127.0.0.1 archive.ubuntu.com`

> **Ticket #1103** — "The Kedai Kira intranet page does not load, and the server cannot download updates."

Troubleshoot bottom-up, find the fault, fix it, and verify.

## Marking

Report Part A's evidence and Part B's investigation, then compare with the model answer.
