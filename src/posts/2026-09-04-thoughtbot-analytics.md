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

We use TWIPLA for analytics on thoughtbot.com because it respects our visitors' privacy. I'm glad we do. Its interface is also tough to navigate, and our search data lives somewhere else entirely, in Google Search Console. Answering a simple question about one page meant two tools and a lot of clicking.

I wanted the numbers on the page itself. Open any page on thoughtbot.com and a side panel answers two questions. What is happening here, and what is the single most valuable thing to improve? It combines Search Console, TWIPLA and a look at the page itself into one verdict and at most three suggestions.

## Weighted by who's searching

Before any suggestion is made, the searches get filtered. Searches for our own name go, since that person already found us, along with noise and anything with very little traffic. What's left is weighted by who is searching rather than how many. A search from someone likely to hire us outranks a much bigger generic one.

Suggestions come from plain rules instead of a model. Each one either has evidence or stays quiet, and each carries a confidence, so a weak idea doesn't get shown.

## No sample numbers, ever

Both data sources are live. When one isn't connected, the panel says so instead of showing placeholder figures. A tool that shows plausible fake numbers is worse than one that shows nothing.

The honest limit today is the company facts behind the advice. They need marketing sign-off before anyone copies them into a page. The plumbing is real and the data is real. The facts underneath are still being checked.
