---
title: Can a phone tell where a sugar packet landed?
description: Yes, if you wrap the packet in foil. How a tabletop game idea turned into a question about touchscreens.
date: 2026-10-03
kind: making
series: Pocket Cornhole
tldr: A touchscreen can register a sugar packet landing on it, and where it comes to rest, once the packet is wrapped in foil. That makes it possible to play cornhole with a phone as the board.
image: /assets/images/experiments/pocket-cornhole-throw.png
image_alt: A foil-wrapped sugar packet sliding toward a phone lying on a wooden table
tone: "#E9E4D8"
ink: "#2E2A22"
cover_kicker: Pocket Cornhole
cover_lines:
  - Phone as the board
  - Sugar packet as the bag
---

Pocket Cornhole started as a simple idea. Put a phone on the table, toss a sugar packet at it, and let the phone keep score. The phone is the board, and the packet is the bag.

The game is easy to picture. The hard part is getting the phone to notice. It needs to know that a packet landed, where it came to rest, and whether it slid off the edge.

## The problem

Phone screens are designed to read fingers. A paper packet full of sugar is not a finger, so the first question had nothing to do with game design. Could the phone feel the packet at all?

## What worked

Wrapping the packet in foil. With foil around it, the phone reads the landing through the touchscreen, including where the packet stops and whether it slides away.

## How I tested it

Before building any of the game, I built bare test screens that did nothing except report what they detected. Rough tools made it quick to try one idea after another, and they kept me focused on the one question that mattered.

## Try it

Pocket Cornhole runs in the browser, so anyone can open it on a phone. [Play it](https://rantbot.github.io/cornhole/) or [read the code](https://github.com/rantbot/cornhole).
