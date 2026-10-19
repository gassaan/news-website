import { useEffect, useRef, useState } from "react";
import { IntentLink } from "sanity/router";
import { useNotifications, type Notice } from "./useNotifications";
import "./notifications.css";

const HOUR = 3600000;

function when(n: Notice, now: number): string {
  const ms = n.kind === "poll-ending" ? n.at - now : now - n.at;
  const h = Math.max(0, ms) / HOUR;
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;
  const span = h < 1 ? `${Math.max(1, Math.round(h * 60))} min` : h < 48 ? plural(Math.round(h), "hour") : plural(Math.round(h / 24), "day");
  return n.kind === "poll-ending" ? `Ends in ${span}` : `${span} ago`;
}

function Icon({ kind }: { kind: Notice["kind"] }) {
  if (kind === "comment")
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3a9 9 0 0 0-7.9 13.3L3 21l4.8-1.1A9 9 0 1 0 12 3z" />
      </svg>
    );
  if (kind === "live")
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 19v-6M12 19V5M18 19v-9" />
    </svg>
  );
}

export default function NotificationBell() {
  const { notices, unread, seen, markAllRead, now } = useNotifications();
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(60);
  const wrap = useRef<HTMLDivElement>(null);

  // Close when tapping anywhere else.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  return (
    <div className="nb-wrap" ref={wrap}>
      <button
        type="button"
        className={`nb-bell${open ? " open" : ""}`}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        onClick={(e) => {
          setTop(e.currentTarget.getBoundingClientRect().bottom + 8);
          setOpen((o) => !o);
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && <span className="nb-count">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="nb-panel" role="dialog" aria-label="Notifications" style={{ top }}>
          <div className="nb-head">
            <b>Notifications</b>
            {unread > 0 && (
              <button type="button" className="nb-markall" onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>
          {notices.length === 0 && <p className="nb-empty">Nothing needs you right now.</p>}
          <div className="nb-list">
            {notices.map((n) => (
              <div key={n.id} className={`nb-note${seen.has(n.id) ? "" : " unread"}`}>
                <span className={`nb-ic ${n.kind}`}>
                  <Icon kind={n.kind} />
                </span>
                <span className="nb-body">
                  <b>{n.title}</b>
                  <span className="nb-dv">{n.detail}</span>
                  {n.context && <span className="nb-dv nb-on">{n.context}</span>}
                  <small>{when(n, now)}</small>
                  {(n.kind === "comment" || n.kind === "poll-ending") && (
                    <IntentLink intent="edit" params={n.link} className="nb-act" onClick={() => setOpen(false)}>
                      {n.kind === "comment" ? "Review" : "Open"}
                    </IntentLink>
                  )}
                  {(n.kind === "live" || n.kind === "poll-ended") && (
                    <IntentLink intent="edit" params={n.link} className="nb-link" onClick={() => setOpen(false)}>
                      Open
                    </IntentLink>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
