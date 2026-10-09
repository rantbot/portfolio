import * as next from "../lib/color.js";
import * as v1 from "./color-v1.js";

const SIZE = 32;

function faviconUrl(pageUrl) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", pageUrl);
  url.searchParams.set("size", String(SIZE));
  return url.toString();
}

async function readPixels(pageUrl) {
  try {
    const res = await fetch(faviconUrl(pageUrl));
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = new OffscreenCanvas(SIZE, SIZE);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, SIZE, SIZE);
    return ctx.getImageData(0, 0, SIZE, SIZE).data;
  } catch {
    return null;
  }
}

function oldOrder(tabs) {
  const items = tabs.map((t) => {
    const hsl = t.oldColor;
    return {
      t,
      hue: v1.hasHue(hsl) ? hsl.h : null,
      rawHue: v1.hasSaturationSignal(hsl) ? hsl.h : null,
      lightness: hsl ? hsl.l : 0.5,
    };
  });
  return v1.orderByHueThenLightness(items, -15).map((i) => i.t);
}

function describe(color) {
  const kind = next.classify(color);
  if (kind === "color") return next.FAMILIES[next.familyIndex(color.h)].name;
  return { light: "light / pastel", dark: "dark", multicolor: "multicolor", missing: "no icon" }[kind];
}

// The section or color block a tab lands in, so the new strip can show gaps between them.
function section(color) {
  const kind = next.classify(color);
  return kind === "color" ? `color-${next.familyIndex(color.h)}` : kind;
}

function strip(title, tabs, { breaks = false } = {}) {
  const h2 = document.createElement("h2");
  h2.textContent = `${title} (${tabs.length})`;
  const div = document.createElement("div");
  div.className = "strip";
  let previous = null;
  for (const t of tabs) {
    const cell = document.createElement("div");
    cell.className = "tab";
    const current = section(t.color);
    if (breaks && previous !== null && current !== previous) cell.classList.add("break");
    previous = current;
    let host = t.url;
    try {
      host = new URL(t.url).host || t.url;
    } catch {
      // keep the raw address
    }
    cell.title = `${host}\n${describe(t.color)}`;
    const img = document.createElement("img");
    img.src = faviconUrl(t.url);
    img.alt = "";
    img.addEventListener("error", () => (img.style.visibility = "hidden"));
    cell.append(img);
    div.append(cell);
  }
  return [h2, div];
}

async function render() {
  const out = document.getElementById("out");
  out.textContent = "Reading icons…";

  const self = await chrome.tabs.getCurrent();
  const all = await chrome.tabs.query({ windowId: self.windowId });
  const tabs = all.filter((t) => !t.pinned && t.id !== self.id).sort((a, b) => a.index - b.index);

  for (const t of tabs) {
    if (next.isChromeInternalUrl(t.url)) {
      t.color = next.FORCED_WHITE;
      t.oldColor = v1.FORCED_WHITE;
      continue;
    }
    const px = await readPixels(t.url);
    t.color = px ? next.extractDominantColor(px, SIZE, SIZE) : null;
    t.oldColor = px ? v1.extractDominantColor(px, SIZE, SIZE) : null;
  }

  out.textContent = "";
  out.append(
    ...strip("Now", tabs),
    ...strip("Old sort (1.0)", oldOrder(tabs)),
    ...strip("New sort", next.orderByColor(tabs), { breaks: true })
  );
}

document.getElementById("refresh").addEventListener("click", render);
render();
