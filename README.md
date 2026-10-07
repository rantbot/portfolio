# Ran Craycraft, personal site

Writing and things I make. Built with [Eleventy](https://www.11ty.dev), hosted on GitHub Pages, and edited with [Pages CMS](https://pagescms.org) from a phone or computer.

## Put it online (one time, about ten minutes)

1. **Create a repository on GitHub.** Name it `rantbot.github.io` to publish at `https://rantbot.github.io`. Any other name works too and publishes at `https://rantbot.github.io/that-name/`.
2. **Upload these files.** On the new repository's page, choose “uploading an existing file” and drag in everything from this folder, including the hidden `.github` folder and `.pages.yml`. Commit to the `main` branch.
   If the hidden files don't come across, open a terminal in this folder and run `git init && git add . && git commit -m "First version" && git branch -M main && git remote add origin https://github.com/rantbot/REPO-NAME.git && git push -u origin main`.
3. **Turn on Pages.** In the repository, go to Settings, then Pages, and set Source to **GitHub Actions**.
4. **Wait for the first publish.** The Actions tab shows a “Publish site” run. When it turns green, the site is live.

From then on, every saved change publishes itself in about a minute.

## Add or edit a post from your phone or computer

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub. On a phone, add it to your home screen so it opens like an app.
2. Pick the repository, then **Posts**, then **Add an entry**.
3. Fill in the title, choose **Story**, **Writing** or **Making**, set the date, write the post, and add a cover photo if you have one.
4. Leave **Draft** on while you work. Turn it off and save to publish.

A few tips that help readers and search:

- **Title.** Use the question someone would actually search for, like “Can a phone tell where a sugar packet landed?”
- **Summary.** One or two sentences. It shows under the title, in lists, and in search results.
- **In short.** An optional plain answer at the top of the post. AI tools tend to quote this part.
- **Series.** Give related posts the same series name and they link to each other automatically.
- **Stories** are longer pieces about the bigger work, under **Stories** in Pages CMS. Fill in **Story details**. The homepage shows the three most recent. Writing and Making are the lighter, shorter posts.
- **No photo yet?** Set a cover color and a few cover words and the site makes a typographic cover.

**Site and homepage** in Pages CMS holds the homepage text and your profile links. **Essays published elsewhere** holds the thoughtbot posts, which link to the originals.

You can also edit any file directly on github.com or in the GitHub mobile app. Posts are plain Markdown files in `src/posts`.

## Help people find it

- The site builds a sitemap (`/sitemap.xml`), an RSS feed (`/feed.xml`), `robots.txt`, and `llms.txt`, a plain list of posts for AI tools.
- Every page has a title, description, link previews, and structured data that tells search engines who wrote what.
- After launch, add the site to [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters) and submit the sitemap.
- Add your LinkedIn address under **My profiles elsewhere**, and link to the site from LinkedIn, GitHub, your thoughtbot author page, and Ruby Central. Those links matter more than anything on the site itself.

## The domain

The site lives at rancraycraft.com, registered at GoDaddy. DNS points the domain at GitHub Pages (four A records for `@` and a `www` CNAME to `rantbot.github.io`), and the custom domain is set in the repository under Settings, then Pages. The build picks up the address automatically.

## Preview on your computer

Install [Node.js](https://nodejs.org), then in this folder run `npm install` once and `npm start`. Open the address it prints.

## Edit with Claude

Open the Portfolio project in Claude and ask for what you want, like “add a Making post about the cookbook” or “add my new thoughtbot essay”. Claude edits this folder, checks the build, and hands it back. Then commit and push in GitHub Desktop. `CLAUDE.md` holds the conventions Claude follows.

To start a post by hand, run `npm run new -- "Post title" making`.

## Where things live

| What | Where |
| --- | --- |
| Stories | `src/stories/`, one Markdown file each |
| Writing and Making posts | `src/posts/` |
| Photos | `src/assets/images/` |
| Homepage text and settings | `src/_data/site.yml` |
| Essays on other sites | `src/_data/elsewhere.yml` |
| About page | `src/about.md` |
| Look and feel | `src/assets/css/site.css` |
| Page templates | `src/_includes/` and `src/*.njk` |

## Before you publish, check

- The dates on the six starter posts are placeholders. Set each one to the day you publish it.
- The four stories include notes in `<!-- -->` marks for the facts, collaborators, results, and lessons to add. These notes don't show on the site.
- Seven more posts are waiting as drafts: Is it AI?, the meeting prep tool, the cookbook, the children's book, the outdoor kitchen, Austin, and the AI transformation.
- Add your LinkedIn address and a portrait (set `portrait` at the top of `src/about.md`).
