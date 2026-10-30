"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Comment } from "@/lib/articles";
import { apiGet, apiOn, apiPost, remember, timeAgo, voterId } from "@/lib/api";
import project from "@/sanity/project.json";

// Reactions on comments, one per device. The service stores them as numbers (and
// still calls likes and dislikes "up" and "down").
type Reaction = "dislike" | "like" | "love" | "sad" | "haha";
type VoteState = Reaction | null;
type Counts = Partial<Record<Reaction, number>>;
type ApiCounts = { up?: number; down?: number; love?: number; sad?: number; haha?: number };
const fromApi = (c?: ApiCounts): Counts => ({ like: c?.up ?? 0, dislike: c?.down ?? 0, love: c?.love ?? 0, sad: c?.sad ?? 0, haha: c?.haha ?? 0 });

const THUMB = "M2 10.5A1.5 1.5 0 0 1 3.5 9h2A1.5 1.5 0 0 1 7 10.5v9A1.5 1.5 0 0 1 5.5 21h-2A1.5 1.5 0 0 1 2 19.5zM9 10l3.6-7a2.4 2.4 0 0 1 4.3 1.9L15.9 9h4.2a2 2 0 0 1 2 2.4l-1.5 7.9A2.6 2.6 0 0 1 18 21H9z";
const HEART = "M12 20.3s-7.4-4.5-9-9.1C1.9 7.9 4 4.6 7.3 4.6c1.9 0 3.5 1 4.7 2.7 1.2-1.7 2.8-2.7 4.7-2.7 3.3 0 5.4 3.3 4.3 6.6-1.6 4.6-9 9.1-9 9.1z";
const MOUTH = { sad: "M9 16c.8-1 1.8-1.5 3-1.5s2.2.5 3 1.5", haha: "M8.8 13.6c.8 1.3 1.9 1.9 3.2 1.9s2.4-.6 3.2-1.9" };

// Top to bottom in the reactions card.
const REACTIONS: { key: Reaction; value: number; label: string }[] = [
  { key: "like", value: 1, label: "ލައިކް" },
  { key: "love", value: 2, label: "ލޯބި" },
  { key: "haha", value: 4, label: "ހިނިގަނޑު" },
  { key: "sad", value: 3, label: "ހިތާމަ" },
  { key: "dislike", value: -1, label: "ނުރުހުން" },
];
const byKey = Object.fromEntries(REACTIONS.map((r) => [r.key, r])) as Record<Reaction, (typeof REACTIONS)[number]>;

// A reaction's sign, drawn in the text colour: as a line, or filled for your own.
function Glyph({ r, size, solid = false }: { r: Reaction; size: number; solid?: boolean }) {
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const paint = solid ? { fill: "currentColor" } : line;
  let body: ReactNode;
  if (r === "like") body = <path d={THUMB} {...paint} />;
  else if (r === "dislike") body = <path d={THUMB} transform="rotate(180 12 12)" {...paint} />;
  else if (r === "love") body = <path d={HEART} {...paint} />;
  else
    body = (
      <>
        <circle cx="12" cy="12" r="7.6" {...line} />
        <circle cx="9.3" cy="10.3" r="1.1" fill="currentColor" />
        <circle cx="14.7" cy="10.3" r="1.1" fill="currentColor" />
        <path d={MOUTH[r]} {...line} />
      </>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {body}
    </svg>
  );
}

// The reactions pill: your reaction (or a thumb) and the total. Tapping it opens a
// small card like the site's polls: a row per reaction, with a bar and its count.
function ReactPill({ counts, mine, onReact }: { counts: Counts; mine: VoteState; onReact: (v: VoteState) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const total = REACTIONS.reduce((n, r) => n + (counts[r.key] ?? 0), 0);
  const most = Math.max(1, ...REACTIONS.map((r) => counts[r.key] ?? 0));

  return (
    <div className="react" ref={wrap}>
      {open && (
        <div className="react-poll" role="menu" aria-label="ރިއެކްޝަން">
          {REACTIONS.map((r) => {
            const n = counts[r.key] ?? 0;
            const on = mine === r.key;
            return (
              <button
                key={r.key}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                aria-label={`${r.label} ${n}`}
                className={`react-row ${on ? "on" : ""}`}
                onClick={() => {
                  onReact(on ? null : r.key);
                  setOpen(false);
                }}
              >
                <i style={{ width: `${(n / most) * 82}%` }} />
                <span className="react-c">
                  <Glyph r={r.key} size={14} solid={on} />
                </span>
                <b>{n}</b>
              </button>
            );
          })}
        </div>
      )}
      <button
        type="button"
        className="react-pill"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${mine ? byKey[mine].label : "ރިއެކްޝަން"} ${total}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`react-disc ${mine ? "on" : ""}`} key={mine ?? "none"}>
          <Glyph r={mine ?? "like"} size={20} solid={Boolean(mine)} />
        </span>
        <b>{total}</b>
      </button>
    </div>
  );
}

function ReplyIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

// Published comments for one article, straight from the dashboard (Sanity), so a
// comment shows as soon as an editor publishes it.
type Stored = { _id: string; name: string; text: string; parent?: string; submittedAt?: string; _createdAt: string };
const PAGE = 10;
const QUERY = `*[_type == "comment" && target == $t && kind == $k] | order(_createdAt desc)[0...300]{_id, name, text, parent, submittedAt, _createdAt}`;

async function loadComments(target: string, kind: string): Promise<Comment[] | null> {
  const url =
    `https://${project.projectId}.apicdn.sanity.io/v2025-02-19/data/query/${project.dataset}` +
    `?query=${encodeURIComponent(QUERY)}&%24t=${encodeURIComponent(JSON.stringify(target))}&%24k=${encodeURIComponent(JSON.stringify(kind))}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const rows = ((await res.json()).result ?? []) as Stored[];
    const toComment = (r: Stored): Comment => ({
      id: r._id,
      author: r.name,
      text: r.text,
      timeAgo: timeAgo(r.submittedAt ?? r._createdAt),
      likes: 0,
      dislikes: 0,
    });
    const top = rows.filter((r) => !r.parent).map(toComment);
    const byId = new Map(top.map((c) => [c.id, c]));
    for (const r of [...rows].reverse()) {
      const parent = r.parent && byId.get(r.parent);
      if (parent) parent.replies = [...(parent.replies ?? []), toComment(r)];
    }
    return top;
  } catch {
    return null;
  }
}

// Replies this device sent that are still waiting for an editor. Only the writer
// sees them, faded, under the comment they answered, until the reply is published.
type Pending = { id: string; parent: string; author: string; text: string; at: number };
const PENDING_DAYS = 14;

function readPending(key: string): Pending[] {
  try {
    const list = JSON.parse(remember(key) ?? "[]") as Pending[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export default function CommentSection({
  initialComments,
  target,
  kind = "article",
}: {
  initialComments: Comment[];
  // The article's web address name; with the online service on, comments are real.
  target: string;
  kind?: "article" | "story";
}) {
  // Without the online service the page shows the sample thread, as before.
  const [comments, setComments] = useState(apiOn ? [] : initialComments);
  const [votes, setVotes] = useState<Record<string, VoteState>>({});
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [moreShown, setMoreShown] = useState(false);
  const [sent, setSent] = useState<"" | "ok" | "error">("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending[]>([]);
  const pendingKey = `hulhangu-pending:${kind}:${target}`;
  // The form is always shown; the comments below it stay folded until opened.
  const [open, setOpen] = useState(false);
  // Until the comments arrive a loading bar stands in for the comments bar.
  const [loaded, setLoaded] = useState(!apiOn);
  const trap = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const count = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  useEffect(() => {
    if (!apiOn) return;
    loadComments(target, kind).then(async (list) => {
      setName((n) => n || (remember("hulhangu-name") ?? ""));
      setLoaded(true);
      if (!list) return;
      setComments(list);
      // Drop waiting replies that are now published, or too old to still be waiting.
      const cutoff = Date.now() - PENDING_DAYS * 86400000;
      const waiting = readPending(pendingKey).filter((p) => {
        if (p.at < cutoff) return false;
        const parent = list.find((c) => c.id === p.parent);
        if (!parent) return true;
        return !(parent.replies ?? []).some((r) => r.author === p.author && r.text === p.text);
      });
      remember(pendingKey, JSON.stringify(waiting));
      setPending(waiting);
      const ids = list.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]);
      const mine: Record<string, VoteState> = {};
      for (const id of ids) {
        const v = remember(`hulhangu-like:${id}`);
        if (v && v in byKey) mine[id] = v as Reaction;
      }
      setVotes(mine);
      for (let i = 0; i < ids.length; i += 100) {
        const got = await apiGet<Record<string, ApiCounts>>(`/likes?ids=${ids.slice(i, i + 100).join(",")}`);
        if (got) setCounts((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(got).map(([k, c]) => [k, fromApi(c)])) }));
      }
    });
  }, [target, kind, pendingKey]);

  function makeId(prefix: string): string {
    nextId.current += 1;
    return `${prefix}-${nextId.current}`;
  }

  function countsOf(c: Comment): Counts {
    const v = votes[c.id] ?? null;
    if (apiOn) return counts[c.id] ?? {};
    return { like: c.likes + (v === "like" ? 1 : 0), dislike: c.dislikes + (v === "dislike" ? 1 : 0), ...(v && v !== "like" && v !== "dislike" ? { [v]: 1 } : {}) };
  }

  function setVote(id: string, v: VoteState) {
    const before = votes[id] ?? null;
    setVotes((prev) => ({ ...prev, [id]: v }));
    if (!apiOn || id.startsWith("local")) return;
    // Shown at once; the service's count replaces it when it answers.
    setCounts((prev) => {
      const c = { ...(prev[id] ?? {}) };
      if (before) c[before] = Math.max(0, (c[before] ?? 0) - 1);
      if (v) c[v] = (c[v] ?? 0) + 1;
      return { ...prev, [id]: c };
    });
    remember(`hulhangu-like:${id}`, v ?? "");
    apiPost<ApiCounts>("/like", {
      comment: id,
      value: v ? byKey[v].value : 0,
      voter: voterId(),
    }).then((res) => res && setCounts((prev) => ({ ...prev, [id]: fromApi(res) })));
  }

  // Sends a comment or reply to the editors. Returns true when it was received.
  async function send(body: string, author: string, parent?: string): Promise<boolean> {
    const res = await apiPost<{ ok?: boolean }>("/comment", {
      target,
      kind,
      name: author,
      text: body,
      ...(parent ? { parent } : {}),
      website: trap.current?.value ?? "",
    });
    return Boolean(res?.ok);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    if (apiOn) {
      setBusy(true);
      const ok = await send(text.trim(), name.trim());
      setBusy(false);
      setSent(ok ? "ok" : "error");
      if (!ok) return;
      remember("hulhangu-name", name.trim());
    } else {
      const c: Comment = {
        id: makeId("local"),
        author: name.trim(),
        text: text.trim(),
        timeAgo: "މިހާރު",
        likes: 0,
        dislikes: 0,
      };
      setComments((prev) => [c, ...prev]);
      setOpen(true);
    }
    setText("");
  }

  async function submitReply(parentId: string, replyText: string, author: string): Promise<boolean> {
    if (apiOn) {
      const ok = await send(replyText, author, parentId);
      if (ok) {
        remember("hulhangu-name", author);
        const waiting: Pending = { id: `pending-${Date.now()}`, parent: parentId, author, text: replyText, at: Date.now() };
        const next = [...readPending(pendingKey), waiting];
        remember(pendingKey, JSON.stringify(next));
        setPending(next);
        setReplyingTo(null);
      }
      return ok;
    }
    const r: Comment = {
      id: makeId("local"),
      author: author || "ތިބާ",
      text: replyText,
      timeAgo: "މިހާރު",
      likes: 0,
      dislikes: 0,
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId ? { ...c, replies: [...(c.replies ?? []), r] } : c,
      ),
    );
    setReplyingTo(null);
    return true;
  }

  function loadMore() {
    if (apiOn) {
      setShown((n) => n + PAGE);
      return;
    }
    const filler = comments[0];
    if (!filler) return;
    const extra: Comment[] = [0, 1].map(() => ({
      id: makeId("filler"),
      author: filler.author,
      text: filler.text,
      timeAgo: "5 ގަޑިއިރު ކުރިން",
      likes: 0,
      dislikes: 0,
    }));
    setComments((prev) => [...prev, ...extra]);
    setMoreShown(true);
  }

  const visible = apiOn ? comments.slice(0, shown) : comments;
  const hasMore = apiOn ? comments.length > shown : !moreShown && initialComments.length > 0;

  return (
    <section className="wrap narrow comments-wrap" id="comments">
      <form className="comment-form" id="commentForm" onSubmit={submitComment}>
        <h2>ކޮމެންޓް</h2>
        <label className="sr" htmlFor="cName">
          ނަން
        </label>
        <input
          id="cName"
          type="text"
          placeholder="ނަން"
          required
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="sr" htmlFor="cText">
          ކޮމެންޓް
        </label>
        <textarea
          id="cText"
          rows={6}
          required
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {/* Left empty by people; robots that fill every box are ignored. */}
        <input ref={trap} className="sr" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        <button className="btn-solid" type="submit" disabled={busy}>
          ފޮނުއްވާ
        </button>
        {sent && (
          <p className={`comment-note ${sent}`} role="status">
            {sent === "ok"
              ? "ޝުކުރިއްޔާ! ތިޔަ ކޮމެންޓް ލިބިއްޖެ. ބަލައިފައި ޝާއިޢު ކުރެވޭނެ."
              : "ކޮމެންޓް ނުފޮނުވުނު. ކޮންމެވެސް ވަގުތަކަށްފަހު އަލުން މަސައްކަތް ކުރައްވާ."}
          </p>
        )}
      </form>

      {!loaded ? (
        <div className="comments-toggle is-loading" role="status" aria-label="ކޮމެންޓްތައް ލޯޑުވަނީ">
          <span className="skel ct-skel-icon" />
          <span className="ct-text">
            <span className="skel ct-skel-line" />
            <span className="skel ct-skel-line short" />
          </span>
        </div>
      ) : count === 0 ? (
        // No comments yet: a quiet note in the same bar, nothing to open.
        <div className="comments-toggle is-empty">
          <span className="ct-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5z" />
              <path
                d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="ct-text">
            <b>އަދި ކޮމެންޓެއް ނެތް</b>
            <span>ފުރަތަމަ ކޮމެންޓް ކުރައްވާ</span>
          </span>
        </div>
      ) : (
        <button
          type="button"
          className="comments-toggle"
          aria-expanded={open}
          aria-controls="commentsBody"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="ct-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5A8.5 8.5 0 1 1 21 11.5z" />
              <path
                d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="ct-text">
            <b>ކޮމެންޓްތައް</b>
            <span>
              {open ? "ކޮމެންޓްތައް ފޮރުވާ" : "ކޮމެންޓްތައް ބައްލަވާ"}
            </span>
          </span>
          <span className="ct-count num">{count}</span>
          <span className="ct-chev" aria-hidden="true">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3.5 6l4.5 4.5L12.5 6" />
            </svg>
          </span>
        </button>
      )}

      <div className="comments-body" id="commentsBody" hidden={!open}>
        <div className="comment-list" id="commentList">
          {visible.map((c) => (
            <article className="comment" key={c.id}>
              <header>
                <strong>{c.author}</strong>
                
              </header>
              <p>{c.text}</p>
              <div className="c-foot">
                <button
                  type="button"
                  className="reply-btn"
                  aria-label="ޖަވާބު ދޭ"
                  onClick={() =>
                    setReplyingTo(replyingTo === c.id ? null : c.id)
                  }
                >
                  <ReplyIcon />
                </button>
                <ReactPill counts={countsOf(c)} mine={votes[c.id] ?? null} onReact={(v) => setVote(c.id, v)} />
                <time>{c.timeAgo}</time>
              </div>

              {replyingTo === c.id && (
                <ReplyForm
                  defaultName={name || (remember("hulhangu-name") ?? "")}
                  askName={apiOn}
                  onSubmit={(t, n) => submitReply(c.id, t, n)}
                />
              )}

              {c.replies?.map((r) => (
                <article className="comment reply" key={r.id}>
                  <header>
                    <strong>
                      <span className="reply-tag">
                        <ReplyIcon />
                      </span>
                      {r.author}
                    </strong>
                    
                  </header>
                  <p>{r.text}</p>
                  <div className="c-foot">
                    <button
                      type="button"
                      className="reply-btn"
                      aria-label="ޖަވާބު ދޭ"
                      onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                    >
                      <ReplyIcon />
                    </button>
                    <ReactPill counts={countsOf(r)} mine={votes[r.id] ?? null} onReact={(v) => setVote(r.id, v)} />
                    <time>{r.timeAgo}</time>
                  </div>
                </article>
              ))}

              {pending
                .filter((p) => p.parent === c.id)
                .map((p) => (
                  <article className="comment reply pending" key={p.id}>
                    <header>
                      <strong>
                        <span className="reply-tag">
                          <ReplyIcon />
                        </span>
                        {p.author}
                      </strong>
                      <time>{timeAgo(new Date(p.at).toISOString())}</time>
                    </header>
                    <p>{p.text}</p>
                    <span className="pending-tag">ޖަވާބު ލިބިއްޖެ، ބެލުމަށްފަހު ޝާއިޢު ކުރެވޭނެ</span>
                  </article>
                ))}
            </article>
          ))}
        </div>

        <div className="load-wrap">
          <button
            type="button"
            className="more"
            id="moreComments"
            hidden={!hasMore}
            onClick={loadMore}
          >
            އިތުރު ކޮމެންޓް
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M6.5 1v11M1 6.5h11" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

function ReplyForm({
  onSubmit,
  defaultName,
  askName,
}: {
  onSubmit: (text: string, name: string) => Promise<boolean>;
  defaultName: string;
  askName: boolean;
}) {
  const [value, setValue] = useState("");
  const [who, setWho] = useState(defaultName);
  const [state, setState] = useState<"" | "busy" | "error">("");
  return (
    <form
      className="reply-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!value.trim() || (askName && !who.trim())) return;
        setState("busy");
        const ok = await onSubmit(value.trim(), who.trim());
        setState(ok ? "" : "error");
      }}
    >
      {askName && (
        <input
          type="text"
          placeholder="ނަން"
          required
          maxLength={60}
          aria-label="ނަން"
          value={who}
          onChange={(e) => setWho(e.target.value)}
        />
      )}
      <input
        type="text"
        placeholder="ޖަވާބު ލިޔުއްވާ"
        required
        maxLength={500}
        aria-label="ޖަވާބު"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <button className="btn-solid" type="submit" disabled={state === "busy"}>
        ފޮނުއްވާ
      </button>
      {state === "error" && (
        <p className="comment-note error" role="status">
          ޖަވާބު ނުފޮނުވުނު. އަލުން މަސައްކަތް ކުރައްވާ.
        </p>
      )}
    </form>
  );
}
