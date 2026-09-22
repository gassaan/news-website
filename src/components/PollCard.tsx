"use client";

import { useState } from "react";
import { Poll } from "@/lib/articles";
import ArticleImage from "./ArticleImage";

export default function PollCard({ poll }: { poll: Poll }) {
  const [votes, setVotes] = useState(poll.votes);
  const [picked, setPicked] = useState<number | null>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const done = picked !== null;
  const total = votes.reduce((a, b) => a + b, 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selection === null) return;
    const next = [...votes];
    next[selection] += 1;
    setVotes(next);
    setPicked(selection);
    // TODO(phase 2): save vote to database
  }

  return (
    <form className={`poll ${done ? "done" : ""}`} onSubmit={submit}>
      <ArticleImage slug={poll.id} alt="" className="poll-img" />
      <div className="poll-body">
        <h2>{poll.question}</h2>
        {poll.options.map((text, i) => {
          const pct = total ? Math.round((votes[i] / total) * 100) : 0;
          return (
            <label className="opt" key={i}>
              <input
                type="radio"
                name={poll.id}
                value={i}
                disabled={done}
                checked={selection === i}
                onChange={() => setSelection(i)}
              />
              <span className="dot" />
              <span className="bar" style={done ? { width: `${pct}%` } : undefined} />
              <span className="txt">{text}</span>
              <span className="pct">{done ? `${pct}%` : ""}</span>
            </label>
          );
        })}
        <button className="btn-solid" type="submit" disabled={selection === null || done}>
          {done ? "ޝުކުރިއްޔާ!" : "ޖަވާބު ފޮނުވާ"}
        </button>
      </div>
    </form>
  );
}
