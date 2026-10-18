---
id: linux-fundamentals.m12.l2
title: Copying and synchronising with rsync
summary: Mirror directories locally and to another server with rsync, safely, and keep dated snapshots with hard links.
objectives:
  - Use rsync's archive mode and understand the trailing-slash rule
  - Preview with `--dry-run` and use `--delete` safely
  - Back up to another host over SSH
  - Keep space-efficient dated snapshots with `--link-dest`
estimatedMinutes: 45
topics: [linux.m12]
resources:
  - { title: "rsync manual", url: "https://download.samba.org/pub/rsync/rsync.1", free: true, official: true }
  - { title: "rsync project", url: "https://rsync.samba.org/", free: true, official: true }
---

## rsync basics

`rsync` copies only what differs between source and destination, locally or over SSH, and can resume interrupted transfers.

```bash
sudo rsync -aAXv /srv/kira/ /srv/backup/kira-mirror/
```

| Option | Meaning |
|---|---|
| `-a` | archive: recursive, keep permissions, times, owners, groups, symlinks, devices |
| `-A` / `-X` | keep ACLs / extended attributes (the Module 4 share needs `-A`) |
| `-v` | list files as they are copied |
| `-h --progress` | human-readable sizes and progress |
| `-z` | compress during transfer (useful over slow networks) |
| `-n` / `--dry-run` | show what would happen; change nothing |
| `--delete` | delete files in the destination that no longer exist in the source |
| `--exclude 'cache/'` | skip matching paths |

### The trailing slash

The single most common rsync mistake:

| Command | Result |
|---|---|
| `rsync -a /srv/kira/ /backup/kira/` | the **contents** of kira go into `/backup/kira/` |
| `rsync -a /srv/kira /backup/kira/` | a directory **`kira` inside** `/backup/kira/` → `/backup/kira/kira/...` |

A trailing slash on the **source** means "the contents of". Be consistent and always check with `--dry-run`.

### `--delete` carefully

A mirror should reflect deletions, but `--delete` with the wrong paths can empty a directory. Always preview first:

```bash
sudo rsync -aAXn --delete /srv/kira/ /srv/backup/kira-mirror/
```

```text
sending incremental file list
deleting accounts/old-ledger.txt
accounts/ledger.txt
```

Lines starting with `deleting` tell you exactly what would be removed. Remember that a mirror is **not a history**: if a file is deleted or corrupted in the source, the next run copies that loss. Combine mirrors with dated copies.

## Over SSH to another server

```bash
rsync -aAXz --delete -e ssh /srv/kira/ backup@backup01:/backups/lab01/kira/
```

Use a dedicated account on the backup server with an SSH key that has no passphrase **and** restricted permissions (for example a `command=` or `restrict` option in its `authorized_keys`), so a stolen key cannot do more than deliver backups. A **pull** model, where the backup server logs in to fetch data, keeps backups out of reach of a compromised production server.

## Dated snapshots with hard links

`--link-dest` makes each day's backup look complete while storing unchanged files only once (as hard links to the previous day's copy, Module 2):

```bash
today=$(date +%F)
sudo rsync -aAX --delete --link-dest=/srv/backup/snapshots/latest /srv/kira/ /srv/backup/snapshots/$today/
sudo ln -sfn /srv/backup/snapshots/$today /srv/backup/snapshots/latest
du -sh /srv/backup/snapshots/*
```

```text
182M	/srv/backup/snapshots/2026-10-17
4.1M	/srv/backup/snapshots/2026-10-18
```

(`du` counts each hard-linked file once, under the first directory it meets.) Restoring yesterday's version of a file is just a copy from `/srv/backup/snapshots/2026-10-17/`. Tools such as **restic**, **Borg** and **Bacula** add encryption, deduplication and remote storage; organisations usually standardise on one.

## Guided lab

1. Mirror `/srv/kira/` to `/srv/backup/kira-mirror/` with `-aAXv`. Run it again and note that nothing is copied.
2. Demonstrate the trailing-slash rule into `/tmp/slash-test/` with both forms and compare with `ls -R`.
3. Delete a file in the source, preview with `-n --delete`, then run it.
4. Take three daily snapshots with `--link-dest` (change a file between runs; use dates like `2026-10-16` by hand), then compare `du -sh` and check with `ls -li` that an unchanged file has the same inode in every snapshot.
5. Restore a deleted file from an older snapshot.

## Independent exercises

1. Explain the difference between a mirror with `--delete` and a set of dated snapshots, and why you want both.
2. Write the rsync command a backup server `backup01` would run to **pull** `/srv/kira` from lab01.
3. Read about `--backup --backup-dir` in the rsync manual and explain how it keeps overwritten files.
