import Link from "next/link";
import PollList from "@/components/PollList";
import AdSlot from "@/components/AdSlot";
import { getPolls } from "@/lib/articles";

export default function PollsPage() {
  const polls = getPolls();

  return (
    <>
      <div className="wrap narrow polls-page">
        <div className="page-head">
          <Link className="back" href="/" aria-label="ފަހަތަށް">
            <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1l11 12L1 25" />
            </svg>
          </Link>
          <h1 className="page-title">ޕޯލްސް</h1>
        </div>

        <PollList polls={polls} />
      </div>
      <AdSlot />
    </>
  );
}
