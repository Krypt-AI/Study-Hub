---
id: sec-08-incident-response.l05
title: Reporting and lessons learned
summary: Writing clear incident reports for technical and non-technical audiences, the blameless post-incident review, metrics, and feeding improvements back into defence.
objectives:
  - Structure an incident report for its audience
  - Run a blameless post-incident review that produces real actions
  - Use metrics and feedback to improve the programme
estimatedMinutes: 45
topics: [sec08.reporting]
resources:
  - { title: "NIST SP 800-61 (post-incident activity)", url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final", free: true, official: true }
  - { title: "Google SRE: postmortem culture", url: "https://sre.google/sre-book/postmortem-culture/", free: true, official: false }
  - { title: "CISA: incident reporting", url: "https://www.cisa.gov/report", free: true, official: true }
---

## The report is part of the response

An investigation that is not clearly communicated has not finished its job. Reporting serves several audiences, and
good responders write for each:

- **Technical teams** need the detail: timeline, affected systems, IOCs (lesson 4), root cause, and the exact remedial
  actions.
- **Management** needs impact and decisions: what happened in plain terms, business impact, what was done, what it
  costs, and what is needed to prevent recurrence.
- **Legal / privacy / regulators** need facts relevant to obligations: what data was involved, notification
  timelines, and a defensible record.

Write in plain language, lead with the bottom line, separate **facts** (what the evidence shows) from
**assessment** (what you infer) and **recommendations**. State confidence honestly and do not overclaim beyond the
evidence.

## The timeline

The backbone of any report is a **timeline**: timestamped events from first compromise (dwell time) through detection,
containment and recovery. It is built from the logs and triage notes you kept throughout (lessons 2–3), which is why
synchronised time and contemporaneous note-taking matter so much.

## Blameless post-incident review

After recovery, hold a **post-incident review** (postmortem). Its purpose is **learning, not blame**. People who fear
punishment hide information, which makes the organisation less safe. A good review asks:

- What happened, and in what order?
- What let it happen (the systemic causes, not "who clicked")?
- What went well in the response, and what did not?
- What concrete changes will prevent recurrence or detect it faster next time — with owners and dates?

Blame individuals and you learn nothing and lose trust; fix the systems and processes and you get durably safer.

## Metrics and the feedback loop

Measure the response so it improves: common metrics are **MTTD** (mean time to detect) and **MTTR** (mean time to
respond/recover), dwell time, and how many incidents were caught by monitoring versus reported late. Trends show
whether the programme is getting better.

Crucially, the lessons must **flow back into Preparation** (lesson 1): new detections and SIEM rules (Stage 7),
hardening and patching gaps closed, plan and playbook updates, and training where human factors mattered. That closes
the loop — each incident, handled well and honestly, leaves the organisation harder to breach than before. That is the
whole point of the discipline.
