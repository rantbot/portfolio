// Shared settings for every post in this folder.
export default {
  layout: "post.njk",
  kind: "writing",
  eleventyComputed: {
    // Writing lives at /writing/slug/ and Making at /making/slug/
    permalink: (data) => (data.draft ? false : `/${data.kind}/${data.page.fileSlug.replace(/^\d{4}-\d{2}-\d{2}-/, "")}/`),
    eleventyExcludeFromCollections: (data) => !!data.draft,
    section: (data) => data.kind
  }
};
