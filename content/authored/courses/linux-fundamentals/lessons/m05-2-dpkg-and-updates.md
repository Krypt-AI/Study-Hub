---
id: linux-fundamentals.m05.l2
title: dpkg, updates and keeping a server patched
summary: Query installed packages with dpkg, apply updates safely, hold versions, configure automatic security updates, and know when a reboot is needed.
objectives:
  - Use `dpkg -l`, `-L`, `-S` and `-s` to answer "what is installed and where"
  - Choose between `apt upgrade` and `apt full-upgrade`
  - Hold and unhold a package version
  - Check and configure unattended security upgrades and detect a pending reboot
  - Fix interrupted installations and broken dependencies
estimatedMinutes: 50
topics: [linux.m05]
resources:
  - { title: "Ubuntu Server: Automatic updates", url: "https://documentation.ubuntu.com/server/how-to/software/automatic-updates/", free: true, official: true }
  - { title: "man 1 dpkg", url: "https://manpages.ubuntu.com/manpages/noble/man1/dpkg.1.html", free: true, official: true }
  - { title: "Ubuntu Security Notices", url: "https://ubuntu.com/security/notices", free: true, official: true }
---

## dpkg: the low-level tool

APT finds and downloads packages and resolves dependencies; it hands the actual installation to **dpkg**. dpkg is also the quickest way to ask about what is installed.

| Command | Answers |
|---|---|
| `dpkg -l` | every package and its state (`ii` = installed) |
| `dpkg -l 'openssh*'` | packages matching a pattern |
| `dpkg -s nginx` | status and details of one installed package |
| `dpkg -L nginx` | files the package installed |
| `dpkg -S /usr/sbin/sshd` | which package owns this file |
| `sudo dpkg -i file.deb` | install a local file (does **not** fetch dependencies: prefer `apt install ./file.deb`) |

```bash
dpkg -S /usr/sbin/sshd
dpkg -L openssh-server | grep -E 'sshd_config|\.service'
```

```text
openssh-server: /usr/sbin/sshd
/etc/ssh/sshd_config.d
/usr/lib/systemd/system/ssh.service
/usr/lib/systemd/system/ssh.socket
...
```

## Applying updates

```bash
sudo apt update
apt list --upgradable
sudo apt upgrade
```

| Command | Behaviour |
|---|---|
| `apt upgrade` | upgrades packages; may install new dependencies but **never removes** anything |
| `apt full-upgrade` | upgrades and may **remove** packages to resolve conflicts (needed for some kernel and library transitions) |

On a server, read the plan before you confirm, especially lines under "Removing".

### Is a reboot needed?

Updates to the kernel, the C library or systemd take full effect only after a reboot. Ubuntu leaves a flag:

```bash
ls /var/run/reboot-required && cat /var/run/reboot-required.pkgs
```

```text
/var/run/reboot-required
linux-image-7.0.0-16-generic
linux-base
```

Plan the reboot in a maintenance window (Module 13); do not reboot production servers on a whim. `needrestart` (installed on Ubuntu Server) also offers to restart services that use updated libraries.

### Holding a version

When an application needs a specific version, **hold** it so upgrades skip it:

```bash
sudo apt-mark hold nginx
apt-mark showhold
sudo apt-mark unhold nginx
```

Held packages miss security fixes too: document every hold and review it regularly.

## Unattended security upgrades

Ubuntu Server installs `unattended-upgrades`, which applies **security** updates automatically every day:

```bash
systemctl status unattended-upgrades --no-pager
cat /etc/apt/apt.conf.d/20auto-upgrades
sudo unattended-upgrade --dry-run --debug | tail -5
less /var/log/unattended-upgrades/unattended-upgrades.log
```

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

Which origins are upgraded, whether to reboot automatically and when, and email notifications are set in `/etc/apt/apt.conf.d/50unattended-upgrades`. Many organisations allow automatic security updates but schedule reboots themselves.

## When things go wrong

| Symptom | Fix |
|---|---|
| `Could not get lock /var/lib/dpkg/lock-frontend` | another APT process is running (often unattended-upgrades): **wait**, check with `ps aux \| grep -E 'apt\|dpkg'`; never delete lock files |
| `dpkg was interrupted, you must manually run 'sudo dpkg --configure -a'` | run exactly that |
| unmet dependencies after installing a `.deb` | `sudo apt --fix-broken install` |
| `Temporary failure resolving 'archive.ubuntu.com'` | a DNS or network problem (Module 9), not an APT problem |
| `The following signatures couldn't be verified` | a repository's key is missing or changed: check the vendor's official instructions; do not disable verification |

## Guided lab

1. Find which package owns `/usr/bin/ls` and `/etc/ssh/sshd_config`.
2. List the files of the `tree` package with `dpkg -L tree`.
3. Run `sudo apt update && apt list --upgradable`, then `sudo apt upgrade`. Read what it plans before confirming.
4. Check whether a reboot is required; if so, reboot and confirm the new kernel with `uname -r`.
5. Hold `nginx`, run `sudo apt upgrade` and look for "held back" or the hold, then unhold it.
6. Check unattended-upgrades is enabled and read the last lines of its log.

## Independent exercises

1. Write a one-line command that prints how many packages are installed (`dpkg -l | grep -c '^ii'`).
2. Find the Ubuntu Security Notice for the most recent OpenSSH update and note which releases it affected.
3. In `50unattended-upgrades`, find the setting that would reboot automatically at 03:00. Explain why you might leave it off on a production server.
