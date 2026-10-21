---
id: sec-01-it-fundamentals.l03
title: Files, users and permissions
summary: Filesystems and paths, users and groups, Linux rwx/octal permissions and Windows ACLs, privilege and least privilege, and why permissions are the first access control.
objectives:
  - Read and set Linux permissions in symbolic and octal form
  - Explain users, groups and administrative privilege on both platforms
  - Apply least privilege to accounts and files
estimatedMinutes: 55
topics: [sec01.files]
resources:
  - { title: "GNU coreutils: chmod", url: "https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html", free: true, official: true }
  - { title: "Microsoft: access control lists", url: "https://learn.microsoft.com/en-us/windows/win32/secauthz/access-control-lists", free: true, official: true }
  - { title: "NIST SP 800-179 (secure configuration)", url: "https://csrc.nist.gov/pubs/sp/800/179/r1/ipd", free: true, official: true }
---

## Filesystems and paths

A **filesystem** organises storage into files and directories in a tree. Linux has one tree rooted at `/`
(`/home/aina/report.txt`); Windows has a tree per drive (`C:\Users\Aina\report.txt`). Knowing where things live —
user data, configuration, logs, executables — is basic situational awareness for both defence and investigation.

## Users and groups

Each person or service gets a **user account**; accounts are collected into **groups** to grant shared access. Two
account types matter for security:

- **Standard users** can do ordinary work but not change the whole system.
- **Administrative** accounts (root on Linux, Administrator on Windows) can do anything.

Good practice is to log in as a standard user and **elevate only when needed** — `sudo` on Linux, UAC on Windows.
Services should run under their own **low-privilege** service accounts, never as root, so a compromised service does
not hand over the whole machine.

## Linux permissions

Every file has an **owner**, a **group**, and three permission sets — owner, group, others — each with **read (r)**,
**write (w)** and **execute (x)**:

```text
-rwxr-x---  1 aina devs  4096 report.sh
 │└┬┘└┬┘└┬┘
 │ │  │  └ others: no access
 │ │  └─── group (devs): read + execute
 │ └────── owner (aina): read + write + execute
 └──────── file type ( - = file, d = directory)
```

As **octal**, r=4, w=2, x=1, summed per set: `rwx`=7, `r-x`=5, `---`=0, so the file above is `750`. Common values:
`644` (owner read/write, others read) for data, `755` for programs and directories, `600` for private files like keys.

```bash
chmod 600 id_ed25519        # private key: owner only
chmod 755 deploy.sh         # executable others may run
chown aina:devs report.txt  # change owner and group
```

On a directory, `x` means "may enter it". **SSH refuses to use a private key that others can read** — a direct example
of permissions as security.

## Windows ACLs

Windows uses **access control lists**: each file carries a list of entries granting or denying specific rights to
specific users/groups (Read, Write, Modify, Full Control). It is more granular than Linux's three-set model; the
`icacls` command and the Security tab manage it.

## Permissions are the first access control

Permissions decide who can read, change or run what, and are the OS's front-line enforcement of **confidentiality**
and **integrity**. **Least privilege** — give each account and process only the access it needs — limits the blast
radius when something is compromised, and underlies every hardening standard you will meet later.
