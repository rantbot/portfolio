---
title: Qualifier, moving a sales lead forward with one emoji
description: A Slack app that turns a checkmark on an inbound opportunity into an enriched, qualified deal in our CRM, with a brief on the people involved.
date: '2026-10-04'
kind: making
series: Tools for my team
meta: Slack app
image: /assets/images/experiments/qualifier.png
image_alt: Illustration of Qualifier in use
---

New opportunities arrive in a Slack channel. Someone reads the post, decides it's real, then opens the CRM and fills in the same details by hand. I wanted that last part to take one emoji.

React with a checkmark to an inbound opportunity and Qualifier finds the deal and shows you, privately, exactly what it would change. The stage, name, project types, value and description, along with the deal's fit score. Click Yes and it saves those changes, moves the deal to Qualification and replies in the thread with every change, before and after. Then it posts a short brief on each contact.

Mention it in the thread to ask about the company or the people, and it answers with sources and saves the answer on the deal for whoever picks it up next.

## Guardrails first

It started as "move the deal when someone reacts." That turned out to change deals too easily, so it grew a confirmation step.

- Nothing changes until someone clicks Yes.
- Only the first Yes counts, so a deal is never updated twice.
- Deals past qualification are never touched.
- Answering a question never edits a deal.
- It never opens LinkedIn pages, since LinkedIn doesn't allow it.

## What I'm watching

Whether what it writes is close enough to what a person would write that we stop editing it, and whether the contact briefs change who we reach out to first.
