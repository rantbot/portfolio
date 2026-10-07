// Start a new draft post: npm run new -- "Post title" [writing|making|leading]
import { writeFileSync, existsSync } from "node:fs";

const [title, type = "writing"] = process.argv.slice(2);
// "leading" starts a Leading piece in src/leading/. Its kind is still "story" internally, so "story" works too.
const kind = type === "leading" ? "story" : type;
if (!title) {
  console.error('Usage: npm run new -- "Post title" [writing|making|leading]');
  process.exit(1);
}
if (!["writing", "making", "story"].includes(kind)) {
  console.error('Type must be "writing", "making" or "leading".');
  process.exit(1);
}
const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const slug = title.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const file = kind === "story" ? `src/leading/${slug}.md` : `src/posts/${date}-${slug}.md`;
if (existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}
writeFileSync(
  file,
  `---
title: ${JSON.stringify(title)}
description: ""
date: ${date}
${kind === "story" ? "" : `kind: ${kind}\n`}draft: true
${kind === "story" ? `case_study:
  organization: ""
  role: ""
  years: ""
  start: ${date.slice(0, 4)}
  scope: ""
  outcomes: []
` : ""}tone: "#EFEFEC"
ink: "#1F1F1C"
cover_lines:
  - ${JSON.stringify(title)}
---

${kind === "story" ? `## The situation

## What I did

<!-- TO ADD as "## What changed" -->

<!-- TO ADD as "## What I learned" -->
` : ""}`
);
console.log(`Created ${file}`);
