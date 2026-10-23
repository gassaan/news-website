import { useEffect, useMemo, useRef, useState } from "react";
import { useClient } from "sanity";
import { AUDIO_TYPES, clock } from "../editor/inputs";
import "../home/home.css";
import "./voice.css";

// Voice training: one sentence at a time, taken from Hulhangu's own published
// articles and stories, read aloud and saved. The recordings (and the sentences they
// read) are kept in one hidden document, ready to train a voice that sounds like
// the reader, so articles can later be read out automatically.

const DOC = "voiceTraining";
// About an hour of clear recordings is a good amount for training a voice.
const GOAL_MINUTES = 60;

type Clip = { _key: string; text: string; seconds: number; url?: string };
type Loaded = { clips: Clip[] | null; texts: { body?: string | null; eps?: (string | null)[] | null }[] };
type Step = "ready" | "recording" | "check" | "saving";

const newKey = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, "0")).join("");

// Plain sentences from the article text: no photos, videos or formatting marks,
// 25–180 letters long so each is one comfortable breath.
function sentencesFrom(bodies: (string | null)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const body of bodies) {
    for (const raw of (body ?? "").split("\n")) {
      if (/^\s*(!\[|@\[|---)/.test(raw)) continue;
      const line = raw
        .trim()
        .replace(/^(\\|## |>\s?|::\s?|-\s+|\d+\.\s+)/, "")
        .replace(/\*\*/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      for (const s of line.split(/(?<=[.!?؟])\s+/)) {
        const t = s.replace(/\s+/g, " ").trim();
        if (t.length < 25 || t.length > 180 || !/[ހ-޿]/.test(t) || seen.has(t)) continue;
        seen.add(t);
        out.push(t);
      }
    }
  }
  // Mixed order, the same every time, so neighbouring sentences come from different articles.
  const hash = (t: string) => {
    let h = 2166136261;
    for (const ch of t) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  };
  return out.sort((a, b) => hash(a) - hash(b));
}

export default function VoiceTraining() {
  const client = useClient({ apiVersion: "2025-02-19" });
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("ready");
  const [seconds, setSeconds] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; url: string; seconds: number } | null>(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const started = useRef(0);

  useEffect(() => {
    client
      .fetch<Loaded>(
        `{
          "clips": *[_id == "${DOC}"][0].clips[]{ _key, text, seconds, "url": audio.asset->url },
          "texts": *[_type in ["article", "story"] && !(_id in path("drafts.**"))] | order(publishedAt desc) { body, "eps": episodes[].body }
        }`,
      )
      .then(
        (data) => {
          setLoaded(data);
          setClips((data.clips ?? []).slice().reverse());
        },
        () => setError("The sentences couldn't be loaded. Check the connection and open this page again."),
      );
  }, [client]);

  // The microphone stays on while this page is open, so it only asks once.
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
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

  const sentences = useMemo(() => (loaded ? sentencesFrom(loaded.texts.flatMap((t) => [t.body ?? null, ...(t.eps ?? [])])) : []), [loaded]);
  const done = useMemo(() => new Set(clips.map((c) => c.text)), [clips]);
  const left = sentences.filter((s) => !done.has(s) && !skipped.includes(s));
  const sentence = left[0];
  const minutes = clips.reduce((sum, c) => sum + (c.seconds || 0), 0) / 60;

  const record = async () => {
    setError("");
    try {
      stream.current ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false } });
      const type = AUDIO_TYPES.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
      const rec = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
      const parts: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && parts.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(parts, { type: rec.mimeType || "audio/mp4" });
        setTake({ blob, url: URL.createObjectURL(blob), seconds: (Date.now() - started.current) / 1000 });
        setStep("check");
      };
      recorder.current = rec;
      started.current = Date.now();
      setSeconds(0);
      setTake(null);
      rec.start(500);
      setStep("recording");
    } catch {
      setError("The microphone couldn't be used. Allow microphone access for this site and try again.");
    }
  };

  const save = async () => {
    if (!take || !sentence) return;
    setStep("saving");
    setError("");
    try {
      const ext = take.blob.type.includes("webm") ? "webm" : "m4a";
      const asset = await client.assets.upload("file", take.blob, { filename: `voice-${clips.length + 1}.${ext}`, contentType: take.blob.type });
      const clip = { _key: newKey(), text: sentence, seconds: Math.round(take.seconds * 10) / 10 };
      await client.createIfNotExists({ _id: DOC, _type: DOC });
      await client
        .patch(DOC)
        .setIfMissing({ clips: [] })
        .append("clips", [{ ...clip, audio: { _type: "file", asset: { _type: "reference", _ref: asset._id } } }])
        .commit();
      setClips((c) => [{ ...clip, url: asset.url }, ...c]);
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
      await client.patch(DOC).unset([`clips[_key=="${key}"]`]).commit();
      setClips((c) => c.filter((x) => x._key !== key));
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

      <section className={`vt-card ${step}`} aria-live="polite">
        {!loaded ? (
          <p className="vt-note">{error ? "" : "Loading sentences…"}</p>
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
                <button type="button" className="vt-rec on" onClick={() => recorder.current?.stop()} aria-label="Stop">
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
            <div key={c._key} className="vt-item">
              <p dir="rtl">{c.text}</p>
              <div className="vt-item-row">
                {c.url && <audio controls preload="none" src={c.url} />}
                <span className="vt-len">{clock(c.seconds || 0)}</span>
                <button type="button" className="vt-del" aria-label="Delete this recording" onClick={() => remove(c._key)}>
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
