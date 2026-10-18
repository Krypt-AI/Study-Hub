---
id: linux-fundamentals.m05.l1
title: APT and repositories
summary: Install, remove, search and inspect software with APT, and understand where packages come from and why it matters.
objectives:
  - Explain packages, repositories, dependencies and package signing
  - Use `apt update`, `install`, `remove`, `purge`, `search`, `show` and `autoremove`
  - Read Ubuntu's repository configuration in deb822 format and name the components
  - Judge whether a third-party repository is trustworthy
estimatedMinutes: 55
topics: [linux.m05]
resources:
  - { title: "Ubuntu Server: Package management", url: "https://documentation.ubuntu.com/server/how-to/software/package-management/", free: true, official: true }
  - { title: "Debian: APT user's guide", url: "https://www.debian.org/doc/manuals/apt-guide/", free: true, official: true }
  - { title: "man 5 sources.list (deb822 format)", url: "https://manpages.ubuntu.com/manpages/noble/man5/sources.list.5.html", free: true, official: true }
---

## Packages and repositories

A **package** is an archive containing a program's files, plus metadata: its version, a description, the scripts to run on install, and its **dependencies** (other packages it needs). Packages come from **repositories**: servers that publish thousands of packages and an index of them, **signed** with the distribution's key so your system can check nothing was tampered with.

Installing software from the distribution's repositories, rather than downloading programs from websites, gives you:

- automatic dependency resolution;
- security updates for everything with one command;
- clean removal;
- a record of what is installed.

## The APT workflow

```bash
sudo apt update
apt search nginx | head
apt show nginx
sudo apt install nginx
systemctl status nginx --no-pager
```

`apt update` downloads the latest **index** of each repository; it installs nothing. Run it before installing or upgrading.

```text
nginx/resolute 1.28.0-2ubuntu1 amd64
  small, powerful, scalable web/proxy server
...
Package: nginx
Version: 1.28.0-2ubuntu1
Priority: optional
Section: web
Origin: Ubuntu
Depends: nginx-common (= 1.28.0-2ubuntu1), libc6 (>= 2.38), libssl3t64 (>= 3.0.0), ...
...
Installing:
  nginx

Installing dependencies:
  nginx-common

Summary:
  Upgrading: 0, Installing: 2, Removing: 0, Not Upgrading: 0
  Download size: 640 kB
  Space needed: 1,750 kB / 18.2 GB available

Continue? [Y/n]
```

(Versions here are examples: yours will differ.) APT lists what it will install, including dependencies, and asks before changing anything. Add `-y` to answer yes automatically in scripts, but read the plan when working by hand.

| Command | Effect |
|---|---|
| `sudo apt install pkg` | install (or upgrade just that package) |
| `sudo apt install ./file.deb` | install a local `.deb`, resolving its dependencies |
| `sudo apt remove pkg` | remove the program, **keep** its configuration files |
| `sudo apt purge pkg` | remove the program **and** its configuration |
| `sudo apt autoremove` | remove dependencies nothing needs any more |
| `apt list --installed` | everything installed |
| `apt list --upgradable` | updates waiting |
| `apt policy pkg` | installed and candidate versions, and which repository each comes from |

`apt` is the interactive command; scripts traditionally use `apt-get` and `apt-cache`, whose output format stays stable.

## Repository configuration

Ubuntu 24.04 and later describe repositories in **deb822** format, in `/etc/apt/sources.list.d/ubuntu.sources`:

```bash
cat /etc/apt/sources.list.d/ubuntu.sources
```

```text
Types: deb
URIs: http://archive.ubuntu.com/ubuntu/
Suites: resolute resolute-updates resolute-backports
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg

Types: deb
URIs: http://security.ubuntu.com/ubuntu/
Suites: resolute-security
Components: main restricted universe multiverse
Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg
```

| Part | Meaning |
|---|---|
| Suites | the release (`resolute` is 26.04), plus `-updates` (bug fixes), `-security` (security fixes) and `-backports` (newer versions, opt-in) |
| `main` | free software supported by Canonical |
| `restricted` | supported proprietary drivers |
| `universe` | community-maintained free software |
| `multiverse` | software with licence restrictions |
| Signed-By | the key that must have signed this repository's index |

Older systems use one-line entries in `/etc/apt/sources.list`; both formats work.

## Third-party repositories

Vendors such as Docker, PostgreSQL and Microsoft publish their own repositories. Adding one means trusting that vendor with **root** on your server, because package scripts run as root. Before adding one:

1. Use the vendor's **official** documentation, not a blog post.
2. Store its key in `/etc/apt/keyrings/` and reference it with `Signed-By` so it is trusted for that repository only. (The old `apt-key` command is deprecated.)
3. Prefer Ubuntu's own package when its version is good enough.
4. Record the change (Module 13): someone will have to maintain it.

PPAs (Personal Package Archives, `add-apt-repository ppa:...`) are third-party repositories too.

## Snaps, briefly

Ubuntu also ships **snap** packages (`snap list`, `snap install`), which bundle their own dependencies and update automatically. Some server tools (LXD, for example) are delivered as snaps. This course uses APT packages; know that `snap` exists and that snaps are managed separately.

## Guided lab

1. Run `sudo apt update` and read the summary line (how many packages can be upgraded).
2. Inspect before installing: `apt show tree` and `apt policy tree`.
3. Install `tree` and `htop`. Run `tree -L 1 /etc | head`.
4. Install `nginx`, check `systemctl status nginx`, and open `http://192.168.56.101` from your laptop's browser (you should see "Welcome to nginx!").
5. `sudo apt remove nginx`, then `ls /etc/nginx` (configuration still there), then `sudo apt purge nginx` and `ls /etc/nginx` again. Finish with `sudo apt autoremove`.
6. Reinstall nginx: Module 7 uses it.

## Independent exercises

1. Use `apt-cache depends curl` and `apt-cache rdepends --installed libcurl4t64` (the library name may differ on your release) to see what curl needs and what needs it.
2. Find which repository suite would deliver a security fix for OpenSSH: `apt policy openssh-server`.
3. Write three questions you would ask before adding a third-party repository to a production server.
