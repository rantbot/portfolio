---
title: The American Dive Bar, a nature documentary about a fragile ecosystem
description: A five-minute lightning talk about dive bars in the style of a nature documentary became a twelve-minute interactive film and a standalone presentation tool.
date: 2026-10-13
kind: making
topics: [fun]
meta: Lightning talk and film
image: /assets/images/projects/the-american-dive-bar.jpg
image_alt: "Dusty wishbones hanging from an old gas lamp over the bar at McSorley's Old Ale House in New York"
try_url: https://rantbot.github.io/dive-bars/
try_label: Watch the film
---

Since 1999 I've been doing field research on the American dive bar. Mostly at night, and all of it involving beer. Sixty-eight cities so far, from Vancouver to Guayaquil, with many dives in each, and the survey is still going.

So when I had five minutes for a lightning talk, I knew what it would be about. I told it like a prestige nature documentary, with me as the field researcher studying a species science never recognized.

## The talk

The American Dive Bar walks through the habitat, the anatomy of a healthy dive, the species still out there today, like the Neighborhood Dive and the Biker Bar, the false dives that imitate them, and what it takes to protect the ones that are left. Under it all is sound from my own field recordings, real bar rooms and a biker bar late at night, crossfading as the slides advance.

<figure class="spread">
  <img src="/assets/images/projects/anatomy-of-a-dive.jpg" alt="An engraving-style plate titled Anatomy of a Dive, a bar interior with eight parts labeled in mock Latin, from old neon and low light to the brewery clock, the unexplained artifact and the jukebox" width="1456" height="819" loading="lazy" decoding="async">
  <figcaption>Plate III, the anatomy of a healthy dive.</figcaption>
</figure>

## Stagehand came from it

The talk needed things a slide app can't do well. Narration, room sound that changes with each scene, and a script only I could see. Once that was working, I wanted the same setup for every talk, so I pulled it out into its own tool, [Stagehand](/making/stagehand/).

## Then it became a film

A lightning talk only lives in the room. I wanted something people could watch on their own, so I turned it into a twelve-minute film built from the same slides, with four scenes from the longer version added back in.

[Watch The American Dive Bar](https://rantbot.github.io/dive-bars/). It's an AI-generated film, pulled from my own experiences in these bars. One AI narrator tells the whole story, the slides reveal on cue with the voice, and captions run underneath. You can pause, skip between its twenty chapters, turn captions off and go full screen. At the end there's a field journal that asks for your favorite dive bar and a protocol of your own, so the survey keeps growing.

The [five-minute version](https://rantbot.github.io/dive-bars/lightning/) is still there for presenting.

## How it's built

I built the talk and the film with Claude, as plain web pages hosted for free on GitHub Pages. There's no app and no video file. The film plays the same slides the talk uses, in the browser.

- **The sound.** My field recordings carry the bar rooms, and the rest of the ambience is synthesized live in the browser with the Web Audio API, crossfading from scene to scene.
- **The narrator.** Every line of narration lives in one script file, and ElevenLabs reads it in a single narrator's voice. When I change a line and push, a GitHub Action records only the lines that changed and saves them back to the site. Until a line is recorded, the film shows it as a caption and keeps going.
- **The field journal.** Notes from viewers go to Supabase. Anyone can add a note, but only I can read them.

<!-- TO ADD, if you like:
1. Where you gave the lightning talk, and how the room took it.
2. A favorite field note someone has left in the journal.
-->
