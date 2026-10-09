/**
 * Pure color-math helpers shared by lib/sort.js (which decides tab order) and offscreen.js
 * (the DOM context that actually reads favicon pixels).
 *
 * Everything in this file is a pure function or constant, no chrome.* APIs, so it can be
 * unit tested directly with plain arrays and imported unmodified into both contexts.
 *
 * Color is measured in OKLCH rather than HSL. OKLCH is built around how people see color:
 * L is how light a color looks, C (chroma) is how vivid it looks, and h is its hue, with hues
 * spaced the way the eye spaces them. HSL calls pure yellow and navy blue equally light, and
 * squeezes cyan and blue into a sliver of the wheel while giving green a huge range, which is
 * what made "pale" and the color families feel off before.
 */

/** Chroma below this reads as gray. Used for single pixels and for an icon's final color. */
export const NEUTRAL_CHROMA = 0.045;

/** A color this light and this soft reads as a pastel, so it sits with the whites. */
export const PALE_LIGHTNESS = 0.86;
export const PALE_CHROMA = 0.1;

/** A color this dark and this soft reads as near-black, so it sits with the blacks. */
export const DARK_LIGHTNESS = 0.3;
export const DARK_CHROMA = 0.08;

/** Neutrals at or above this lightness go in the light bookend, below it in the dark one. */
export const LIGHT_NEUTRAL_CUTOFF = 0.6;

/**
 * The color families, in rainbow order, as OKLCH hue centers. Every colorful icon belongs to
 * the family whose center is nearest. The centers were placed so real brand colors land
 * where people expect, Facebook, Dropbox and Zoom together in blue, Discord, Stripe and
 * Linear together in indigo, Amazon in orange, Mailchimp and Miro in yellow.
 */
export const FAMILIES = Object.freeze([
  { name: "red", hue: 25 },
  { name: "orange", hue: 55 },
  { name: "yellow", hue: 95 },
  { name: "green", hue: 142 },
  { name: "teal", hue: 190 },
  { name: "blue", hue: 252 },
  { name: "indigo", hue: 278 },
  { name: "violet", hue: 305 },
  { name: "pink", hue: 345 },
]);

/**
 * Chrome's tab group colors in OKLCH, measured from the colors Chrome draws them in, so a
 * group slots into the same rainbow as a single tab. Grey has no hue and sorts as a neutral.
 */
export const GROUP_COLORS = Object.freeze({
  red: { l: 0.58, c: 0.206, h: 29 },
  orange: { l: 0.75, c: 0.158, h: 55 },
  yellow: { l: 0.8, c: 0.167, h: 76 },
  green: { l: 0.53, c: 0.141, h: 148 },
  cyan: { l: 0.53, c: 0.09, h: 203 },
  blue: { l: 0.57, c: 0.195, h: 258 },
  purple: { l: 0.6, c: 0.25, h: 304 },
  pink: { l: 0.57, c: 0.225, h: 352 },
  grey: { l: 0.5, c: 0, h: 0 },
});

/**
 * Chrome's own internal pages (chrome://extensions and similar) render their favicon
 * differently depending on system dark/light mode, and the icon Chrome's `_favicon` endpoint
 * hands back is often the light-mode asset, so pixel extraction can't be trusted for these.
 * They're always treated as pure white instead.
 *
 * This deliberately does NOT cover chrome-extension:// pages, some other installed
 * extension's own page, which have an ordinary, stable favicon.
 */
export const FORCED_WHITE = Object.freeze({ l: 1, c: 0, h: 0, multicolor: false });

/**
 * @param {string} url
 * @returns {boolean} true only for chrome:// pages (Chrome's own UI), not chrome-extension://
 */
export function isChromeInternalUrl(url) {
  return typeof url === "string" && url.startsWith("chrome://");
}

function srgbToLinear(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converts 8-bit sRGB to OKLCH. l in [0, 1], c from 0 to about 0.37, h in degrees [0, 360).
 */
export function rgbToOklch(r, g, b) {
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bk = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  let h = (Math.atan2(Bk, A) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c: Math.hypot(A, Bk), h };
}

/** Shortest distance around the wheel, so circularDistance(350, 10) is 20. */
export function circularDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** @returns {number} index into FAMILIES of the family nearest this hue */
export function familyIndex(hue) {
  let best = 0;
  for (let i = 1; i < FAMILIES.length; i++) {
    if (circularDistance(hue, FAMILIES[i].hue) < circularDistance(hue, FAMILIES[best].hue)) best = i;
  }
  return best;
}

/**
 * Sums up a set of pixels: how much of each color family they hold (weighted by how vivid
 * and how opaque each pixel is), and the average lightness of the gray ones.
 */
function tally(pixels) {
  const families = FAMILIES.map(() => ({ weight: 0, count: 0, sin: 0, cos: 0, c: 0, l: 0 }));
  let neutralCount = 0;
  let neutralLightness = 0;
  let lightnessSum = 0;

  for (const p of pixels) {
    lightnessSum += p.l;

    if (p.c < NEUTRAL_CHROMA) {
      neutralCount++;
      neutralLightness += p.l;
      continue;
    }

    const f = families[familyIndex(p.h)];
    const w = p.c * p.a;
    const rad = (p.h * Math.PI) / 180;
    f.weight += w;
    f.count++;
    f.sin += Math.sin(rad) * w;
    f.cos += Math.cos(rad) * w;
    f.c += p.c * w;
    f.l += p.l * w;
  }

  let peak = 0;
  for (let i = 1; i < families.length; i++) {
    if (families[i].weight > families[peak].weight) peak = i;
  }

  return {
    families,
    peak,
    colorfulWeight: families.reduce((sum, f) => sum + f.weight, 0),
    colorfulCount: families.reduce((sum, f) => sum + f.count, 0),
    opaqueCount: pixels.length,
    neutralLightness: neutralCount > 0 ? neutralLightness / neutralCount : null,
    meanLightness: pixels.length > 0 ? lightnessSum / pixels.length : 0,
  };
}

/**
 * Whether a tally holds several strong, unrelated colors, like Google's G, Slack's hash or
 * Microsoft's four squares. Any single color picked from those is arbitrary, so they get
 * their own place in the sort instead.
 *
 * Three or more families each holding a real share of the color counts, unless they all sit
 * side by side on the wheel (red, orange and yellow in a sunset gradient is one warm color).
 */
function isMulticolor(t) {
  if (t.colorfulCount < 12) return false;

  const strong = [];
  t.families.forEach((f, i) => {
    if (f.weight / t.colorfulWeight >= 0.15) strong.push(i);
  });
  if (strong.length < 3) return false;

  const n = FAMILIES.length;
  for (const start of strong) {
    const fitsInThree = strong.every((i) => (i - start + n) % n <= 2);
    if (fitsInThree) return false;
  }
  return true;
}

/** The red-ish families an unread badge is usually drawn in (red, orange, pink). */
const BADGE_FAMILIES = new Set([0, 1, FAMILIES.length - 1]);

/**
 * Whether the top-right corner holds a notification badge, a small, vivid, red-ish dot that
 * doesn't match the rest of the icon. Only then is the corner left out, so icons without a
 * badge are read whole.
 */
function hasBadge(cornerPixels, restTally) {
  if (cornerPixels.length === 0) return false;
  const vividRed = cornerPixels.filter((p) => p.c >= 0.12 && BADGE_FAMILIES.has(familyIndex(p.h))).length;
  if (vividRed / cornerPixels.length < 0.2) return false;

  // A red icon with red in its corner is just a red icon.
  const restIsRed = restTally.colorfulCount > 0 && BADGE_FAMILIES.has(restTally.peak);
  return !restIsRed;
}

/**
 * Works out the color a person would call an icon, from its RGBA pixels.
 *
 * Colors vote by family, weighted by how vivid each pixel is, and the heaviest family wins,
 * so a multi-hue icon doesn't average out to gray. Then a few checks match what the eye sees.
 * Several strong unrelated colors mark it multicolor. A small colored mark on a big gray,
 * black or white tile takes the tile's color, since that's what shows in the tab bar. An
 * unread badge in the top-right corner is ignored, but only when there is one.
 *
 * @param {Uint8ClampedArray|number[]} pixels flat RGBA data, 4 values per pixel
 * @param {number} width
 * @param {number} height
 * @param {object} [options]
 * @param {number} [options.minAlpha=100] ignore pixels less opaque than this (0-255)
 * @param {number} [options.badgeMarginFraction=0.35] size of the top-right corner checked for a badge
 * @param {number} [options.markShare=0.25] colorful pixels below this share of a solid tile count as a small mark
 * @returns {{l: number, c: number, h: number, multicolor: boolean} | null} null only when
 *   there were no opaque pixels at all
 */
export function extractDominantColor(pixels, width, height, options = {}) {
  const { minAlpha = 100, badgeMarginFraction = 0.35, markShare = 0.25 } = options;

  const rest = [];
  const corner = [];
  const badgeX = width - Math.ceil(width * badgeMarginFraction);
  const badgeY = Math.ceil(height * badgeMarginFraction);

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < minAlpha) continue;

    const index = i / 4;
    const x = index % width;
    const y = Math.floor(index / width);
    const p = { ...rgbToOklch(pixels[i], pixels[i + 1], pixels[i + 2]), a: alpha / 255 };
    (x >= badgeX && y < badgeY ? corner : rest).push(p);
  }

  if (rest.length + corner.length === 0) return null;

  const restTally = tally(rest);
  const t = hasBadge(corner, restTally) ? restTally : tally([...rest, ...corner]);

  const neutral = () => ({ l: t.neutralLightness ?? t.meanLightness, c: 0, h: 0, multicolor: false });

  if (t.colorfulCount === 0) return neutral();
  if (isMulticolor(t)) return { l: t.meanLightness, c: 0, h: 0, multicolor: true };

  // A solid tile (most of the icon is opaque) that's mostly gray, black or white, with only
  // a small colored mark on it, looks like the tile in a tab bar.
  const solidTile = t.opaqueCount / (width * height) >= 0.8;
  if (solidTile && t.colorfulCount / t.opaqueCount < markShare) return neutral();

  const f = t.families[t.peak];
  let h = (Math.atan2(f.sin, f.cos) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: f.l / f.weight, c: f.c / f.weight, h, multicolor: false };
}

/**
 * Sorts a color into where it goes in the strip.
 * @param {{l: number, c: number, h: number, multicolor?: boolean} | null | undefined} color
 * @returns {"missing" | "multicolor" | "light" | "dark" | "color"}
 */
export function classify(color) {
  if (!color) return "missing";
  if (color.multicolor) return "multicolor";
  if (color.c < NEUTRAL_CHROMA) return color.l >= LIGHT_NEUTRAL_CUTOFF ? "light" : "dark";
  if (color.l > PALE_LIGHTNESS && color.c < PALE_CHROMA) return "light";
  if (color.l < DARK_LIGHTNESS && color.c < DARK_CHROMA) return "dark";
  return "color";
}

/**
 * Orders items by color, light to color to dark, as one long rainbow.
 *
 * - Multicolor icons go first, then whites and light grays, then pastels, with the pastels
 *   that lean toward red last so they lead into the color blocks.
 * - Colors come in blocks by family, red through pink, so it's easy to find "the red ones".
 *   Inside each block tabs fade by lightness, and the direction alternates block to block
 *   (light to dark, then dark to light), so each block meets the next at a similar lightness
 *   instead of jumping from dark red to pale orange.
 * - Near-blacks and dark grays come after the colors, the ones with a hint of pink first.
 * - Tabs whose icon couldn't be read go at the very end.
 *
 * The sort is stable, so tabs that share an icon (several tabs on one site) keep their order.
 *
 * @template {{color: {l: number, c: number, h: number, multicolor?: boolean} | null}} T
 * @param {T[]} items
 * @returns {T[]} the same items, reordered
 */
export function orderByColor(items) {
  const groups = { missing: [], multicolor: [], light: [], dark: [], color: [] };
  for (const item of items) groups[classify(item.color)].push(item);

  const first = FAMILIES[0].hue;
  const last = FAMILIES[FAMILIES.length - 1].hue;
  const lean = (item, anchor) => (item.color.c >= NEUTRAL_CHROMA ? circularDistance(item.color.h, anchor) : null);

  // Light bookend: pure neutrals brightest first, then tinted pastels, farthest from red first.
  groups.light.sort((a, b) => {
    const la = lean(a, first);
    const lb = lean(b, first);
    if (la === null && lb === null) return b.color.l - a.color.l;
    if (la === null) return -1;
    if (lb === null) return 1;
    return lb - la;
  });

  // Dark bookend: tinted darks closest to pink first, then grays fading to black.
  groups.dark.sort((a, b) => {
    const la = lean(a, last);
    const lb = lean(b, last);
    if (la !== null && lb !== null) return la - lb;
    if (la !== null) return -1;
    if (lb !== null) return 1;
    return b.color.l - a.color.l;
  });

  groups.multicolor.sort((a, b) => b.color.l - a.color.l);

  const blocks = FAMILIES.map(() => []);
  for (const item of groups.color) blocks[familyIndex(item.color.h)].push(item);

  const colors = [];
  let lightFirst = true;
  for (const block of blocks) {
    if (block.length === 0) continue;
    block.sort((a, b) => (lightFirst ? b.color.l - a.color.l : a.color.l - b.color.l));
    colors.push(...block);
    lightFirst = !lightFirst;
  }

  return [...groups.multicolor, ...groups.light, ...colors, ...groups.dark, ...groups.missing];
}
