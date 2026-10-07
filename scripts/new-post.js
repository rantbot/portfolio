// Start a new draft post: npm run new -- "Post title" [writing|making]
import { writeFileSync, existsSync } from "node:fs";

const [title, kind = "writing"] = process.argv.slice(2);
if (!title) {
  console.error('Usage: npm run new -- "Post title" [writing|making]');
  process.exit(1);
}
if (!["writing", "making"].includes(kind)) {
  console.error('Type must be "writing" or "making".');
  process.exit(1);
}
const date = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const slug = title.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const file = `src/posts/${date}-${slug}.md`;
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
kind: ${kind}
draft: true
tone: "#EFEFEC"
ink: "#1F1F1C"
cover_lines:
  - ${JSON.stringify(title)}
---

`
);
console.log(`Created ${file}`);
