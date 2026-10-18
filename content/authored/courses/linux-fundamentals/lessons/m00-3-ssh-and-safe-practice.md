---
id: linux-fundamentals.m00.l3
title: Connecting with SSH and working safely
summary: Log in to your server over SSH, set up key-based login, and adopt the habits that keep lab and production systems safe.
objectives:
  - Connect to a Linux server with `ssh` from Windows, macOS or Linux
  - Create an SSH key pair and log in with it
  - Explain the host-key fingerprint prompt
  - Apply safe lab practices before running commands as root
estimatedMinutes: 50
topics: [linux.m00]
resources:
  - { title: "Ubuntu Server: OpenSSH server", url: "https://documentation.ubuntu.com/server/how-to/security/openssh-server/", free: true, official: true }
  - { title: "OpenSSH manual pages", url: "https://www.openssh.com/manual.html", free: true, official: true }
  - { title: "Microsoft: OpenSSH for Windows", url: "https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_overview", free: true, official: true }
---

## Why SSH

The VM console works, but at work servers are in a data centre or the cloud: you reach them over the network with **SSH** (Secure Shell). SSH encrypts everything, including your password, and lets you copy text in and out of your own terminal. Windows 10 and 11, macOS and Linux all include the `ssh` client.

## Your first connection

From your laptop (PowerShell, Windows Terminal or a macOS/Linux terminal):

```bash
ssh student@192.168.56.101
```

The first time, SSH cannot know whether this really is your server:

```text
The authenticity of host '192.168.56.101 (192.168.56.101)' can't be established.
ED25519 key fingerprint is SHA256:Qm4b1oV2sT8xXk1m0yqvH3eJk7p2nW9fZcR5aL6dE0s.
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '192.168.56.101' (ED25519) to the list of known hosts.
student@192.168.56.101's password:
student@lab01:~$
```

The **host key fingerprint** identifies the server. To check it properly, run this on the VM console and compare:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

```text
256 SHA256:Qm4b1oV2sT8xXk1m0yqvH3eJk7p2nW9fZcR5aL6dE0s root@lab01 (ED25519)
```

Your laptop stores accepted keys in `~/.ssh/known_hosts`. If the key later changes, SSH refuses with `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`. In a lab that usually means you reinstalled the VM (remove the old entry with `ssh-keygen -R 192.168.56.101`); on a real network, stop and ask, because it can also mean someone is intercepting the connection.

Type `exit` (or press `Ctrl+D`) to log out.

## Key-based login

Passwords can be guessed; a key pair cannot realistically be. You keep the **private key** on your laptop and put the **public key** on the server.

On your laptop:

```bash
ssh-keygen -t ed25519 -C "student laptop"
```

```text
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/you/.ssh/id_ed25519):
Enter passphrase for "/home/you/.ssh/id_ed25519" (empty for no passphrase):
Your identification has been saved in /home/you/.ssh/id_ed25519
Your public key has been saved in /home/you/.ssh/id_ed25519.pub
```

Give it a passphrase: it protects the key if your laptop is stolen. Then copy the public key to the server:

- macOS and Linux: `ssh-copy-id student@192.168.56.101`
- Windows PowerShell (no `ssh-copy-id`):

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh student@192.168.56.101 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Now `ssh student@192.168.56.101` asks for the key's passphrase instead of the server password. Never share or copy the **private** key (`id_ed25519` without `.pub`). Module 11 turns off password logins once keys work.

### A shortcut: `~/.ssh/config`

```text
Host lab01
    HostName 192.168.56.101
    User student
```

Then `ssh lab01` is enough.

## Safe lab practices

These habits matter more at work than in the lab, so practise them now.

1. **Work as yourself, use `sudo` for single admin commands.** Do not log in as `root`. `sudo` asks for *your* password and logs what you ran.
2. **Read before you press Enter**, especially with `sudo`, `rm`, `>` (overwrite), `dd`, `mkfs` and anything copied from the internet. Make sure you understand every part.
3. **Snapshot before risky changes**, and back up configuration files before editing: `sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak`.
4. **Check where you are**: the prompt shows the host and directory. Many accidents happen on the wrong machine; at work, production prompts are often coloured red for this reason.
5. **Keep a lab log**: date, what you changed, the commands, and the result. This is the habit behind tickets and change records in Module 13.
6. **Keep your lab isolated**: host-only or NAT networking, strong passwords, and never expose a practice server to the internet.
7. **Only test systems you own or are authorised to test.** Scanning or logging into other people's machines without permission is illegal in Malaysia (Computer Crimes Act 1997) and in most countries.

## Guided lab

1. SSH to your VM by IP address and accept the host key after checking the fingerprint on the console.
2. Create an Ed25519 key pair with a passphrase and install the public key on the VM.
3. Log out and log in again; confirm you are asked for the key passphrase, not the server password.
4. Add a `Host lab01` block to `~/.ssh/config` and connect with `ssh lab01`.
5. On the VM, run `cat ~/.ssh/authorized_keys` and confirm that it contains one line ending in `student laptop`.

## Independent exercises

1. Start a lab log (a text file or notebook) with today's date and everything you did in Module 0.
2. Explain in your own words what would happen if someone copied your **public** key, and if someone copied your **private** key.
3. Find which SSH key types `ssh-keygen` supports (`man ssh-keygen`, look at `-t`) and why Ed25519 is a good default.
