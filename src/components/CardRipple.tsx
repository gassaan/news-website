"use client";

import { useEffect } from "react";

// Touch effect for the small cards: a soft purple wave spreads from where the
// finger lands. One listener for the whole site, so every .card gets it.
export default function CardRipple() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const card = (e.target as Element | null)?.closest?.(".card");
      if (!(card instanceof HTMLElement)) return;

      const r = card.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const box = document.createElement("span");
      box.className = "card-ripple";
      box.setAttribute("aria-hidden", "true");
      const wave = document.createElement("span");
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - r.left}px`;
      wave.style.top = `${e.clientY - r.top}px`;
      box.appendChild(wave);
      card.appendChild(box);

      // The browser took the touch for scrolling: fade the wave out quickly.
      const cancel = () => box.classList.add("gone");
      card.addEventListener("pointercancel", cancel, { once: true });
      wave.addEventListener("animationend", () => {
        card.removeEventListener("pointercancel", cancel);
        box.remove();
      });
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  return null;
}
