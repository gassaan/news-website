"use client";

import { useEffect, useState } from "react";
import { Poll } from "@/lib/articles";
import { apiGet, apiOn, apiPost, remember, voterId } from "@/lib/api";
import ArticleImage from "./ArticleImage";

// "2 ދުވަސް 5 ގަޑިއިރު" style time left until voting ends.
function timeLeft(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const min = m % 60;
  if (d) return `${d} ދުވަސް${h ? ` ${h} ގަޑިއިރު` : ""}`;
  if (h) return `${h} ގަޑިއިރު${min ? ` ${min} މިނިޓު` : ""}`;
  return `${min} މިނިޓު`;
}

export default function PollCard({ poll }: { poll: Poll }) {
  const [votes, setVotes] = useState(poll.votes);
  const [picked, setPicked] = useState<number | null>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // The clock is read only in the browser; until then the page trusts the build.
  const [now, setNow] = useState<number | null>(null);
  const ends = poll.closesAt ? Date.parse(poll.closesAt) : NaN;
  const closed = now === null ? Boolean(poll.closed) : ends <= now;
  const done = picked !== null || closed;
  const total = votes.reduce((a, b) => a + b, 0);
  const top = Math.max(0, ...votes);

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

  // Keep the countdown moving, and switch to the results the moment voting ends.
  useEffect(() => {
    if (!poll.closesAt) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 30000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [poll.closesAt]);

  // When voting ends while the page is open, show the final numbers.
  useEffect(() => {
    if (!apiOn || !closed || now === null) return;
    apiGet<Record<string, number>>(`/poll?id=${encodeURIComponent(poll.id)}`).then((counts) => {
      if (counts) setVotes(fromCounts(counts));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closed]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selection === null || closed) return;
    if (apiOn) {
      setBusy(true);
      const res = await apiPost<{ counts: Record<string, number> }>("/vote", {
        poll: poll.id,
        option: selection,
        voter: voterId(),
      });
      setBusy(false);
      if (!res) {
        // Most likely voting has just ended: show where things stand.
        const counts = await apiGet<Record<string, number>>(`/poll?id=${encodeURIComponent(poll.id)}`);
        if (counts) setVotes(fromCounts(counts));
        setNow(Date.now());
        return;
      }
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
    <form className={`poll ${done ? "done" : ""} ${closed ? "closed" : ""}`} onSubmit={submit}>
      <ArticleImage slug={poll.id} alt="" className="poll-img" />
      <div className="poll-body">
        <h2>{poll.question}</h2>
        {poll.options.map((text, i) => {
          const pct = total ? Math.round((votes[i] / total) * 100) : 0;
          const winner = closed && total > 0 && votes[i] === top;
          return (
            <label className={`opt ${winner ? "winner" : ""}`} key={i}>
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
        {closed ? (
          <p className="poll-status ended">
            <strong>ވޯޓު ނިމިއްޖެ</strong>
            <span>ޖުމްލަ {total.toLocaleString("en-US")} ވޯޓު</span>
          </p>
        ) : (
          <>
            {poll.closesAt && now !== null && (
              <p className="poll-status">
                ވޯޓު ނިމުމަށް <strong>{timeLeft(ends - now)}</strong>
              </p>
            )}
            <button className="btn-solid" type="submit" disabled={selection === null || done || busy}>
              {done ? "ޝުކުރިއްޔާ!" : "ޖަވާބު ފޮނުވާ"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
