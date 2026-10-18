---
id: linux-fundamentals.m12.l3
title: Verifying backups, restoring and recovery procedures
summary: Prove that backups work with checksums and test restores, restore files and services, and write a recovery procedure.
objectives:
  - Verify archives and copies with checksums and test extractions
  - Restore single files, directories and configuration safely
  - Rebuild a service on a fresh system from backups
  - Write and test a recovery procedure
estimatedMinutes: 55
topics: [linux.m12]
resources:
  - { title: "GNU Coreutils: sha2 utilities (sha256sum)", url: "https://www.gnu.org/software/coreutils/manual/html_node/sha2-utilities.html", free: true, official: true }
  - { title: "GNU tar manual: verifying archives", url: "https://www.gnu.org/software/tar/manual/html_node/verify.html", free: true, official: true }
  - { title: "Ubuntu Server: Backups", url: "https://documentation.ubuntu.com/server/how-to/backups/", free: true, official: true }
---

## A backup you have not restored is a hope, not a backup

Backups fail silently: a full disk, a changed path, a permission error in a cron job nobody reads, an archive that is truncated. **Verification** catches that before you need the backup.

### Levels of verification

| Level | How | Proves |
|---|---|---|
| 1. The job ran | exit code, log, file exists with a recent date and a plausible size | something was written |
| 2. The archive is readable | `tar -tzf` / `zstd -t` / `gzip -t` without errors | it is not corrupted |
| 3. Integrity over time | checksums recorded at backup time, rechecked later and after copying off-site | the copy is identical |
| 4. **Test restore** | extract to a scratch location and compare, or restore a service on a test VM | you can actually recover |

```bash
cd /srv/backup
sha256sum etc-2026-10-18.tar.gz kira-2026-10-18.tar.zst > SHA256SUMS
sha256sum -c SHA256SUMS
gzip -t etc-2026-10-18.tar.gz && echo "gzip OK"
zstd -t kira-2026-10-18.tar.zst
```

```text
etc-2026-10-18.tar.gz: OK
kira-2026-10-18.tar.zst: OK
gzip OK
kira-2026-10-18.tar.zst: 189173760 bytes
```

Compare a restored tree with the source:

```bash
sudo mkdir -p /tmp/restore-test
sudo tar --acls --xattrs -xpf <(zstd -dc kira-2026-10-18.tar.zst) -C /tmp/restore-test
sudo diff -r /srv/kira /tmp/restore-test/srv/kira && echo "identical"
```

## Restoring

### A single file

A user overwrote `accounts/ledger.txt` this morning:

1. Find the right version: list candidates (`ls /srv/backup/snapshots/*/accounts/ledger.txt` or `tar -tf ... | grep ledger`) and confirm the date with the user.
2. Restore to a **temporary** location first: `sudo cp -a /srv/backup/snapshots/2026-10-17/accounts/ledger.txt /tmp/`.
3. Let the user check it, then put it in place **without overwriting the current file blindly**: `sudo cp -a /tmp/ledger.txt /srv/kira/accounts/ledger.restored-2026-10-17.txt`.
4. Check ownership, group and ACL (`ls -l`, `getfacl`). Record the restore in the ticket.

### Configuration

Restore `/etc` files selectively: extract to `/tmp/restore`, `diff` against the live file, then copy back only what is needed. Never extract an old `/etc` archive over a running system's `/etc`: package versions and UUIDs may have changed since.

### A whole service onto a new server

When a server is lost, you rebuild rather than "restore the OS":

1. Install the same Ubuntu LTS release, update it, and set the hostname and network.
2. Reinstall packages from the saved list: `sudo apt install $(grep -v deinstall packages.txt | awk '{print $1}')` (or reinstall the documented package set).
3. Restore configuration for those packages from the `/etc` backup (selectively), users and groups (or recreate them), and service units.
4. Restore data (with ACLs and ownership), then start services and **verify from the user's side**.
5. Record how long it took: that is your real RTO.

## Recovery procedures

Write the recovery steps **before** you need them, as a numbered runbook (Module 13): where backups are, who has access, exact commands, how to verify, who to tell. Test the runbook regularly (for example quarterly) on a spare VM and update it whenever something does not match reality. A procedure that only lives in one person's head fails when that person is on leave.

## Guided lab

1. Create `SHA256SUMS` for your backups and verify them. Then corrupt a **copy** (`cp x.tar.gz y.tar.gz; printf 'junk' | dd of=y.tar.gz bs=1 seek=100 conv=notrunc`) and watch `gzip -t` and `sha256sum -c` catch it.
2. Do a test restore of the kira archive into `/tmp/restore-test` and compare with `diff -r`; check ACLs with `getfacl`.
3. Restore one file from yesterday's rsync snapshot following the four steps, as if for a user.
4. Simulate losing nginx's configuration (`sudo mv /etc/nginx /etc/nginx.lost`), restore it from your `/etc` archive, test with `nginx -t`, reload, and verify in the browser. Time yourself.

## Independent exercises

1. Write a recovery runbook for "the Kedai Kira share was deleted": numbered steps, commands, verification, communication.
2. Explain why the time you measured in step 4 matters to the business.
3. Add a verification step to your backup script: it should test the archive and write its checksum, and exit non-zero if either fails.
