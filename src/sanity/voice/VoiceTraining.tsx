import { useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { API_URL } from "@/lib/api";
import { clock } from "../editor/inputs";
import { recordWav, type WavRecording } from "./wavRecorder";
import "../home/home.css";
import "./voice.css";

// Voice training: one sentence at a time, read aloud and saved. The recordings (and
// the sentences they read) are kept ready to train a voice that sounds like the
// reader, so articles can later be read out automatically.
//
// The sentences are Mozilla Common Voice's Dhivehi sentences (sentences-dv.json):
// written and checked by Dhivehi speakers for training voice technology, and public
// domain (CC0). Copied once from common-voice/server/data/dv, keeping 12–180 letters of Thaana only, in a fixed mixed order.
//
// The recordings are private: they are kept by the site's online service (api/), which
// only lets in the CMS administrator, confirmed with their Sanity login. Never in Sanity
// itself, where the Free plan has no private datasets. Recordings made before, in the
// old "voice" dataset, are moved over once, and that dataset is then deleted.

const DOC = "voiceTraining";
const VOICE = "voice";
// About an hour of clear recordings is a good amount for training a voice.
const GOAL_MINUTES = 60;

type Clip = { key: string; text: string; seconds: number; bytes?: number };
type Step = "ready" | "recording" | "check" | "saving";
type Setup = "checking" | "ready" | "login" | "denied" | "offline";
type OldClip = { _key: string; text: string; seconds: number; url?: string; size?: number };

const newKey = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");

export default function VoiceTraining() {
  const client = useClient({ apiVersion: "2025-02-19" });
  const voice = useMemo(() => client.withConfig({ dataset: VOICE }), [client]);
  // The Studio keeps the login as a token (sanity.config.ts: loginMethod "token").
  const token = client.config().token;
  const api = useMemo(
    () => (path: string, init: RequestInit = {}) =>
      fetch(`${API_URL}${path}`, { ...init, cache: "no-store", headers: { ...init.headers, Authorization: `Bearer ${token}` } }),
    [token],
  );
  const [setup, setSetup] = useState<Setup>("checking");
  const [loaded, setLoaded] = useState<{ sentences: string[] } | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("ready");
  const [seconds, setSeconds] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [moving, setMoving] = useState("");
  const recorder = useRef<WavRecording | null>(null);
  const started = useRef(0);

  useEffect(() => {
    let gone = false;
    (async () => {
      if (!API_URL) return setSetup("offline");
      if (!token) return setSetup("login");
      const list = async () => {
        const res = await api("/voice/clips");
        if (res.status === 403) return "denied" as const;
        if (!res.ok) throw new Error("list");
        return (await res.json()) as Clip[];
      };
      try {
        let mine = await list();
        if (mine === "denied") return gone ? undefined : setSetup("denied");
        // Recordings from the old "voice" dataset: copy each one over, check they all
        // arrived whole, then delete that dataset (it is no longer private on Free).
        const old = await voice
          .fetch<OldClip[] | null>(`*[_id == "${DOC}"][0].clips[]{ _key, text, seconds, "url": audio.asset->url, "size": audio.asset->size }`)
          .catch(() => null);
        if (old) {
          const have = new Set(mine.map((c) => c.key));
          const todo = old.filter((c) => c.url && !have.has(c._key));
          for (const [i, c] of todo.entries()) {
            if (gone) return;
            setMoving(`Moving your recordings to private storage… ${i + 1} of ${todo.length}`);
            const blob = await (await fetch(c.url!)).blob();
            const form = new FormData();
            form.set("key", c._key);
            form.set("text", c.text);
            form.set("seconds", String(c.seconds || 0.1));
            form.set("audio", blob, "voice.wav");
            if (!(await api("/voice/clip", { method: "POST", body: form })).ok) throw new Error("move");
          }
          mine = await list();
          if (mine === "denied") throw new Error("move");
          const stored = new Map(mine.map((c) => [c.key, c.bytes]));
          if (old.every((c) => !c.url || (stored.has(c._key) && (!c.size || stored.get(c._key) === c.size)))) {
            await client.datasets.delete(VOICE).catch(() => {
              if (!gone) setError("Your recordings are moved, but the old copy couldn't be deleted. On sanity.io/manage → Hulhangu → Datasets, delete \"voice\".");
            });
          }
          setMoving("");
        }
        const sentences = await import("./sentences-dv.json");
        if (gone) return;
        setLoaded({ sentences: sentences.default as string[] });
        setClips(mine.slice().reverse());
        setSetup("ready");
      } catch {
        if (gone) return;
        setMoving("");
        setSetup("offline");
      }
    })();
    return () => {
      gone = true;
    };
  }, [api, client, token, voice]);

  // Leaving the page mid-recording switches the microphone off.
  useEffect(
    () => () => {
      recorder.current?.stop().catch(() => undefined);
    },
    [],
  );
  useEffect(() => {
    if (step !== "recording") return;
    const tick = setInterval(() => setSeconds((Date.now() - started.current) / 1000), 200);
    return () => clearInterval(tick);
  }, [step]);
  useEffect(
    () => () => {
      if (take) URL.revokeObjectURL(take.url);
    },
    [take],
  );

  const sentences = loaded?.sentences ?? [];
  const done = useMemo(() => new Set(clips.map((c) => c.text)), [clips]);
  const left = sentences.filter((s) => !done.has(s) && !skipped.includes(s));
  const sentence = left[0];
  const minutes = clips.reduce((sum, c) => sum + (c.seconds || 0), 0) / 60;

  const record = async () => {
    setError("");
    try {
      setTake(null);
      recorder.current = await recordWav();
      started.current = Date.now();
      setSeconds(0);
      setStep("recording");
    } catch {
      setError("The microphone couldn't be used. Allow microphone access for this site and try again.");
    }
  };

  const stop = async () => {
    const rec = recorder.current;
    recorder.current = null;
    if (!rec) return;
    try {
      const { blob, seconds: length } = await rec.stop();
      if (length < 0.5) throw new Error("too short");
      setTake({ blob, url: URL.createObjectURL(blob), seconds: length });
      setStep("check");
    } catch {
      setError("Nothing was recorded. Check the microphone and try again.");
      setStep("ready");
    }
  };

  const save = async () => {
    if (!take || !sentence) return;
    setStep("saving");
    setError("");
    try {
      const clip = { key: newKey(), text: sentence, seconds: Math.round(take.seconds * 10) / 10 };
      const form = new FormData();
      form.set("key", clip.key);
      form.set("text", clip.text);
      form.set("seconds", String(clip.seconds));
      form.set("audio", take.blob, "voice.wav");
      if (!(await api("/voice/clip", { method: "POST", body: form })).ok) throw new Error("save");
      setClips((c) => [clip, ...c]);
      setTake(null);
      setStep("ready");
    } catch {
      setError("The recording couldn't be saved. Check the connection and tap Save again.");
      setStep("check");
    }
  };

  const remove = async (key: string) => {
    setError("");
    try {
      if (!(await api(`/voice/delete?key=${key}`, { method: "POST" })).ok) throw new Error("delete");
      setClips((c) => c.filter((x) => x.key !== key));
    } catch {
      setError("That recording couldn't be deleted. Try again.");
    }
  };

  const skip = () => {
    if (sentence) setSkipped((s) => [...s, sentence]);
    setTake(null);
    setStep("ready");
  };

  const shown = showAll ? clips : clips.slice(0, 5);

  return (
    <div className="sh vt">
      <header className="vt-head">
        <h1>Voice training</h1>
        <p>Read each sentence aloud in your normal news voice. About an hour of recordings is enough to train a voice that sounds like you.</p>
        <p className="vt-private">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
          </svg>
          Private: kept apart from the website. Only you, the CMS administrator, can open them.
        </p>
      </header>

      <section className="vt-progress" aria-label="Progress">
        <div className="vt-stats">
          <span>
            <b>{clips.length}</b> sentences
          </span>
          <span>
            <b>{Math.floor(minutes)}</b> of {GOAL_MINUTES} min
          </span>
        </div>
        <div className="vt-bar" role="progressbar" aria-valuemin={0} aria-valuemax={GOAL_MINUTES} aria-valuenow={Math.round(minutes)}>
          <span style={{ width: `${Math.min(100, (minutes / GOAL_MINUTES) * 100)}%` }} />
        </div>
      </section>

      <details className="vt-tips">
        <summary>Tips for good recordings</summary>
        <ul>
          <li>A quiet room, no fan or TV. The same place each time.</li>
          <li>Hold the phone about a hand&apos;s length from your mouth.</li>
          <li>Read naturally, like reading the news. Wait a second before and after.</li>
          <li>Made a mistake? Tap Record again. Can&apos;t read a sentence? Skip it.</li>
          <li>Short sessions are fine: 10–15 minutes a day adds up quickly.</li>
        </ul>
      </details>
      <p className="vt-credit">Sentences: Mozilla Common Voice, written and checked by Dhivehi speakers (public domain).</p>

      <section className={`vt-card ${step}`} aria-live="polite">
        {setup === "login" ? (
          <div className="vt-note">
            <p>
              <b>Log in again to open your recordings.</b> Choose Log out from your picture at the top right, then log in. This only happens once.
            </p>
          </div>
        ) : setup === "denied" ? (
          <div className="vt-note">
            <p>
              <b>These recordings are private.</b> Only the CMS administrator can open them.
            </p>
          </div>
        ) : setup === "offline" ? (
          <div className="vt-note">
            <p>
              <b>The private storage couldn&apos;t be reached.</b> Check the connection and open this page again. Your recordings are safe.
            </p>
          </div>
        ) : !loaded ? (
          <p className="vt-note">{error ? "" : moving || "Opening private storage…"}</p>
        ) : !sentence ? (
          <p className="vt-note">All sentences are done. New ones come with each new article.</p>
        ) : (
          <>
            <span className="vt-num">Sentence {clips.length + 1}</span>
            <p className="vt-sentence" dir="rtl">
              {sentence}
            </p>

            {step === "ready" && (
              <div className="vt-actions">
                <button type="button" className="vt-rec" onClick={record} aria-label="Record">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0zM5 11a7 7 0 0 0 14 0M12 18v3" />
                  </svg>
                </button>
                <span className="vt-hint">Tap to record</span>
                <button type="button" className="vt-link" onClick={skip}>
                  Skip this sentence
                </button>
              </div>
            )}

            {step === "recording" && (
              <div className="vt-actions">
                <button type="button" className="vt-rec on" onClick={stop} aria-label="Stop">
                  <span className="vt-stop" />
                </button>
                <span className="vt-time">{clock(seconds)}</span>
                <span className="vt-hint">Recording… tap to stop</span>
              </div>
            )}

            {(step === "check" || step === "saving") && take && (
              <div className="vt-check">
                <audio controls src={take.url} />
                <div className="vt-row">
                  <button type="button" className="vt-btn" disabled={step === "saving"} onClick={record}>
                    Record again
                  </button>
                  <button type="button" className="vt-btn vt-save" disabled={step === "saving"} onClick={save}>
                    {step === "saving" ? "Saving…" : "Save & next"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {error && <p className="vt-error">{error}</p>}
      </section>

      {clips.length > 0 && (
        <section className="vt-list" aria-label="Saved recordings">
          <h2 className="sh-label">Saved recordings</h2>
          {shown.map((c) => (
            <div key={c.key} className="vt-item">
              <p dir="rtl">{c.text}</p>
              <div className="vt-item-row">
                <ClipAudio load={() => api(`/voice/audio?key=${c.key}`).then((r) => (r.ok ? r.blob() : Promise.reject(new Error("play"))))} />
                <span className="vt-len">{clock(c.seconds || 0)}</span>
                <button type="button" className="vt-del" aria-label="Delete this recording" onClick={() => remove(c.key)}>
                  ×
                </button>
              </div>
            </div>
          ))}
          {clips.length > 5 && (
            <button type="button" className="vt-link" onClick={() => setShowAll((s) => !s)}>
              {showAll ? "Show fewer" : `Show all ${clips.length}`}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

// A saved recording: fetched from private storage (with the login) only when played.
function ClipAudio({ load }: { load: () => Promise<Blob> }) {
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"" | "busy" | "error">("");
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  if (url) return <audio controls autoPlay src={url} />;
  return (
    <button
      type="button"
      className="vt-btn vt-play"
      disabled={state === "busy"}
      onClick={async () => {
        setState("busy");
        try {
          setUrl(URL.createObjectURL(await load()));
          setState("");
        } catch {
          setState("error");
        }
      }}
    >
      {state === "busy" ? "Loading…" : state === "error" ? "Couldn't load. Try again" : "▶ Play"}
    </button>
  );
}
