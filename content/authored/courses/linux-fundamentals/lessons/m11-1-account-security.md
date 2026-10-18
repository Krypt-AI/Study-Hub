---
id: linux-fundamentals.m11.l1
title: Account security
summary: Enforce password quality and ageing, review accounts and logins, and remove what should not be there.
objectives:
  - Configure password quality (pwquality) and ageing (`chage`, login.defs)
  - Audit accounts for UID 0 duplicates, empty passwords, unused and expired accounts
  - Review login history with `last`, `lastb`, `lastlog` and the journal
  - Explain account lockout after failed attempts
estimatedMinutes: 45
topics: [linux.m11]
resources:
  - { title: "Ubuntu Server: User management (password policy)", url: "https://documentation.ubuntu.com/server/how-to/security/user-management/", free: true, official: true }
  - { title: "man 5 pwquality.conf", url: "https://manpages.ubuntu.com/manpages/noble/man5/pwquality.conf.5.html", free: true, official: true }
  - { title: "man 1 chage", url: "https://manpages.ubuntu.com/manpages/noble/man1/chage.1.html", free: true, official: true }
  - { title: "CIS Benchmarks (free PDF download for Ubuntu and RHEL)", url: "https://www.cisecurity.org/cis-benchmarks", free: true, official: true }
---

## Why accounts matter

Most compromises start with an account: a guessed password, a leaked key, a former employee who still has access. Module 4 taught how accounts work; this module makes them **hard to abuse** and **easy to audit**.

## Password quality

Install the quality checker and set rules:

```bash
sudo apt install libpam-pwquality
sudoedit /etc/security/pwquality.conf
```

```text
minlen = 12
dcredit = -1
ucredit = -1
lcredit = -1
ocredit = -1
dictcheck = 1
enforce_for_root
```

That requires at least 12 characters with at least one digit, upper-case, lower-case and other character, rejects dictionary words, and applies to root too. Modern guidance (for example NIST SP 800-63B) favours **long passphrases** and checking against breached-password lists over complex rules and frequent forced changes; follow your organisation's policy.

## Password ageing

```bash
sudo chage -l aina
sudo chage -M 365 -m 1 -W 14 aina
sudo chage -d 0 aina          # must change at next login
sudo chage -E 2026-12-31 contractor1
```

| Option | Meaning |
|---|---|
| `-M` | maximum days before the password must change |
| `-m` | minimum days between changes |
| `-W` | warning days before expiry |
| `-E` | account expiry date |
| `-I` | days of inactivity after expiry before locking |

Defaults for **new** accounts are in `/etc/login.defs` (`PASS_MAX_DAYS`, `PASS_MIN_DAYS`, `PASS_WARN_AGE`).

## Account audit

```bash
awk -F: '$3 == 0 {print $1}' /etc/passwd                 # must print only root
sudo awk -F: '$2 == "" {print $1}' /etc/shadow            # accounts with empty passwords: should print nothing
awk -F: '$3 >= 1000 && $3 < 65534 {print $1, $7}' /etc/passwd   # human accounts and their shells
getent group sudo adm                                     # who has admin or log access
sudo lastlog -b 90 | grep -v "Never"                      # accounts not used for 90+ days (that have logged in before)
```

For each account, ask: is the person still here, do they still need it, do they need this level of access? Disable rather than delete when unsure (Module 4), and check for SSH keys in their `~/.ssh/authorized_keys`, which work even when the password is locked.

## Login history

```bash
last -n 10
sudo lastb -n 10
journalctl -u ssh --since "24 hours ago" -g "Accepted|Failed" --no-pager | tail
who
```

```text
student  pts/0        192.168.56.1     Sat Oct 18 09:41   still logged in
reboot   system boot  7.0.0-15-generic Sat Oct 18 09:12   still running
...
admin    ssh:notty    192.168.56.1     Sat Oct 18 10:52 - 10:52  (00:00)
```

`last` reads successful logins from `/var/log/wtmp` (on newer releases some distributions are moving to `wtmpdb`); `lastb` reads failed attempts from `/var/log/btmp`. Look for logins at unusual times, from unknown addresses, or to accounts that should not log in.

## Lockout after failed attempts

PAM's `pam_faillock` module can lock an account after repeated failures (configured in `/etc/security/faillock.conf` and the PAM stack; on RHEL with `authselect enable-feature with-faillock`). On SSH-facing servers, **key-only authentication** (next lesson) and rate limiting (ufw `limit`, fail2ban) are usually more effective than locking accounts, which an attacker could otherwise use to lock out legitimate users.

## Guided lab

1. Install `libpam-pwquality`, set `minlen = 12`, and try to set a short password for a test user (`sudo passwd farid`): read the rejection.
2. Set ageing on `aina` (max 365, warning 14) and show it with `chage -l`.
3. Run the five audit commands and record the results. Is anyone except root UID 0? Any empty passwords?
4. From your laptop, fail an SSH login twice as a non-existent user, then find it with `sudo lastb` and in the journal.
5. List the members of `sudo` and `adm`, and justify each membership in your lab log.

## Independent exercises

1. Write a script `audit-accounts.sh` that prints the audit results above with headings, suitable to attach to a monthly review ticket.
2. Explain why an attacker who adds a second UID 0 account gains full control even with a harmless-looking name.
3. Find in a CIS Benchmark for Ubuntu (free registration) two recommendations about password policy and compare them with your settings.
