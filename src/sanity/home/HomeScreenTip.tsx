import { useEffect, useState } from "react";

const KEY = "hh-homescreen-tip";
type InstallEvent = Event & { prompt: () => Promise<void> };

// A small card on the start screen: how to put the newsroom on the phone's home screen,
// so it opens full screen like an app. Hidden once it's there, or after "Not now".
// Already on the home screen, or the card was closed before: nothing to show.
function hidden() {
  if (typeof window === "undefined") return true;
  const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
  try {
    return Boolean(standalone) || localStorage.getItem(KEY) === "no";
  } catch {
    return Boolean(standalone);
  }
}
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function HomeScreenTip() {
  // The Studio only runs in the browser, so the starting value can read it directly.
  const [show, setShow] = useState<"ios" | "android" | null>(() => (hidden() ? null : isIos() ? "ios" : null));
  const [install, setInstall] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if (hidden()) return;
    // Chrome on Android offers its own install box; keep it for our button.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
      setShow("android");
    };
    addEventListener("beforeinstallprompt", onPrompt);
    return () => removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!show) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, "no");
    } catch {}
    setShow(null);
  };
  return (
    <section className="sh-tip" aria-label="Add the newsroom to your home screen">
      <span className="sh-tip-ic" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="2.5" width="12" height="19" rx="3" />
          <path d="M12 8.5v6M9 11.5h6" />
        </svg>
      </span>
      <div className="sh-tip-text">
        <b>Put the newsroom on your home screen</b>
        {show === "ios" ? (
          <span>
            Tap Share{" "}
            <svg className="sh-tip-share" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share">
              <path d="M12 3v12M8 7l4-4 4 4" />
              <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
            </svg>{" "}
            in Safari, then <b>Add to Home Screen</b>. It opens full screen, like an app.
          </span>
        ) : (
          <span>It opens full screen, like an app.</span>
        )}
        <div className="sh-tip-btns">
          {show === "android" && install && (
            <button
              type="button"
              className="sh-tip-add"
              onClick={() => {
                install.prompt().catch(() => {});
                setShow(null);
              }}
            >
              Add to home screen
            </button>
          )}
          <button type="button" className="sh-tip-no" onClick={close}>
            Not now
          </button>
        </div>
      </div>
    </section>
  );
}
