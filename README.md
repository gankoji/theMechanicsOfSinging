# The Mechanics of Singing

An Astro library of essays by Jacob (Jake) Bailey and teaching materials developed
for the Northwest Sound Chorus. The site combines long-form reading with the
original lessons, chord visualizer, and Zach Groeblinghoff's expression workshop.

## Run locally

Use Node 26 (see `.nvmrc`), then install both locked dependency trees:

```sh
npm ci
npm ci --prefix barbershop-analyzer
npm run dev
```

Open `http://localhost:4321/theMechanicsOfSinging/`.
The development command builds the analyzer and stages the original resources
before starting Astro. Essay and Astro edits update live. After editing a legacy
lesson or the analyzer, rerun `npm run prepare:resources` (or restart `npm run dev`).
For fast analyzer-only development, use `npm --prefix barbershop-analyzer run dev`.

## Publish an essay

Add a Markdown file in `essays/` using this frontmatter:

```yaml
---
slug: a-stable-url-name
title: "The full essay title"
description: "A concise, reader-facing description."
topic: instrument
order: 4
draft: true
---
# The full essay title

Your essay begins here.
```

- Supported primary topics: `instrument`, `tuning`, `expression`.
- Set `draft: false` when ready. Omitted draft status defaults to **unpublished**.
  Drafts are excluded from page generation, lists, related links, and public copies.
  This is a publishing guard, **not privacy protection**: anything committed to a
  public repository remains public on GitHub.
- Keep the H1 in the Markdown for readability on GitHub. The site replaces that
  initial heading with the page header; it is not duplicated.
- `slug` is the permanent URL under `/essays/`. Keep it stable when renaming files.
- `order` controls display order, not a required learning sequence.
- No publication dates are invented. Reading time is estimated at 220 words/minute.
- Standard Markdown tables are supported. Use `$...$` for inline math and `$$`
  blocks for display math; KaTeX renders accessible math at build time.
- Add optional cross-topic connections in `src/data/resources.ts`. New essays
  otherwise appear automatically under their primary topic.

The migration added frontmatter to the three initial essays and normalized one
inline math delimiter from `\(...\)` to `$...$`; the wording and references were
not rewritten.

## Add or update teaching materials

`src/data/resources.ts` is the discovery catalog shared by the home page, topic
library, and related-resource sections. Credit collaborators on the entry, not
only inside the resource itself. A resource may belong to multiple topics.

The original source directories remain editable in place:

- `learning-the-instrument/`: interactive anatomy and technique lesson.
- `mechanics-of-music/`: rhythm and tuning instructor's guide.
- `thematic-elements/`: presentation and original PDF, Markdown, TXT, and Org files.
- `barbershop-analyzer/`: React/Vite source for the illustrative chord model.

`scripts/prepare-resources.mjs` stages the first three directories, `public/`, and
the analyzer's **built** output in the ignored `.legacy-public/` directory.
Astro serves that directory in development and copies it into `dist/` on build.
This avoids maintaining two editable copies and preserves old `index.html` URLs,
presentation filenames, and adjacent PDF links. Do not place drafts or private
notes in a public resource directory. For an entirely new resource directory,
add it explicitly to staging and the build-verification contract.

The shared return bar is styled by `public/legacy-nav.css`. Existing lesson
experiences deliberately retain their original styles and teaching content.
Contextual notes identify specific simplified explanations; the expression
workshop is not treated as superseded by the essays.

## Verify

```sh
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run preview
```

The build creates **only static files** in `dist/`, then validates the assembled
site. Browser tests serve that artifact under the actual GitHub project prefix,
not a development-server fallback.

The analyzer keeps its own React dependencies and large chart bundle; they are
not loaded by the Astro reading pages. Its existing `@ts-nocheck` is not a claim of
full analyzer type safety. The original anatomy lesson uses Tailwind's CDN, and
the presentation uses external fonts/icons and outbound media links. Those
resources still need internet access. Legacy accessibility is not fully
remediated by the new site shell.

## GitHub Pages deployment

The intended URL remains:
`https://gankoji.github.io/theMechanicsOfSinging/`.

**Before publishing this migration**, in GitHub go to **Settings → Pages →
Build and deployment → Source** and select **GitHub Actions**. The repository
currently serves `main` from `/`; that branch-folder mode cannot build Astro.
The old root landing page and stale compiled assets have been replaced by Astro
source, so do not continue deploying the repository directory itself.

The workflow in `.github/workflows/deploy.yml` checks and builds pull requests.
Pushes to `main` (or a manual run on `main`) deploy the verified `dist/` artifact
using the `github-pages` environment. The workflow does not push generated files
back to Git. No hosting settings are changed by running the local build.

`site.config.mjs` is the source of truth for the origin and project base. If moving
to a custom domain, update both, configure the domain in Pages, and rerun link
and browser tests. The analyzer's relative assets and legacy relative navigation
do not need their own hardcoded hostname.

## Design and migration decisions

See `docs/site-plan.md` for the plan and review gates. This project follows the
plain-CSS, static Astro approach of Jake's personal website, but has no build or
runtime dependency on that separate repository.
