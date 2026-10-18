---
id: linux-fundamentals.m08.l5
title: "Practical assessment: storage for the office file share"
summary: Provide persistent, expandable storage for the shared folders, prove it survives a reboot, and handle a "disk full" call.
objectives:
  - Provision LVM storage, filesystems and persistent mounts to a specification
  - Grow storage online and investigate disk usage
estimatedMinutes: 75
topics: [linux.m08]
---

## Specification

Kedai Kira's shared folders (Module 4) must move to dedicated storage:

1. A logical volume `lv_share` of 1 GiB in `vg_data` (create the VG first if you skipped the lesson), formatted **ext4**, mounted at `/srv/kira`, persistent across reboots by **UUID**.
2. Existing contents of `/srv/kira` (accounts and sales folders, with their groups, setgid bits and ACLs) preserved: copy them with `cp -a` (or `rsync -aAX`, Module 12) to the new volume before mounting it in place.
3. Prove the mount works after a reboot.

## Then the call comes

> "Users can't save files in the accounts folder: 'disk full'."

Simulate it: `sudo fallocate -l 900M /srv/kira/accounts/scan-archive.bin`.

1. Show how you confirmed the cause (`df`, `du`).
2. Grow `lv_share` by 512 MiB online and show the new free space.
3. Note what you would recommend to the office (quota, archive policy, monitoring).

## Marking

Report your commands and evidence, then compare with the model answer.
