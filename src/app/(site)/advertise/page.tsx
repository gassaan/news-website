import type { Metadata } from "next";
import Link from "next/link";
import { getContactInfo } from "@/lib/contact";

export const metadata: Metadata = { title: "އިޢުލާން ކުރައްވާ · Hulhangu" };

// The page for businesses: where adverts appear on the site, the picture sizes, and how
// to get in touch (from the Contact page's details). The "Advertise here" spaces link here.

const SPACES: { name: string; size: string; sketch: string[]; full?: boolean }[] = [
  { name: "ފުރަތަމަ ސަފްހާ", size: "Wide banner · 1456 × 364", sketch: ["k", "", "x", "k", "", "x"] },
  { name: "ޚަބަރުގެ މަތީގައި", size: "Wide banner · 1456 × 364", sketch: ["x", "k", "", "", "", ""] },
  { name: "ޚަބަރުގެ ތެރޭގައި", size: "Square · 1080 × 1080", sketch: ["k", "", "x sq", "", ""] },
  { name: "ޚަބަރުގެ ފަހަތުގައި", size: "Wide banner · 1456 × 364", sketch: ["k", "", "", "", "", "x"] },
  { name: "ވާހަކައިގެ ބައިތަކުގެ ދެމެދު", size: "Full screen · 1080 × 1080", sketch: ["x"], full: true },
];

export default function AdvertisePage() {
  const c = getContactInfo();
  const message = encodeURIComponent("ހުޅަނގުގައި އިޢުލާނެއް ޖެއްސުމުގެ ވާހަކަ ދައްކަން");
  return (
    <div className="wrap narrow contact-page">
      <div className="page-head">
        <Link className="back" href="/" aria-label="ފަހަތަށް">
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <h1 className="page-title">އިޢުލާން ކުރައްވާ</h1>
      </div>

      <p className="contact-intro">ހުޅަނގުގައި ތިޔަ ވިޔަފާރީގެ އިޢުލާން ޖައްސަވާ. ޚަބަރާއި ވާހަކަ ކިޔާ ކިޔުންތެރިންނާ ހަމައަށް ތިޔަ މެސެޖު ފޯރުކޮށްދެވޭނެ.</p>

      <h2 className="aw-h">އިޢުލާން ފެންނާނެ ތަންތަން</h2>
      <div className="aw-spaces">
        {SPACES.map((s) => (
          <div key={s.name} className="aw-space">
            <span className={`aw-mini${s.full ? " full" : ""}`} aria-hidden="true">
              {/* k: a card, x: the advert, sq: square */}
              {s.sketch.map((k, i) => (
                <i key={i} className={k} />
              ))}
            </span>
            <span className="aw-txt">
              <b>{s.name}</b>
              <small>{s.size}</small>
            </span>
          </div>
        ))}
      </div>

      <h2 className="aw-h">ތިޔަ އިޢުލާން މިހެން ފެންނާނެ</h2>
      <div className="aw-sample">ތިޔަ އިޢުލާން މިތާ</div>

      {c.whatsapp && (
        <a className="aw-btn wa" href={`https://wa.me/${c.whatsapp}?text=${message}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
            <path d="M9 9c0 3 3 6 6 6l1.2-1.4-2-1-1 .8a4 4 0 0 1-2.6-2.6l.8-1-1-2z" />
          </svg>
          ވަޓްސްއެޕް ކޮށްލައްވާ
        </a>
      )}
      {c.email && (
        <a className="aw-btn line" href={`mailto:${c.email}?subject=${encodeURIComponent("Advertising on Hulhangu")}`} dir="ltr">
          {c.email}
        </a>
      )}
      {c.phone && (
        <a className="aw-btn line" href={`tel:${c.phone.replace(/\s/g, "")}`} dir="ltr">
          {c.phone}
        </a>
      )}
      <p className="aw-note">އަގުތަކާއި ހުސް ތާރީޚުތައް ބައްލަވަން ގުޅުއްވާ</p>
    </div>
  );
}
