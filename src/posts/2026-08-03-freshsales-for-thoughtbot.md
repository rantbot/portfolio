---
title: Freshsales for thoughtbot, our CRM inside the inbox
description: A sidebar in Gmail that shows who someone is in our CRM, the deal tied to a thread, and the people worth reconnecting with this week.
date: 2026-08-03
kind: making
updated: 2026-10-06
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/freshsales-for-thoughtbot.png
image_alt: Illustration of Freshsales for thoughtbot in use
---

Business development happens in email. Our CRM lives in another tab. Every time I wanted to know whether someone was already a contact, or what was happening on their deal, I had to leave the conversation to find out.

This extension adds a CRM sidebar to Gmail. On a thread it shows who's already in Freshsales, the related deal, a recommended next step and recent activity, with a box to add a note. If there's no deal yet, creating one takes a couple of clicks.

## Five people a week

The part that has paid off most is the smallest. The inbox view has a Suggestions tab with five people worth reconnecting with each week. It never refills. Five is a list you can finish, and a feed that tops itself up is one you learn to ignore.

It's been reigniting conversations with past clients, people who spent money with us before and simply hadn't heard from us in a while. That's some of the best business there is, and it was sitting in our CRM the whole time.

## The part most likely to be wrong

When a thread includes several companies, an AI pass works out which one is actually the client rather than assuming it's the sender's domain. That's the guess most likely to miss, so it's the one I ask people to report.

## What I learned

- **Bump the version every time.** It sat on the same version number for weeks, and nobody could tell which build they had installed.
- **Look at the real page before guessing.** The CSV exporter that lives inside this extension got better every time I worked from the actual page structure instead of my assumptions about it.
- **Never let a tool move what's already closed.** Closed deals no longer show stage buttons at all.
