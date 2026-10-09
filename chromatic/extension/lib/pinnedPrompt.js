const CONFIRM_POPUP_URL = "confirm.html";

/**
 * Asks whether to sort the pinned tabs instead, since there's nothing unpinned to sort, by
 * pointing the toolbar action at a small confirmation popup and forcing it open.
 * chrome.action.openPopup() requires a user gesture, which the click that led here carries.
 *
 * chrome.action.setPopup() only accepts a tabId to scope the change, not a windowId (that's a
 * Firefox-only option on the same-named API), so this targets the window's active tab.
 * chrome.action.openPopup() does accept a windowId, so that part is unaffected.
 * @param {number} windowId
 * @returns {Promise<boolean>} whether the popup opened
 */
export async function promptToSortPinned(windowId) {
  let tabId;
  try {
    const [activeTab] = await chrome.tabs.query({ windowId, active: true });
    if (!activeTab) throw new Error("no active tab found for this window");
    tabId = activeTab.id;

    await chrome.action.setPopup({
      tabId,
      popup: `${CONFIRM_POPUP_URL}?windowId=${windowId}&tabId=${tabId}`,
    });
    await chrome.action.openPopup({ windowId });
    return true;
  } catch (err) {
    console.error("[Chromatic] couldn't open the confirm popup:", err);
    if (tabId !== undefined) {
      await chrome.action.setPopup({ tabId, popup: "" }).catch(() => {});
    }
    return false;
  }
}
