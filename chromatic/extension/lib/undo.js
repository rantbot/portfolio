/**
 * @param {number} windowId
 * @returns {string}
 */
export function undoStorageKey(windowId) {
  return `undoState:${windowId}`;
}

/**
 * Records each sortable tab's current absolute index, the minimum needed to restore the
 * window's layout later.
 * @param {number} windowId
 * @param {object} [options]
 * @param {boolean} [options.includePinned=false] include pinned tabs (used when the person
 *   chose to sort pinned tabs via the confirm popup)
 * @returns {Promise<Array<{tabId: number, index: number}>>}
 */
export async function captureSnapshot(windowId, { includePinned = false } = {}) {
  const tabs = await chrome.tabs.query({ windowId });
  return tabs.filter((t) => includePinned || !t.pinned).map((t) => ({ tabId: t.id, index: t.index }));
}

/**
 * The window's whole tab order as one string, used to tell whether anything has changed
 * since a sort. Group membership is included, since dragging a tab into a group is a change.
 * @param {number} windowId
 * @returns {Promise<string>}
 */
export async function windowFingerprint(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  return tabs
    .sort((a, b) => a.index - b.index)
    .map((t) => `${t.id}:${t.groupId}:${t.pinned ? 1 : 0}`)
    .join(",");
}

/**
 * Moves each snapshotted tab back to its recorded index, left to right, which reconstructs
 * the original arrangement (and, since group membership is a per-tab property, restores
 * each tab group's contiguous position along with it). Tabs closed since the snapshot was
 * taken are skipped rather than failing the whole restore.
 * @param {Array<{tabId: number, index: number}>} snapshot
 */
export async function restoreSnapshot(snapshot) {
  const ordered = [...snapshot].sort((a, b) => a.index - b.index);
  for (const { tabId, index } of ordered) {
    try {
      await chrome.tabs.move(tabId, { index });
    } catch {
      // Tab was closed since the snapshot was taken; nothing to restore it to.
    }
  }
}
