import Link from "next/link";
import Logo from "./Logo";
import BackToTop from "./BackToTop";
import { categories } from "@/lib/articles";

const SOCIAL_LINKS = [
  {
    label: "YouTube",
    href: "#",
    path: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8zM9.7 15V9l5.8 3-5.8 3z",
  },
  {
    label: "TikTok",
    href: "#",
    path: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.8 5.8 0 1 0 5 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.3-1.6z",
  },
];

const SECTIONS = [
  { href: "/#latest", label: "ފަހުގެ ޚަބަރު" },
  { href: "/#popular", label: "އެންމެ މަގުބޫލް" },
  { href: "/category/report", label: "ރިޕޯޓް" },
  { href: "/stories", label: "ވާހަކަ" },
  { href: "/gallery", label: "ފޮޓޯ ގެލެރީ" },
  { href: "/graphics", label: "ގުރެފިކްސް" },
  { href: "/polls", label: "ޕޯލްސް" },
];

// "Reports" is already a section, so it is left out of the category pills.
const CATEGORIES = categories.filter((c) => c.slug !== "report");

// Trust pages: links stay "#" until the pages are written.
const PAGE_LINKS = [
  "އަހަރެމެންނާ ބެހޭ",
  "އަހަރެމެންގެ ޓީމު",
  "އެޑިޓޯރިއަލް ސިޔާސަތު",
  "ގޯހެއް ރިޕޯޓުކުރައްވާ",
  "ޕޯލްތަކާ ބެހޭ",
  "ވާހަކަތަކާ ބެހޭ",
  "ގުޅުއްވާ",
  "އިޝްތިހާރު ކުރައްވާ",
  "ސިއްރުކަމުގެ ސިޔާސަތު",
  "ޝަރުތުތައް",
];

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-card">
          <BackToTop />
          <Link href="/" aria-label="Hulhangu home" className="logo">
            <Logo className="h-12" />
          </Link>
          <p className="foot-tag">ޚަބަރު، ވާހަކަ އަދި ފޮޓޯ</p>

          <p className="foot-label">ސެކްޝަންތައް</p>
          <nav className="foot-cats" aria-label="ސެކްޝަންތައް">
            {SECTIONS.map((s) => (
              <Link key={s.href} href={s.href}>
                {s.label}
              </Link>
            ))}
          </nav>

          <p className="foot-label">ކެޓެގަރީ</p>
          <nav className="foot-cats" aria-label="ކެޓެގަރީ">
            {CATEGORIES.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`}>
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="foot-rule" />

          <a href="#" className="foot-tip">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z" />
            </svg>
            ހުޅަނގަށް ޚަބަރެއް ފޮނުއްވާ
          </a>

          <div className="social" dir="ltr">
            {SOCIAL_LINKS.map((s) => (
              <a key={s.label} href={s.href} aria-label={`Hulhangu on ${s.label}`}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d={s.path} />
                </svg>
              </a>
            ))}
            <a href="#" aria-label="Hulhangu on Instagram">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
              </svg>
            </a>
            <a href="#" aria-label="Hulhangu on Facebook">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M14 8.5V6.8c0-.8.5-1 .9-1h2.4V2h-3.3C10.3 2 9.6 4.7 9.6 6.5v2H7.3v3.9h2.3V22H14v-9.6h3l.4-3.9H14z" />
              </svg>
            </a>
          </div>
        </div>

        <nav className="flinks" aria-label="Footer">
          {PAGE_LINKS.map((label) => (
            <a key={label} href="#">
              {label}
            </a>
          ))}
        </nav>

        <p className="foot-publisher">
          Published by Hulhangu · Registered with the Maldives Media and Broadcasting Commission
        </p>
        <p className="copyright">
          © {new Date().getFullYear()} Hulhangu · All rights reserved
        </p>
      </div>
    </footer>
  );
}
