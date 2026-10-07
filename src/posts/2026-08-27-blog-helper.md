---
title: Blog Helper, an editor that knows our style guide
description: A panel beside our blog editor that reviews drafts against thoughtbot's editorial guidelines, suggests internal links and writes first drafts from notes.
date: 2026-08-27
kind: making
updated: 2026-10-05
series: Tools for my team
meta: Chrome extension
image: /assets/images/experiments/blog-helper.png
image_alt: Illustration of Blog Helper in use
---

thoughtbot has published on its blog for a long time, and we have editorial guidelines to match. The trouble with guidelines is that they live in a document, and the draft lives somewhere else.

Blog Helper puts them side by side. Open a draft in our internal editor and a panel appears next to it. It scores the piece, works through the guidelines as a checklist, suggests links to older posts with the anchor text already picked, and can write a first draft from rough notes. Titles, teasers and tags each get their own pass.

## Rules people can argue with

The guidelines are plain markdown files inside the extension, rather than a prompt buried in code. That's deliberate. Rules should be readable and arguable by the people they apply to, and changing one should mean editing a sentence.

The same goes for the small decisions. Internal links follow a simple rule of about one for every 300 words, at least two and never more than six, because a paragraph full of links reads like a directory. A post gets four tags, because three kept being treated as "done" in three different places.

## What I learned

The most expensive bugs in this build were edits that silently did nothing. A change lands in the wrong file, everything still works, and the feature is just quietly missing. Now I check for the result after every edit instead of trusting that it applied.

The question I'm watching is which passes people run twice. A review that gets run once and never again is a review nobody trusted.
