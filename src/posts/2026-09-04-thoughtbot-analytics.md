---
title: thoughtbot analytics, one useful suggestion for every page
description: A side panel on thoughtbot.com that says what's happening with the page you're on and the most valuable thing to improve.
date: 2026-09-04
kind: making
updated: 2026-10-05
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/thoughtbot-analytics.png
image_alt: Illustration of thoughtbot analytics in use
---

Analytics dashboards are good at telling you what happened and bad at telling you what to do next. I wanted something that sat on the page itself and answered two questions. What is happening here, and what is the single most valuable thing to improve?

Open any page on thoughtbot.com and the panel answers both, combining search data, site analytics and a look at the page itself into one verdict and at most three suggestions.

## Weighted by who's searching

Before any suggestion is made, the searches get filtered. Searches for our own name go, since that person already found us, along with noise and anything with very little traffic. What's left is weighted by who is searching rather than how many. A search from someone likely to hire us outranks a much bigger generic one.

Suggestions come from plain rules instead of a model. Each one either has evidence or stays quiet, and each carries a confidence, so a weak idea doesn't get shown.

## No sample numbers, ever

Both data sources are live. When one isn't connected, the panel says so instead of showing placeholder figures. A tool that shows plausible fake numbers is worse than one that shows nothing.

The honest limit today is the company facts behind the advice. They need marketing sign-off before anyone copies them into a page. The plumbing is real and the data is real. The facts underneath are still being checked.
