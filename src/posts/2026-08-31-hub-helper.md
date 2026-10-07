---
title: Hub Helper, small fixes for the reports we read every week
description: Sorting, filters, color bands and a one-click weekly review for the utilization and delivery reports in our internal app.
date: 2026-08-31
kind: making
updated: 2026-10-05
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/hub-helper.png
image_alt: Illustration of Hub Helper in use
---

Every week our delivery leads read the same two reports, utilization and project delivery. Both had the data. Neither made it easy to see what needed attention.

Hub Helper is a set of quality-of-life fixes on top of those pages. Sortable columns, quick date ranges, filters, a difference column with a color band down each row, and totals folded into the headers. On the delivery report, a Weekly Review button turns a handful of checked projects into something you could send, with each project's open tickets listed by name. Notes and tickets can be written right from the review.

## Small details that matter

- **Rounded numbers decide the color.** Two people both showing -5% always land in the same band, even if the raw numbers differ slightly.
- **Context matters.** Internal investment projects used to be marked down for having no client. thoughtbot is the client there, so now they aren't.
- **The thresholds are guesses, and I say so.** The amber and red lines sit at the top of one file. If they don't match how people actually read the numbers, that's the most useful feedback I can get.

## What I learned

I can't change the app underneath, so every fix has to live in the layer on top. That's a good constraint. It forces the question of what really needs to change in the product versus what just needed a better view.

The other lesson was simple and kept proving itself. Get the real page before fixing anything. Guessing at markup cost me several rounds every time.
