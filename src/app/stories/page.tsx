import StoryCard from "@/components/StoryCard";
import { stories } from "@/lib/articles";

export default function StoriesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-mv-mag-round text-foreground mb-6 text-2xl">
        ވާހަކަތައް
      </h1>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4">
        {stories.map((story) => (
          <StoryCard key={story.slug} article={story} />
        ))}
      </div>
    </div>
  );
}
