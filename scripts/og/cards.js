// Share cards. Pages without their own photo get a 1200×630 card for link previews
// on LinkedIn, Slack, iMessage and the rest, drawn at build time from the page's title.
// Templates ask for a card with the ogCard filter, and the cards are drawn after the build.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

const here = dirname(fileURLToPath(import.meta.url));
const font = (f) => readFileSync(join(here, "fonts", f));
const fonts = [
  { name: "Newsreader", data: font("newsreader-360.ttf"), weight: 400, style: "normal" },
  { name: "Instrument Sans", data: font("instrument-sans-500.ttf"), weight: 500, style: "normal" },
  { name: "Mark", data: font("inter-tight-bold.ttf"), weight: 700, style: "normal" }
];

const queue = new Map();

// Returns the card's address and remembers what to draw. The address is the page's own, so /leading/wildebeest/ gets /og/leading/wildebeest.png.
export function ogCard(url, { title, kicker, tone, ink, note } = {}) {
  if (typeof url !== "string") return "/assets/og-default.png"; // drafts have no address
  const slug = url.replace(/^\/|\/$/g, "") || "home";
  const path = `/og/${slug}.png`;
  queue.set(path, { title: title || "", kicker: kicker || "", note: note || "", tone: tone || "#FAFAF7", ink: ink || "#262624" });
  return path;
}

const el = (type, style, children) => ({ type, props: { style, children } });

function card({ title, kicker, note, tone, ink }) {
  // Section pages (a short title and a line about the section) set the title larger, with the line beneath
  const size = note ? 120 : title.length > 90 ? 58 : title.length > 60 ? 66 : 76;
  const middle = note
    ? el("div", { display: "flex", flexDirection: "column" }, [
        el("div", { display: "flex", fontFamily: "Newsreader", fontSize: size, lineHeight: 1, letterSpacing: "-0.035em" }, title),
        el("div", { display: "flex", marginTop: 26, fontFamily: "Newsreader", fontSize: 36, lineHeight: 1.3, opacity: 0.72, maxWidth: 940 }, note)
      ])
    : el("div", { display: "flex", fontFamily: "Newsreader", fontSize: size, lineHeight: 1.06, letterSpacing: "-0.025em", maxWidth: 1000 }, title);
  return el("div", { width: 1200, height: 630, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px 60px", background: tone, color: ink }, [
    el("div", { display: "flex", fontFamily: "Instrument Sans", fontSize: 26, opacity: 0.72 }, kicker),
    middle,
    el("div", { display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: `2px solid ${ink}`, paddingTop: 22 }, [
      el("div", { display: "flex", fontFamily: "Mark", fontSize: 34, letterSpacing: "-0.03em" }, "Ran Craycraft"),
      el("div", { display: "flex", fontFamily: "Instrument Sans", fontSize: 24, opacity: 0.72 }, "rancraycraft.com")
    ])
  ]);
}

export async function drawCards(outputDir) {
  for (const [path, spec] of queue) {
    const svg = await satori(card(spec), { width: 1200, height: 630, fonts });
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
    const file = join(outputDir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, png);
  }
  return queue.size;
}
