---
title: Hub Search, Cmd+K for our internal app
description: A fast search palette for thoughtbot's internal app that re-ranks results locally and never sends what you type anywhere new.
date: '2026-09-10'
kind: making
updated: '2026-10-05'
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/hub-search.png
image_alt: Illustration of Hub Search in use
---

Search is the front door to any internal tool, and ours was slow to open and hard to scan. I wanted to know whether better ranking alone could fix that, without touching the search underneath.

Hub Search adds a Cmd+K palette anywhere in the app. Results appear as you type across pages, projects, opportunities, teammates, clients, the handbook and the blog, re-ranked in the browser rather than shown in the order the server returns them.

## Ranking with context

Where you are counts. If you're on a project, other projects rank a little higher, since that's usually what you're after. The boost is small enough that it only breaks ties and never lifts a weaker match over a better one. The page you're already on drops out of its own results.

An Explain ranking setting shows the score behind each result. It's the fastest way for someone to tell me the ranking is wrong.

There's no backend and no new database. It uses the session you're already signed into, and nothing you search leaves your browser.

## What I learned

- **Show something before you finish thinking.** The palette felt slow because it waited for saved settings to load. Drawing first and reading settings second made it feel instant.
- **Read the source before guessing.** Three rounds of guessing at the question-answering endpoint failed. Reading the app's own code settled it in one.

The open question is whether re-ranking on top is enough, or whether the search underneath needs to change. Usage will tell.
