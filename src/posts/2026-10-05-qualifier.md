---
title: Qualifier, moving a sales lead forward with one emoji
description: A Slack app that turns a checkmark on an inbound opportunity into an enriched, qualified deal in our CRM, with a brief on the people involved.
date: 2026-10-05
kind: making
series: Tools for my team
meta: Slack app
image: /assets/images/experiments/qualifier.png
image_alt: Illustration of Qualifier in use
---

New opportunities arrive in a Slack channel. Qualifying one can take three or four emails, sometimes a video call. What shouldn't take any work is the paperwork that comes after, where someone opens the CRM and types in the same details by hand. I wanted that part to take one emoji.

React with a checkmark to an inbound opportunity and Qualifier finds the deal and shows you, privately, exactly what it would change. The stage, name, project types, value and description, along with the deal's fit score. Click Yes and it saves those changes, moves the deal to Qualification and replies in the thread with every change, before and after. Then it posts a short brief on each contact, so those first emails start from what we already know.

Mention it in the thread to ask about the company or the people, and it answers with sources and saves the answer on the deal for whoever picks it up next.

## Guardrails first

It started as "move the deal when someone reacts." That turned out to change deals too easily, so it grew a confirmation step.

- Nothing changes until someone clicks Yes.
- Only the first Yes counts, so a deal is never updated twice.
- Deals past qualification are never touched.
- Answering a question never edits a deal.
- It never opens LinkedIn pages, since LinkedIn doesn't allow it.

I think any tool that edits sales data should ask first and explain itself after.

## What I'm watching

Whether what it writes is close enough to what a person would write that we stop editing it, and whether the contact briefs change who we reach out to first.

<!-- TO ADD, to connect this tool to your judgment. Answer in a sentence or two each:
1. Who had the problem, and what was it costing them?
2. What did you personally do, from spotting it to building it?
3. What changed after people used it? A number or a before and after helps.
4. Is it an experiment, a tool the team adopted, or something you'd sell?
-->
