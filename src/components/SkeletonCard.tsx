// A news card's shape in shimmering bars, shown while results are still loading.
export default function SkeletonCard() {
  return (
    <div className="card skel-card" aria-hidden="true">
      <div className="ph skel" />
      <span className="skel skel-title" />
      <span className="skel skel-title short" />
      <span className="skel skel-meta" />
    </div>
  );
}
