// Reads every skill in src/skills/<name>/SKILL.md so pages can show an install panel.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import yaml from "js-yaml";

export default function () {
  const root = "src/skills";
  if (!existsSync(root)) return {};
  const skills = {};
  for (const dir of readdirSync(root, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const file = `${root}/${dir.name}/SKILL.md`;
    if (!existsSync(file)) continue;
    const match = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/);
    const meta = match ? yaml.load(match[1]) : {};
    skills[dir.name] = { name: meta.name || dir.name, description: meta.description || "", folder: dir.name };
  }
  return skills;
}
