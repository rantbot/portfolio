import {
  GROUP_COLOR_HUES,
  FORCED_WHITE,
  isChromeInternalUrl,
  hasHue,
  hasSaturationSignal,
  orderByHueThenLightness,
} from "./color.js";

const OFFSCREEN_URL = "offscreen.html";

// The color sequence always starts at red. Continuing it from the last pinned tab's hue was
// tried, but since white/light neutrals always sit right before the color sequence begins
// (see color.js), that white bookend already breaks the visual handoff from the pinned tabs,
// so matching the anchor hue no longer bought anything.
//
// Red sits right at the 0°/360° seam of the hue wheel, so two favicons that both look "red"
// to the eye can measure a few degrees apart on either side of that seam (say hue 2 and hue
// 356) and, on a straight 0→360 sweep, end up at opposite ends of the sort instead of next to
// each other. Starting the sweep a little before 0 gives "red" a buffer that straddles the
// seam, so both sides of it land together at the front, with violet landing just before it.
const START_HUE = -15;

/**
 * Reorders every sortable tab (and tab group) in the given window into rainbow order by
 * favicon/group color. Pinned tabs are left exactly where they are, unless includePinned is
 * set (used when the person chose to sort pinned tabs via the confirm popup).
 *
 * Tabs feed into the color sort in their current left-to-right order. Since the sort is
 * stable, that's what makes several tabs on the same site (which tie on hue, sharing a
 * favicon) hold their existing relative order rather than getting shuffled among themselves,
 * which in practice tracks oldest-to-newest for anyone who hasn't manually dragged tabs
 * around, without needing to track anything extra.
 * @param {number} windowId
 * @param {object} [options]
 * @param {boolean} [options.includePinned=false]
 * @returns {Promise<number>} the number of tabs considered
 */
export async function sortWindow(windowId, { includePinned = false } = {}) {
  const allTabs = await chrome.tabs.query({ windowId });
  const groups = await chrome.tabGroups.query({ windowId });
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const pinned = includePinned ? [] : allTabs.filter((t) => t.pinned).sort((a, b) => a.index - b.index);
  const sortable = (includePinned ? allTabs : allTabs.filter((t) => !t.pinned)).sort(
    (a, b) => a.index - b.index
  );

  if (sortable.length < 2) return sortable.length;

  await ensureOffscreenDocument();

  const colors = await collectColors(sortable);
  const units = buildSortUnits(sortable, groupById, colors);
  const ordered = orderByHueThenLightness(units, START_HUE);

  return await applyOrder(ordered, pinned.length);
}

/**
 * Reads (or, for Chrome-internal pages, forces) a color for every given tab.
 * @param {chrome.tabs.Tab[]} tabs
 * @returns {Promise<Record<string, {h: number, s: number, l: number}>>} keyed by tab id
 */
async function collectColors(tabs) {
  const items = [];
  const forcedColors = {};

  for (const t of tabs) {
    if (isChromeInternalUrl(t.url)) {
      forcedColors[t.id] = FORCED_WHITE;
    } else {
      items.push({ tabId: t.id, pageUrl: t.url });
    }
  }

  const response = await chrome.runtime.sendMessage({ type: "EXTRACT_COLORS", items });
  return { ...(response?.results || {}), ...forcedColors };
}

/**
 * Builds one sortable unit per ungrouped tab, and one per tab group (covering all of that
 * group's tabs, which move together as a block and are internally sorted by hue).
 * @param {chrome.tabs.Tab[]} tabs
 * @param {Map<number, chrome.tabGroups.TabGroup>} groupById
 * @param {Record<string, {h: number, s: number, l: number}>} colors
 * @returns {Array<{tabs: chrome.tabs.Tab[], hue: number | null, rawHue: number | null, lightness: number, groupId?: number}>}
 */
function buildSortUnits(tabs, groupById, colors) {
  const NO_GROUP = chrome.tabGroups.TAB_GROUP_ID_NONE;
  const units = [];

  const toItem = (tab) => {
    const hsl = colors[tab.id];
    return {
      tab,
      hue: hasHue(hsl) ? hsl.h : null,
      rawHue: hasSaturationSignal(hsl) ? hsl.h : null,
      lightness: hsl ? hsl.l : 0.5,
    };
  };

  for (const tab of tabs.filter((t) => t.groupId === NO_GROUP)) {
    const { hue, rawHue, lightness } = toItem(tab);
    units.push({ tabs: [tab], hue, rawHue, lightness });
  }

  const seenGroups = new Set();
  for (const tab of tabs) {
    if (tab.groupId === NO_GROUP || seenGroups.has(tab.groupId)) continue;
    seenGroups.add(tab.groupId);

    const tabsInGroup = tabs.filter((t) => t.groupId === tab.groupId);
    const groupTabItems = tabsInGroup.map(toItem);
    const sortedGroupTabs = orderByHueThenLightness(groupTabItems, START_HUE).map((item) => item.tab);

    const group = groupById.get(tab.groupId);
    const hue = group ? GROUP_COLOR_HUES[group.color] : null;

    // Chrome's fixed group colors have no lightness/paleness concept, so a group's hue is
    // already final, there's no separate "raw" value to fall back on the way there is for an
    // individual tab's too-pale-to-count color.
    units.push({ tabs: sortedGroupTabs, groupId: tab.groupId, hue, rawHue: hue, lightness: 0.5 });
  }

  return units;
}

/**
 * Moves each unit (a single tab, or a whole tab group) into place in order, starting right
 * after the pinned tabs. Groups move as one block via chrome.tabGroups.move, then their
 * tabs are re-moved within that same block to apply the internal sort order.
 * @param {Array<{tabs: chrome.tabs.Tab[], groupId?: number}>} ordered
 * @param {number} startIndex
 * @returns {Promise<number>} total tabs moved
 */
async function applyOrder(ordered, startIndex) {
  let index = startIndex;
  let movedTabCount = 0;

  for (const unit of ordered) {
    if (unit.groupId !== undefined) {
      await chrome.tabGroups.move(unit.groupId, { index });
      // The group now occupies a contiguous block starting at `index`, but its internal tab
      // order hasn't changed yet. Move each tab within that same block to its sorted spot,
      // staying inside the group's own index range so it doesn't get bumped out of the group.
      for (let i = 0; i < unit.tabs.length; i++) {
        await chrome.tabs.move(unit.tabs[i].id, { index: index + i });
      }
    } else {
      await chrome.tabs.move(unit.tabs[0].id, { index });
    }
    index += unit.tabs.length;
    movedTabCount += unit.tabs.length;
  }

  return movedTabCount;
}

async function ensureOffscreenDocument() {
  const existing = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  if (existing.length > 0) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ["DOM_SCRAPING"],
    justification: "Load favicon images onto a canvas to read their dominant color",
  });
}
