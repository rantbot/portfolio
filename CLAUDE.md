# Working on Ran's site with Claude

This is Ran Craycraft's personal site, separate from thoughtbot. It's an Eleventy site published to GitHub Pages from the `main` branch. These notes tell Claude how to make changes here.

## How Ran asks for changes

Ran will say things like "add a post about X", "update my AOL story", "add my new thoughtbot essay", or "change the homepage intro". Make the change in this folder, check that the site builds, then tell Ran what changed and that it's ready to commit and push. Claude can't push to GitHub from a Cowork session, so Ran commits and pushes in GitHub Desktop (or asks Claude for a commit message). Every push to `main` publishes in about a minute.

## Where things live

| What | File |
| --- | --- |
| Stories | `src/stories/slug.md`, one plain Markdown file each |
| Writing and Making posts | `src/posts/YYYY-MM-DD-slug.md` |
| Photos | `src/assets/images/`, referenced as `/assets/images/name.jpg` |
| Homepage text, the subtitle under the name (`tagline`), profile links | `src/_data/site.yml` |
| thoughtbot essays and other outside posts | `src/_data/elsewhere.yml`, newest first |
| About page, roles, education | `src/about.md` |
| Look and feel | `src/assets/css/site.css` |
| Templates | `src/_includes/`, `src/*.njk` |
| Pages CMS editor settings | `.pages.yml` (keep fields in sync when front matter changes) |

## Posts

Start one with `npm run new -- "Title" writing` (or `making`). The URL comes from the file name without the date, so `/stories/slug/`, `/writing/slug/` or `/making/slug/`.

Front matter:

- `title` the question someone would search for, when that fits
- `description` one or two sentences, shown under the title and in search results
- `date` publish date, `YYYY-MM-DD`
- `kind` `story`, `writing` or `making`
  - **Stories** live in `src/stories/`, not `src/posts/`. Every Markdown file there becomes a story at `/stories/<file-name>/`, so the folder sets the kind and layout. Ran drafts and finesses them there in a Markdown editor. They take a `case_study` block (`organization`, `role`, `years`, `start` year for ordering, `scope`, `team`, `outcomes`). Each story reads like a chapter in a book. Narrative, engaging, insightful and opinionated, about 2,500 to 3,500 words, a 10 to 15 minute read. Open on a scene, set up the stakes, follow the decisions and turning points, say what changed, and end with what Ran believes now and why. First person, specific moments and real names (with permission), clear opinions. "Chapter" is only the feel, so never label or number stories as chapters. The layout adds a drop cap, and `---` in the text becomes a section break. Headings can be evocative rather than The situation or What I did. Facts, quotes, numbers and opinions must come from Ran. Draft by interviewing him first, then outline, then write, then let him finesse. Never invent facts or results. Leave a `<!-- TO ADD -->` note instead, and keep a heading in the note until its section has content.
  - **Writing** and **Making** are lighter, passing ideas, experiments and thoughts. Keep them short.
- `draft: true` keeps it off the site. Remove it to publish.
- `tldr` optional plain answer at the top ("In short")
- `series` same name on related posts links them together
- The homepage Stories carousel shows every story, most recent first. `meta` is an optional card label.
- Cover, either `image` plus `image_alt` (and optional `image_caption`), or a typographic cover with `tone`, `ink`, `cover_kicker`, `cover_lines`
- `updated` optional date for revised posts
- `try_url` and optional `try_label` add a "Try it" link at the end, only for tools that are public

Notes for Ran to fill in go in `<!-- -->` comments. They don't show on the site.

## Writing voice

- Clean, direct, human, matter-of-fact. Kind, honest, smart, approachable.
- No em dashes, semicolons, or colons in prose. Use commas for asides, not spaced hyphens.
- No slogans and no "not X, it's Y" constructions.
- Present Ran as a leader who builds things, not a job seeker. Fun to read.
- Prefer several short posts per experience, linked by `series`, over one long one.
- Use `##` headings that match what people search for. Keep paragraphs short.

## Working with Ran

Ran is available for consulting, helping businesses launch new things and solve tough problems with software and in physical spaces. `/work/` (`src/work.njk`) explains where he helps, ties each area to his stories, and asks people to tell him about their idea. Every page ends with the same invitation (`contact.njk`), story pages add a "Working on something like this?" prompt, and the nav and hero link to `/work/`. The email button opens a prefilled message (what I'm trying to do, where I'm stuck, timing). When adding stories, link the strongest ones from the matching area on `/work/`.

## Language

Call them stories everywhere, never case studies or milestones. A story is about the work, not the company, and there can be several from one place. The organization only appears as quiet context (the card's small meta line and the facts panel), never as a story's cover or heading.

## Agent skills

- Skills live in `src/skills/<name>/SKILL.md` (Agent Skills format, `name` and `description` front matter). They publish at `/skills/<name>/SKILL.md`, a `.zip` is built for each, and `/skills/` lists them.
- Add `skill: <name>` to a post's or story's front matter to show the install panel at the end of it.
- Skills are MIT-licensed, unlike the writing. Write them as clear instructions grounded in what the post describes, and end with a "From Ran Craycraft" credit line.

## Design system

- One 12-column grid (`.grid`). Labels and meta sit in the 3-column rail (`.rail`), reading text in `.span-main` (columns 4 to 10), wide content in `.span-wide`. Phones collapse to one column.
- Type: Newsreader for reading and headlines, Instrument Sans for labels, meta and UI, Helvetica Neue Bold (Inter Tight fallback) for the name and story covers. Fonts are self-hosted in `src/assets/fonts/`, nothing loads from Google.
- Color tokens live at the top of `site.css`. Keep text at WCAG AA contrast, so use `--muted` for small text, never lighter.
- Section heads are a 1px ink rule with the label in the rail. Keep new sections on that pattern.
- Run an accessibility check (axe) and look at desktop and phone screenshots before handing back design changes.

## The repo is public

Everything committed here is readable by anyone, including drafts, `<!-- -->` notes and git history.

- Never commit secrets, keys, client names, budgets or internal details. Working notes and source material go in `private/`, which git ignores.
- `<!-- -->` notes are stripped from the built pages, but they're still visible in the repo.
- The page sets a Content Security Policy in `base.njk`. Scripts, styles and images load from this site only, plus Google Fonts. Embedding something from another site (a video, an outside image) means updating that policy on purpose.
- Workflow actions are pinned to commit SHAs and each job gets only the permissions it needs. Keep it that way, and let Dependabot propose updates.

## Check before handing back

```
npm install   # first time only
npm run build # must finish without errors
npm start     # optional local preview
```

Don't commit `node_modules/` or `_site/`.
