---
id: linux-fundamentals.m07.l1
title: How Linux boots
summary: Follow the boot from firmware to login, understand targets, and know how to reboot, shut down and recover.
objectives:
  - Describe the stages of the boot process (firmware, GRUB, kernel and initramfs, systemd)
  - Explain systemd targets and show or change the default
  - Reboot and shut down safely, now or at a scheduled time
  - Measure boot time and find slow units
  - Describe how to reach a recovery shell
estimatedMinutes: 45
topics: [linux.m07]
resources:
  - { title: "systemd: bootup(7)", url: "https://www.freedesktop.org/software/systemd/man/latest/bootup.html", free: true, official: true }
  - { title: "systemd: systemd.special(7) targets", url: "https://www.freedesktop.org/software/systemd/man/latest/systemd.special.html", free: true, official: true }
  - { title: "GNU GRUB manual", url: "https://www.gnu.org/software/grub/manual/grub/grub.html", free: true, official: true }
  - { title: "RHEL 10: Managing systemd", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/using_systemd_unit_files_to_customize_and_optimize_your_system/", free: true, official: true }
---

## From power button to login prompt

```text
1. Firmware (UEFI or BIOS)   checks hardware, finds a boot loader on a disk
2. Boot loader (GRUB 2)      shows the menu, loads the kernel and the initramfs
3. Kernel                    starts hardware drivers, mounts the initramfs
4. initramfs                 a small temporary root: loads storage drivers, finds and mounts the real root filesystem
5. systemd (PID 1)           mounts filesystems, starts services in dependency order, reaches the default target
6. Login                     getty on the console, sshd for remote logins
```

| Stage | Where its files are | What can go wrong |
|---|---|---|
| UEFI/BIOS | firmware settings, the EFI partition (`/boot/efi`) | wrong boot order, Secure Boot refusing a kernel |
| GRUB | `/boot/grub/grub.cfg`, generated from `/etc/default/grub` | missing kernel, typo in configuration |
| Kernel and initramfs | `/boot/vmlinuz-*`, `/boot/initrd.img-*` | cannot find the root filesystem (wrong UUID, missing driver) |
| systemd | units in `/usr/lib/systemd/system` and `/etc/systemd/system` | a failing mount in `/etc/fstab`, a broken service |

```bash
ls /boot
cat /proc/cmdline
```

```text
config-7.0.0-15-generic  initrd.img-7.0.0-15-generic  vmlinuz-7.0.0-15-generic
efi  grub  initrd.img  vmlinuz ...
BOOT_IMAGE=/vmlinuz-7.0.0-15-generic root=/dev/mapper/ubuntu--vg-ubuntu--lv ro
```

`/proc/cmdline` shows the options GRUB gave the kernel, including where the root filesystem is.

### Changing GRUB settings

Edit `/etc/default/grub` (for example `GRUB_TIMEOUT=5`), then regenerate the configuration:

| Ubuntu | RHEL family |
|---|---|
| `sudo update-grub` | `sudo grub2-mkconfig -o /boot/grub2/grub.cfg` (or `grubby` for kernel arguments) |

Never edit `grub.cfg` directly: it is overwritten.

## Targets

A **target** is a named group of units that represents a system state, like the old "runlevels".

| Target | State | Old runlevel |
|---|---|---|
| `multi-user.target` | full system, text logins, network services: **servers** | 3 |
| `graphical.target` | multi-user plus a graphical desktop | 5 |
| `rescue.target` | single user, root filesystem mounted, minimal services | 1 |
| `emergency.target` | root filesystem read-only, almost nothing started | — |
| `reboot.target`, `poweroff.target` | reboot, power off | 6, 0 |

```bash
systemctl get-default
sudo systemctl set-default multi-user.target
systemctl list-units --type=target
```

```text
multi-user.target
```

`sudo systemctl isolate rescue.target` switches **now** (it stops your SSH session: only do it on the console).

## Rebooting and shutting down

| Command | Effect |
|---|---|
| `sudo systemctl reboot` (or `sudo reboot`) | reboot now |
| `sudo systemctl poweroff` (or `sudo poweroff`) | shut down now |
| `sudo shutdown -r +15 "Kernel update"` | reboot in 15 minutes, warning logged-in users |
| `sudo shutdown -r 23:00` | reboot at 23:00 |
| `sudo shutdown -c` | cancel a scheduled shutdown |

On a shared server, announce reboots and use the delayed form.

## Boot time

```bash
systemd-analyze
systemd-analyze blame | head -5
systemd-analyze critical-chain
```

```text
Startup finished in 3.112s (kernel) + 9.804s (userspace) = 12.917s
multi-user.target reached after 9.721s in userspace.
6.010s systemd-networkd-wait-online.service
1.233s snapd.seeded.service
...
```

`systemd-networkd-wait-online` waiting for an interface that never comes up (such as a disconnected second adapter) is a common cause of slow boots on Ubuntu Server.

## Reaching a recovery shell

When a server will not boot normally:

1. Open the VM console (or the server's out-of-band console: iLO, iDRAC, cloud serial console).
2. Show the GRUB menu: hold **Shift** (BIOS) or press **Esc** (UEFI) during boot.
3. Choose **Advanced options → recovery mode** on Ubuntu, or press `e` on an entry and add `systemd.unit=rescue.target` (or `emergency.target`) to the `linux` line, then `Ctrl+X` to boot.
4. Fix the problem (often `/etc/fstab`, Module 8), then reboot.

RHCSA expects you to **interrupt the boot to regain access** (for example, to reset a forgotten root password with `rd.break` or `init=/bin/bash`, then relabel SELinux). Practise it only on your lab VM; the advanced Linux course covers it in detail.

## Guided lab

1. Run `ls -l /boot` and `cat /proc/cmdline`. Which kernel version is booted?
2. Check `systemctl get-default`.
3. Run `systemd-analyze` and `systemd-analyze blame | head`. Record the slowest unit.
4. Schedule a reboot with `sudo shutdown -r +10 "Lab test"`, check that a message appears in a second session (`wall` message), then cancel it with `sudo shutdown -c`.
5. On the VM console, reboot and open the GRUB menu (hold Shift or press Esc). Look at **Advanced options**, then boot normally.

## Independent exercises

1. Draw the six boot stages from memory and write one thing that can fail at each.
2. Set `GRUB_TIMEOUT=3` in `/etc/default/grub`, apply it with `update-grub`, reboot and confirm. Take a snapshot first.
3. What is the difference between `rescue.target` and `emergency.target`? Use `man systemd.special`.
