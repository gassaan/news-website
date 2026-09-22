"use client";

import { useRef, useState } from "react";
import { Comment } from "@/lib/articles";

type VoteState = "like" | "dislike" | null;

function ReplyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </svg>
  );
}

function VoteButtons({
  id,
  baseLikes,
  baseDislikes,
  vote,
  setVote,
}: {
  id: string;
  baseLikes: number;
  baseDislikes: number;
  vote: VoteState;
  setVote: (id: string, v: VoteState) => void;
}) {
  return (
    <div className="votes">
      <button
        type="button"
        className="vote"
        aria-label="Like"
        aria-pressed={vote === "like"}
        onClick={() => setVote(id, vote === "like" ? null : "like")}
      >
        <span className="vi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 10.5A1.5 1.5 0 0 1 3.5 9h2A1.5 1.5 0 0 1 7 10.5v9A1.5 1.5 0 0 1 5.5 21h-2A1.5 1.5 0 0 1 2 19.5zM9 10l3.6-7a2.4 2.4 0 0 1 4.3 1.9L15.9 9h4.2a2 2 0 0 1 2 2.4l-1.5 7.9A2.6 2.6 0 0 1 18 21H9z" />
          </svg>
        </span>
        <span className="vn">{baseLikes + (vote === "like" ? 1 : 0)}</span>
      </button>
      <button
        type="button"
        className="vote"
        aria-label="Dislike"
        aria-pressed={vote === "dislike"}
        onClick={() => setVote(id, vote === "dislike" ? null : "dislike")}
      >
        <span className="vi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M22 13.5A1.5 1.5 0 0 1 20.5 15h-2a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 18.5 3h2A1.5 1.5 0 0 1 22 4.5zM15 14l-3.6 7a2.4 2.4 0 0 1-4.3-1.9L8.1 15H3.9a2 2 0 0 1-2-2.4l1.5-7.9A2.6 2.6 0 0 1 6 3h9z" />
          </svg>
        </span>
        <span className="vn">{baseDislikes + (vote === "dislike" ? 1 : 0)}</span>
      </button>
    </div>
  );
}

export default function CommentSection({ initialComments }: { initialComments: Comment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [votes, setVotes] = useState<Record<string, VoteState>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [moreShown, setMoreShown] = useState(false);
  const nextId = useRef(0);

  function makeId(prefix: string): string {
    nextId.current += 1;
    return `${prefix}-${nextId.current}`;
  }

  function setVote(id: string, v: VoteState) {
    setVotes((prev) => ({ ...prev, [id]: v }));
  }

  function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    const c: Comment = {
      id: makeId("local"),
      author: name.trim(),
      text: text.trim(),
      timeAgo: "މިހާރު",
      likes: 0,
      dislikes: 0,
    };
    setComments((prev) => [c, ...prev]);
    setText("");
    // TODO(phase 2): save comment to database
  }

  function submitReply(parentId: string, replyText: string) {
    const r: Comment = {
      id: makeId("local"),
      author: "ތިބާ",
      text: replyText,
      timeAgo: "މިހާރު",
      likes: 0,
      dislikes: 0,
    };
    setComments((prev) =>
      prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), r] } : c)),
    );
    setReplyingTo(null);
    // TODO(phase 2): save reply to database
  }

  function loadMore() {
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
    // TODO(phase 2): fetch the next page of comments from the database
  }

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
        <button className="btn-solid" type="submit">
          ފޮނުއްވާ
        </button>
      </form>

      <div className="comment-list" id="commentList">
        {comments.map((c) => (
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
                onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              >
                <ReplyIcon />
              </button>
              <VoteButtons
                id={c.id}
                baseLikes={c.likes}
                baseDislikes={c.dislikes}
                vote={votes[c.id] ?? null}
                setVote={setVote}
              />
            </div>

            {replyingTo === c.id && (
              <ReplyForm onSubmit={(t) => submitReply(c.id, t)} />
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
                  <button type="button" className="reply-btn" aria-label="ޖަވާބު ދޭ">
                    <ReplyIcon />
                  </button>
                  <VoteButtons
                    id={r.id}
                    baseLikes={r.likes}
                    baseDislikes={r.dislikes}
                    vote={votes[r.id] ?? null}
                    setVote={setVote}
                  />
                </div>
              </article>
            ))}
          </article>
        ))}
      </div>

      <div className="load-wrap">
        <button type="button" className="more" id="moreComments" hidden={moreShown} onClick={loadMore}>
          އިތުރު ކޮމެންޓް
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M6.5 1v11M1 6.5h11" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function ReplyForm({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      className="reply-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmit(value.trim());
      }}
    >
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
      <button className="btn-solid" type="submit">
        ފޮނުއްވާ
      </button>
    </form>
  );
}
