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
  const c = ((cmsData as { contact?: Partial<ContactInfo> }).contact ?? {}) as Partial<ContactInfo>;
  const clean = (v?: string | null) => (v ?? "").trim();
  return {
    intro: clean(c.intro) || DEFAULT_INTRO,
    email: clean(c.email),
    phone: clean(c.phone),
    whatsapp: clean(c.whatsapp).replace(/[^\d]/g, ""),
    address: clean(c.address),
    hours: clean(c.hours),
  };
}
