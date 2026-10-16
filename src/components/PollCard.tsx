"use client";

import { useEffect, useState } from "react";
import { Poll } from "@/lib/articles";
import { apiGet, apiOn, apiPost, remember, voterId } from "@/lib/api";
import ArticleImage from "./ArticleImage";

export default function PollCard({ poll }: { poll: Poll }) {
  const [votes, setVotes] = useState(poll.votes);
  const [picked, setPicked] = useState<number | null>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const done = picked !== null;
  const total = votes.reduce((a, b) => a + b, 0);

  const [busy, setBusy] = useState(false);
  const fromCounts = (counts: Record<string, number>) => poll.options.map((_, i) => counts[i] ?? 0);

  // With the online service on: everyone's votes, and this device's earlier vote.
  useEffect(() => {
    if (!apiOn) return;
    apiGet<Record<string, number>>(`/poll?id=${encodeURIComponent(poll.id)}`).then((counts) => {
      if (counts) setVotes(fromCounts(counts));
      const mine = remember(`hulhangu-poll:${poll.id}`);
      if (mine !== null && mine !== "") {
        setPicked(Number(mine));
        setSelection(Number(mine));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poll.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selection === null) return;
    if (apiOn) {
      setBusy(true);
      const res = await apiPost<{ counts: Record<string, number> }>("/vote", {
        poll: poll.id,
        option: selection,
        voter: voterId(),
      });
      setBusy(false);
      if (!res) return;
      setVotes(fromCounts(res.counts));
      remember(`hulhangu-poll:${poll.id}`, String(selection));
      setPicked(selection);
      return;
    }
    const next = [...votes];
    next[selection] += 1;
    setVotes(next);
    setPicked(selection);
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
        <button className="btn-solid" type="submit" disabled={selection === null || done || busy}>
          {done ? "ޝުކުރިއްޔާ!" : "ޖަވާބު ފޮނުވާ"}
        </button>
      </div>
    </form>
  );
}
