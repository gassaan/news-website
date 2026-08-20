# ދިވެހި ޚަބަރު (Dhivehi News)

A Dhivehi-language news website built with Next.js (App Router), TypeScript, and Tailwind CSS v4.

## Stack

- **Next.js 16** (App Router, static generation)
- **Tailwind CSS v4**
- **Noto Sans Thaana** (Google Font) for Dhivehi/Thaana script
- Right-to-left (`dir="rtl"`, `lang="dv"`) layout throughout

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Project structure

- `src/app/page.tsx` — homepage (featured + latest articles)
- `src/app/article/[slug]/page.tsx` — article detail page
- `src/app/category/[slug]/page.tsx` — category listing page
- `src/lib/articles.ts` — article/category data model and sample (placeholder) content
- `src/components/` — `Header`, `Footer`, `ArticleCard`

## Content

Article and category data currently lives in `src/lib/articles.ts` as static sample
data, so the site runs with no backend. The sample articles are placeholders — swap
them out with real content, or replace `articles.ts` with a fetch from a CMS/API
(e.g. Sanity, Contentful, a custom backend) once a content source is chosen. The
`Article`/`Category` types and the `getArticle`/`getArticlesByCategory`/etc. helpers
are the seam to keep when doing that swap.

## Deployment

Any platform that supports Next.js works (Vercel, Netlify, etc.). The site is fully
statically generated (`generateStaticParams` on both dynamic routes), so it can also
be exported as static HTML if desired.
