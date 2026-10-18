---
id: linux-fundamentals.m04.l5
title: "Practical assessment: accounts and access for a small office"
summary: Create users, groups, shared folders, an ACL and a limited sudo rule to an access specification, and prove it works.
objectives:
  - Implement an access specification with users, groups, modes, setgid, ACLs and sudoers
  - Test access as each user and document the evidence
estimatedMinutes: 90
topics: [linux.m04]
---

## The access specification

Kedai Kira Sdn Bhd has four staff:

| User | Role | Needs |
|---|---|---|
| `aina` | accounts | read and write `/srv/kira/accounts` |
| `farid` | accounts | read and write `/srv/kira/accounts` |
| `mei` | sales | read and write `/srv/kira/sales`; **read only** `/srv/kira/accounts` |
| `ravi` | IT support | restart and check the `ssh` service with sudo, nothing more; no access to the folders |

Rules:

1. Groups `accounts` and `sales`. Each user in the right group; no one except you in `sudo`.
2. Each folder: owned by `root`, group-owned by its team, mode `2770`.
3. `mei`'s read-only access to accounts with an ACL, including a default ACL.
4. `ravi`'s rights in `/etc/sudoers.d/it-support`, edited with `visudo`.
5. All four accounts must change their password at first login.

## Tests to run and record

```bash
sudo -u aina touch /srv/kira/accounts/ledger.txt
ls -l /srv/kira/accounts/ledger.txt                 # group accounts?
sudo -u mei cat /srv/kira/accounts/ledger.txt        # allowed
sudo -u mei touch /srv/kira/accounts/x.txt           # must fail
sudo -u ravi ls /srv/kira/accounts                   # must fail
sudo -l -U ravi                                      # only the ssh commands
getfacl /srv/kira/accounts
sudo chage -l aina | head -1
```

## Marking

Report the commands you used and the test results, then compare with the model answer.
