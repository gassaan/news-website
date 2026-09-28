import cmsData from "@/content/cms.json";

export type ContactInfo = {
  intro: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  hours: string;
};

const DEFAULT_INTRO =
  "ޚަބަރެއް، ޚިޔާލެއް، ސުވާލެއް ނުވަތަ އިޝްތިހާރެއްގެ ވާހަކައެއް އޮތިއްޔާ އަޅުގަނޑުމެންނާ ގުޅުއްވާ.";

// Filled in the dashboard under "ގުޅުއްވުމަށް"; anything left empty is hidden on the page.
export function getContactInfo(): ContactInfo {
  // Fields left empty in the dashboard come through as null.
  const c = ((cmsData as unknown as { contact?: { [K in keyof ContactInfo]?: string | null } }).contact ?? {});
  const clean = (v?: string | null) => (v ?? "").trim();
  const wa = clean(c.whatsapp).replace(/[^\d]/g, "");
  return {
    intro: clean(c.intro) || DEFAULT_INTRO,
    email: clean(c.email),
    phone: clean(c.phone),
    // A local 7-digit Maldives number gets the 960 country code WhatsApp needs.
    whatsapp: wa.length === 7 ? `960${wa}` : wa,
    address: clean(c.address),
    hours: clean(c.hours),
  };
}
