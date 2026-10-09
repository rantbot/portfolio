/**
 * The 1.0 color logic, kept only so dev/compare.html can show the old order next to the new
 * one. Not part of the extension build.
 *
 * Pure color-math helpers shared by background.js (the service worker that decides tab
 * order) and offscreen.js (the DOM context that actually reads favicon pixels).
 *
 * Everything in this file is a pure function or constant, no chrome.* APIs, so it can be
 * unit tested directly with plain arrays and imported unmodified into both contexts.
 */

/** A saturation below this is treated as "no real color" once a color has already been extracted. */
export const HUE_SATURATION_THRESHOLD = 0.15;

/**
 * A lightness above this is treated as too pale to belong in the vivid rainbow, even when it
 * carries a real, correctly-detected hue. A rainbow reads as a rainbow because its colors are
 * vivid; a washed-out pastel (a light Google icon, say) doesn't serve that even though it
 * technically has a hue, so it's grouped with the light neutrals instead.
 */
export const PALE_LIGHTNESS_THRESHOLD = 0.78;

/**
 * Chrome's fixed tab group palette, mapped to approximate hues so a group can slot into the
 * same rainbow order as an individual tab. "grey" has no hue and is treated as neutral.
 */
export const GROUP_COLOR_HUES = {
  red: 5,
  orange: 25,
  yellow: 45,
  green: 130,
  cyan: 185,
  blue: 210,
  purple: 265,
  pink: 330,
  grey: null,
};

/**
 * Chrome's own internal pages (chrome://extensions and similar) render their favicon
 * differently depending on system dark/light mode. In dark mode the icon Chrome's
 * `_favicon` endpoint hands back is often still the original, non-dark-mode asset, so pixel
 * extraction can't be trusted for these. They're always treated as pure white instead, which
 * is how they actually render in a dark-mode tab strip.
 *
 * This deliberately does NOT cover chrome-extension:// pages, which are a different thing:
 * some *other* installed extension's own page (an options page, a "leave a review" prompt,
 * etc.), not Chrome's UI. Those have an ordinary, stable favicon with no dark-mode mismatch,
 * so they go through normal color extraction like any other page.
 */
export const FORCED_WHITE = Object.freeze({ h: 0, s: 0, l: 1 });

/**
 * @param {string} url
 * @returns {boolean} true only for chrome:// pages (Chrome's own UI), not chrome-extension://
 *   pages (some other installed extension's own page)
 */
export function isChromeInternalUrl(url) {
  return typeof url === "string" && url.startsWith("chrome://");
}

/**
 * @param {{h: number, s: number, l: number} | null | undefined} hsl
 * @returns {boolean} whether this color carries enough saturation to sort by hue, and isn't
 *   so pale/washed-out that it should be treated as a light neutral instead
 */
export function hasHue(hsl) {
  return Boolean(hsl && hsl.s >= HUE_SATURATION_THRESHOLD && hsl.l <= PALE_LIGHTNESS_THRESHOLD);
}

/**
 * Unlike hasHue, this ignores paleness entirely, it only asks whether a real hue was
 * detected at all. A pale, washed-out color still has this even though hasHue rejects it,
 * which is what lets a demoted-for-paleness color be placed within the neutral bookend by
 * which color it leans toward, rather than being treated as having no hue information at all.
 * @param {{h: number, s: number} | null | undefined} hsl
 * @returns {boolean}
 */
export function hasSaturationSignal(hsl) {
  return Boolean(hsl && hsl.s >= HUE_SATURATION_THRESHOLD);
}

/**
 * Converts 8-bit RGB to HSL. Standard conversion, h in degrees [0, 360), s and l in [0, 1].
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s, l };
}

/**
 * Signed-shortest-path distance in degrees from `anchorHue` to `hue`, always in [0, 360).
 * Used to sort colors as if the rainbow starts at the anchor rather than always at red.
 */
export function hueDistance(hue, anchorHue) {
  return (((hue - anchorHue) % 360) + 360) % 360;
}

/**
 * The named color centers tabs are bucketed into before sorting, reusing Chrome's own tab
 * group palette (minus grey, which has no hue) as the canonical set of "named colors" so a
 * favicon and a tab group agree on what counts as, say, "red".
 */
const NAMED_HUE_CENTERS = Object.values(GROUP_COLOR_HUES).filter((hue) => hue !== null);

/**
 * Ordinary shortest-path circular distance, e.g. distance(350, 10) is 20, not 340. Used only
 * to find which named color a hue is closest to; the final sort order still uses the
 * one-directional hueDistance above, which is a different measurement on purpose.
 */
function circularDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Snaps a hue to whichever named color center it's closest to. Two different brands' reds
 * (say hue 350 and hue 10) both look "red" to a person even though they're 20° apart, and
 * sorting by raw hue alone can let an unrelated color's hue fall numerically between them.
 * Snapping first groups every red-ish favicon into one block regardless of the exact shade,
 * matching how people actually categorize color rather than a continuous sweep.
 * @param {number} hue
 * @returns {number} the nearest value in NAMED_HUE_CENTERS
 */
export function nearestNamedHue(hue) {
  let nearest = NAMED_HUE_CENTERS[0];
  let minDistance = circularDistance(hue, nearest);

  for (const center of NAMED_HUE_CENTERS.slice(1)) {
    const distance = circularDistance(hue, center);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = center;
    }
  }

  return nearest;
}

/**
 * Finds the dominant hue in a block of RGBA pixel data by binning saturated pixels into hue
 * buckets (weighted by how saturated each pixel is) and taking the heaviest bucket. This is
 * deliberately not a flat average: an icon that spans several hues at once (Chrome's own
 * pinwheel logo, for example) would average out to a washed-out gray and get wrongly sorted
 * as neutral. Finding the peak bucket instead avoids that cancellation.
 *
 * @param {Uint8ClampedArray|number[]} pixels flat RGBA data, 4 values per pixel
 * @param {number} width
 * @param {number} height
 * @param {object} [options]
 * @param {number} [options.minAlpha=100] ignore pixels less opaque than this (0-255)
 * @param {number} [options.badgeMarginFraction=0.35] ignore this fraction of width/height in the top-right corner, where notification badges are conventionally drawn
 * @param {number} [options.neutralSaturationThreshold=0.18] per-pixel saturation below this doesn't count toward the hue vote
 * @param {number} [options.binCount=24] number of hue buckets (360 / binCount degrees each)
 * @param {number} [options.whiteLightnessThreshold=0.85] mean lightness above this triggers the stricter check below, for a mostly-white icon
 * @param {number} [options.faintColorSaturationThreshold=0.3] when the icon is overwhelmingly light, its colorful pixels must average at least this saturation to be trusted as a real logo color rather than a faint tinted shadow
 * @param {number} [options.minColorfulWeight=1.5] an absolute floor on colorful weight, regardless of area
 * @returns {{h: number, s: number, l: number} | null} null only when there were no sampled pixels at all (e.g. a fully transparent image)
 */
export function extractDominantColor(pixels, width, height, options = {}) {
  const {
    minAlpha = 100,
    badgeMarginFraction = 0.35,
    neutralSaturationThreshold = 0.18,
    binCount = 24,
    whiteLightnessThreshold = 0.85,
    faintColorSaturationThreshold = 0.3,
    minColorfulWeight = 1.5,
  } = options;

  const bins = new Array(binCount).fill(0);
  const binPixels = Array.from({ length: binCount }, () => []);

  let neutralLightnessSum = 0;
  let neutralCount = 0;
  let totalCount = 0;
  let totalLightnessSum = 0;

  const badgeMarginX = Math.ceil(width * badgeMarginFraction);
  const badgeMarginY = Math.ceil(height * badgeMarginFraction);

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < minAlpha) continue;

    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    if (x >= width - badgeMarginX && y < badgeMarginY) continue; // skip badge corner

    const { h, s, l } = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);

    totalCount++;
    totalLightnessSum += l;

    if (s < neutralSaturationThreshold) {
      neutralLightnessSum += l;
      neutralCount++;
      continue;
    }

    const bin = Math.floor(h / (360 / binCount)) % binCount;
    bins[bin] += s;
    binPixels[bin].push({ h, s, l });
  }

  if (totalCount === 0) return null;

  const colorfulWeight = bins.reduce((sum, w) => sum + w, 0);
  const colorfulPixelCount = binPixels.reduce((sum, arr) => sum + arr.length, 0);
  const meanLightness = totalLightnessSum / totalCount;
  const avgColorfulSaturation = colorfulPixelCount > 0 ? colorfulWeight / colorfulPixelCount : 0;

  // Area alone doesn't tell you whether a color is real: a small, fully-saturated logo on a
  // big solid background (Supabase's green bolt on black, say) should still count as
  // colorful even though the background vastly outnumbers it in pixels. What actually needs
  // catching is the opposite case, an icon that's overwhelmingly light where the only "color"
  // is a faint, weakly-saturated artifact (anti-aliasing, a soft drop shadow). That's judged
  // by how saturated the colorful pixels are on average, not by how many of them there are.
  const isOverwhelminglyLight = meanLightness > whiteLightnessThreshold;
  const colorTooFaintToTrust = isOverwhelminglyLight && avgColorfulSaturation < faintColorSaturationThreshold;

  if (colorfulPixelCount === 0 || colorfulWeight < minColorfulWeight || colorTooFaintToTrust) {
    const l = neutralCount > 0 ? neutralLightnessSum / neutralCount : meanLightness;
    return { h: 0, s: 0, l };
  }

  let peakBin = 0;
  for (let b = 1; b < binCount; b++) {
    if (bins[b] > bins[peakBin]) peakBin = b;
  }

  // Circular weighted mean of the hues inside the winning bin, so the result isn't just
  // snapped to the bin's center. Lightness is tracked the same way, so a pale, washed-out
  // color and a rich, vivid one with the same hue don't come out identical: a real lightness
  // value is what lets a pale tint get treated differently from a vivid color later, instead
  // of every colorful result defaulting to the same placeholder mid-lightness.
  let sinSum = 0;
  let cosSum = 0;
  let sSum = 0;
  let lSum = 0;

  for (const { h, s, l } of binPixels[peakBin]) {
    const rad = (h * Math.PI) / 180;
    sinSum += Math.sin(rad) * s;
    cosSum += Math.cos(rad) * s;
    sSum += s;
    lSum += l;
  }

  let meanHue = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
  if (meanHue < 0) meanHue += 360;

  const meanSaturation = sSum / binPixels[peakBin].length;
  const meanColorLightness = lSum / binPixels[peakBin].length;

  return { h: meanHue, s: meanSaturation, l: meanColorLightness };
}

/**
 * Splits a list of `{ hue, rawHue, lightness }`-shaped items into hue-sorted "colorful" items
 * bookended by "neutral" items. Lighter neutrals (whites, light grays) go right before the
 * color sequence starts; darker neutrals (blacks, dark grays) go right after it ends. The
 * result reads as one smooth light → color → dark gradient, rather than dumping every
 * non-colorful item in a single clump at one end. Used for both individual tabs and whole
 * tab groups, since both share this same shape.
 *
 * Colorful items sort primarily by which named color they're nearest to (see
 * nearestNamedHue), measured as distance from `startHue` so the sequence can begin anywhere
 * on the wheel, and only secondarily by their exact hue. That keeps every red-ish tab in one
 * block regardless of small brand-color differences, rather than letting an unrelated color
 * that happens to fall numerically between two "reds" split them apart.
 *
 * Within each neutral bookend, items with a real hue underneath (a color too pale to count
 * as "colorful", but not truly achromatic) are placed by how close that hue is to the color
 * sequence, so the handoff from white into the rainbow (and from the rainbow into black)
 * eases through near-colors first rather than jumping straight from pure gray to full color.
 * Truly achromatic items (no hue signal at all) sit at the far end of their bookend, away
 * from the color sequence, sorted by lightness as before.
 * @param {Array<{hue: number | null, rawHue?: number | null, lightness: number}>} items
 * @param {number} startHue degrees; colors are ordered by distance from this hue
 * @param {number} [midLightness=0.5] the lightness cutoff between the "light" and "dark" neutral halves
 * @returns {Array} the same items, reordered
 */
export function orderByHueThenLightness(items, startHue, midLightness = 0.5) {
  const colorful = items.filter((item) => item.hue !== null && item.hue !== undefined);
  const neutral = items.filter((item) => item.hue === null || item.hue === undefined);

  const lightNeutrals = neutral.filter((item) => item.lightness > midLightness);
  const darkNeutrals = neutral.filter((item) => item.lightness <= midLightness);

  colorful.sort((a, b) => {
    const familyDiff =
      hueDistance(nearestNamedHue(a.hue), startHue) - hueDistance(nearestNamedHue(b.hue), startHue);
    return familyDiff !== 0 ? familyDiff : hueDistance(a.hue, startHue) - hueDistance(b.hue, startHue);
  });

  // Ascending: an item with a real (but too-pale-to-count) hue gets a more negative key the
  // closer that hue sits to startHue, so the reddest-leaning pale item ends up last, right
  // next to where the colorful sequence begins. A truly achromatic item (no hue signal) gets
  // pushed to whichever end is farthest from the color sequence.
  const affinityKey = (item, farEnd) => {
    const rawHue = item.rawHue ?? null;
    if (rawHue === null) return farEnd;
    return -hueDistance(rawHue, startHue);
  };

  lightNeutrals.sort((a, b) => {
    const diff = affinityKey(a, -Infinity) - affinityKey(b, -Infinity);
    return diff !== 0 ? diff : b.lightness - a.lightness; // tie-break: brightest first
  });
  darkNeutrals.sort((a, b) => {
    const diff = affinityKey(a, Infinity) - affinityKey(b, Infinity);
    return diff !== 0 ? diff : b.lightness - a.lightness; // tie-break: brightest first
  });

  return [...lightNeutrals, ...colorful, ...darkNeutrals];
}
