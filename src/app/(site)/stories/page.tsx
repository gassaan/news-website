import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import { stories } from "@/lib/articles";

export default function StoriesPage() {
  return (
    <div className="wrap cat-page">
      <div className="page-head">
        <Link className="back" href="/" aria-label="ފަހަތަށް">
          <svg width="14" height="26" viewBox="0 0 13 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 1l11 12L1 25" />
          </svg>
        </Link>
        <h1 className="page-title">ވާހަކަ</h1>
      </div>

      <div className="cat-grid">
        {stories.map((story) => (
          <StoryCard key={story.slug} article={story} />
        ))}
      </div>
    </div>
  );
}
