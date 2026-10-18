---
id: linux-fundamentals.m12.l1
title: Backup strategy, tar and compression
summary: Decide what to back up, how often and where, then create, list and extract archives with tar and the common compressors.
objectives:
  - Explain RPO, RTO, the 3-2-1 rule and full, incremental and differential backups
  - Decide what to back up on a Linux server (and what not)
  - Create, list and extract tar archives with gzip, xz and zstd compression
  - Preserve permissions, ownership and ACLs in archives
estimatedMinutes: 50
topics: [linux.m12]
resources:
  - { title: "GNU tar manual", url: "https://www.gnu.org/software/tar/manual/", free: true, official: true }
  - { title: "Ubuntu Server: Backups", url: "https://documentation.ubuntu.com/server/how-to/backups/", free: true, official: true }
  - { title: "zstd (Zstandard)", url: "https://facebook.github.io/zstd/", free: true, official: true }
---

## Why and how much

A backup exists to **restore**. Two numbers, agreed with the business, drive every decision:

- **RPO** (recovery point objective): how much data you can afford to lose. Daily backups mean up to a day of work lost.
- **RTO** (recovery time objective): how long the service may be down while you restore.

The **3-2-1 rule**: at least **3** copies of the data, on **2** different kinds of storage, with **1** copy off-site (and ideally one offline or immutable, so ransomware or a mistaken `rm` cannot reach it).

| Type | Contains | Restore needs |
|---|---|---|
| **Full** | everything | the one backup |
| **Incremental** | changes since the last backup of any kind | the full plus every incremental since |
| **Differential** | changes since the last full | the full plus the latest differential |

RAID, snapshots and replicas protect against hardware failure, **not** against deletion, corruption or ransomware, which they faithfully copy.

## What to back up on a server

| Back up | Examples |
|---|---|
| data | `/srv`, `/home`, `/var/www`, application data |
| configuration | `/etc` (whole), crontabs (`/var/spool/cron`), custom units in `/etc/systemd/system` |
| databases | a **dump** made by the database tool (`pg_dump`, `mysqldump`), not the live data files |
| the list of installed packages | `dpkg --get-selections > packages.txt` (or `apt-mark showmanual`) |
| scripts and documentation | `/usr/local/bin`, runbooks |

Usually **not**: `/proc`, `/sys`, `/dev`, `/run`, `/tmp`, caches, and the OS itself (reinstall it and restore configuration and data). Secrets in backups (keys, `/etc/shadow`) mean backups must be protected as carefully as the server.

## tar

`tar` bundles files into one archive, keeping paths, permissions, owners and times.

| Mode | Option |
|---|---|
| create | `-c` |
| list | `-t` |
| extract | `-x` |
| file name | `-f archive` |
| verbose | `-v` |
| compression | `-z` gzip, `-J` xz, `--zstd` zstd (or `-a` to choose from the file extension) |
| change directory first | `-C dir` |

```bash
sudo tar -czf /srv/backup/etc-$(date +%F).tar.gz /etc
sudo tar -tzf /srv/backup/etc-2026-10-18.tar.gz | head -3
sudo tar -xzf /srv/backup/etc-2026-10-18.tar.gz -C /tmp/restore etc/hosts
```

```text
tar: Removing leading `/' from member names
etc/
etc/hostname
etc/hosts
```

- tar strips the leading `/`, so extraction lands **relative to the current directory** (or `-C`), never over your live files by accident. That is a safety feature; restore into a scratch directory first, then copy what you need.
- Extract a single file by naming its path inside the archive (`etc/hosts`).
- As root, tar restores owners and permissions. Add `--acls --xattrs` (and `--selinux` on RHEL) to keep ACLs and extended attributes: the Module 4 share relies on them.

```bash
sudo tar --acls --xattrs -cpf - /srv/kira | zstd -T0 > /srv/backup/kira-$(date +%F).tar.zst
```

### Compression compared

| Tool | Extension | Speed | Size |
|---|---|---|---|
| gzip | `.gz` | fast | good, universal |
| bzip2 | `.bz2` | slow | better |
| xz | `.xz` | slowest | smallest |
| zstd | `.zst` | very fast | as good as gzip or better; modern default |

Compress text (configuration, logs, dumps); already-compressed data (photos, videos, `.zip`) barely shrinks.

## Guided lab

1. Mount check: is `/srv/backup` (LV from Module 8) mounted? If not, create the directory.
2. Back up `/etc` with gzip, and `/srv/kira` with ACLs and zstd (`sudo apt install zstd` if the command is missing). Compare sizes with `ls -lh`.
3. List the contents of both archives without extracting.
4. Restore only `etc/hosts` into `/tmp/restore` and compare with `diff /etc/hosts /tmp/restore/etc/hosts`.
5. Save the package list: `dpkg --get-selections > /srv/backup/packages-$(date +%F).txt`.
6. Extract the kira archive into `/tmp/restore` and check with `getfacl` that mei's ACL survived.

## Independent exercises

1. For Kedai Kira (accounts data changes all day; the owners say losing more than one working day would be serious, and the server must be back within 4 hours), propose an RPO, RTO and a backup schedule.
2. Explain why a nightly copy to a USB disk that stays plugged into the server does not satisfy 3-2-1.
3. Time `tar` with gzip, xz and zstd on `/usr/share/doc` (`time tar ...`) and compare sizes.
