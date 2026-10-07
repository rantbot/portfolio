import yaml from "js-yaml";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { HtmlBasePlugin } from "@11ty/eleventy";
import { zipSkills } from "./scripts/zip-skills.js";

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  // Agent skills are published as-is, and zipped after each build
  eleventyConfig.addPassthroughCopy({ "src/skills": "skills" }, { filter: ["**/*", "!*.js"] });
  eleventyConfig.ignores.add("src/skills/**");
  eleventyConfig.on("eleventy.after", ({ dir }) => zipSkills("src/skills", `${dir.output}/skills`));
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Keep <!-- notes --> in posts out of the published pages
  eleventyConfig.addTransform("stripComments", function (content) {
    return (this.page.outputPath || "").endsWith(".html") ? content.replace(/<!--[\s\S]*?-->\n?/g, "") : content;
  });

  // Every published post, newest first
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob(["src/posts/*.md", "src/stories/*.md"])
      .filter((p) => !p.data.draft)
      .sort((a, b) => b.date - a.date)
  );
  // Oldest first, for the feed plugin, which lists the newest entries first
  eleventyConfig.addCollection("feedPosts", (api) =>
    api.getFilteredByGlob(["src/posts/*.md", "src/stories/*.md"]).filter((p) => !p.data.draft).sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addFilter("ofKind", (posts, kind) => posts.filter((p) => p.data.kind === kind));
  eleventyConfig.addFilter("pinned", (posts) => posts.filter((p) => p.data.pinned));
  // Stories, ordered by when the work began, most recent first. Several can come from one place.
  eleventyConfig.addFilter("stories", (posts) =>
    posts
      .filter((p) => p.data.kind === "story")
      .sort((a, b) => (b.data.case_study?.start || 0) - (a.data.case_study?.start || 0) || b.date - a.date)
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
  // Groups the stream so Writing stands alone and runs of Making sit side by side, up to three at a time
  // Groups the feed by month, newest first, like a journal's contents page
  eleventyConfig.addFilter("byMonth", (items) => {
    const months = [];
    for (const p of items) {
      const d = new Date(p.date);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      let m = months[months.length - 1];
      if (!m || m.key !== key) {
        m = { key, month: d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }), year: d.getUTCFullYear(), items: [] };
        months.push(m);
      }
      m.items.push(p);
    }
    return months;
  });
  eleventyConfig.addFilter("dayMonth", (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }));
  eleventyConfig.addFilter("groupStream", (items) => {
    const groups = [];
    for (const p of items) {
      const last = groups[groups.length - 1];
      if (p.data.kind === "making" && last && last.kind === "making" && last.items.length < 3) last.items.push(p);
      else groups.push({ kind: p.data.kind === "making" ? "making" : "writing", items: [p] });
    }
    return groups;
  });
  eleventyConfig.addFilter("withSkill", (posts, key) => posts.find((p) => p.data.skill === key));
  eleventyConfig.addFilter("kindLabel", (kind) => ({ story: "Story", making: "Making" })[kind] || "Writing");
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
  eleventyConfig.addFilter("absUrl", (path, base) => new URL(path, base).href);

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
