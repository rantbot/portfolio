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
- **Color the way people see it.** Pixels are measured in OKLCH, a color space
  built around human vision, where lightness, vividness (chroma) and hue match
  what the eye sees. HSL, which 1.0 used, calls pure yellow and navy blue
  equally light and spaces hues unevenly, so "pale" and the color families
  felt off.
- **Color families.** Every colorful icon belongs to one of nine families, red,
  orange, yellow, green, teal, blue, indigo, violet and pink, centered so real
  brand colors land where people expect. Facebook, Dropbox and Zoom sit together
  in blue, Discord, Stripe and Linear together in indigo.
- **Multi-hue icons.** A flat average of every pixel washes out to gray for any
  icon that spans several hues. Pixels vote by family instead, weighted by how
  vivid they are, and the heaviest family wins.
- **Multicolor logos.** When three or more unrelated families each hold a real
  share of an icon (Google's G, Microsoft's squares, Figma), any single color
  would be arbitrary, so the icon is marked multicolor and sorted at the very
  start, before the whites. A red to yellow gradient still counts as one warm
  color.
- **A small mark on a big tile.** A solid black, gray or white tile with a small
  colored mark on it (a green bolt on black, say) looks like the tile in a tab
  bar, so it sorts as the tile's color.
- **Notification badges.** An unread-count dot in the top-right corner is
  usually more vivid than the logo. The corner is left out only when it holds a
  vivid red-ish dot that doesn't match the rest of the icon, so icons without a
  badge are read whole, and a red icon stays red.
- **Pastels and near-blacks.** A very light, soft color reads as a tint of white
  and a very dark, soft one as a shade of black, so they join the white and
  black bookends instead of the color blocks.
- **Chrome's own internal pages.** `chrome://extensions` and similar pages
  render differently in dark mode than the raw favicon bytes Chrome hands back,
  so pixel extraction can't be trusted for these. They're always treated as
  pure white instead.

## How the order works

From left to right:

1. Multicolor icons.
2. Whites and light grays, brightest first, then pastels, with the ones leaning
   toward red last so they lead into the colors.
3. Color blocks, red through pink. Inside each block tabs fade by lightness,
   and the direction alternates (light to dark, then dark to light), so each
   block meets the next at a similar lightness instead of jumping from dark red
   to pale orange.
4. Near-blacks with a hint of color, then dark grays fading to black.
5. Tabs whose icon couldn't be read.

Tab groups move as a block, placed by the color Chrome draws the group in, with
the tabs inside sorted the same way. Tabs on the same site share an icon and so
tie, and since the sort is stable they keep their existing left-to-right order,
which in practice tracks oldest to newest.

All of this lives in [`lib/color.js`](lib/color.js) as plain, dependency-free
functions with no `chrome.*` calls, kept separate from the `chrome.*`
orchestration in `background.js`, `lib/sort.js` and `offscreen.js`.

### Comparing sorts

`dev/compare.html` shows the current window's tabs as they are, sorted the 1.0
way, and sorted the current way, side by side, without moving anything. Hover an
icon to see how it was read. With the extension loaded unpacked, copy its ID
from `chrome://extensions` and open
`chrome-extension://<ID>/dev/compare.html` in the window you want to check.
The `dev/` folder isn't part of the store build.

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
lib/color.js         Pure color math, no chrome.* calls: RGB→OKLCH,
                     dominant-color extraction, the rainbow order. Shared by
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
