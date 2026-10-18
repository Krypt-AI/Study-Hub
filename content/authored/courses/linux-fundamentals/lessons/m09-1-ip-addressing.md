---
id: linux-fundamentals.m09.l1
title: Interfaces, IP addresses and routes
summary: Read and configure network interfaces, addresses and routes with `ip` and netplan.
objectives:
  - Read interface, address and route information with `ip`
  - Explain IPv4 CIDR notation, private ranges, the gateway and IPv6 basics
  - Configure a static address persistently with netplan, safely
  - Know how RHEL configures networking with NetworkManager (`nmcli`)
estimatedMinutes: 55
topics: [linux.m09]
resources:
  - { title: "Ubuntu Server: Configuring networks", url: "https://documentation.ubuntu.com/server/explanation/networking/configuring-networks/", free: true, official: true }
  - { title: "Netplan documentation", url: "https://netplan.readthedocs.io/", free: true, official: true }
  - { title: "man 8 ip", url: "https://manpages.ubuntu.com/manpages/noble/man8/ip.8.html", free: true, official: true }
  - { title: "RHEL 10: Configuring and managing networking", url: "https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/configuring_and_managing_networking/", free: true, official: true }
---

## Addresses, networks and gateways (a quick refresher)

- An **IPv4 address** such as `192.168.56.101/24` has a **prefix length** (`/24`): the first 24 bits identify the **network** (`192.168.56.0`), the rest the host. `/24` holds 254 usable hosts.
- Hosts on the **same network** talk directly. To reach anything else, a host sends traffic to its **default gateway** (router).
- **Private ranges** (not routed on the internet): `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`. `127.0.0.0/8` is loopback (the machine itself).
- **IPv6** addresses are 128-bit (`fd17:625c:f037:2::15/64`). Link-local addresses start with `fe80::`; servers increasingly have both IPv4 and IPv6.

## Reading the configuration with `ip`

```bash
ip -br link
ip -br address
ip address show enp0s8
ip route
ip -6 route
```

```text
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
enp0s3           UP             08:00:27:8d:1a:2b <BROADCAST,MULTICAST,UP,LOWER_UP>
enp0s8           UP             08:00:27:44:9e:10 <BROADCAST,MULTICAST,UP,LOWER_UP>
...
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:44:9e:10 brd ff:ff:ff:ff:ff:ff
    inet 192.168.56.101/24 metric 100 brd 192.168.56.255 scope global dynamic enp0s8
       valid_lft 512sec preferred_lft 512sec
default via 10.0.2.2 dev enp0s3 proto dhcp src 10.0.2.15 metric 100
10.0.2.0/24 dev enp0s3 proto kernel scope link src 10.0.2.15 metric 100
192.168.56.0/24 dev enp0s8 proto kernel scope link src 192.168.56.101 metric 100
```

| Item | Meaning |
|---|---|
| `enp0s3`, `enp0s8` | interface names (predictable names: PCI bus 0, slot 3); clouds often use `ens5` or `eth0` |
| `link/ether` | the MAC address |
| `inet ... dynamic` | IPv4 address obtained by DHCP (with a lease time) |
| `default via 10.0.2.2` | the default gateway, through the NAT adapter |
| `192.168.56.0/24 dev enp0s8` | the host-only network is directly connected |

`ip route get 1.1.1.1` shows which route and source address the kernel would use for one destination: very useful when a server has several interfaces.

Older tutorials use `ifconfig`, `route` and `netstat` (package `net-tools`); they are deprecated. Learn `ip` and `ss`.

### Temporary changes

`sudo ip address add 192.168.56.150/24 dev enp0s8` adds an address **until the next reboot or network restart**. Useful for tests; never the way to configure a server permanently.

## Persistent configuration on Ubuntu: netplan

Ubuntu Server describes networking in YAML under `/etc/netplan/`; netplan turns it into configuration for **systemd-networkd** (on servers) or NetworkManager (on desktops).

```bash
ls /etc/netplan/
sudo cat /etc/netplan/50-cloud-init.yaml
```

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      dhcp4: true
```

### Setting a static address on the host-only adapter

A server's address should not change, so give `enp0s8` a static address:

```bash
sudo cp -a /etc/netplan/50-cloud-init.yaml /root/50-cloud-init.yaml.bak
sudoedit /etc/netplan/60-static.yaml
```

```yaml
network:
  version: 2
  ethernets:
    enp0s8:
      dhcp4: false
      addresses:
        - 192.168.56.10/24
```

```bash
sudo chmod 600 /etc/netplan/60-static.yaml
sudo netplan generate
sudo netplan try
```

Rules that save you from locking yourself out:

- YAML indentation is meaningful: use **spaces**, never tabs.
- `netplan try` applies the change and **rolls it back after 120 seconds** unless you press Enter to confirm. If you change the address you are connected through, your SSH session will drop: reconnect to the new address within the timeout and confirm from there, or work on the console.
- Later files override earlier ones (`60-` after `50-`). If cloud-init manages networking on a cloud VM, follow that platform's guidance instead.
- On a network with a gateway you would also set `routes: [{to: default, via: 192.168.1.1}]` and `nameservers: {addresses: [192.168.1.1]}`. Our host-only network has no gateway: the NAT adapter provides it.

After confirming, update your `~/.ssh/config` on the laptop to `HostName 192.168.56.10`.

## RHEL family: NetworkManager and `nmcli`

```bash
nmcli device status
nmcli connection show
sudo nmcli connection modify enp0s8 ipv4.method manual ipv4.addresses 192.168.56.20/24
sudo nmcli connection up enp0s8
```

Connection profiles are stored in `/etc/NetworkManager/system-connections/`. Hostnames are set the same way on both families: `sudo hostnamectl set-hostname lab01`.

## Guided lab

1. Record every interface, its MAC and its addresses with `ip -br link` and `ip -br address`.
2. Read the routing table and identify the default gateway. Run `ip route get 1.1.1.1` and `ip route get 192.168.56.1`: which interface is used for each?
3. Add a temporary address with `ip address add`, ping it from your laptop, then remove it with `ip address del`.
4. Configure `192.168.56.10/24` on `enp0s8` with netplan, apply it with `netplan try`, reconnect from your laptop to the new address and confirm.
5. Reboot and check the address persists. Update `~/.ssh/config` and your lab log.

## Independent exercises

1. For `172.20.14.33/20`, work out the network address, the broadcast address and the number of usable hosts. Check with `ipcalc` (install it).
2. Explain why a server should have a static address (or a DHCP reservation) while a laptop does not need one.
3. Translate your netplan file into the `nmcli` commands you would use on RHEL.
