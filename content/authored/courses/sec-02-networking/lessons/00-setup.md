---
id: sec-02-networking.l00
title: "Setup: Wireshark and Nmap"
summary: Install Wireshark to read packets and Nmap to discover hosts and services, and use them only inside your own lab network.
objectives:
  - Install Wireshark and Nmap on your host or lab VM
  - Capture and read a simple packet exchange
  - Map a lab host's open services, within authorised scope
estimatedMinutes: 40
topics: [sec02.setup]
resources:
  - { title: "Wireshark download and User's Guide", url: "https://www.wireshark.org/download.html", free: true, official: true }
  - { title: "Nmap download and reference guide", url: "https://nmap.org/download.html", free: true, official: true }
  - { title: "Wireshark sample captures", url: "https://wiki.wireshark.org/SampleCaptures", free: true, official: true }
---

Builds on the lab from Stage 1 lesson 0. These two tools appear throughout the Cybersecurity roadmap.

## Scope first

Both tools must only be used on **networks and hosts you own or are authorised to test**. Packet capture can record
other people's data, and port scanning probes services without permission — both can be unlawful off your own
equipment. Keep this work on your **host-only lab network** (Stage 1). Capturing your *own* traffic to learn the
protocols is fine.

## Step 1: Wireshark (read packets)

**Wireshark** shows every packet on a network interface, decoded protocol by protocol.

```text
Windows: download the installer from wireshark.org — it includes Npcap, needed for live capture.
macOS:   install the .dmg (it sets up the capture helper).
Linux:   sudo apt install wireshark   (allow non-root capture when prompted).
```

Capture a lookup:

1. Start a capture on your active interface.
2. In a terminal run `nslookup example.com` (or just load a page).
3. Stop the capture and type `dns` or `http` in the display-filter bar to isolate those packets.
4. Expand a packet to see the layers — Ethernet, IP, TCP/UDP, application — matching lesson 1's model.

If you have no traffic to capture, open a **sample capture** from the Wireshark wiki and explore it offline.

## Step 2: Nmap (discover hosts and services)

**Nmap** finds live hosts and which services (ports) they expose — the inventory step of both defence (know your own
exposure) and authorised assessment.

```text
Windows: Nmap installer from nmap.org (includes the Zenmap GUI).
macOS:   brew install nmap
Linux:   sudo apt install nmap
```

Against your **own lab VM** (use its host-only IP):

```bash
nmap 192.168.56.101            # common ports on one lab host
nmap -sV 192.168.56.101        # also identify service/version banners
```

Read the output as a list of doors: each open port is a service an attacker could reach and a defender should justify
or close (Stage 7). Never point Nmap at addresses outside your lab.

## Check your setup

- Wireshark captures packets (or opens a sample capture) and you can filter to `dns`.
- `nmap --version` runs, and scanning your lab VM lists its open ports.
- Your lab VMs still cannot reach the internet on host-only networking.
