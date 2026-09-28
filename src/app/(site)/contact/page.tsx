import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { getContactInfo } from "@/lib/contact";

export const metadata: Metadata = { title: "ގުޅުއްވުމަށް · Hulhangu" };

const ICONS = {
  email: <path d="M3 6h18v12H3zM3 7l9 6 9-6" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  whatsapp: (
    <>
      <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
      <path d="M9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .8a4 4 0 0 1-2.6-2.6l.8-1-1-2z" />
    </>
  ),
  address: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  hours: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
};

export default function ContactPage() {
  const c = getContactInfo();
  const cards = [
    c.email && { key: "email", label: "އީމެއިލް", value: c.email, href: `mailto:${c.email}`, ltr: true },
    c.phone && { key: "phone", label: "ފޯނު", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}`, ltr: true },
    c.whatsapp && { key: "whatsapp", label: "ވަޓްސްއެޕް", value: `+${c.whatsapp}`, href: `https://wa.me/${c.whatsapp}`, ltr: true },
    c.address && { key: "address", label: "އެޑްރެސް", value: c.address },
    c.hours && { key: "hours", label: "ހުޅުވާލާ ގަޑިތައް", value: c.hours },
  ].filter(Boolean) as { key: keyof typeof ICONS; label: string; value: string; href?: string; ltr?: boolean }[];

  return (
    <div className="wrap narrow contact-page">
      <div className="page-head">
        <Link className="back" href="/" aria-label="ފަހަތަށް">
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <h1 className="page-title">ގުޅުއްވުމަށް</h1>
      </div>

      <p className="contact-intro">{c.intro}</p>

      {cards.length > 0 && (
        <div className="contact-cards">
          {cards.map((card) => {
            const inner = (
              <>
                <span className="ci-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[card.key]}
                  </svg>
                </span>
                <span className="ci-text">
                  <small>{card.label}</small>
                  <b dir={card.ltr ? "ltr" : undefined}>{card.value}</b>
                </span>
              </>
            );
            return card.href ? (
              <a key={card.key} className="contact-card" href={card.href}>
                {inner}
              </a>
            ) : (
              <div key={card.key} className="contact-card">
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {c.email || c.whatsapp ? (
        <ContactForm email={c.email} whatsapp={c.whatsapp} />
      ) : (
        <p className="contact-soon">ގުޅުއްވޭނެ މަޢުލޫމާތު ވަރަށް އަވަހަށް މިތަނުގައި ލިޔެވޭނެ.</p>
      )}
    </div>
  );
}
