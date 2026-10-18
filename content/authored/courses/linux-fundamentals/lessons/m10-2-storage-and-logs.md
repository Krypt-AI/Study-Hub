---
id: linux-fundamentals.m10.l2
title: Storage performance, log management and alerts
summary: Measure disk I/O, keep logs under control with logrotate, read logs efficiently, and build a simple alerting check.
objectives:
  - Measure disk throughput and latency with `iostat` and `iotop`
  - Check disk health indicators and filesystem errors in logs
  - Configure log rotation with logrotate
  - Search logs efficiently across the journal and text files
  - Know what monitoring systems do and where your scripts fit
estimatedMinutes: 50
topics: [linux.m10]
resources:
  - { title: "sysstat: iostat", url: "https://sysstat.github.io/", free: true, official: true }
  - { title: "man 8 logrotate", url: "https://manpages.ubuntu.com/manpages/noble/man8/logrotate.8.html", free: true, official: true }
  - { title: "Prometheus: Overview", url: "https://prometheus.io/docs/introduction/overview/", free: true, official: true }
---

## Disk I/O

```bash
sudo apt install sysstat iotop
iostat -xz 2 3
sudo iotop -o
```

```text
Device            r/s     rkB/s   r_await     w/s     wkB/s   w_await  aqu-sz  %util
sda             12.00    480.00      0.45   85.00   9200.00     14.20    1.21   71.60
```

| Field | Meaning |
|---|---|
| `r/s`, `w/s` | reads and writes per second |
| `rkB/s`, `wkB/s` | throughput |
| `r_await`, `w_await` | average time per request in ms (**latency**) |
| `aqu-sz` | average queue length |
| `%util` | how busy the device was (near 100 % on a single disk is saturation; less meaningful on SSD arrays and cloud volumes) |

Rising `await` with users complaining means the storage is the bottleneck. `iotop -o` shows which processes are doing the I/O.

### Health signs

```bash
journalctl -k -p err --since "7 days ago" | grep -iE 'i/o error|ext4-fs error|xfs|ata|nvme'
sudo smartctl -H /dev/sda        # physical disks only (package smartmontools)
```

`I/O error`, `EXT4-fs error` or a filesystem remounted read-only mean data is at risk: check backups first, then hardware. Virtual disks usually report no SMART data; the platform monitors the physical disks.

## Log management with logrotate

Applications keep writing logs; without rotation they fill disks. **logrotate** runs daily (a systemd timer) and renames, compresses and deletes old logs according to files in `/etc/logrotate.d/`:

```bash
cat /etc/logrotate.d/nginx
```

```text
/var/log/nginx/*.log {
	daily
	missingok
	rotate 14
	compress
	delaycompress
	notifempty
	create 0640 www-data adm
	sharedscripts
	prerotate
		if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
			run-parts /etc/logrotate.d/httpd-prerotate; \
		fi \
	endscript
	postrotate
		invoke-rc.d nginx rotate >/dev/null 2>&1
	endscript
}
```

| Directive | Meaning |
|---|---|
| `daily` / `weekly` | how often |
| `rotate 14` | keep 14 old files |
| `compress`, `delaycompress` | gzip old files, but not the most recent one |
| `missingok`, `notifempty` | no error if missing; skip empty logs |
| `create 0640 www-data adm` | new file's mode and owner |
| `postrotate` | tell the service to reopen its log file |

For your own application, add a file such as `/etc/logrotate.d/kira`:

```text
/var/log/kira/*.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
    copytruncate
}
```

`copytruncate` copies then empties the live file, for programs that cannot be told to reopen their logs. Test with `sudo logrotate -d /etc/logrotate.d/kira` (debug, changes nothing) and force a run with `sudo logrotate -f /etc/logrotate.d/kira`.

## Reading logs efficiently

| Need | Command |
|---|---|
| errors since boot | `journalctl -b -p err` |
| one service, a time window | `journalctl -u nginx --since "10:00" --until "10:30"` |
| text logs, including rotated and compressed ones | `zgrep -h "error" /var/log/nginx/error.log*` |
| count by hour | `journalctl -u ssh --since today -g Failed -o short-iso \| cut -c1-13 \| uniq -c` |
| correlate | look at **all** logs around the same timestamp: kernel, the service, auth |

## Monitoring and alerting

Organisations do not watch `top` all day. **Monitoring systems** collect metrics and logs from every server and **alert** a person when thresholds are crossed: Prometheus with node_exporter and Grafana, Zabbix, Nagios/Icinga, Netdata, or cloud monitoring (CloudWatch, Azure Monitor, Google Cloud Monitoring). As a junior, you will mostly **respond** to their alerts and add simple checks. Your Module 3 health-check script is exactly the kind of check that feeds such a system: clear output, and an exit code (0 OK, 1 warning, 2 critical) that the monitoring system understands.

## Guided lab

1. Install `sysstat` and `iotop`. Run `iostat -xz 2` while `stress-ng --hdd 1 --timeout 30s` runs. Record `w_await` and `%util` before and during.
2. Read `/etc/logrotate.d/nginx` and `/etc/logrotate.d/rsyslog` and explain each directive.
3. Create `/var/log/kira/app.log` with some lines, add the `kira` logrotate file, run `logrotate -d` and then `-f`, and list the results.
4. Use `zgrep` to search the current and rotated nginx logs for `404`.
5. Find error-level kernel messages in the last week and explain any you see.

## Independent exercises

1. Extend your Module 3 health check to report the 1-minute load relative to `nproc` and the `available` memory, with warning thresholds.
2. Write a logrotate rule for `/srv/kira/status/access.log`: daily, keep 30, compress, owner `kira-status`.
3. Explain the difference between monitoring (metrics over time) and logging (events), with one example of each.
