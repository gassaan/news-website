import CategoryTabs from "@/components/CategoryTabs";
import StoryGrid from "@/components/StoryGrid";
import { stories } from "@/lib/articles";

export default function StoriesPage() {
  return (
    <div className="bg-card-accent/70 relative left-1/2 right-1/2 -mx-[50vw] w-screen py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h1 className="font-mv-mag-round text-foreground mb-6 text-right text-2xl">
          ކެޓަގަރީތައް
        </h1>

        <CategoryTabs active="vaahaka" />

        <StoryGrid stories={stories} />
      </div>
    </div>
  );
}
