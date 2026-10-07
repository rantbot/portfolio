---
title: Schedule Helper, seeing who's free at a glance
description: A resource-planning timeline for thoughtbot's team schedule, with one row per person and the filters we actually use.
date: 2026-08-31
kind: making
updated: 2026-10-06
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/schedule-helper.png
image_alt: Illustration of Schedule Helper in use
---

Staffing a consultancy comes down to one question asked many times a week. Who is free, and when? Our schedule page had the answer, spread across a layout that made it hard to see.

Schedule Helper redraws it as a compact timeline with one row per person. Bars are colored by type of booking rather than by project, so client work, internal projects and investment time never look alike. A red line marks today, and zoom goes from one week to three months. The filters we use most, like department, team, region and skills, sit in a toolbar. Clicking any stretch of free time opens the booking form with the person and dates already filled in.

## Being honest about a guess

The underlying data marks a day as booked without saying which project booked it. When several projects shared a week, each one claimed the whole week, so a two-day assignment looked full time. Now the week is divided between them, and because which days is a guess, those bars get a faint hatch and show the real allocation on hover. When the two disagree, the allocation is the number to trust.

## What I learned

I spent four versions trying to make the whole page scroll with the dates pinned to the top. Each attempt introduced a new bug, and the last one painted a white sheet over everything. I rolled all four back and rebuilt from the last good version. Knowing when to retreat is part of the job.

The bigger question is whether a timeline is the right shape for this at all, or whether people need a different view entirely.
