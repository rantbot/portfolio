---
title: Pocket Cornhole, a bar game played on your phone
description: Cornhole played by tossing a foil-wrapped sugar packet at a phone lying flat on the table.
date: 2026-08-27
kind: making
series: Pocket Cornhole
meta: Mobile web game
try_url: https://rantbot.github.io/cornhole
try_label: Play Pocket Cornhole
image: /assets/images/experiments/pocket-cornhole.png
image_alt: Illustration of Pocket Cornhole in use
---

I was sitting in a bar on a Friday night, getting ready to build a real set of cornhole boards the next morning, when I noticed my phone sitting on its kickstand. It looked a lot like a cornhole board. My girlfriend threw a sugar packet onto it, and the rest was history.

Pocket Cornhole turns your phone into the board. Lay it flat on a table, toss a sugar packet at it, and the screen works out where the packet landed. In the hole is three points, on the board is one, off the edge is nothing. Play on your own or head to head across a table.

## The trick is foil

The phone reads the landing through its touchscreen, and a bare paper packet is often too light to register. Wrap it in foil and it works. That one line of instructions took more testing than anything else in the game.

## Telling a throw from everything else

Most of the code has nothing to do with scoring. It's about ignoring things that aren't throws. A hand reaching in, the phone's own buzz, a knock on the table, someone picking a packet back up. There's a setting for how steady your table is, which is really a setting for how suspicious the game should be.

## The only question that matters

It's a bar game that fits in your pocket, so the only thing worth measuring is whether anyone plays a second round. Starting a game and finishing one are counted separately, which keeps the answer honest.
