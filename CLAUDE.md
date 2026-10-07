# Working on Ran's site with Claude

This is Ran Craycraft's personal site, separate from thoughtbot. It's an Eleventy site published to GitHub Pages from the `main` branch. These notes tell Claude how to make changes here.

## How Ran asks for changes

Ran will say things like "add a post about X", "update my AOL piece", "add my new thoughtbot essay", or "change the homepage intro". Make the change in this folder, check that the site builds, then tell Ran what changed and that it's ready to commit and push. Claude can't push to GitHub from a Cowork session, so Ran commits and pushes in GitHub Desktop (or asks Claude for a commit message). Every push to `main` publishes in about a minute.

## Where things live

| What | File |
| --- | --- |
| Leading | `src/leading/slug.md`, one plain Markdown file each |
| Writing and Making posts | `src/posts/YYYY-MM-DD-slug.md` |
| Photos | `src/assets/images/`, referenced as `/assets/images/name.jpg` |
| Homepage text, the subtitle under the name (`tagline`), profile links | `src/_data/site.yml` |
| thoughtbot essays and other outside posts | `src/_data/elsewhere.yml`, newest first |
| About page, roles, education | `src/about.md` |
| Look and feel | `src/assets/css/site.css` |
| Templates | `src/_includes/`, `src/*.njk` |
| Pages CMS editor settings | `.pages.yml` (keep fields in sync when front matter changes) |

## Posts

Start one with `npm run new -- "Title" writing` (or `making` or `leading`). The URL comes from the file name without the date, so `/leading/slug/`, `/writing/slug/` or `/making/slug/`.

Front matter:

- `title` the question someone would search for, when that fits
- `description` one or two sentences, shown under the title and in search results
- `date` publish date, `YYYY-MM-DD`
- `kind` `story` (shown as Leading), `writing` or `making`
  - **Leading** pieces live in `src/leading/`, not `src/posts/`. Every Markdown file there becomes a Leading piece at `/leading/<file-name>/`, so the folder sets the kind and layout. Internally the kind is still `story` and the details block is still `case_study`. Ran drafts and finesses them there in a Markdown editor. They take a `case_study` block (`organization`, `role`, `years`, `start` year for ordering, `scope`, `team`, `outcomes`). Each piece reads like a chapter in a book. Narrative, engaging, insightful and opinionated, about 2,500 to 3,500 words, a 10 to 15 minute read. Open on a scene, set up the stakes, follow the decisions and turning points, say what changed, and end with what Ran believes now and why. First person, specific moments and real names (with permission), clear opinions. "Chapter" is only the feel, so never label or number them as chapters. The layout adds a drop cap, and `---` in the text becomes a section break. Headings can be evocative rather than The situation or What I did. Facts, quotes, numbers and opinions must come from Ran. Draft by interviewing him first, then outline, then write, then let him finesse. Never invent facts or results. Leave a `<!-- TO ADD -->` note instead, and keep a heading in the note until its section has content.
  - **Writing** and **Making** are lighter, passing ideas, experiments and thoughts. Keep them short.
- `draft: true` keeps it off the site. Remove it to publish.
- `tldr` optional plain answer at the top ("In short")
- `series` same name on related posts links them together
- The homepage Leading carousel shows every piece, most recent first. `meta` is an optional card label.
- Cover, either `image` plus `image_alt` (and optional `image_caption`), or a typographic cover with `tone`, `ink`, `cover_kicker`, `cover_lines`
- `updated` optional date for revised posts
- `try_url` and optional `try_label` add a "Try it" link at the end, only for tools that are public

Notes for Ran to fill in go in `<!-- -->` comments. They don't show on the site.

## Writing voice

- Kind, personal, opinionated and inventive. It should sound like Ran talking, never like a copywriter. Plain words, specific details, first person, real opinions he has stated (his posts and thoughtbot essays are the best source). No polished marketing phrases like "exceptional experiences" or "turning ideas into reality".
- Clean, direct, human, matter-of-fact. Kind, honest, smart, approachable.
- No em dashes, semicolons, or colons in prose. Use commas for asides, not spaced hyphens.
- No slogans and no "not X, it's Y" constructions.
- Present Ran as a leader who builds things, not a job seeker. Fun to read.
- Invitations sound collaborative, about working together rather than about Ran ("Let’s work together", "Work together", "Let’s talk"), never "Work with me" or "More about me".
- Prefer several short posts per experience, linked by `series`, over one long one.
- Use `##` headings that match what people search for. Keep paragraphs short.

## Working with Ran

Ran is available for consulting, helping businesses launch new things and solve tough problems with software and in physical spaces. `/work/` (`src/work.njk`) explains where he helps, ties each area to his Leading pieces, and asks people to tell him about their idea. Every page ends with the same invitation (`contact.njk`), Leading pieces add a "Working on something like this?" prompt, and the nav and hero link to `/work/`. The email button opens a prefilled message (what I'm trying to do, where I'm stuck, timing). When adding Leading pieces, link the strongest ones from the matching area on `/work/`.

## Logos and awards

A quiet wall sits under the homepage hero and on `/work/` (`src/_includes/logos.njk`): companies Ran has worked with, then a row headed "My work has won" (The Emmys for the Heroes work at NBC, Cannes Lions, D&AD, The Webby Awards, The ANDYs). Lists, file names and display sizes are `logos` and `awards` in `src/_data/site.yml`.

To add one, make a single-color PNG in `src/assets/images/logos/`: flatten on white, alpha = 255 minus the darkest channel (ramp 28 to 110), fill with ink `#151513`, trim to the mark, and resize so its area is about 27,000 px². Remove any stray text from the source (the ANDYs file had "Ad Makers Collective" in a corner). Check the whole mark survived, the first Google pass lost the left of the G. In `site.yml` set width and height to about 0.28 of the PNG's pixel size. The CSS shows them at 38% opacity, 70% on hover, five per row on desktop and wrapped smaller on phones. Logos stay off Leading covers.

## Wordmark and favicon

The wordmark is plain text, "Ran Craycraft" in Inter Tight Bold (self-hosted, so it looks the same everywhere). The favicon (`src/assets/favicon.svg`) and the home-screen icons (`apple-touch-icon.png`, `icon-512.png`) are Inter Tight's bold R in paper on an ink square. Ran tried a filled-in R in the wordmark and favicon and didn't like it, so leave the R as a normal letter. He also passed on a serif R for the favicon or wordmark, so keep both sans.

## Leadership first

The homepage leads with executive value. The carousel opens with three featured leadership stories, set with `featured: 1`, `2` and `3` in front matter (thoughtbot, AOL, Wildebeest). Each has a `highlight`, one verified outcome with its years written into the sentence, shown on the card in place of the description. Only use outcomes Ran has confirmed. The Work together page separates leadership opportunities from selective consulting.

## Read next

Every Leading piece ends with "Read next", up to two others chosen in its front matter:

```yaml
read_next:
  - story: wildebeest          # the file name, without .md
    why: What came next        # a short reason, shown above the title
```

The first is usually what happened next in Ran's career, the second a piece that shares a theme. Without `read_next`, the next piece by start year is shown. Update the picks when a new piece is added.

## Language

The section for the longer pieces about the bigger work is called **Leading**, next to Writing and Making (Ran's call, October 2026, because Stories and Writing sounded too alike). Never call them stories, case studies or milestones on the site. Links to the whole section read "Everything I’ve led". A piece is about the work, not the company, and there can be several from one place. The organization only appears as quiet context (the card's small meta line and the facts panel), never as a cover or heading.

## Agent skills

- Skills live in `src/skills/<name>/SKILL.md` (Agent Skills format, `name` and `description` front matter). They publish at `/skills/<name>/SKILL.md`, a `.zip` is built for each, and `/skills/` lists them.
- Add `skill: <name>` to a post's or Leading piece's front matter to show the install panel at the end of it.
- Skills are MIT-licensed, unlike the writing. Write them as clear instructions grounded in what the post describes, and end with a "From Ran Craycraft" credit line.

## Design system

- One 12-column grid (`.grid`). Labels and meta sit in the 3-column rail (`.rail`), reading text in `.span-main` (columns 4 to 10), wide content in `.span-wide`. Phones collapse to one column.
- Type: Newsreader for reading and headlines, Instrument Sans for labels, meta and UI, Helvetica Neue Bold (Inter Tight fallback) for the name and Leading covers. Fonts are self-hosted in `src/assets/fonts/`, nothing loads from Google.
- Color tokens live at the top of `site.css`. Type is warm dark grey, never pure black. `--ink` for headlines, labels and UI, `--text` for reading text, `--ink-2` for ledes. Keep text at WCAG AA contrast, so use `--muted` for small text, never lighter.
- Section heads are a 1px ink rule with the label in the rail. Keep new sections on that pattern.
- Phones (820px and under) get their own treatment, all in the phone block near the end of `site.css`. A sticky header with a Menu button that opens a full-screen menu, full-width buttons, edge-to-edge covers and carousel with a progress line, an even five-across logo grid, and the name set large at the foot of the page. Change phone layouts there, and confirm desktop still matches `main` pixel for pixel.
- Run an accessibility check (axe) and look at desktop and phone screenshots before handing back design changes.

## Search, sharing and AI tools

These are built automatically. Nothing needs doing per post, but keep them working when templates change.

- `sitemap.xml`, `robots.txt` and the Atom feed at `/feed.xml`.
- Title tags add " · Ran Craycraft" when the title is 48 characters or shorter. Set `seo_title` in front matter to override the whole tag. Keep `description` under about 160 characters, since search results cut it there.
- Share images. A page with its own `image` uses it. The homepage and 404 use `src/assets/og-default.png`. Every other page gets a 1200×630 card drawn at build time by `scripts/og/cards.js`, published at `/og/<page address>.png`. Leading cards use the piece's `tone` and `ink` with "Leading · organization" above the title. Section pages show their title and description. The card fonts are static TTF copies of the site fonts in `scripts/og/fonts/`.
- Markdown versions. Every post, Leading piece and the About page is also published at its address with `.md` on the end (like `/leading/wildebeest.md`), built from the source file by `src/markdown.njk`. Private `<!-- -->` notes are removed. Each page links to its Markdown version in the head.
- `llms.txt` lists everything, linking to the Markdown versions. `llms-full.txt` holds every piece in one file.
- Structured data in `src/_includes/schema.njk`, with a Person, BlogPosting for posts, ProfilePage for About, and breadcrumbs.
- The 404 page and drafts are marked noindex.

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
