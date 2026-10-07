---
title: Delivery Copilot, an AI assistant that stays beside the work
description: A side panel that brings our internal delivery copilot next to the project you're looking at, with suggestions drawn from the record in front of you.
date: 2026-09-25
kind: making
updated: 2026-10-05
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/delivery-copilot.png
image_alt: Illustration of Delivery Copilot in use
---

Our internal operations app, Hub, already had an AI copilot for delivery work. It lived on its own page, which meant leaving the project you were looking at to ask about it.

Delivery Copilot is a second home for the same copilot. It docks in Chrome's side panel and follows you around Hub, so it stays beside the record instead of taking over the page.

## Three rules

It adds a home screen for each project with five suggested actions, and at most one proactive card about the record in front of you. The cards follow three rules.

1. **Silence is the default.** If nothing crosses a threshold, there's no card.
2. **Every card shows its evidence.** The numbers behind it and where they came from.
3. **Nothing happens without a person.** Choosing a task opens Hub's own ticket form, filled in and waiting for someone to click save.

## Measuring before guessing

Early on, answers felt slow. Before optimizing anything I measured, and found that Hub writes the whole answer and sends it once at the end. No client can be faster than that. So instead of a single spinner, the panel now says which of four stages it's in, which made the wait feel far shorter.

## Built to be deleted

This was always scaffolding. I built it outside Hub because that was the fastest way to work out what the panel should be. The finish line is moving the good parts into Hub and deleting the extension.

I wrote porting notes for the team that are blunt about the cost. One rule duplicates something Hub already does. Four things that look like moving code across are really new builds. That's how a week becomes a month, and I'd rather say so before anyone commits to the week.
