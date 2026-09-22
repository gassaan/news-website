# Hulhangu redesign — build brief

You are updating the existing Dhivehi news site in this repository (Next.js, deployed to GitHub Pages) to the new **Hulhangu** design. The owner has no coding experience: do all the work yourself, test it, commit to `main` so it deploys, and explain results in plain language (no code talk).

## What's in this `design/` folder

| File | What it is |
|---|---|
| `hulhangu-design.html` | **The approved design, built as one working HTML page.** Open it in a browser. It contains every page (use the menu, category tiles, cards and author name to switch between them), both themes (sun/moon button), the phone layout (narrow the window) and all the exact CSS. Treat it as the source of truth for layout, spacing, colours and behaviour. The page switching inside it is hash-based only because it's one file: in the real site each view becomes a real route. |
| `screens/*.jpg` | Screenshots from the owner's Figma file (phone size), dark and light. Where the HTML and a screenshot disagree, **the screenshot wins**. |
| `fonts/Democrats-AK-Black.ttf` | Heading font (weight 900). |
| `fonts/Democrats-Akuru-Bold.ttf` | Body font (weight 700). |
| `logo/hulhangu-logo-white.png` | Logo, transparent PNG. Render it as a CSS mask filled with the theme's logo colour (the design HTML does this with `.logo-mark`). |

Before writing code, read `AGENTS.md`: this is Next.js 16 and its docs live in `node_modules/next/dist/docs/`.

## Phase 1 (this task): new design on the current setup

Keep the current stack and hosting so the owner can see the result at https://gassaan.github.io/news-website/:
- Next.js 16 App Router, TypeScript, Tailwind v4, `output: "export"`, the `basePath` logic in `next.config.ts`, and `.github/workflows/deploy.yml`, all unchanged in purpose.
- Keep the data in `src/lib/articles.ts` (sample content) and its helper functions as the single data seam. Phase 2 will swap it for a database, so **no page or component may import sample data directly; go through the helpers.** Extend the types as needed (image, views, author slug, time, category, poll, etc.).
- Keep the existing **stories with episodes and star ratings** feature (`/stories`, `/story/[slug]`, `/story/[slug]/[episode]`) and restyle it to the design's "ވާހަކަ" story cards (tall image cards with a small white rating badge).
- Remove old components the new design doesn't use.

### Fonts and theme
- Load both fonts with `next/font/local` from `src/fonts/` (copy the two .ttf files there). Headings, nav, chips, card titles and names use Black 900; everything else uses Bold 700. Latin text in the footer, numbers and "Sponsored" uses Inter (Google font).
- Whole site is `lang="dv" dir="rtl"`.
- Theme: dark is the design default, but on first visit follow the device setting (`prefers-color-scheme`). The header button toggles and remembers the choice (keep the existing localStorage + no-flash init script approach). **The button shows a moon in dark mode and a sun in light mode.**
- Copy every colour token **exactly** from the `:root`, `:root[data-theme="light"]` and `:root[data-theme="dark"]` blocks in `hulhangu-design.html` (map them to whatever class or attribute the theme script uses). Don't invent colours. Key values: dark ground `#080018`, surface `#150735`, line `#270e61`, accent `#a882ff`; light ground `#efe8ff`, surface `#e1d5ff`, line `#dacafd`, text/accent `#3e2180`; purple band `#3e2180`.

### Routes and what each must match
| Route | Match |
|---|---|
| `/` | Home view in the design HTML: hero slider (autoplay, swipe, dots), scrolling headline ticker, section carousels (latest, popular, reports) with "އިތުރު ލިޔުން" buttons, category tiles, stories, graphics, photo gallery, two ad slots. |
| `/category/[slug]` | `screens/category-*`: back arrow + title, scrollable chips (the selected one has a thick outline, not a fill), card grid (2 columns and 8 cards on phones, 3 and 9 on desktop), "އިތުރު ލިޔުން +" loads more, ad, footer. Each chip is a link to its category route. |
| `/article/[slug]` | `screens/article-*`: top ad, category pill, centred headline, date/time line, full-width photo, caption bar (camera + caption, eye + views), author pill linking to the author page, text-size −/+ buttons, body with in-article sponsored image, share and comment round buttons, ad, poll card, comment form, comments with nested reply, like/dislike, reply button, "އިތުރު ކޮމެންޓް +", related articles (2×2 on phones). On desktop the body is 2 columns with a thin divider. |
| `/author/[slug]` | `screens/author-*`: avatar, name, "ރިޕޯޓަރު", stat pills (articles, comments), bio, card grid, load more, ad. |
| `/polls` | `screens/polls-*`: back arrow + "ޕޯލްސް", list of poll cards, "އިތުރު ޕޯލްސް +", ad. |
| `/stories`, `/story/...` | As above. |
| Header/footer | Desktop header: logo, 4 nav links, theme button, search. Phone header: moon/sun left, logo centre, ☰ right; the menu opens with a search pill and the 4 links, and ☰ becomes ✕. Footer: logo, links, 4 social icons, copyright (the phone layout adds "Hulhangu" under the logo and puts the links in 2 columns). |

Make nav links, category tiles, cards, chips and author links go to real routes (with `basePath` handled by `next/link`). Use `generateStaticParams` for all dynamic routes.

### Behaviour for phase 1 (no backend yet)
Poll voting, comments, likes and "load more" work in the browser only (client components, local state), exactly as in the design HTML. Show sample data. Clearly mark these spots with `// TODO(phase 2): save to database` comments.

### Images
There are no real photos yet. Use the design's gradient placeholder (`.ph`) wherever an image goes, via one `<ArticleImage>` component that takes an optional `src`. Phase 2 plugs real photos into it.

### Quality bar
- Test at 390px and 1440px wide, in both themes, against the screenshots. No horizontal scrolling on phones.
- Keyboard focus visible, and respect `prefers-reduced-motion`.
- `npm run build` and `npm run lint` must pass before committing.
- Commit in small, clearly described steps and push to `main`. Then tell the owner in plain words what changed and to check the live link after the deploy finishes (about 2 minutes).

## Phase 2 (later, not now; just keep the code ready for it)
Move hosting to Vercel, add Supabase (database, logins, photo storage), and build an admin panel at `/admin`. Features: owner login plus the ability to add more users later (roles: admin, editor, writer); write, edit, schedule and publish articles in Dhivehi with photos; manage categories, authors, stories/episodes, polls and ads; moderate comments. Comments, likes and poll votes then save for everyone.
