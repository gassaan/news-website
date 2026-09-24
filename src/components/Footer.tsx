import { Fragment } from "react";
import Link from "next/link";
import Logo from "./Logo";

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

const PAGE_LINKS = ["ގުޅުއްވާ", "ސިއްރުކަމުގެ ސިޔާސަތު", "ޝަރުތުތައް", "ސުލޫކީ މިންގަނޑު"];

export default function Footer() {
  return (
    <footer>
      <span className="foot-ghost" aria-hidden="true">
        <Logo className="h-full" />
      </span>
      <div className="wrap foot-inner">
        <Link href="/" aria-label="Hulhangu home" className="logo">
          <Logo className="h-14" />
        </Link>
        <p className="foot-tag">ޚަބަރު، ވާހަކަ އަދި ފޮޓޯ</p>

        <div className="social" dir="ltr">
          {SOCIAL_LINKS.map((s) => (
            <a key={s.label} href={s.href} aria-label={s.label}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d={s.path} />
              </svg>
            </a>
          ))}
          <a href="#" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
            </svg>
          </a>
          <a href="#" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 8.5V6.8c0-.8.5-1 .9-1h2.4V2h-3.3C10.3 2 9.6 4.7 9.6 6.5v2H7.3v3.9h2.3V22H14v-9.6h3l.4-3.9H14z" />
            </svg>
          </a>
        </div>

        <nav className="flinks" aria-label="Footer">
          {PAGE_LINKS.map((label, i) => (
            <Fragment key={label}>
              {i > 0 && <span aria-hidden="true">•</span>}
              <a href="#">{label}</a>
            </Fragment>
          ))}
        </nav>

        <p className="copyright">© {new Date().getFullYear()} Hulhangu · All rights reserved</p>
      </div>
    </footer>
  );
}
