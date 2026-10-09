import { GROUP_COLORS, FORCED_WHITE, isChromeInternalUrl, orderByColor } from "./color.js";

const OFFSCREEN_URL = "offscreen.html";

// The color sequence always starts at red, after the whites and pastels (see orderByColor in
// color.js). Continuing it from the last pinned tab's color was tried, but the white bookend
// already breaks the handoff from the pinned tabs, so matching it bought nothing.

/**
 * Reorders every sortable tab (and tab group) in the given window into rainbow order by
 * favicon/group color. Pinned tabs are left exactly where they are, unless includePinned is
 * set (used when the person chose to sort pinned tabs via the confirm popup).
 *
 * Tabs feed into the color sort in their current left-to-right order. Since the sort is
 * stable, that's what makes several tabs on the same site (which tie on color, sharing a
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
  const ordered = orderByColor(units);

  return await applyOrder(ordered, pinned.length);
}

/**
 * Reads (or, for Chrome-internal pages, forces) a color for every given tab.
 * @param {chrome.tabs.Tab[]} tabs
 * @returns {Promise<Record<string, {l: number, c: number, h: number, multicolor: boolean} | null>>} keyed by tab id
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
 * group's tabs, which move together as a block and are internally sorted by color).
 * @param {chrome.tabs.Tab[]} tabs
 * @param {Map<number, chrome.tabGroups.TabGroup>} groupById
 * @param {Record<string, object | null>} colors
 * @returns {Array<{tabs: chrome.tabs.Tab[], color: object | null, groupId?: number}>}
 */
function buildSortUnits(tabs, groupById, colors) {
  const NO_GROUP = chrome.tabGroups.TAB_GROUP_ID_NONE;
  const units = [];

  const toItem = (tab) => ({ tab, color: colors[tab.id] ?? null });

  for (const tab of tabs.filter((t) => t.groupId === NO_GROUP)) {
    units.push({ tabs: [tab], color: toItem(tab).color });
  }

  const seenGroups = new Set();
  for (const tab of tabs) {
    if (tab.groupId === NO_GROUP || seenGroups.has(tab.groupId)) continue;
    seenGroups.add(tab.groupId);

    const tabsInGroup = tabs.filter((t) => t.groupId === tab.groupId);
    const groupTabItems = tabsInGroup.map(toItem);
    const sortedGroupTabs = orderByColor(groupTabItems).map((item) => item.tab);

    // A group sorts by the color Chrome draws it in, so a red group sits with the red tabs.
    const group = groupById.get(tab.groupId);
    const color = (group && GROUP_COLORS[group.color]) || GROUP_COLORS.grey;

    units.push({ tabs: sortedGroupTabs, groupId: tab.groupId, color });
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
