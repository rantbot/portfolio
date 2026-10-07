---
title: Handbook Helper, a better way to read our company handbook
description: A reading layer over thoughtbot's handbook with a path for new people, handbook-only search, and a clear line between policies and guides.
date: 2026-09-02
kind: making
updated: 2026-10-05
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/handbook-helper.png
image_alt: Illustration of Handbook Helper in use
---

thoughtbot's handbook is one of the best things about working here. It explains how we make decisions, what we expect of each other and why. It was also hard to read inside our internal app, with long lines across the whole screen and no way to tell a policy from a guide.

Handbook Helper adds a reading layer. A path through the introduction for someone new, search that only looks at the handbook, categories, and a comfortable reading column. Turn it off and the handbook is exactly as it was.

## Policies and guides

Every page now says which one it is. Policies get a red badge and guides get a gray one, because the point of red is that it's the exception. The answer comes from the handbook itself wherever it says so.

That came from a mistake. An earlier version used its own rule to decide what counted as a policy, and it filed real policies under guides. Second-guessing someone else's document was the bug.

## Reuse over rebuild

The index is the handbook's own table of contents, read from the page, so it can't drift from the real thing. Search uses the existing endpoint and answers instantly from page titles while full text catches up.

I also took something out. A hand-picked "key pages" section felt helpful, but it was my judgment rather than data, and it buried everything it didn't pick.

## What I learned

A tool for reading should author nothing. New pages still go to the handbook, where everyone can see and change them.
