import yaml from "js-yaml";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Keep <!-- notes --> in posts out of the published pages
  eleventyConfig.addTransform("stripComments", function (content) {
    return (this.page.outputPath || "").endsWith(".html") ? content.replace(/<!--[\s\S]*?-->\n?/g, "") : content;
  });

  // Every published post, newest first
  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("src/posts/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => b.date - a.date)
  );
  // Oldest first, for the feed plugin, which lists the newest entries first
  eleventyConfig.addCollection("feedPosts", (api) =>
    api.getFilteredByGlob("src/posts/*.md").filter((p) => !p.data.draft).sort((a, b) => a.date - b.date)
  );

  eleventyConfig.addFilter("ofKind", (posts, kind) => posts.filter((p) => p.data.kind === kind));
  eleventyConfig.addFilter("pinned", (posts) => posts.filter((p) => p.data.pinned));
  // Stories are milestones, ordered by when the work began, most recent first
  eleventyConfig.addFilter("milestones", (posts) =>
    posts.filter((p) => p.data.kind === "story").sort((a, b) => (b.data.case_study?.start || 0) - (a.data.case_study?.start || 0))
  );
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
      base: new URL(process.env.SITE_URL || "https://rantbot.github.io").origin + "/",
      author: { name: "Ran Craycraft" }
    }
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
