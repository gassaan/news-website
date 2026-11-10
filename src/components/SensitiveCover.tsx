"use client";

import { useState } from "react";

// Over a distressing photo: the photo stays blurred under a short note. On the article
// page (reveal) a button shows it; on cards there's only a small sign.
export default function SensitiveCover({ reveal = false }: { reveal?: boolean }) {
  const [shown, setShown] = useState(false);
  if (shown) return null;
  if (!reveal)
    return (
      <span className="ph-veil-sign" aria-hidden="true">
        <EyeOff />
      </span>
    );
  return (
    <div className="ph-veil">
      <EyeOff />
      <p>މި ފޮޓޯގައި ހިތްހަމަނުޖެހޭ ތަސްވީރެއް ހުރެދާނެ</p>
      <button
        type="button"
        onClick={(e) => {
          e.currentTarget.closest(".ph")?.classList.add("ph-shown");
          setShown(true);
        }}
      >
        ފޮޓޯ ބައްލަވާ
      </button>
    </div>
  );
}

function EyeOff() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c5.5 0 9 5 10 7a14 14 0 0 1-3.3 4.2M6.6 6.6C4.4 8 2.9 10.2 2 12c1 2 4.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
