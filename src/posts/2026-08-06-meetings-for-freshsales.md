---
title: Meeting Helper, logging client meetings without thinking about it
description: An extension that logs finished meetings to our CRM automatically and handles notes and follow-up right on Google Meet's goodbye screen.
date: 2026-08-06
kind: making
updated: 2026-10-05
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/meetings-for-freshsales.png
image_alt: Illustration of Meeting Helper in use
---

Logging meetings in a CRM is one of those jobs everyone agrees matters and nobody does consistently. I wanted to see what happened if nobody had to.

Meeting Helper checks Google Calendar every ten minutes for meetings that have ended, matches the outside attendees to CRM contacts by email address, and logs the meeting on each one with the real title, time and description. If a contact has an open deal, the meeting goes on the deal's timeline too.

It skips what should be skipped. All-day events, canceled meetings, internal meetings and recurring ones, since a standing weekly is rarely a one-off sales call.

## The goodbye screen

Inside a Google Meet call it does something different. It works out which opportunity the call belongs to. When you leave, a single card appears on Meet's own "You left the meeting" screen with the note already focused, ready to post to our internal app, the CRM, or both. The AI meeting notes can follow once they're ready, laid out the way they read in the notes tool.

That card went through many versions. Chips, logos, a separate card and colored borders were all tried and dropped as too busy. One composer and two checkboxes won.

## What I learned

- **Trust, but read back.** The CRM often replies "success" while quietly ignoring fields. Now every change is read back to confirm it actually took.
- **Unmatched attendees are a finding.** When the extension can't match someone, that's a gap in the CRM, which is arguably more useful to know than the meeting itself.

A tool nobody clicks gives you no feedback, so this one counts what it does on its own. That's the only way to know it's working.
