import type { Metadata } from "next";
import Link from "next/link";
import { formatDhivehiDate } from "@/lib/articles";
import { getPrivacyPolicy } from "@/lib/privacy";

export const metadata: Metadata = { title: "ޕްރައިވެސީ ޕޮލިސީ · Hulhangu" };

// One icon per section, in the order of the built-in policy text.
const ICONS = [
  <><path d="M9 3h6v3H9z" /><path d="M7 4.5H5V21h14V4.5h-2" /><path d="M9 11h6M9 15h4" /></>,
  <><rect x="6" y="2" width="12" height="20" rx="2.5" /><path d="M11 18h2" /></>,
  <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></>,
  <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  <><circle cx="10" cy="8" r="4" /><path d="M3 21a7 7 0 0 1 12-4.9" /><path d="M15 18l2 2 4-4" /></>,
  <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></>,
];

export default function PrivacyPage() {
  const p = getPrivacyPolicy();

  return (
    <div className="wrap narrow policy-page">
      <div className="page-head">
        <Link className="back" href="/" aria-label="ފަހަތަށް">
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <h1 className="page-title">ޕްރައިވެސީ ޕޮލިސީ</h1>
      </div>

      <p className="policy-updated">ފަހުން އަޕްޑޭޓްކުރީ: {formatDhivehiDate(p.updated)}</p>
      {p.intro && <p className="contact-intro">{p.intro}</p>}

      <div className="policy-sections">
        {p.sections.map((s, i) => (
          <section key={i} className="policy-section">
            <span className="policy-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[i % ICONS.length]}
              </svg>
            </span>
            <div>
              {s.heading && <h2>{s.heading}</h2>}
              {s.paragraphs.map((t, j) => (
                <p key={j}>{t}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="policy-contact">
        <p>މި ސިޔާސަތާ ބެހޭގޮތުން ސުވާލެއް އޮތިއްޔާ</p>
        <Link className="btn-solid" href="/contact">
          އަޅުގަނޑުމެންނާ ގުޅުއްވާ
        </Link>
      </div>
    </div>
  );
}
