---
id: linux-fundamentals.m05.l3
title: "The Red Hat side: RPM and DNF"
summary: Translate your APT skills to RHEL, Rocky Linux and AlmaLinux with DNF and rpm, and meet Flatpak.
objectives:
  - Map common APT and dpkg commands to DNF and rpm
  - Read a `.repo` file and explain what `gpgcheck` protects
  - Describe what changes when you move from Ubuntu to a RHEL-family server
estimatedMinutes: 40
topics: [linux.m05]
resources:
  - { title: "RHEL 10: Managing software with the DNF tool", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/managing_software_with_the_dnf_tool/", free: true, official: true }
  - { title: "DNF documentation", url: "https://dnf.readthedocs.io/", free: true, official: true }
  - { title: "Rocky Linux documentation", url: "https://docs.rockylinux.org/", free: true, official: true }
  - { title: "Flatpak documentation", url: "https://docs.flatpak.org/", free: true, official: true }
---

## Same ideas, different tools

The Red Hat family uses **RPM** packages, installed by `rpm` and managed with **DNF** (`yum` is still accepted as an alias). Repositories, dependencies, signatures and updates work the same way as on Ubuntu.

| Task | Ubuntu / Debian | RHEL / Rocky / AlmaLinux / Fedora |
|---|---|---|
| refresh indexes | `apt update` | automatic (or `dnf makecache`) |
| search | `apt search nginx` | `dnf search nginx` |
| details | `apt show nginx` | `dnf info nginx` |
| install | `apt install nginx` | `dnf install nginx` |
| remove | `apt remove nginx` | `dnf remove nginx` |
| list updates | `apt list --upgradable` | `dnf check-update` |
| apply updates | `apt upgrade` | `dnf upgrade` |
| only security updates | unattended-upgrades | `dnf upgrade --security` (RHEL with errata) |
| what is installed | `dpkg -l` | `rpm -qa` or `dnf list --installed` |
| files of a package | `dpkg -L pkg` | `rpm -ql pkg` |
| which package owns a file | `dpkg -S /path` | `rpm -qf /path` |
| which package **provides** a file (not installed) | `apt-file search` | `dnf provides /path` |
| history and undo | `/var/log/apt/history.log` | `dnf history`, `dnf history undo N` |
| local package | `apt install ./x.deb` | `dnf install ./x.rpm` |
| automatic updates | unattended-upgrades | `dnf-automatic` |

## Repositories on RHEL

Repositories are `.repo` files in `/etc/yum.repos.d/`:

```ini
[baseos]
name=Rocky Linux $releasever - BaseOS
mirrorlist=https://mirrors.rockylinux.org/mirrorlist?arch=$basearch&repo=BaseOS-$releasever
gpgcheck=1
enabled=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-Rocky-10
```

`gpgcheck=1` makes DNF verify each package's signature, as APT's `Signed-By` does. Never set it to `0` to "make an error go away". RHEL itself gets its content from Red Hat's CDN after the system is **registered** with a subscription (free developer subscriptions exist); Rocky Linux and AlmaLinux need no subscription. Common repositories: **BaseOS** (the core OS) and **AppStream** (applications, languages and databases). **EPEL** adds community packages, much like Ubuntu's universe.

## Flatpak

Flatpak packages desktop applications with their dependencies, from remotes such as Flathub. It matters mostly on workstations, but RHCSA for RHEL 10 includes configuring Flatpak repositories and installing and removing Flatpak packages. The commands look like this:

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install flathub org.gnome.Calculator
flatpak list
flatpak uninstall org.gnome.Calculator
```

## Other differences you will notice

| Area | Ubuntu | RHEL family |
|---|---|---|
| firewall | `ufw` (front end to nftables) | `firewalld` with `firewall-cmd` (Module 9) |
| mandatory access control | AppArmor | SELinux, enforcing by default (Module 11) |
| network configuration | netplan | NetworkManager (`nmcli`) |
| admin group | `sudo` | `wheel` |
| authentication log | `/var/log/auth.log` | `/var/log/secure` |
| default filesystem | ext4 | XFS |
| web server package / service | `apache2` | `httpd` |

## Optional lab: a second VM

If your computer has the memory, create a second VM from the **Rocky Linux 10** or **AlmaLinux 10** minimal ISO (free; both are RHEL-compatible) named `lab02`. Then:

1. `sudo dnf install -y tree`, `rpm -qf /usr/bin/tree`, `rpm -ql tree`.
2. `dnf provides /usr/sbin/semanage` to find the package that provides a missing command.
3. `dnf history` to see what you installed, and `sudo dnf history undo last` to reverse it.
4. Compare `cat /etc/os-release` with Ubuntu's.

If you cannot run a second VM, read the commands and complete the exercises on paper.

## Independent exercises

1. Translate this Ubuntu runbook step into Rocky Linux commands: "update the index, install nginx, find which package owns `/usr/sbin/nginx`, list pending updates".
2. Explain to a colleague why `gpgcheck=0` in a `.repo` file is a security problem.
3. List three things you would check first when you are given SSH access to an unfamiliar RHEL server (hint: release, package manager history, SELinux mode).
