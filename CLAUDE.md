@AGENTS.md

## Security rules

- The site is static (GitHub Pages); everything that writes goes through the online service in `api/`. Every service endpoint validates its input (types, lengths, allowed values), uses bound parameters for D1 and `$params` for GROQ, and is rate-limited per reader.
- Never put a secret in the site's code or in a `NEXT_PUBLIC_` variable. Secrets live only in GitHub Actions secrets and the service's Wrangler secrets (`SANITY_TOKEN`, `CF_ANALYTICS_TOKEN`, …).
- The public Sanity dataset is readable by anyone: put private records under an id with a dot (e.g. `analytics.readers`) or keep them out of Sanity (voice recordings live in the service's D1, admin-only).
- User or editor text is shown with React's normal escaping; any raw HTML (`dangerouslySetInnerHTML`, `innerHTML`) must escape every value, and links only allow `http:`/`https:`.
- Admin-only service endpoints check the Sanity login server-side (`voiceAdmin`), never in the browser alone.
- Before adding a package, confirm it is the real, maintained one; run `npm audit` in the root and in `api/` after dependency changes.
