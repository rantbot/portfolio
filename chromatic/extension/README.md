# Chromatic

A Chrome extension that sorts the tabs in your current window into rainbow order,
red through violet, based on each tab's favicon color. Tab groups move as a block,
positioned by their assigned group color, with the tabs inside each group sorted
by their own favicon color too. Pinned tabs are never touched, unless every tab in
the window is pinned, in which case it offers to sort those instead (see below).

## Using it

Click the toolbar icon, or press Alt+Shift+R, to sort. A green checkmark badge
confirms the sort ran. Click again to undo it, and a gray `↺` badge confirms the
undo (and forgets it, so a third click sorts fresh rather than redoing the same
order). The undo only applies while the window is exactly as the sort left it.
Open, close or move a tab and the undo is forgotten, so the next click sorts
again instead of jumping back to an old layout. A red `!` means something went
wrong, check the service worker console (see below).

The shortcut can be changed at `chrome://extensions/shortcuts`.

If every tab in the window is pinned, there's nothing unpinned to sort. Rather
than silently doing nothing, it opens a small confirmation popup asking
whether to sort the pinned tabs instead, click through it and it sorts them
in place, same undo toggle applies afterward. If there are fewer than two
pinned tabs either (nothing to sort either way), it shows a gray `–` badge
instead of asking.

## How the color detection works

The interesting part of this extension is figuring out a favicon's "real" color
well enough that the result matches what a person would expect, not just what a
naive pixel average produces. A few things make that harder than it sounds:

- **CORS.** Most sites don't send CORS headers on their favicon, so a direct
  cross-origin fetch fails silently. Favicons are instead read through Chrome's
  own `_favicon` endpoint (the `favicon` permission), which serves the icon
  Chrome already has cached, from the extension's own origin. No network
  request, no CORS issue.
- **Multi-hue icons.** A flat average of every pixel washes out to gray for any
  icon that spans several hues at once (Chrome's own pinwheel logo, for
  example), since opposing hues cancel out. Colors are instead binned into hue
  buckets weighted by saturation, and the heaviest bucket wins, a simple
  dominant-color approach rather than a mean.
- **Notification badges.** An unread-count dot in the top-right corner is
  usually more saturated than the actual logo, so it's excluded from sampling
  entirely rather than being allowed to hijack the hue.
- **Near-white icons with a faint tint.** A soft drop shadow or anti-aliasing
  can nudge an otherwise white icon's average just over a naive saturation
  threshold. Icons that read as overwhelmingly light need their colorful
  pixels to average a real level of saturation, not just a faint tint, before
  they're classified as "colorful" rather than white.
- **Small logos on a big background.** A small, fully-saturated logo on a
  much larger background of a different color (a thin green lightning bolt on
  a black square, say) is still a real color, even though the background
  outnumbers it in pixels. What actually needs catching is a different
  problem, one where the "color" is a weak, barely-saturated artifact, so
  that's judged by how saturated the colorful pixels are on average, not by
  how much area they cover.
- **Pale colors don't feel like a rainbow.** A color can be technically
  saturated (high `s`) while still reading as washed-out and pale, because
  saturation and lightness are independent, a pastel blue can be just as
  "saturated" as a vivid one, only much lighter. A rainbow reads as a rainbow
  because its colors are vivid, so anything whose actual lightness is high
  enough to look pale is treated as a light neutral instead of being sorted
  into the vivid color sequence, even though it has a real, correctly
  detected hue.
- **A smooth handoff from white into color, and from color into black.**
  A pale color demoted by the rule above still has a real hue underneath, it
  was just too washed-out to count as "colorful". That hue is kept and used
  to place the item within its neutral bookend: a pale, reddish-leaning tab
  sits at the very end of the white cluster, right next to where the red
  section begins, while a pale blue-leaning tab (less related to where the
  rainbow starts) sits further back. The same applies in reverse for the
  black bookend, relative to whichever hue the color sequence ends on. Fully
  achromatic items (no hue signal at all) sit at the far end of their
  bookend, away from the color sequence, sorted by lightness as before.
- **Chrome's own internal pages.** `chrome://extensions` and similar pages
  render differently in dark mode than the raw favicon bytes Chrome hands back,
  so pixel extraction can't be trusted for these specifically. They're always
  treated as pure white instead.
- **Similar-but-different brand colors.** Two unrelated sites' "reds" (say hue
  350 and hue 8) are close enough to look identical to a person but far enough
  apart that a third, genuinely different color's hue could numerically fall
  between them on a continuous sweep, splitting the two reds apart. Hues are
  snapped to the nearest named color (the same palette used for tab groups)
  before sorting, so every red-ish tab lands in one block no matter how many
  different brands of "red" are mixed in; the exact hue only breaks ties
  within that block.
- **Bookending with black and white.** Fully neutral tabs (grayscale or
  white/black favicons) aren't dumped in one clump at the end. Lighter
  neutrals sit right before the color sequence starts and darker neutrals sit
  right after it ends, so the whole strip reads as one gradient: light → color
  → dark.
- **Same-site tabs keep their relative order.** Several tabs on the same
  site share the same favicon and so tie on hue. Since the sort is stable,
  ties hold their existing left-to-right order rather than getting shuffled
  among themselves, which in practice tracks oldest-to-newest for anyone who
  hasn't manually dragged tabs around. Chrome's tabs API has no creation
  timestamp to sort by directly, and tracking one independently wasn't worth
  the added surface for this.

All of this pixel-math lives in [`lib/color.js`](lib/color.js) as plain,
dependency-free functions with no `chrome.*` calls, kept separate from the
`chrome.*` orchestration in `background.js` and `offscreen.js` so the sorting
logic isn't duplicated across both.

## Architecture

```
background.js       Service worker. Wires up events (icon click or shortcut,
                     messages from confirm.js) and delegates to the
                     modules below, plus the undo-vs-sort toggle that ties
                     them together.
lib/sort.js          Computes and applies rainbow order to a window's tabs
                     and tab groups. Imports lib/color.js for the sorting math.
lib/undo.js          Captures each tab's pre-sort position and restores it,
                     for the undo toggle, plus a fingerprint of the sorted
                     window so a stale undo is never applied.
lib/pinnedPrompt.js  Asks whether to sort pinned tabs when there's nothing
                     else to sort, via the confirm popup.
lib/color.js         Pure color math, no chrome.* calls: RGB→HSL,
                     dominant-hue extraction, hue-distance sorting. Shared by
                     lib/sort.js and offscreen.js.
offscreen.js         Runs in a hidden offscreen document (the only context
                     with canvas access in Manifest V3). Reads favicon pixels
                     and extracts a dominant color, using lib/color.js.
confirm.html/js      A small popup, not shown by default. background.js
                     (via lib/pinnedPrompt.js) points the toolbar action at
                     it and forces it open (via chrome.action.openPopup(),
                     which needs a user gesture, and a direct icon click
                     carries one) only when every tab in the window is
                     pinned, to ask whether to sort those instead.
```

`background.js` and `offscreen.js` talk to each other with a single message
type (`EXTRACT_COLORS`) since a service worker has no DOM/canvas access and an
offscreen document is the only Manifest V3 context that does. `confirm.js`
talks back to `background.js` with two message types: `CONFIRM_SORT_PINNED`
when the button is clicked, and `SORT_PINNED_POPUP_CLOSED` when the popup
closes for any reason, which is what un-points the action from the popup so
a normal click resumes sorting instead of reopening the confirmation. If
`chrome.action.openPopup()` fails for some reason, it shows the gray `–` badge
instead.

## Permissions

| Permission      | Why                                                                              |
| --------------- | -------------------------------------------------------------------------------- |
| `tabs`          | Read tab URLs/favicons and reorder tabs                                          |
| `tabGroups`     | Read and reorder tab groups                                                      |
| `offscreen`     | Create the offscreen document used for canvas access                             |
| `favicon`       | Use Chrome's local `_favicon` endpoint instead of fetching favicons cross-origin |
| `storage`       | Remember each tab's pre-sort position (session-only) so a second click can undo  |

There's deliberately no `host_permissions`. Nothing in this extension fetches
a page directly, favicons are read through Chrome's own local `_favicon`
endpoint, which is same-origin to the extension. That keeps the Chrome install
prompt free of the "read and change all your data on all websites" warning.

## Development

```
npm install     # eslint + prettier, dev-only
npm run lint    # eslint .
npm run format  # prettier --write .
```

No build step, no bundler. Manifest V3 service workers and offscreen documents
both support native ES modules, so `lib/color.js` is imported directly.

### Loading the extension locally

1. Go to `chrome://extensions`
2. Enable Developer mode (top right)
3. "Load unpacked" → select this folder
4. Click the icon in the toolbar to sort the current window

### Debugging

On the extension's card in `chrome://extensions`, click "service worker" to
open a DevTools console scoped to `background.js`. `console.error` calls there
log any sort failure along with the underlying error.

## Known limitations

- Notification-badge detection assumes the badge sits in the top-right corner,
  which covers the large majority of sites but not all of them.
- Group colors are mapped to fixed approximate hues (Chrome only exposes nine
  named colors, not exact values), so group block ordering is a best
  approximation rather than pixel-exact.

## Privacy

Chromatic collects nothing. It makes no network requests, has no host
permissions, and the only thing it stores is the pre-sort tab order for the
undo, in session storage that Chrome clears when the browser closes.
