import type { Metadata } from "next";
import Link from "next/link";
import { formatDhivehiDate } from "@/lib/articles";
import { getPrivacyPolicy } from "@/lib/privacy";

export const metadata: Metadata = { title: "ޕްރައިވެސީ ޕޮލިސީ · Hulhangu" };

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
            <span className="policy-num" aria-hidden="true">
              {i + 1}
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
