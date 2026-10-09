import { sortWindow } from "./lib/sort.js";
import { undoStorageKey, captureSnapshot, restoreSnapshot, windowFingerprint } from "./lib/undo.js";
import { promptToSortPinned } from "./lib/pinnedPrompt.js";

const BADGE_SORTED = { text: "✓", color: "#34c759" };
const BADGE_UNDONE = { text: "↺", color: "#8e8e93" }; // ↺
const BADGE_NOTHING_TO_SORT = { text: "–", color: "#8e8e93" }; // –
const BADGE_ERROR = { text: "!", color: "#ff3b30" };
const BADGE_DURATION_MS = 1200;

chrome.action.onClicked.addListener((tab) => {
  handleClick(tab.windowId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "CONFIRM_SORT_PINNED") {
    handleConfirmSortPinned(message.windowId).then(() => sendResponse({ ok: true }));
    return true; // keep the message channel open for the async sendResponse above
  }
  if (message?.type === "SORT_PINNED_POPUP_CLOSED") {
    // Restores normal click-to-sort behavior for this tab, regardless of whether the popup
    // was confirmed or just dismissed by losing focus. chrome.action.setPopup() only accepts
    // tabId, not windowId, so the tab id is threaded through from the popup.
    chrome.action.setPopup({ tabId: message.tabId, popup: "" });
    return false;
  }
  return false;
});

/**
 * Toggles between sorting and undoing, per window. The first click sorts and remembers each
 * tab's original position. A second click restores it, but only if the window still looks
 * exactly the way the sort left it. Once the person opens, closes or moves a tab, the undo
 * is forgotten and the next click sorts afresh, so an old undo never surprises anyone.
 * @param {number} windowId
 */
async function handleClick(windowId) {
  try {
    const undoKey = undoStorageKey(windowId);
    const stored = await chrome.storage.session.get(undoKey);
    const saved = stored[undoKey];

    if (saved) {
      await chrome.storage.session.remove(undoKey);
      if (saved.after === (await windowFingerprint(windowId))) {
        await restoreSnapshot(saved.before);
        await flashBadge(BADGE_UNDONE);
        return;
      }
    }

    const before = await captureSnapshot(windowId);
    const movedCount = await sortWindow(windowId);

    if (movedCount < 2) {
      // Nothing unpinned to reorder, most commonly because every tab is pinned. If there are
      // at least two pinned tabs, ask whether to sort those instead.
      const pinnedTabs = await chrome.tabs.query({ windowId, pinned: true });
      if (pinnedTabs.length >= 2 && (await promptToSortPinned(windowId))) return;
      await flashBadge(BADGE_NOTHING_TO_SORT);
      return;
    }

    await rememberUndo(windowId, before);
    await flashBadge(BADGE_SORTED);
  } catch (err) {
    console.error("[Chromatic] failed:", err);
    await flashBadge(BADGE_ERROR);
  }
}

/**
 * Sorts the pinned tabs in a window once the person has confirmed in the popup, and records
 * an undo the same as a normal sort.
 * @param {number} windowId
 */
async function handleConfirmSortPinned(windowId) {
  try {
    const before = await captureSnapshot(windowId, { includePinned: true });
    const movedCount = await sortWindow(windowId, { includePinned: true });

    if (movedCount >= 2) await rememberUndo(windowId, before);
    await flashBadge(BADGE_SORTED);
  } catch (err) {
    console.error("[Chromatic] failed to sort pinned tabs:", err);
    await flashBadge(BADGE_ERROR);
  }
}

/**
 * Saves the pre-sort layout along with a fingerprint of the sorted one.
 * @param {number} windowId
 * @param {Array<{tabId: number, index: number}>} before
 */
async function rememberUndo(windowId, before) {
  const after = await windowFingerprint(windowId);
  await chrome.storage.session.set({ [undoStorageKey(windowId)]: { before, after } });
}

/**
 * Briefly shows a badge on the toolbar icon to confirm what happened, then clears it.
 * @param {{text: string, color: string}} badge
 */
async function flashBadge({ text, color }) {
  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), BADGE_DURATION_MS);
}
