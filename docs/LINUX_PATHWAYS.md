# Linux pathways

How Linux Fundamentals connects to the certifications and roadmaps in Study Hub. The data itself lives in
`content/authored/` (this file explains it and records the sources); the app shows it on each certification page
("Linux for this exam"), on roadmap stages ("Before this stage") and on the course page ("A foundation for").

Last reviewed 2026-10-18.

## The course

`linux-fundamentals` (category `it`, so it is listed under Certifications › IT courses): 15 modules (units
`linux-fundamentals.m00` to `.m14`), 64 lessons, 357 lesson questions, 14 module quizzes and a 30-question final mock exam
(142 questions). Ubuntu Server 26.04 LTS is the main environment (24.04 works for every lab), with RHEL-family
differences noted where they matter (Module 5.3 compares the package tools side by side). Each teaching lesson has
explanations, commands with expected output, a guided lab, independent exercises, questions with explained answers
and official resources. Each module ends with a practical-assessment lesson (rubric-marked written answers) and a
module quiz. Module 14 is the capstone (Teratai Learning Centre server). Bash runs in the learner's own VM; Study Hub
has no Linux sandbox.

## Classifications

**Essential**: the exam's tasks or scope need Linux directly. **Strongly recommended**: materially improves
preparation or work, not universally required. **Optional**: useful in some roles only. These are Study Hub's
recommendations; each entry also records the provider's own requirement (`officialRequirement`). No provider lists
Linux as a formal prerequisite for any of these exams.

| Certification (id) | Area | Linux | Official requirement | Modules | Source checked |
|---|---|---|---|---|---|
| CompTIA Linux+ (`comptia-linux-plus`) | Linux | Essential | none; ~12 months Linux server experience recommended | 0–13 | comptia.org/…/linux, 2026-10-18 |
| LFCS (`lf-lfcs`) | Linux | Essential | none | 0–13 | training.linuxfoundation.org/…/lfcs, 2026-10-18 |
| **RHCSA** (`red-hat-rhcsa`, new) | Linux | Essential | none formal; RH124+RH134 or RH199 or experience recommended | 0–9, 11, 13 | redhat.com/…/ex200, 2026-10-18 |
| **LPIC-1** (`lpi-lpic-1`, new) | Linux | Essential | none | 0–9, 11, 13 | lpi.org/…/lpic-1-overview, 2026-10-18 |
| CKA (`lf-cka`) | Linux and Kubernetes | Essential | none (intermediate level) | 1–4, 6, 7, 9, 10 | training.linuxfoundation.org/…/cka, 2026-10-18 |
| KCNA (`lf-kcna`) | Linux and Kubernetes | Optional | none; domains do not list Linux | 1–3, 6, 9 | training.linuxfoundation.org/…/kcna, 2026-10-18 |
| CompTIA A+ (`comptia-a-plus`) | IT fundamentals | Strongly recommended | 12 months support experience recommended; Core 2 includes Linux | 0–2, 4–6 | comptia.org/…/core-1-and-2-v15, 2026-10-18 |
| CompTIA Network+ (`comptia-network-plus`) | Networking | Optional | A+ and experience recommended | 1, 9 | comptia.org/…/network, 2026-10-18 |
| Cisco CCNA (`cisco-ccna`) | Networking | Optional | none | 1, 3, 9 | cisco.com/…/ccna, 2026-10-18 |
| CompTIA Security+ (`comptia-security-plus`) | Security | Strongly recommended | Network+ and experience recommended; objectives do not name Linux | 4, 7, 9–12 | comptia.org/…/security and /security/v7, 2026-10-18 |
| ISC2 CC (`isc2-certified-in-cybersecurity`) | Security | Optional | no experience required | 4, 10, 11, 13 | isc2.org/…/cc-certification-exam-outline, 2026-10-18 |
| Google Cloud ACE (`google-associate-cloud-engineer`) | Cloud | Strongly recommended | 6+ months Google Cloud recommended; guide covers SSH keys, OS Login, Ops Agent | 0, 1, 3, 5, 7, 9, 10 | cloud.google.com/…/cloud-engineer and exam guide PDF, 2026-10-18 |
| AWS Cloud Practitioner (`aws-cloud-practitioner`) | Cloud | Optional | none | 0, 9 | aws.amazon.com/…/certified-cloud-practitioner, 2026-10-18 |
| Azure Fundamentals (`ms-azure-fundamentals`) | Cloud | Optional | none | 0, 9 | learn.microsoft.com/…/azure-fundamentals, 2026-10-11 |
| AWS ML Engineer – Associate (`aws-ml-engineer-associate`) | AI and ML | Optional | 1 year SageMaker recommended | 1, 3, 6, 7, 10 | aws.amazon.com/…/ml-engineer-associate, 2026-10-11 |
| Google Professional ML Engineer (`google-ml-engineer`) | AI and ML | Optional | experience recommended | 1, 3, 6, 7, 10 | cloud.google.com/…/machine-learning-engineer, 2026-10-11 |
| Microsoft MLOps Engineer, AI-300 (`ms-mlops-engineer`) | AI and ML | Optional | entry-level DevOps incl. CLIs and GitHub Actions | 1, 3, 13 | learn.microsoft.com/…/ai-300, 2026-10-18 |

Not linked (Linux not relevant): the other AI/ML certifications, JLPT and HSK. Each certification's full entry (concepts,
skills beyond the course, timing, next step) is in `content/authored/certifications.yaml` under `foundations`.

Facts refreshed while checking: Linux+ domain weights added and its prerequisite text corrected; CKA now targets
Kubernetes v1.37; LFCS re-verified.

## Roadmap changes

- **Cybersecurity**: stage 3 ("Linux and the command line") now uses `linux-fundamentals` instead of the unwritten
  `sec-03-linux` (no duplicate course). Stages 7 (defence, essential: Modules 4, 7, 9–11), 8 (incident response,
  strongly recommended) and 9 (ethical hacking, strongly recommended, authorised labs only) name the Linux modules to
  do first and what lies beyond them.
- **AI Engineering**: stage 2 lists `linux-fundamentals` beside the planned `ai-02-dev-tools` (Git and tooling); stage 12
  (MLOps) recommends Modules 3, 5–7, 9, 10.
- **Full-Stack Developer**: stage 4 optional Modules 1–3; stage 10 (deployment) strongly recommends Modules 4, 5, 7, 9,
  11, 13.
- **Linux Administration** (new, `roadmaps/linux-administration.yaml`): stage 1 is the course; stages 2–7 are outlined
  advanced courses (planned ids below), each with its topic outline shown on the roadmap and the certifications it
  leads to.

## Advanced Linux curriculum (outlined, not written)

| Stage | Planned course id | Certifications | Outline |
|---|---|---|---|
| 2 | `linux-02-system-administration` | Linux+, LPIC-1 | hardware and boot in depth, RAID/NFS/autofs/quotas, advanced networking, SELinux and AppArmor, PKI and OpenSSL, LPIC-1 102 topics, Podman/Docker, Git, troubleshooting |
| 3 | `linux-03-enterprise-linux` | RHCSA | dnf and Flatpak, nmcli, firewalld, SELinux, boot recovery, storage and autofs, tuned, scheduling, timed RHEL practice |
| 4 | `linux-04-performance-labs` | LFCS | timed task sets by LFCS domain, KVM and containers, storage and network tasks under pressure, mock exams |
| 5 | `linux-05-automation` | Linux+ (automation domain), toward RHCE | advanced Bash, Git, Ansible, idempotent configuration, IaC and CI, Python for admins |
| 6 | `linux-06-containers-and-cloud` | KCNA, CKA, Google Cloud ACE | cloud VMs and cloud-init, cloud vs host networking, containers, Kubernetes administration, observability, deployment automation |
| 7 | `linux-07-security-operations` | Security+ | CIS hardening, auditd and SIEM logging, MAC troubleshooting, Linux incident triage, intro forensics, vulnerability management |

The Linux certifications' `relatedCourses` point at these ids, so their pages say "courses planned" until they exist.

## Data and code

- No database change. Progress is keyed by lesson and question ids; all ids are new and no existing id was renamed.
- Schema (`src/domain/content/schema.ts`): `foundations` on certifications (`certificationFoundationSchema`) and on
  roadmap stages (`stageFoundationSchema`), `outline` on roadmap stages, `units` in course summaries. All default to
  empty, so existing content is unchanged.
- Build (`scripts/build-content.ts`): assessments may be listed by name and read from `<course>/assessments/<name>.yaml`;
  foundations must name existing units (error) and courses (warning if missing); roadmap certification ids are checked.
- UI: `FoundationModules` (modules with lesson bubbles, linking to the next lesson to do), the "Linux for this exam"
  sheet on certification pages, "Before this stage" and the outline on roadmap stages, and "A foundation for" on the
  course page. Roadmap certification tags now truncate instead of overflowing on phones.

## Outstanding

- The six advanced courses are outlines only.
- Exam prices, RHCSA duration and validity are unverified (listed under `unverified` in each entry).
- Re-check every source before relying on it; providers change objectives (Security+ V8 is due around 17 Nov 2026).
- Cybersecurity stages 8–9 have no certification linked; CySA+, PenTest+ or similar could be added after verification.
- The `it-operating-systems`, `it-networking`, `it-security` and `it-cloud` courses referenced by certifications are
  still unwritten.
