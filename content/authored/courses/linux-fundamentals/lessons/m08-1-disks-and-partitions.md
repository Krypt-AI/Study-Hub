---
id: linux-fundamentals.m08.l1
title: Disks and partitions
summary: Identify disks and partitions, understand GPT, and partition a new disk safely.
objectives:
  - Identify block devices with `lsblk`, `blkid` and `/dev` names
  - Explain partitions and the GPT partition table
  - Partition a new disk with `fdisk` or `parted` without touching the system disk
estimatedMinutes: 50
topics: [linux.m08]
resources:
  - { title: "Ubuntu Server: Storage", url: "https://documentation.ubuntu.com/server/how-to/storage/", free: true, official: true }
  - { title: "man 8 lsblk", url: "https://manpages.ubuntu.com/manpages/noble/man8/lsblk.8.html", free: true, official: true }
  - { title: "GNU parted manual", url: "https://www.gnu.org/software/parted/manual/", free: true, official: true }
  - { title: "man 8 fdisk", url: "https://manpages.ubuntu.com/manpages/noble/man8/fdisk.8.html", free: true, official: true }
---

## Preparation: add a second disk

Shut down `lab01`, take a snapshot (`m08-before-storage`), and add a **new 8 GB virtual disk** to the VM (VirtualBox: Settings → Storage → controller → Add hard disk). Start the VM. Every lab in this module uses only that new disk.

## Block devices

Disks appear as files in `/dev`:

| Name | Device |
|---|---|
| `/dev/sda`, `/dev/sdb` | SATA, SAS, USB and most virtual disks (first, second, ...) |
| `/dev/sda1`, `/dev/sda2` | partitions on `/dev/sda` |
| `/dev/nvme0n1`, `/dev/nvme0n1p1` | NVMe disk and its first partition |
| `/dev/vda` | virtio disks on KVM and many clouds |
| `/dev/mapper/...`, `/dev/dm-0` | LVM logical volumes and other device-mapper devices |

```bash
lsblk
lsblk -f
```

```text
NAME                      MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
sda                         8:0    0   25G  0 disk
├─sda1                      8:1    0    1M  0 part
├─sda2                      8:2    0    2G  0 part /boot
└─sda3                      8:3    0   23G  0 part
  └─ubuntu--vg-ubuntu--lv 252:0    0 11.5G  0 lvm  /
sdb                         8:16   0    8G  0 disk
sr0                        11:0    1 1024M  0 rom
```

`sdb` with no partitions and no mount point is your new disk. **Check this every time before you run a partitioning or formatting command**: names can change between boots and between machines, and a command on the wrong disk destroys data.

`lsblk -f` adds filesystem type, label and **UUID**; `sudo blkid` shows the same details per device.

## Partitions and partition tables

A disk is divided into **partitions**, listed in a **partition table** at its start:

| | MBR (msdos) | GPT |
|---|---|---|
| Maximum disk size | 2 TiB | effectively unlimited |
| Partitions | 4 primary (or extended + logical) | 128 by default |
| Robustness | one copy | backup copy at the end of the disk, checksums |
| Used with | old BIOS systems | UEFI systems, all new installations |

Use **GPT** for new disks. Partition types (GUIDs) mark what a partition is for: Linux filesystem, Linux LVM, Linux swap, EFI system.

## Partitioning with `fdisk`

`fdisk` is interactive and changes nothing until you type `w`:

```bash
sudo fdisk /dev/sdb
```

```text
Command (m for help): g
Created a new GPT disklabel (GUID: 6C9D...).

Command (m for help): n
Partition number (1-128, default 1): 1
First sector (2048-16777182, default 2048):
Last sector, +/-sectors or +/-size{K,M,G,T,P} (2048-16777182, default 16775167): +2G

Created a new partition 1 of type 'Linux filesystem' and of size 2 GiB.

Command (m for help): n
Partition number (2-128, default 2):
First sector (4196352-16777182, default 4196352):
Last sector, +/-sectors or +/-size{K,M,G,T,P} (4196352-16777182, default 16775167):

Created a new partition 2 of type 'Linux filesystem' and of size 6 GiB.

Command (m for help): t
Partition number (1,2, default 2): 2
Partition type or alias (type L to list all): lvm

Changed type of partition 'Linux filesystem' to 'Linux LVM'.

Command (m for help): p
...
Device       Start      End  Sectors Size Type
/dev/sdb1     2048  4196351  4194304   2G Linux filesystem
/dev/sdb2  4196352 16775167 12578816   6G Linux LVM

Command (m for help): w
The partition table has been altered.
Syncing disks.
```

| Key | Action |
|---|---|
| `g` | new empty GPT table |
| `n` | new partition |
| `t` | change type |
| `p` | print the table |
| `d` | delete a partition |
| `w` / `q` | write and quit / quit **without** saving |

### The same with `parted` (scriptable)

```bash
sudo parted /dev/sdb --script mklabel gpt mkpart data ext4 1MiB 2GiB mkpart pv 2GiB 100% set 2 lvm on
sudo parted /dev/sdb print
```

`gdisk` is a GPT-only alternative with the same style as `fdisk`. RHCSA also expects you to **add partitions non-destructively**, which means adding new ones in free space without touching existing ones.

After partitioning, `lsblk` should show `sdb1` and `sdb2`. If the kernel has not noticed a change on a disk that is in use, `sudo partprobe /dev/sdb` asks it to reread the table.

## Guided lab

1. Add the 8 GB disk and identify it with `lsblk`. Record its name and size.
2. Run `sudo blkid` and `lsblk -f` and note which devices have UUIDs (only those with filesystems or LVM).
3. With `fdisk`, create a GPT table, a 2 GB Linux filesystem partition and a second partition of type Linux LVM using the rest. Print and write.
4. Confirm with `lsblk /dev/sdb` and `sudo fdisk -l /dev/sdb`.
5. Practise safety: open `sudo fdisk /dev/sdb` again, delete a partition with `d`, print, then quit with `q` and confirm with `lsblk` that nothing changed.

## Independent exercises

1. Explain why `/dev/sdb` might be called `/dev/sdc` after adding another disk, and how UUIDs (next lesson) solve that for mounting.
2. List the partition type aliases `fdisk` accepts (`t` then `L`) and find the ones for swap and EFI.
3. Write down the three checks you will always do before running a destructive disk command.
