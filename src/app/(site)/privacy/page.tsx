import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
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
  return (
    <PolicyPage
      title="ޕްރައިވެސީ ޕޮލިސީ"
      policy={getPrivacyPolicy()}
      icons={ICONS}
      question="މި ސިޔާސަތާ ބެހޭގޮތުން ސުވާލެއް އޮތިއްޔާ"
    />
  );
}
