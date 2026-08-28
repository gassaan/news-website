const PALETTE = ["#e8c257", "#4fb8a6", "#e8815f", "#5ea3e0", "#e07bb0", "#9b8ce0"];

function colorFor(name: string) {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 17 + char.charCodeAt(0)) % 100000;
  }
  return PALETTE[hash % PALETTE.length];
}

export default function AuthorAvatar({
  name,
  className = "h-8 w-8",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`}
      style={{ backgroundColor: colorFor(name) }}
    >
      <svg viewBox="0 0 24 24" fill="#fff" className="h-3/5 w-3/5" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1Z" />
      </svg>
    </span>
  );
}
