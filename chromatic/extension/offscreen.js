// Runs in an offscreen document because MV3 service workers have no DOM/canvas access.
//
// Favicons get pulled through Chrome's own _favicon endpoint instead of fetching each
// site's favicon URL directly. Most sites don't send CORS headers on their favicon, so a
// direct cross-origin fetch fails silently and those tabs would wrongly fall into the
// "no color" bucket. The _favicon endpoint serves the icon Chrome already has cached, from
// the extension's own origin, so there's no network request and no CORS issue at all.

import { extractDominantColor } from "./lib/color.js";

const FAVICON_SAMPLE_SIZE = 32;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "EXTRACT_COLORS") return false;

  (async () => {
    const results = {};
    for (const item of message.items) {
      results[item.tabId] = await extractColor(item.pageUrl);
    }
    sendResponse({ results });
  })();

  return true; // keep the message channel open for the async response
});

/**
 * Builds a URL to Chrome's local favicon cache for a given page. Served from the
 * extension's own chrome-extension:// origin, so reading it back onto a canvas never
 * taints the canvas the way a direct cross-origin image fetch would.
 * @param {string} pageUrl
 * @returns {string}
 */
function faviconUrl(pageUrl) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", String(FAVICON_SAMPLE_SIZE));
  return url.toString();
}

/**
 * Fetches a page's favicon and extracts its dominant color.
 * @param {string} pageUrl
 * @returns {Promise<{h: number, s: number, l: number} | null>} null on any failure (no
 *   favicon, network error, fully transparent image, etc.)
 */
async function extractColor(pageUrl) {
  if (!pageUrl) return null;

  try {
    const res = await fetch(faviconUrl(pageUrl));
    if (!res.ok) return null;

    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);

    const size = FAVICON_SAMPLE_SIZE;
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(bitmap, 0, 0, size, size);

    const { data } = ctx.getImageData(0, 0, size, size);
    return extractDominantColor(data, size, size);
  } catch {
    return null;
  }
}
