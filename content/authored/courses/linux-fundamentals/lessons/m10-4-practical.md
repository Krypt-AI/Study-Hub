---
id: linux-fundamentals.m10.l4
title: "Practical assessment: incident drill"
summary: Diagnose two unknown faults under time pressure using the method, and write a short incident report.
objectives:
  - Apply the troubleshooting method to unknown faults
  - Communicate findings in an incident report
estimatedMinutes: 90
topics: [linux.m10]
---

## Set-up

Take a snapshot (`m10-before-drill`). Then let a classmate or instructor run **two** of these on your VM without telling you which (or run the script below, which picks two at random and hides the choice in a root-only file):

```bash
sudo bash -c 'faults=(cfg perm port disk mem); for f in $(printf "%s\n" "${faults[@]}" | shuf -n2); do echo "$f" >> /root/.drill; case $f in
  cfg)  sed -i "s/listen 80 default_server;/listen 80 default_server typo;/" /etc/nginx/sites-available/default; systemctl restart nginx ;;
  perm) chmod 700 /var/www/html ;;
  port) systemctl stop nginx; nohup python3 -m http.server 80 >/dev/null 2>&1 & sleep 1; systemctl start nginx ;;
  disk) fallocate -l "$(df --output=avail -B1 /srv/web | tail -1)" /srv/web/fill.bin ;;
  mem)  systemd-run --unit=memhog stress-ng --vm 1 --vm-bytes 90% --timeout 600s ;;
esac; done'
```

## The incident

> **Incident INC-2026-118 (priority 2)** — "The Kedai Kira intranet page is down or very slow. Reported 10:05 by the office manager."

You have 45 minutes. Work through the method and the first-five-minutes routine. Fix both faults and verify.

## Then

1. Compare your findings with `sudo cat /root/.drill`.
2. Revert to the snapshot if anything is left broken.

## Marking

Write the incident report, then compare with the model answer.
