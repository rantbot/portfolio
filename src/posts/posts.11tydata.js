// Shared settings for every post in this folder.
// kind is "writing" or "making". Leading pieces live in src/leading/.
const sections = { story: "leading", writing: "writing", making: "making" };

export default {
  layout: "post.njk",
  kind: "writing",
  eleventyComputed: {
    // Leading lives at /leading/slug/, Writing at /writing/slug/, Making at /making/slug/
    permalink: (data) =>
      data.draft ? false : `/${sections[data.kind] || data.kind}/${data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "")}/`,
    eleventyExcludeFromCollections: (data) => !!data.draft,
    section: (data) => sections[data.kind] || data.kind
  }
};
