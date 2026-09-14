# A unified home for The Mechanics of Singing

## Goal and boundaries

Publish Jake Bailey's three essays alongside the existing Northwest Sound teaching
materials. Use Astro, Markdown, semantic HTML, and plain CSS, following the
publishing approach of `jakedoescode.com` without coupling the repositories.
Do not rewrite essay prose, claim ownership of collaborators' materials, or
replace working teaching interactions merely to change their appearance.

## Information architecture

- `/`: editorial introduction, three topic pathways, essays, and practice links.
- `/essays/`: all published essays, with topic and estimated reading time.
- `/essays/<slug>/`: one article, author, introduction, section navigation,
  print-friendly prose, and related essays/resources.
- `/resources/`: lessons, tools, presentations, and downloadable source documents,
  clearly labeled by format and provenance.
- Existing lesson, presentation, and analyzer paths continue to work, including
  explicit `index.html` links. Legacy lessons receive a small shared navigation
  strip, not a wholesale visual or behavioral rewrite.
- Raw workshop documents retain their filenames and relative PDF links.

The three topic pathways are **The singing instrument**, **Tuning together**, and
**Musical expression**. Each links directly to its corresponding section of
`/resources/`, containing related essays and practical resources. Resources may
belong to several topics. These connect formats rather than making readers choose
a file type before they know what they want to learn.

## Visual design

- Warm off-white paper, near-black green ink, forest-green links, ochre details.
- System serif display and article text; system sans-serif navigation and labels.
  No external font request is required for the new site.
- Quiet rules, unnumbered topic pathways, generous whitespace, modest square-edged
  cards. No stock imagery, animation, gradient-heavy cards, or dashboard styling.
- Full wordmark and three navigation links (Home, Essays, Resources). Navigation
  wraps on small screens without a JavaScript menu.
- Homepage: small context label, large editorial headline, concise introduction,
  one reading CTA and one lesson/tool CTA, prominent named practice shortcuts,
  topic pathways, then essay previews as a list with complete, untruncated titles.
- Article: breadcrumb, topic, full title, author/reading time, description, then
  a desktop two-column layout with section navigation and a 65–72 character
  reading column. Section navigation becomes a closed native disclosure above
  prose on small screens. Nested disclosures expose useful subsection links.
- Tables scroll within a keyboard-focusable labeled region on narrow screens.
  Math renders at build time. Print hides site navigation, not essay content.
- Visible keyboard focus, skip link, semantic landmarks, descriptive links,
  high-contrast text, reduced-motion support, and no color-only distinctions.

## Publishing and migration

- `essays/` remains the sole source of essay text. Add frontmatter with stable
  slugs, title, description, topic, ordering, and explicit draft status. Do not
  invent publication dates. Render the existing Markdown H1 only once.
- Drafts are absent from routes, indexes, related links, and downloadable output.
- A small typed catalog describes existing resources and their relationships.
- Build copies only an explicit allowlist of legacy resource directories into the
  served static files. Never expose the repository root, private notes, or summaries.
- Build the existing React/Vite analyzer separately and include its production
  output, never its development HTML entrypoint.
- Use one configured Pages base (`/theMechanicsOfSinging/`) for Astro navigation;
  legacy relative links and analyzer-relative assets remain portable.
- GitHub Actions installs locked dependencies, checks, builds, verifies output,
  and deploys `dist/`. GitHub Pages must use **GitHub Actions** as its source.
- Preserve original teaching experiences, adding specific context only where
  simplified explanations need it. The expression workshop is not superseded
  simply because it predates the essays. Preserve existing credits, notably Zach
  Groeblinghoff's presentation, and show credit on discovery entries too.

## Review and acceptance

1. Adversarial planning review: challenge migration, scope, and publishing risks.
2. Adversarial design review: challenge information hierarchy, coherence, mobile,
   accessibility, article ergonomics, and treatment of legacy materials.
3. Adversarial implementation review: inspect code and actual build behavior.
4. Verify type checks, complete production build, internal links/assets/fragments,
   all three essays, draft exclusion, preserved routes and downloads.
5. Exercise production output in a browser at desktop and mobile sizes, including
   article tables/math and the analyzer. Record limitations rather than implying
   a full accessibility or pedagogical audit.

## Review outcomes

### Planning

The adversarial review supported Astro and preserving the original experiences.
It required explicit publication filtering, stable slugs, exact legacy file URLs,
independent analyzer base configuration, and a confirmed Pages deployment mode.
The implementation uses frontmatter in the original essay files and a shared
published-content helper for every route and discovery surface. The analyzer
builds with relative assets before staging; Astro owns final output assembly.

GitHub's Pages API confirmed `main` at `/`, no custom domain, and the project URL
`https://gankoji.github.io/theMechanicsOfSinging/`. Changing Pages source to
GitHub Actions is a documented user action; no live setting has been changed.

### Design

The adversarial review required actual topic destinations, prominent practice
shortcuts, full long titles, a collapsed mobile contents list, usable tables,
specific rather than blanket archival notes, and contributor credits in discovery.
Those adjustments are reflected above and in the implementation.

Rendered homepage, library, and long-title article were inspected at 1440px and
320px. Titles remain complete, new pages have no horizontal page overflow, and
math renders with MathML. The article uses the same editorial system with a
smaller title scale than the homepage. Wide tables retain semantic headers and
scroll locally; print styles let columns wrap onto the page.

### Implementation

The adversarial implementation review confirmed the static build, legacy paths,
attribution, table/math rendering, and topic destinations. Three findings were
addressed:

- Legacy recommendations now point to stable topic sections, so withdrawing an
  essay does not leave a hardcoded link to its unpublished route.
- One helper unions an essay's primary topic with supplemental topics; optional
  connections can no longer replace frontmatter.
- Navigation distinguishes the current page from the current section and marks
  neither on the 404 page. The 404 canonical targets the actual generated file.

Final verification passed:

- `npm run check`: no errors, warnings, or hints.
- `npm test`: five tests, including an isolated Astro build that tests both new
  drafts and withdrawal of previously published essays.
- `npm run build`: analyzer plus Astro, followed by assembled-output validation of
  local links, assets, fragments, publication status, headings, tables, and math.
- `npm run test:browser`: 24 Chromium checks across desktop and 320px mobile,
  including bookmark-to-essay-to-tool navigation, analyzer controls, keyboard
  contents and table scrolling, PDF downloads, and print-table visibility.
- Dependency audits: no reported vulnerabilities after compatible analyzer
  lockfile updates. No forced major upgrades were used.

The original analyzer's large bundle and `@ts-nocheck`, legacy external services,
and incomplete legacy accessibility remain documented limitations. No live Pages
deployment, branch push, or hosting-settings change was performed.

### Content preservation

The three essays remain the sole prose sources. Frontmatter was added, and one
inline equation's delimiters were normalized from `\(...\)` to `$...$` for KaTeX.
Wording, references, and author signatures were retained. Legacy presentation
credits and teaching prose were preserved; the instructor guide's reference-app
link was corrected to the analyzer.
