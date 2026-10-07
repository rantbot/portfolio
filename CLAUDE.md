# Working on Ran's site with Claude

This is Ran Craycraft's personal site, separate from thoughtbot. It's an Eleventy site published to GitHub Pages from the `main` branch. These notes tell Claude how to make changes here.

## How Ran asks for changes

Ran will say things like "add a post about X", "update my AOL story", "add my new thoughtbot essay", or "change the homepage intro". Make the change in this folder, check that the site builds, then tell Ran what changed and that it's ready to commit and push. Claude can't push to GitHub from a Cowork session, so Ran commits and pushes in GitHub Desktop (or asks Claude for a commit message). Every push to `main` publishes in about a minute.

## Where things live

| What | File |
| --- | --- |
| Posts (Writing and Making) | `src/posts/YYYY-MM-DD-slug.md` |
| Photos | `src/assets/images/`, referenced as `/assets/images/name.jpg` |
| Homepage text, profile links | `src/_data/site.yml` |
| thoughtbot essays and other outside posts | `src/_data/elsewhere.yml`, newest first |
| About page, roles, education | `src/about.md` |
| Look and feel | `src/assets/css/site.css` |
| Templates | `src/_includes/`, `src/*.njk` |
| Pages CMS editor settings | `.pages.yml` (keep fields in sync when front matter changes) |

## Posts

Start one with `npm run new -- "Title" writing` (or `making`). The URL comes from the file name without the date, so `/writing/slug/` or `/making/slug/`.

Front matter:

- `title` the question someone would search for, when that fits
- `description` one or two sentences, shown under the title and in search results
- `date` publish date, `YYYY-MM-DD`
- `kind` `writing` or `making`
- `draft: true` keeps it off the site. Remove it to publish.
- `tldr` optional plain answer at the top ("In short")
- `series` same name on related posts links them together
- `pinned: true` and `meta` put it in the homepage Stories row (three newest pinned)
- Cover, either `image` plus `image_alt` (and optional `image_caption`), or a typographic cover with `tone`, `ink`, `cover_kicker`, `cover_lines`
- `updated` optional date for revised posts

Notes for Ran to fill in go in `<!-- -->` comments. They don't show on the site.

## Writing voice

- Clean, direct, human, matter-of-fact. Kind, honest, smart, approachable.
- No em dashes, semicolons, or colons in prose. Use commas for asides, not spaced hyphens.
- No slogans and no "not X, it's Y" constructions.
- Present Ran as a leader who builds things, not a job seeker. Fun to read.
- Prefer several short posts per experience, linked by `series`, over one long one.
- Use `##` headings that match what people search for. Keep paragraphs short.

## Check before handing back

```
npm install   # first time only
npm run build # must finish without errors
npm start     # optional local preview
```

Don't commit `node_modules/` or `_site/`.
