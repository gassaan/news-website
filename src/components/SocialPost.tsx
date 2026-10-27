"use client";

import { useEffect, useRef, useState } from "react";
import type { Social } from "@/lib/richText";

// A post from X, Facebook or Instagram inside an article, shown with the site's own
// embed. Its script is fetched once per page, and only when a post is about to scroll
// into view, so articles without posts (or readers who never reach one) load nothing
// extra. A post-shaped skeleton shimmers until the post has drawn; only if it can't be
// shown (the site blocked, too slow, or a Facebook share link) does a link to it appear.

declare global {
  interface Window {
    twttr?: { ready?: (fn: (t: { widgets: { load: (el?: Element) => void } }) => void) => void };
    instgrm?: { Embeds: { process: () => void } };
    FB?: { XFBML: { parse: (el?: Element) => void } };
  }
}

const SCRIPTS: Record<Social["site"], string> = {
  x: "https://platform.twitter.com/widgets.js",
  instagram: "https://www.instagram.com/embed.js",
  facebook: "https://connect.facebook.net/en_US/sdk.js#xfbml=0&version=v21.0",
};
const loading: Partial<Record<Social["site"], Promise<void>>> = {};

function loadScript(site: Social["site"]): Promise<void> {
  loading[site] ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPTS[site];
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      delete loading[site];
      reject(new Error(site));
    };
    document.body.appendChild(s);
  });
  return loading[site];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The markup each site's script turns into the post. It is set once as HTML (React
// leaves it alone afterwards), because the scripts replace it with their own.
function markup(post: Social): string {
  const link = `<a href="${esc(post.url)}" target="_blank" rel="noopener noreferrer">${esc(post.name)} ގައި މި ޕޯސްޓް ބައްލަވާ</a>`;
  if (post.site === "x")
    return `<blockquote class="twitter-tweet" data-dnt="true" data-align="center"><a href="https://twitter.com/x/status/${esc(post.id ?? "")}" target="_blank" rel="noopener noreferrer">${esc(post.name)} ގައި މި ޕޯސްޓް ބައްލަވާ</a></blockquote>`;
  if (post.site === "instagram")
    return `<blockquote class="instagram-media" data-instgrm-permalink="${esc(post.url)}" data-instgrm-version="14" data-instgrm-captioned>${link}</blockquote>`;
  if (post.short) return `<blockquote>${link}</blockquote>`;
  return `<div class="fb-post" data-href="${esc(post.url)}" data-width="auto" data-show-text="true"><blockquote class="fb-xfbml-parse-ignore" cite="${esc(post.url)}">${link}</blockquote></div>`;
}

type State = "loading" | "shown" | "link";

// The longest wait for a post before the link to it is shown instead.
const GIVE_UP_MS = 15000;

export default function SocialPost({ post }: { post: Social }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>(post.short ? "link" : "loading");

  useEffect(() => {
    const el = box.current;
    if (!el || post.short) return;
    let gone = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let giveUp: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearInterval(poll);
      clearTimeout(giveUp);
    };
    // Can't be shown: back to the plain link (the site's script may have taken it).
    const fail = () => {
      stop();
      if (gone) return;
      el.innerHTML = markup(post);
      setState("link");
    };
    // Shown once the site's frame has loaded and taken its size (or has held a size for
    // a while, in case its load came before this was watching).
    const watch = () => {
      let frame: HTMLIFrameElement | null = null;
      let loaded = false;
      let sizedAt = 0;
      poll = setInterval(() => {
        const f = el.querySelector("iframe");
        if (f && f !== frame) {
          frame = f;
          loaded = false;
          sizedAt = 0;
          f.addEventListener("load", () => (loaded = true), { once: true });
        }
        if (!frame || frame.getBoundingClientRect().height < 80) return;
        sizedAt ||= Date.now();
        if (loaded || Date.now() - sizedAt > 1500) {
          stop();
          if (!gone) setState("shown");
        }
      }, 200);
      giveUp = setTimeout(fail, GIVE_UP_MS);
    };
    // X posts come in light or dark: the same as the site at the moment.
    const theme = () => {
      const root = document.documentElement.getAttribute("data-theme");
      const light = root ? root === "light" : window.matchMedia("(prefers-color-scheme: light)").matches;
      return light ? "light" : "dark";
    };
    let drawn = "";
    const drawX = () => {
      const now = theme();
      if (now === drawn) return;
      if (drawn) {
        // Switched light/dark after the post was shown: draw it again in the new look,
        // keeping its height meanwhile so the text below doesn't jump.
        el.style.minHeight = `${el.offsetHeight}px`;
        el.innerHTML = markup(post);
        setTimeout(() => (el.style.minHeight = ""), 3000);
      }
      drawn = now;
      el.querySelector("blockquote")?.setAttribute("data-theme", now);
      window.twttr?.ready?.((t) => t.widgets.load(el));
    };
    const show = async () => {
      if (post.site === "facebook" && !document.getElementById("fb-root")) {
        const root = document.createElement("div");
        root.id = "fb-root";
        document.body.prepend(root);
      }
      try {
        await loadScript(post.site);
      } catch {
        fail();
        return;
      }
      if (gone) return;
      watch();
      if (post.site === "x") drawX();
      else if (post.site === "instagram") window.instgrm?.Embeds.process();
      else window.FB?.XFBML.parse(el);
    };
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        near.disconnect();
        show();
      },
      { rootMargin: "600px 0px" },
    );
    near.observe(el.parentElement ?? el);
    // The site's light/dark button, or the phone's own setting, changing.
    const toggled = new MutationObserver(() => drawn && drawX());
    const system = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => drawn && drawX();
    if (post.site === "x") {
      toggled.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      system.addEventListener("change", onSystem);
    }
    return () => {
      gone = true;
      stop();
      near.disconnect();
      toggled.disconnect();
      system.removeEventListener("change", onSystem);
    };
  }, [post]);

  return (
    <div className={`rt-post rt-post-${post.site}`} data-state={state} aria-busy={state === "loading"}>
      <div ref={box} className="rt-post-embed" dangerouslySetInnerHTML={{ __html: markup(post) }} />
      {state === "loading" && <PostSkeleton site={post.site} />}
    </div>
  );
}

const MARKS: Record<Social["site"], React.ReactNode> = {
  x: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  facebook: <path d="M12 2a10 10 0 0 0-1.6 19.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 12 2z" />,
  instagram: (
    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm5.25-3.6a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3z" />
  ),
};

// The post's shape in shimmering bars (picture, name, text, photo), with the site's mark.
function PostSkeleton({ site }: { site: Social["site"] }) {
  return (
    <div className="rt-post-skel" aria-hidden="true">
      <div className="sk-head">
        <span className="skel sk-avatar" />
        <span className="sk-who">
          <span className="skel sk-name" />
          <span className="skel sk-handle" />
        </span>
        <svg className="sk-mark" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          {MARKS[site]}
        </svg>
      </div>
      <span className="skel sk-line" />
      <span className="skel sk-line" />
      <span className="skel sk-line short" />
      <span className="skel sk-media" />
      <span className="skel sk-foot" />
    </div>
  );
}
