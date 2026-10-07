---
title: Rainbow Tabs, sorting browser tabs by color
description: A small Chrome extension that sorts the tabs in a window into rainbow order by the color of each site's icon.
date: '2026-09-10'
kind: making
updated: '2026-10-05'
meta: Chrome extension
image: /assets/images/experiments/rainbow-tabs.png
image_alt: Illustration of Rainbow Tabs in use
---

Some experiments are toys, and that's fine. This one sorts your browser tabs into a rainbow.

Click the toolbar icon and the tabs in your window reorder red through violet by the main color of each site's icon. Tab groups move as a block, placed by their group color, with the tabs inside sorted too. Pinned tabs stay put. Click again to undo.

## Deciding what color an icon is

That turned out to be the whole project. Average the pixels in a colorful icon and you get gray, because opposite colors cancel out. So colors are sorted into hue buckets, weighted by how saturated they are, and the heaviest bucket wins.

Notification badges get ignored, since a red unread dot is usually louder than the logo it sits on. Pale icons have to clear a higher bar before they count as colored. Whites go first and darks go last, like bookends.

Some cases are still unresolved. Google's multicolor logo measures as a vivid blue, and I'd rather it sat with the whites. I haven't won that argument with the math yet.

## The honest question

It's a toy, so the only question is whether anyone clicks it twice.
