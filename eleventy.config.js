import yaml from "js-yaml";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { readFileSync } from "node:fs";
import { zipSkills } from "./scripts/zip-skills.js";
import { ogCard, drawCards } from "./scripts/og/cards.js";

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  // Agent skills are published as-is, and zipped after each build
  eleventyConfig.addPassthroughCopy({ "src/skills": "skills" }, { filter: ["**/*", "!*.js"] });
  eleventyConfig.ignores.add("src/skills/**");
  eleventyConfig.on("eleventy.after", ({ directories }) => zipSkills("src/skills", `${directories.output}skills`));
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Share cards for pages without a photo of their own, drawn after each build (scripts/og/cards.js)
  eleventyConfig.addFilter("ogCard", (url, title, kicker, tone, ink, note) => ogCard(url, { title, kicker, tone, ink, note }));
  eleventyConfig.on("eleventy.after", ({ directories }) => drawCards(directories.output));

  // Markdown versions of each post, Leading piece and the About page, at the same address ending in .md,
  // for AI tools and anyone who wants the plain text. Private <!-- notes --> never make it in.
  eleventyConfig.addCollection("markdown", (api) =>
    api.getFilteredByGlob(["src/posts/*.md", "src/leading/*.md", "src/about.md"]).filter((p) => !p.data.draft).sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addFilter("mdUrl", (url) => (typeof url === "string" ? url.replace(/\/$/, "") + ".md" : ""));
  eleventyConfig.addFilter("sourceMarkdown", (inputPath, base) => {
    let s = readFileSync(inputPath, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "").replace(/<!--[\s\S]*?-->\n?/g, "");
    // The About page wraps its prose in layout markup. Keep just the prose.
    const prose = s.match(/<div class="span-main prose serif">([\s\S]*?)<\/div>/);
    if (prose) s = prose[1];
    const attr = (tag, name) => (tag.match(new RegExp(`${name}="([^"]*)"`)) || [])[1] || "";
    // Pictures become Markdown images, with the caption in italics beneath
    s = s.replace(/<figure[\s\S]*?<\/figure>/g, (fig) => {
      const img = (fig.match(/<img[^>]*>/) || [""])[0];
      const cap = (fig.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1];
      return `![${attr(img, "alt")}](${attr(img, "src")})` + (cap ? `\n\n*${cap.trim()}*` : "");
    });
    s = s.replace(/<img[^>]*>/g, (img) => `![${attr(img, "alt")}](${attr(img, "src")})`);
    // Links and images on this site get the full address
    s = s.replace(/\]\(\//g, `](${base}/`).replace(/href="\//g, `href="${base}/`);
    return s.replace(/\n{3,}/g, "\n\n").trim();
  });

  // Keep <!-- notes --> in posts out of the published pages
  eleventyConfig.addTransform("stripComments", function (content) {
    return (this.page.outputPath || "").endsWith(".html") ? content.replace(/<!--[\s\S]*?-->\n?/g, "") : content;
  });

  // Every published post, newest first
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob(["src/posts/*.md", "src/leading/*.md"])
      .filter((p) => !p.data.draft)
      .sort((a, b) => b.date - a.date)
  );
  // Oldest first, for the feed plugin, which lists the newest entries first
  eleventyConfig.addCollection("feedPosts", (api) =>
    api.getFilteredByGlob(["src/posts/*.md", "src/leading/*.md"]).filter((p) => !p.data.draft).sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addFilter("ofKind", (posts, kind) => posts.filter((p) => p.data.kind === kind));
  // Stories, ordered by when the work began, most recent first. Several can come from one place.
  eleventyConfig.addFilter("stories", (posts) =>
    posts
      .filter((p) => p.data.kind === "story")
      // Featured leadership stories lead, in their set order, then everything else by when the work began
      .sort((a, b) => (a.data.featured || 99) - (b.data.featured || 99) || (b.data.case_study?.start || 0) - (a.data.case_study?.start || 0) || b.date - a.date)
  );
  // What to read after a story. Uses the story's read_next picks, otherwise the next story in career order.
  eleventyConfig.addFilter("readNext", (posts, page, picks = []) => {
    const stories = posts.filter((p) => p.data.kind === "story");
    const out = [];
    for (const r of picks || []) {
      const p = stories.find((s) => s.page.fileSlug === r.story);
      if (p && p.url !== page.url) out.push({ p, why: r.why });
    }
    if (!out.length) {
      const order = [...stories].sort((a, b) => (a.data.case_study?.start || 0) - (b.data.case_study?.start || 0));
      const i = order.findIndex((p) => p.url === page.url);
      const p = order[i + 1] || order[i - 1];
      if (p) out.push({ p, why: order[i + 1] ? "What came next" : "What came before" });
    }
    return out.slice(0, 2);
  });
  // Everything except stories, newest first
  eleventyConfig.addFilter("stream", (posts, elsewhere = []) => {
    const own = posts.filter((p) => p.data.kind !== "story");
    // Essays published on other sites join the stream as Writing and link to the original
    const outside = elsewhere.map((e) => ({
      url: e.url,
      date: new Date(e.date),
      external: true,
      data: { kind: "writing", title: e.title, description: e.summary, publication: e.publication }
    }));
    return [...own, ...outside].sort((a, b) => b.date - a.date);
  });
  eleventyConfig.addFilter("dayMonth", (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }));
  // The Writing and Making posts just before and after this one, by date. Stories have their own Read next.
  eleventyConfig.addFilter("neighbors", (posts, page) => {
    const list = posts.filter((p) => p.data.kind !== "story");
    const i = list.findIndex((p) => p.url === page.url);
    if (i < 0) return {};
    return { newer: list[i - 1], older: list[i + 1] };
  });
  // Posts worth reading after this one. Same series first, then the same kind, then the closest in time.
  eleventyConfig.addFilter("related", (posts, page, exclude = [], n = 4) => {
    const me = posts.find((p) => p.url === page.url);
    if (!me) return [];
    const skip = new Set([page.url, ...(exclude || []).filter(Boolean).map((p) => p.url)]);
    const score = (p) =>
      (me.data.series && p.data.series === me.data.series ? 4 : 0) +
      (p.data.kind === me.data.kind ? 1 : 0) -
      Math.abs(p.date - me.date) / (365 * 86400000);
    return posts
      .filter((p) => p.data.kind !== "story" && !skip.has(p.url))
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, n)
      .map((x) => x.p);
  });
  // Drops a "You might also like" card into the middle of a longer post, at a natural break,
  // just before a heading when there is one near the middle. Short posts are left alone.
  eleventyConfig.addFilter("insertAside", (html, aside) => {
    html = String(html || "");
    if (!aside || !aside.trim() || html.length < 1600) return html;
    const breaks = [];
    const re = /<\/(p|ul|ol|blockquote|figure)>\s*\n(?=<(h2|h3|p)[\s>])/g;
    let m;
    while ((m = re.exec(html))) breaks.push({ at: m.index + m[0].length, heading: html.startsWith("<h", m.index + m[0].length) });
    const ok = breaks.filter((b) => b.at > html.length * 0.3 && b.at < html.length * 0.75);
    if (!ok.length) return html;
    const target = html.length * 0.5;
    const pool = ok.some((b) => b.heading) ? ok.filter((b) => b.heading) : ok;
    const best = pool.reduce((a, b) => (Math.abs(b.at - target) < Math.abs(a.at - target) ? b : a));
    return html.slice(0, best.at) + aside.trim() + "\n" + html.slice(best.at);
  });
  eleventyConfig.addFilter("withSkill", (posts, key) => posts.find((p) => p.data.skill === key));
  // Search. One small JSON file with every post, story, outside essay and main page, built with the site.
  // Body text is stripped of markup and trimmed, so the file stays light.
  const plain = (s) =>
    String(s || "")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/\{[%{#][\s\S]*?[%}#]\}/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`~|-]+/g, " ")
      .replace(/&[a-z]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  eleventyConfig.addFilter("searchIndex", (posts, elsewhere = [], pages = []) => {
    const day = (d) => new Date(d).toISOString().slice(0, 10);
    const kind = (k) => ({ story: "Leading", making: "Making" })[k] || "Writing";
    const items = [
      ...posts.map((p) => ({
        t: p.data.title,
        u: p.url,
        k: kind(p.data.kind),
        d: plain(p.data.highlight || p.data.description),
        m: [p.data.series, p.data.meta, p.data.case_study?.organization].filter(Boolean).join(" "),
        x: plain(p.rawInput).slice(0, 2400),
        y: p.data.kind === "story" ? "" : day(p.date),
      })),
      ...elsewhere.map((e) => ({ t: e.title, u: e.url, k: "Writing", d: plain(e.summary), m: e.publication || "", x: "", y: day(e.date), o: 1 })),
      ...pages.map((p) => ({ t: p.data.title, u: p.url, k: "Page", d: plain(p.data.description), m: "", x: plain(p.rawInput).slice(0, 1200), y: "" })),
    ];
    return JSON.stringify(items);
  });
  // Turns the first mention of each name in a plain sentence into a link, for intros kept as plain text in site.yml.
  // The links carry data-autolink so the inline editor can still edit the sentence.
  eleventyConfig.addFilter("orgLinks", (text, links = {}) => {
    let out = String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
    for (const [name, url] of Object.entries(links)) {
      const re = new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`);
      out = out.replace(re, (m) => `<a href="${url}" class="ul" data-autolink>${m}</a>`);
    }
    return out;
  });
  eleventyConfig.addFilter("kindLabel", (kind) => ({ story: "Leading", making: "Making" })[kind] || "Writing");
  eleventyConfig.addFilter("inSeries", (posts, series) =>
    series ? posts.filter((p) => p.data.series === series).sort((a, b) => a.date - b.date) : []
  );
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })
  );
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = String(content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 230)) + " min read";
  });
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v, (k, x) => (x === null || x === undefined ? undefined : x)).replace(/</g, "\\u003c"));
  eleventyConfig.addFilter("pluck", (arr, key) => (arr || []).map((x) => x[key]).filter((x) => x && !String(x).includes("[")));
  // Hides an email address from scrapers. site.js turns it back into a link.
  eleventyConfig.addFilter("scramble", (s) => Buffer.from(String(s || "").split("").reverse().join("")).toString("base64"));

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "feedPosts", limit: 30 },
    metadata: {
      language: "en",
      title: "Ran Craycraft",
      subtitle: "Writing and things I make.",
      // Origin only. The base plugin adds the path prefix to every link.
      base: new URL(process.env.SITE_URL || "https://rancraycraft.com").origin + "/",
      author: { name: "Ran Craycraft" }
    }
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
