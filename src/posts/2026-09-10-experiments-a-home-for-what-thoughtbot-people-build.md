---
title: Experiments, a home for what thoughtbot people build
description: A catalog where thoughtbot people share the tools they make, try each other’s work, leave feedback, and vote on what’s ready for production.
date: 2026-09-10
kind: making
series: Tools for my team
meta: Web app
image: /assets/images/experiments/experiments-site.png
image_alt: Illustration of Experiments in use
---

The first thing I built wasn't a tool. It was a place to put tools.

I created Space Station to organize work between client engagements, along with an experiment framework to help people turn ideas into tangible work and shared learning. Experiments is where that work lives.

People at thoughtbot were building useful things on their own, and almost none of it traveled. A great prompt stayed in one person's notes. An extension that saved someone an hour a week never reached the person sitting next to them in Slack. So I built Experiments, an internal catalog where every experiment gets a card, a page, an install button and a few honest numbers.

## How it works

It's a plain static site with no framework and no build step. Each experiment is a folder with a short description, a picture and a download. Adding one means adding a folder, and a GitHub Action does the rest. It lists the folders, publishes the downloads, and announces new versions in our #experiments channel.

The only thing that needs a database is what a static file can't know. Visits, hearts, which version each person is running, and which features get used inside each tool.

Later I added a lighter way in. Most people will never build a Chrome extension, and the catalog shouldn't need them to. Now anyone can share a prompt, a skill or a Loom through a short form, and it opens the pull request for them.

## What I learned

- **Ask questions people will answer.** Each card used to ask "Should this become real software?" Almost nobody answered. Replacing it with a simple like got real signal.
- **Count people, not builds.** The first version counted every version anyone had ever run, so one person testing fourteen builds looked like fourteen users. Now it counts the version each person last reported.
- **Close doors you don't need open.** I removed comments. A public form posting to a public endpoint invites spam, and feedback works better as a button into Slack anyway.

The catalog is an experiment too. If the numbers on it are the wrong numbers, I'd rather hear that than work around it.
