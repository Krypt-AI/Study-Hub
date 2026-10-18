---
id: linux-fundamentals.m08.l2
title: Filesystems, mounting and /etc/fstab
summary: Create filesystems, mount and unmount them, and make mounts permanent with UUIDs in /etc/fstab, safely.
objectives:
  - Choose between ext4, XFS and VFAT and create them with `mkfs`
  - Mount and unmount filesystems and inspect mounts with `findmnt`
  - Write a correct `/etc/fstab` line using a UUID, and test it before rebooting
  - Fix "target is busy" and recover from a bad fstab entry
estimatedMinutes: 55
topics: [linux.m08]
resources:
  - { title: "man 5 fstab", url: "https://manpages.ubuntu.com/manpages/noble/man5/fstab.5.html", free: true, official: true }
  - { title: "man 8 mount", url: "https://manpages.ubuntu.com/manpages/noble/man8/mount.8.html", free: true, official: true }
  - { title: "ext4 documentation (kernel)", url: "https://docs.kernel.org/filesystems/ext4/index.html", free: true, official: true }
  - { title: "XFS documentation (kernel)", url: "https://docs.kernel.org/filesystems/xfs/index.html", free: true, official: true }
---

## Filesystems

A partition is just space; a **filesystem** organises it into files, directories, permissions and free-space records.

| Filesystem | Strengths | Notes |
|---|---|---|
| **ext4** | mature, Ubuntu's default, can grow and **shrink** (offline) | `mkfs.ext4`, `resize2fs`, `e2fsck` |
| **XFS** | large files and filesystems, parallel I/O; RHEL's default | can grow but **not shrink**; `mkfs.xfs`, `xfs_growfs`, `xfs_repair` |
| **VFAT** | readable by Windows, macOS and firmware | no Linux permissions; used for the EFI partition and USB sticks |
| Btrfs, ZFS | snapshots, checksums | beyond this course |

```bash
sudo mkfs.ext4 -L data /dev/sdb1
```

```text
mke2fs 1.47.2 (1-Jan-2025)
Creating filesystem with 524288 4k blocks and 131072 inodes
Filesystem UUID: 3f6c2d1e-8a4b-4f7e-9c2d-5b1a0e7f6d3c
Superblock backups stored on blocks:
	32768, 98304, 163840, 229376, 294912

Allocating group tables: done
Writing inode tables: done
Creating journal (16384 blocks): done
Writing superblocks and filesystem accounting information: done
```

`mkfs` **erases** the partition. `-L` sets a label. On Ubuntu, install `xfsprogs` for XFS tools (`sudo apt install xfsprogs`).

## Mounting

**Mounting** attaches a filesystem to a directory (the **mount point**) in the single tree.

```bash
sudo mkdir -p /srv/data
sudo mount /dev/sdb1 /srv/data
findmnt /srv/data
df -h /srv/data
```

```text
TARGET    SOURCE    FSTYPE OPTIONS
/srv/data /dev/sdb1 ext4   rw,relatime
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1       2.0G   24K  1.8G   1% /srv/data
```

Anything that was in `/srv/data` before is hidden (not deleted) while something is mounted on it.

```bash
sudo umount /srv/data
```

Note the spelling: `umount`. If it says **target is busy**, a process is using it (often your own shell inside the directory): `cd` out, then find others with `sudo lsof +D /srv/data` or `sudo fuser -vm /srv/data`.

Common mount options: `ro` (read-only), `noexec` (no programs run from it), `nosuid`, `nodev`, `defaults`.

## Making it permanent: `/etc/fstab`

`/etc/fstab` lists what to mount at boot. Each line has six fields:

```text
# <device>                                 <mount point> <type> <options>        <dump> <pass>
UUID=3f6c2d1e-8a4b-4f7e-9c2d-5b1a0e7f6d3c  /srv/data     ext4   defaults,nofail  0      2
```

| Field | Meaning |
|---|---|
| device | **use `UUID=` (or `LABEL=`)**, not `/dev/sdb1`, because device names can change |
| mount point | an existing directory |
| type | `ext4`, `xfs`, `vfat`, `swap`, `nfs` ... |
| options | `defaults`; add `nofail` for non-essential disks so a missing disk does not stop the boot |
| dump | `0` (legacy backup flag) |
| pass | fsck order at boot: `1` for `/`, `2` for other local filesystems, `0` to skip (XFS uses `0`) |

Get the UUID with `sudo blkid /dev/sdb1` or `lsblk -f`.

### Test before you reboot

A wrong fstab line can stop the server from booting into normal mode (Module 7 showed how to recover). Always:

```bash
sudo cp -a /etc/fstab /etc/fstab.bak
sudoedit /etc/fstab
sudo findmnt --verify
sudo systemctl daemon-reload
sudo mount -a
findmnt /srv/data
```

`findmnt --verify` checks the file for errors; `mount -a` mounts everything listed that is not mounted yet, so an error appears **now**, while you still have a working shell. systemd turns fstab lines into `.mount` units, hence the `daemon-reload`.

## Network filesystems, briefly

Servers often mount shares from a file server: **NFS** (`server:/export /mnt/share nfs defaults,_netdev 0 0`, package `nfs-common`) or **SMB/CIFS** for Windows shares. **autofs** mounts them on demand. RHCSA includes mounting NFS shares and configuring autofs; the advanced course covers both.

## Guided lab

1. Format `/dev/sdb1` (from Lesson 1) as ext4 with the label `data`. Record the UUID.
2. Create `/srv/data`, mount it, write a file into it, unmount it and see that the file "disappears"; remount it and see it again.
3. From inside `/srv/data`, try `sudo umount /srv/data` and read the error. Fix it.
4. Back up fstab, add a UUID line with `nofail`, then `findmnt --verify`, `daemon-reload`, `mount -a`.
5. Reboot and confirm with `findmnt /srv/data`.
6. Break it on purpose in a safe way: change the UUID to a wrong value, run `findmnt --verify` and `mount -a` and read the errors. Restore `fstab.bak`.

## Independent exercises

1. Explain why `nofail` is sensible for a data disk but not for `/`.
2. Mount `/srv/data` read-only and with `noexec` temporarily (`mount -o remount,ro,noexec`) and test both restrictions.
3. Format a small partition (or a file-backed loop device: `truncate -s 200M x.img; sudo mkfs.xfs x.img`) as XFS and compare `df -hT` output.
