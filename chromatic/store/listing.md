# Chromatic, Chrome Web Store listing

Everything the developer dashboard asks for, in the order it asks.

## Name

Chromatic

## Summary (132 characters max)

Sorts the tabs and tab groups in a window into rainbow order by the color of each site's icon. Click again to undo.

## Category

Tools

## Description

Chromatic puts your tabs in rainbow order.

Click the toolbar icon, or press Alt+Shift+R, and the tabs in that window line up red through violet by the color of each site's icon. Light icons gather at the start, dark ones at the end, so the whole strip reads as one gradient. Tab groups move as a block, placed by their group color, with the tabs inside sorted too.

Click again to put everything back where it was. If you've opened, closed or moved a tab since, the next click sorts again instead.

A few details
• Pinned tabs stay put. If every tab in a window is pinned, Chromatic asks before sorting them.
• Tabs from the same site keep their order.
• Unread-count badges on icons are ignored, so a red dot won't turn a blue site red.
• You can change the shortcut at chrome://extensions/shortcuts.

Chromatic collects nothing. It makes no network requests and reads icons from Chrome's own cache.

## Single purpose

Chromatic reorders the tabs in the current window by the color of each tab's site icon, and can undo that reorder.

## Permission justifications

tabs
Reads each tab's address so Chromatic can look up its icon in Chrome's local icon cache, and moves tabs into their sorted order.

tabGroups
Reads each group's color to place the group in the sorted order, and moves groups as a block.

offscreen
Opens a hidden page with a canvas, which is the only place a Manifest V3 extension can read an icon's pixels to work out its color.

favicon
Reads site icons from Chrome's own cache instead of fetching them from each website.

storage
Keeps the window's previous tab order for the current browser session so a second click can undo the sort. It's cleared when Chrome closes.

## Remote code

No, I am not using remote code.

## Data usage

Check none of the boxes. Then certify all three statements (not sold to third parties, not used for unrelated purposes, not used for creditworthiness).

## Homepage URL

https://rancraycraft.com/chromatic/ (from src/chromatic/index.md)

## Support URL

https://github.com/rantbot/portfolio/issues

## Privacy policy URL

https://rancraycraft.com/chromatic/privacy/ (from src/chromatic/privacy.md, live once it's pushed)

## Images

Store icon (128×128) is extension/icons/icon128.png.
Small promo tile (440×280) is promo-small-440x280.png.
Marquee (1400×560, optional) is promo-marquee-1400x560.png.
Screenshots (1280×800, at least one, up to five) still need taking. See below.

## Screenshots to take

1. A busy window before sorting, cropped to the tab strip and a bit of the page.
2. The same window after sorting.
3. A window with two or three tab groups, after sorting.

Use a window at 1280×800, or take them larger and scale down to that exact size.
