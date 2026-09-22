"use client";

import { useState } from "react";
import { Poll } from "@/lib/articles";
import PollCard from "./PollCard";

const INITIAL = 2;
const STEP = 2;

export default function PollList({ polls }: { polls: Poll[] }) {
  const [shown, setShown] = useState(Math.min(INITIAL, polls.length));
  const visible = polls.slice(0, shown);
  const hasMore = shown < polls.length;

  return (
    <>
      <div className="poll-list" id="pollList">
        {visible.map((poll) => (
          <PollCard key={poll.id} poll={poll} />
        ))}
      </div>
      <div className="load-wrap">
        <button
          type="button"
          className="more load-more"
          hidden={!hasMore}
          onClick={() => setShown((s) => Math.min(s + STEP, polls.length))}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M6.5 1v11M1 6.5h11" />
          </svg>
          އިތުރު ޕޯލްސް
        </button>
      </div>
    </>
  );
}
