export default function PhotoCount({ count }: { count: number }) {
  return (
    <span className="photo-count" dir="ltr">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="7" width="14" height="14" rx="2.5" />
        <path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17" />
      </svg>
      {count}
    </span>
  );
}
