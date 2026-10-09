const params = new URLSearchParams(location.search);
const windowId = Number(params.get("windowId"));
const tabId = Number(params.get("tabId"));

document.getElementById("confirm").addEventListener("click", async () => {
  // Awaited so the sort is queued before window.close() below fires the pagehide handler.
  await chrome.runtime.sendMessage({ type: "CONFIRM_SORT_PINNED", windowId });
  window.close();
});

// Fires whether the button was clicked (window.close(), above) or the popup was just
// dismissed by losing focus. Either way, the toolbar action needs to stop pointing at this
// popup afterward so a normal click resumes sorting instead of reopening this confirmation.
// tabId (not windowId) is what chrome.action.setPopup() actually accepts to scope the reset.
window.addEventListener("pagehide", () => {
  chrome.runtime.sendMessage({ type: "SORT_PINNED_POPUP_CLOSED", tabId });
});
