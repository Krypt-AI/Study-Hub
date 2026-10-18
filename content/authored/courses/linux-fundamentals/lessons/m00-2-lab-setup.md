---
id: linux-fundamentals.m00.l2
title: Building your lab
summary: Install Ubuntu Server in a virtual machine, choose its network mode, and protect your work with snapshots.
objectives:
  - Explain what a hypervisor and a virtual machine are
  - Install Ubuntu Server LTS in a virtual machine with sensible settings
  - Choose between NAT, bridged and host-only networking
  - Take, restore and name snapshots
estimatedMinutes: 90
topics: [linux.m00]
resources:
  - { title: "Ubuntu Server installation tutorial", url: "https://documentation.ubuntu.com/server/tutorial/basic-installation/", free: true, official: true }
  - { title: "Download Ubuntu Server", url: "https://ubuntu.com/download/server", free: true, official: true }
  - { title: "VirtualBox user manual: virtual networking", url: "https://www.virtualbox.org/manual/topics/networkingdetails.html", free: true, official: true }
  - { title: "Multipass documentation (Ubuntu VMs from the command line)", url: "https://documentation.ubuntu.com/multipass/", free: true, official: true }
---

## Virtual machines

A **hypervisor** lets one physical computer run several **virtual machines** (VMs), each with its own virtual CPU, memory, disk and network card. For this course a VM is ideal: you can break it, roll it back, and nothing on your own laptop is at risk.

| Hypervisor | Runs on | Notes |
|---|---|---|
| VirtualBox | Windows, Linux, Intel macOS | Free; used for the steps below |
| VMware Workstation Pro / Fusion | Windows, Linux, macOS | Free for personal use |
| Hyper-V | Windows Pro and Education | Built in; switch it on in Windows features |
| UTM | Apple-silicon Macs | Use the **ARM64** Ubuntu Server image |
| Multipass | Windows, macOS, Linux | Launches Ubuntu VMs with one command: `multipass launch --name lab01 26.04` |

Your computer needs **hardware virtualisation** (Intel VT-x or AMD-V) switched on in its firmware settings. If a VM refuses to start with an error mentioning VT-x or AMD-V, that is the setting to check.

## Recommended VM settings

| Setting | Value | Why |
|---|---|---|
| Name | `lab01` | Short, matches the hostname you will give it |
| CPUs | 2 | Enough for every lab |
| Memory | 2048 MB (4096 MB if you can spare it) | The server runs without a desktop |
| Disk | 25 GB, dynamically allocated | Grows only as it fills |
| Second disk | 8 GB (add later, in Module 8) | For partitioning and LVM labs |
| Network adapter 1 | NAT | Internet access for updates |
| Network adapter 2 | Host-only | So your laptop can SSH to the VM |

## Network modes

| Mode | The VM can reach | Your laptop can reach the VM | Others on your network can reach the VM |
|---|---|---|---|
| **NAT** | the internet, through your laptop | only with port forwarding | no |
| **Host-only** | your laptop and other host-only VMs | yes | no |
| **Bridged** | your physical network and the internet | yes | **yes** |
| Internal | other VMs on the same internal network | no | no |

NAT plus host-only is the safest lab: updates work, and the VM is invisible to other people on a campus or café network. Use bridged only on a network you control.

## Installing Ubuntu Server

1. Download the **Ubuntu Server 26.04 LTS** ISO from ubuntu.com and check its SHA-256 checksum against the published `SHA256SUMS` file (on Windows: `Get-FileHash .\ubuntu-26.04.1-live-server-amd64.iso`).
2. Create the VM with the settings above and attach the ISO as its optical drive.
3. Start the VM and choose **Try or Install Ubuntu Server**.
4. Language and keyboard: choose yours. Installer type: **Ubuntu Server** (not minimized).
5. Network: both adapters should get addresses by DHCP. Note the host-only address (usually `192.168.56.x` in VirtualBox).
6. Storage: accept **Use an entire disk** with **Set up this disk as an LVM group**. (Module 8 explains LVM.)
7. Profile: your name, server name `lab01`, username `student` (or your own), and a strong password you will remember.
8. Ubuntu Pro: skip for now. **SSH: tick "Install OpenSSH server".** Featured snaps: none.
9. When the installer says **Reboot now**, remove the ISO if asked and reboot.

After the reboot you see a text login:

```text
Ubuntu 26.04.1 LTS lab01 tty1

lab01 login: student
Password:
Welcome to Ubuntu 26.04.1 LTS (GNU/Linux 7.0.0-15-generic x86_64)
...
student@lab01:~$
```

The password is not shown while you type it (on 26.04, sudo-rs shows `*` for each character at the sudo prompt, but the login prompt shows nothing). That is normal.

### First commands after installing

```bash
sudo apt update
sudo apt full-upgrade
ip -br address
```

Expected output of the last command (addresses will differ):

```text
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp0s3           UP             10.0.2.15/24 metric 100 fd17:625c:f037:2:a00:27ff:fe8d:1a2b/64
enp0s8           UP             192.168.56.101/24 metric 100
```

`enp0s3` is the NAT adapter; `enp0s8` (host-only) is the address you will use for SSH in the next lesson. If `enp0s8` shows `DOWN` with no address, Lesson 9.1 explains how to enable it with netplan; for now you can use the VM console.

## Snapshots

A **snapshot** records the VM's disk (and optionally memory) at a moment, so you can return to it later. Take one:

- after a clean install and update: `01-clean-install`;
- before every module's labs: `m04-before-permissions`;
- before any change you are unsure about.

Restoring a snapshot throws away everything since it was taken, so copy out any evidence (command output, notes) first. Snapshots are **not backups**: they live on the same disk as the VM, and Module 12 covers real backups.

## Guided lab

1. Install the VM as above and log in on the console.
2. Run `sudo apt update && sudo apt full-upgrade -y` and wait for it to finish.
3. Run `hostnamectl` and check that the static hostname is `lab01` and the operating system is Ubuntu 26.04 LTS.
4. Shut down cleanly with `sudo poweroff`.
5. Take a snapshot named `01-clean-install`.

## Independent exercises

1. Write down your VM's two IP addresses and which adapter each belongs to.
2. Make a deliberate change (`touch ~/marker.txt`), restore the snapshot, and confirm that the file is gone. Explain in one sentence why this is useful before a risky change.
3. Explain why a bridged adapter on a shared university network is riskier than host-only.
