"use client";

import { useEffect, useRef } from "react";
import type { Social } from "@/lib/richText";

// A post from X, Facebook or Instagram inside an article, shown with the site's own
// embed. Its script is fetched once per page, and only when a post is about to scroll
// into view, so articles without posts (or readers who never reach one) load nothing
// extra. Until then, or if the site is blocked, the reader sees a link to the post.

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

export default function SocialPost({ post }: { post: Social }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || post.short) return;
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
        if (post.site === "x") drawX();
        else if (post.site === "instagram") window.instgrm?.Embeds.process();
        else window.FB?.XFBML.parse(el);
      } catch {
        // Blocked or offline: the link to the post stays.
      }
    };
    const watch = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        watch.disconnect();
        show();
      },
      { rootMargin: "600px 0px" },
    );
    watch.observe(el);
    // The site's light/dark button, or the phone's own setting, changing.
    const toggled = new MutationObserver(() => drawn && drawX());
    const system = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => drawn && drawX();
    if (post.site === "x") {
      toggled.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      system.addEventListener("change", onSystem);
    }
    return () => {
      watch.disconnect();
      toggled.disconnect();
      system.removeEventListener("change", onSystem);
    };
  }, [post]);

  return <div ref={box} className={`rt-post rt-post-${post.site}`} dangerouslySetInnerHTML={{ __html: markup(post) }} />;
}
