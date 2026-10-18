---
id: linux-fundamentals.m11.l3
title: Updates, firewalls and a hardening baseline
summary: Bring the security pieces together into a baseline, check it with an audit tool, and meet AppArmor and SELinux.
objectives:
  - Build a basic hardening baseline (patching, minimal services, firewall, permissions, logging, time)
  - Find risky files (world-writable, unowned, setuid) and unnecessary services
  - "Explain mandatory access control: AppArmor on Ubuntu and SELinux on RHEL"
  - Run an audit tool (Lynis) and act on its findings sensibly
estimatedMinutes: 55
topics: [linux.m11]
resources:
  - { title: "Ubuntu Server: Security", url: "https://documentation.ubuntu.com/server/how-to/security/", free: true, official: true }
  - { title: "Ubuntu Server: AppArmor", url: "https://documentation.ubuntu.com/server/how-to/security/apparmor/", free: true, official: true }
  - { title: "RHEL 10: Using SELinux", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/using_selinux/", free: true, official: true }
  - { title: "Lynis (CISOfy)", url: "https://cisofy.com/lynis/", free: true, official: true }
  - { title: "CIS Benchmarks", url: "https://www.cisecurity.org/cis-benchmarks", free: true, official: true }
---

## A beginner's hardening baseline

Hardening means **reducing the attack surface** and **increasing visibility**. No list makes a server "secure", but this baseline covers what an entry-level administrator is expected to check:

| Area | Baseline | Module |
|---|---|---|
| Updates | security updates automatic; reboots scheduled; no forgotten holds | 5 |
| Accounts | no shared accounts; least privilege; dormant accounts disabled; password policy | 4, 11 |
| SSH | keys only, no root login, restricted group | 11 |
| Network exposure | only required services listening; internal services on loopback; firewall default deny | 9 |
| Services | unused services disabled or removed | 7 |
| Files | sensitive files with tight permissions; no unexpected world-writable or setuid files | 4 |
| Logging and time | persistent journal, logs rotated, clock synchronised (accurate timestamps matter for investigations) | 7, 10 |
| Backups | tested, and stored away from the server | 12 |

### Minimise services

```bash
systemctl list-unit-files --type=service --state=enabled
sudo ss -tulpn
```

For each enabled service and listening port: is it needed on **this** server? If not, `sudo systemctl disable --now NAME` or remove the package. Every running service is code that can have vulnerabilities.

### Find risky files

```bash
sudo find / -xdev -type f -perm -o+w -not -path "/proc/*" 2>/dev/null       # world-writable files
sudo find / -xdev -type d -perm -o+w ! -perm -1000 2>/dev/null               # world-writable dirs without sticky bit
sudo find / -xdev \( -nouser -o -nogroup \) 2>/dev/null                      # files with no valid owner
sudo find / -xdev -type f -perm -4000 2>/dev/null                            # setuid programs: compare with a known list
ls -l /etc/shadow /etc/sudoers /etc/ssh/sshd_config
```

Expected: `/etc/shadow` is `-rw-r----- root shadow`, `/etc/sudoers` is `-r--r----- root root`.

### Time synchronisation

```bash
timedatectl
```

`System clock synchronized: yes` and `NTP service: active` matter: logs from several servers can only be correlated if their clocks agree, and TLS and Kerberos fail with wrong clocks. Recent Ubuntu releases synchronise time with **chrony** (`chronyc tracking`), older ones with systemd-timesyncd (`timedatectl timesync-status`); RHEL uses chrony.

## Mandatory access control

Standard permissions (DAC) let a file's owner decide access. **Mandatory access control** (MAC) adds system-wide rules that even root-owned processes must obey, so a compromised service is confined to what its policy allows.

| | Ubuntu: **AppArmor** | RHEL: **SELinux** |
|---|---|---|
| Model | per-program **profiles** based on paths | **labels** (contexts) on every file, process and port |
| Status | `sudo aa-status` | `getenforce`, `sestatus` |
| Modes | enforce / complain per profile | Enforcing / Permissive / Disabled system-wide |
| Denials logged | `journalctl -k -g apparmor="DENIED"` | `ausearch -m avc`, `/var/log/audit/audit.log` |
| Typical fix | adjust the profile | restore labels (`restorecon -Rv`), set a boolean (`setsebool -P`), label a port (`semanage port`) |

```bash
sudo aa-status | head -8
```

```text
apparmor module is loaded.
112 profiles are loaded.
48 profiles are in enforce mode.
   /usr/bin/man
   /usr/sbin/chronyd
...
```

The single most important rule: **do not disable SELinux or AppArmor to make a problem go away**. Read the denial, then fix the label, boolean or profile. RHCSA tests SELinux troubleshooting in depth; the advanced course covers it.

## Auditing with Lynis

```bash
sudo apt install lynis
sudo lynis audit system --quick
```

```text
  Hardening index : 64 [############        ]
  Tests performed : 255
...
  Suggestions (38):
  * Set a password on GRUB boot loader to prevent altering boot configuration [BOOT-5122]
  * Install a PAM module for password strength testing like pam_cracklib or pam_passwdqc [AUTH-9262]
  ...
```

Treat the results as **suggestions to evaluate**, not orders: each has a cost. Fix what fits the server's role and risk, record what you chose not to do and why, and re-run to see the index improve. Full compliance programmes use CIS Benchmarks (and tools like Ubuntu's `usg` with Ubuntu Pro, or OpenSCAP on RHEL).

## Guided lab

1. List enabled services and listening ports. Disable one you do not need (for example `kira-status` if you no longer use it) and record why.
2. Run the risky-file searches and explain each result (expected setuid programs, `/tmp` and similar).
3. Check `timedatectl`, and `chronyc tracking` (or `timedatectl timesync-status`).
4. Run `sudo aa-status` and find nginx-related or other enforced profiles.
5. Run `sudo lynis audit system --quick`, record the hardening index, pick three suggestions, apply those that make sense for a lab server, and re-run.

## Independent exercises

1. Write your own baseline checklist (one page) from the table above, with the command that checks each item.
2. Explain to a manager, in three sentences, why disabling SELinux to fix a web application is a bad idea.
3. Choose one Lynis suggestion you decided **not** to apply and justify it in a change record (Module 13).
