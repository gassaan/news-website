import type { ReactNode } from "react";
import Link from "next/link";
import { formatDhivehiDate } from "@/lib/articles";
import type { Policy } from "@/lib/policy";

// Shared layout for the Privacy Policy and Terms pages: one card per section, each with an icon.
export default function PolicyPage({
  title,
  policy,
  icons,
  question,
}: {
  title: string;
  policy: Policy;
  icons: ReactNode[];
  question: string;
}) {
  return (
    <div className="wrap narrow policy-page">
      <div className="page-head">
        <Link className="back" href="/" aria-label="ފަހަތަށް">
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <h1 className="page-title">{title}</h1>
      </div>

      <p className="policy-updated">ފަހުން އަޕްޑޭޓްކުރީ: {formatDhivehiDate(policy.updated)}</p>
      {policy.intro && <p className="contact-intro">{policy.intro}</p>}

      <div className="policy-sections">
        {policy.sections.map((s, i) => (
          <section key={i} className="policy-section">
            <span className="policy-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                {icons[i % icons.length]}
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
        <p>{question}</p>
        <Link className="btn-solid" href="/contact">
          އަޅުގަނޑުމެންނާ ގުޅުއްވާ
        </Link>
      </div>
    </div>
  );
}
