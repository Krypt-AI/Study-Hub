---
id: linux-fundamentals.m08.l4
title: Introduction to LVM
summary: Understand physical volumes, volume groups and logical volumes, and create and grow a logical volume.
objectives:
  - Explain PV, VG and LV and why LVM makes storage flexible
  - Create a PV, a VG and an LV, format and mount it
  - Extend a logical volume and its filesystem online
  - Recognise Ubuntu's default LVM layout and its unused space
estimatedMinutes: 55
topics: [linux.m08]
resources:
  - { title: "man 8 lvm", url: "https://manpages.ubuntu.com/manpages/noble/man8/lvm.8.html", free: true, official: true }
  - { title: "RHEL 10: Configuring and managing logical volumes", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/configuring_and_managing_logical_volumes/", free: true, official: true }
  - { title: "Ubuntu Server: LVM", url: "https://documentation.ubuntu.com/server/how-to/storage/manage-logical-volumes/", free: true, official: true }
---

## Why LVM

Partitions are fixed. If `/srv` fills up, growing its partition is awkward, especially across disks. The **Logical Volume Manager** adds a flexible layer:

```text
  disks / partitions       /dev/sdb2        /dev/sdc
                               │                │
  physical volumes (PV)        PV               PV
                               └──────┬─────────┘
  volume group (VG)                 vg_data   (a pool of space)
                               ┌──────┴─────────┐
  logical volumes (LV)       lv_web          lv_backup
                               │                │
  filesystems               ext4 /srv/web    xfs /srv/backup
```

- A **PV** is a disk or partition prepared for LVM.
- A **VG** pools the space of one or more PVs, in fixed-size **extents** (4 MiB by default).
- An **LV** is carved from a VG and used like a partition: format it and mount it.

You can grow an LV while it is mounted, add a new disk to a VG when it runs out, and take LVM snapshots. Ubuntu Server and RHEL install onto LVM by default.

## Ubuntu's default layout

```bash
sudo vgs
sudo lvs
```

```text
  VG        #PV #LV #SN Attr   VSize   VFree
  ubuntu-vg   1   1   0 wz--n- <23.00g 11.50g
  LV        VG        Attr       LSize  Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  ubuntu-lv ubuntu-vg -wi-ao---- 11.50g
```

The installer gave the root LV only part of the VG (up to 100 GB, about half here), leaving **free space** for later growth. A full `/` on a fresh Ubuntu VM is often solved by extending `ubuntu-lv` into that free space.

## Building LVM on the lab disk

Use `/dev/sdb2` (type Linux LVM, from Lesson 1).

```bash
sudo pvcreate /dev/sdb2
sudo vgcreate vg_data /dev/sdb2
sudo lvcreate -n lv_web -L 1G vg_data
sudo mkfs.ext4 /dev/vg_data/lv_web
sudo mkdir -p /srv/web
sudo mount /dev/vg_data/lv_web /srv/web
sudo pvs; sudo vgs; sudo lvs
```

```text
  Physical volume "/dev/sdb2" successfully created.
  Volume group "vg_data" successfully created
  Logical volume "lv_web" created.
...
  PV         VG      Fmt  Attr PSize  PFree
  /dev/sdb2  vg_data lvm2 a--  <6.00g <5.00g
  VG      #PV #LV #SN Attr   VSize  VFree
  vg_data   1   1   0 wz--n- <6.00g <5.00g
  LV     VG      Attr       LSize Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  lv_web vg_data -wi-ao---- 1.00g
```

The LV is reachable as `/dev/vg_data/lv_web` and `/dev/mapper/vg_data-lv_web`. Add it to `/etc/fstab` by UUID (or by the stable `/dev/mapper/...` path), and test with `mount -a`, as in Lesson 2.

## Growing a logical volume

```bash
sudo lvextend -r -L +500M /dev/vg_data/lv_web
df -h /srv/web
```

`-r` (`--resizefs`) grows the filesystem in the same step: it runs `resize2fs` for ext4 or `xfs_growfs` for XFS, online. Without `-r`, you must grow the filesystem yourself afterwards; forgetting this is a common mistake (the LV is bigger, `df` is not).

Other forms: `-L 2G` (to exactly 2 GiB), `-l +100%FREE` (all free space in the VG).

When the VG itself is full, add a disk: `pvcreate /dev/sdc`, then `vgextend vg_data /dev/sdc`.

**Shrinking** is risky (ext4 only, unmounted, filesystem first) and XFS cannot shrink: plan sizes conservatively and grow later.

## Summary of commands

| Layer | Create | Show | Grow |
|---|---|---|---|
| PV | `pvcreate` | `pvs`, `pvdisplay` | (add disks) |
| VG | `vgcreate` | `vgs`, `vgdisplay` | `vgextend` |
| LV | `lvcreate` | `lvs`, `lvdisplay` | `lvextend -r` |

## Guided lab

1. Inspect your system's LVM with `sudo pvs`, `vgs`, `lvs`, and `lsblk`. How much free space does `ubuntu-vg` have?
2. Create PV, VG `vg_data` and LV `lv_web` (1 GiB) on `/dev/sdb2`; format ext4 and mount at `/srv/web`.
3. Add it to fstab by UUID and test with `findmnt --verify` and `mount -a`.
4. Copy some files in, then extend the LV by 500 MiB with `-r` while it is mounted, and confirm with `df -h` that the files are intact.
5. Create a second LV `lv_backup` of 500 MiB with XFS (`sudo apt install xfsprogs` if needed), mount it at `/srv/backup` (used in Module 12).

## Independent exercises

1. Explain to a colleague, using the three-layer diagram, why LVM makes adding storage to a running server easier.
2. What happens if you run `lvextend` without `-r` on an ext4 volume, and how do you fix it?
3. On your VM (after a snapshot), extend `ubuntu-lv` by 2 GiB and grow `/` online. Record the before and after `df -h /`.
