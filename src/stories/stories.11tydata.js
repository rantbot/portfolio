// Every Markdown file in this folder becomes a story.
// Name the file the way you want the address to read, like ladera-heights-cleanup.md.
// Add draft: true at the top to keep one off the site while you work on it.
export default {
  layout: "case-study.njk",
  kind: "story",
  section: "stories",
  eleventyComputed: {
    permalink: (data) => (data.draft ? false : `/stories/${data.page.fileSlug}/`),
    eleventyExcludeFromCollections: (data) => !!data.draft
  }
};
