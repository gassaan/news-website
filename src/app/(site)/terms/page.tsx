import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { getTerms } from "@/lib/terms";

export const metadata: Metadata = { title: "ބޭނުންކުރުމުގެ ޝަރުތުތައް · Hulhangu" };

// One icon per section, in the order of the built-in terms text.
const ICONS = [
  <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  <><circle cx="12" cy="12" r="9" /><path d="M14.8 9.5a3.5 3.5 0 1 0 0 5" /></>,
  <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></>,
  <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  <><path d="M4 5h16v11H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>,
  <><path d="M12 4v16M7 20h10M5 7h14" /><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" /></>,
  <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 4v5h-5" /></>,
];

export default function TermsPage() {
  return (
    <PolicyPage
      title="ބޭނުންކުރުމުގެ ޝަރުތުތައް"
      policy={getTerms()}
      icons={ICONS}
      question="މި ޝަރުތުތަކާ ބެހޭގޮތުން ސުވާލެއް އޮތިއްޔާ"
    />
  );
}
