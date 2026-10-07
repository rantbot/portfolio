import yaml from "js-yaml";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import { HtmlBasePlugin } from "@11ty/eleventy";

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPlugin(HtmlBasePlugin);

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
  eleventyConfig.addFilter("absUrl", (path, base) => new URL(path, base).href);

  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "feedPosts", limit: 30 },
    metadata: {
      language: "en",
      title: "Ran Craycraft",
      subtitle: "Writing and things I make.",
      base: process.env.SITE_URL || "https://rantbot.github.io/",
      author: { name: "Ran Craycraft" }
    }
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
}
