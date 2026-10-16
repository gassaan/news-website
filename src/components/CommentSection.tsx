"use client";

import { useEffect, useRef, useState } from "react";
import { Comment } from "@/lib/articles";
import { apiGet, apiOn, apiPost, remember, timeAgo, voterId } from "@/lib/api";
import project from "@/sanity/project.json";

type VoteState = "like" | "dislike" | null;

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

function VoteButtons({
  likes,
  dislikes,
  vote,
  onVote,
}: {
  likes: number;
  dislikes: number;
  vote: VoteState;
  onVote: (v: VoteState) => void;
}) {
  return (
    <div className="votes">
      <button
        type="button"
        className="vote"
        aria-label="Like"
        aria-pressed={vote === "like"}
        onClick={() => onVote(vote === "like" ? null : "like")}
      >
        <span className="vi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 10.5A1.5 1.5 0 0 1 3.5 9h2A1.5 1.5 0 0 1 7 10.5v9A1.5 1.5 0 0 1 5.5 21h-2A1.5 1.5 0 0 1 2 19.5zM9 10l3.6-7a2.4 2.4 0 0 1 4.3 1.9L15.9 9h4.2a2 2 0 0 1 2 2.4l-1.5 7.9A2.6 2.6 0 0 1 18 21H9z" />
          </svg>
        </span>
        <span className="vn">{likes}</span>
      </button>
      <button
        type="button"
        className="vote"
        aria-label="Dislike"
        aria-pressed={vote === "dislike"}
        onClick={() => onVote(vote === "dislike" ? null : "dislike")}
      >
        <span className="vi">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          >
            <path d="M22 13.5A1.5 1.5 0 0 1 20.5 15h-2a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 18.5 3h2A1.5 1.5 0 0 1 22 4.5zM15 14l-3.6 7a2.4 2.4 0 0 1-4.3-1.9L8.1 15H3.9a2 2 0 0 1-2-2.4l1.5-7.9A2.6 2.6 0 0 1 6 3h9z" />
          </svg>
        </span>
        <span className="vn">{dislikes}</span>
      </button>
    </div>
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
  const [counts, setCounts] = useState<Record<string, { up: number; down: number }>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [moreShown, setMoreShown] = useState(false);
  const [sent, setSent] = useState<"" | "ok" | "error">("");
  const [busy, setBusy] = useState(false);
  // The form is always shown; the comments below it stay folded until opened.
  const [open, setOpen] = useState(false);
  const trap = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const count = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);

  useEffect(() => {
    if (!apiOn) return;
    loadComments(target, kind).then(async (list) => {
      setName((n) => n || (remember("hulhangu-name") ?? ""));
      if (!list) return;
      setComments(list);
      const ids = list.flatMap((c) => [c.id, ...(c.replies ?? []).map((r) => r.id)]);
      const mine: Record<string, VoteState> = {};
      for (const id of ids) {
        const v = remember(`hulhangu-like:${id}`);
        if (v === "like" || v === "dislike") mine[id] = v;
      }
      setVotes(mine);
      for (let i = 0; i < ids.length; i += 100) {
        const got = await apiGet<Record<string, { up: number; down: number }>>(
          `/likes?ids=${ids.slice(i, i + 100).join(",")}`,
        );
        if (got) setCounts((prev) => ({ ...prev, ...got }));
      }
    });
  }, [target, kind]);

  function makeId(prefix: string): string {
    nextId.current += 1;
    return `${prefix}-${nextId.current}`;
  }

  function likesOf(c: Comment) {
    const v = votes[c.id] ?? null;
    if (apiOn) return { up: counts[c.id]?.up ?? 0, down: counts[c.id]?.down ?? 0 };
    return { up: c.likes + (v === "like" ? 1 : 0), down: c.dislikes + (v === "dislike" ? 1 : 0) };
  }

  function setVote(id: string, v: VoteState) {
    setVotes((prev) => ({ ...prev, [id]: v }));
    if (!apiOn || id.startsWith("local")) return;
    remember(`hulhangu-like:${id}`, v ?? "");
    apiPost<{ up: number; down: number }>("/like", {
      comment: id,
      value: v === "like" ? 1 : v === "dislike" ? -1 : 0,
      voter: voterId(),
    }).then((res) => res && setCounts((prev) => ({ ...prev, [id]: res })));
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
        setName(author);
        setReplyingTo(null);
        setSent("ok");
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

      {count === 0 ? (
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
                <time>{c.timeAgo}</time>
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
                <VoteButtons
                  likes={likesOf(c).up}
                  dislikes={likesOf(c).down}
                  vote={votes[c.id] ?? null}
                  onVote={(v) => setVote(c.id, v)}
                />
              </div>

              {replyingTo === c.id && (
                <ReplyForm
                  defaultName={name}
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
                    <time>{r.timeAgo}</time>
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
                    <VoteButtons
                      likes={likesOf(r).up}
                      dislikes={likesOf(r).down}
                      vote={votes[r.id] ?? null}
                      onVote={(v) => setVote(r.id, v)}
                    />
                  </div>
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
