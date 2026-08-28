import Link from "next/link";
import { categories } from "@/lib/articles";
import NewsIllustration from "./NewsIllustration";

export default function CategoryCarousel() {
  const track = [...categories, ...categories];

  return (
    <div dir="ltr" className="overflow-hidden py-2">
      <div
        className="animate-marquee flex w-max gap-4 px-4"
        style={{ animationDuration: "32s" }}
      >
        {track.map((category, index) => (
          <Link
            key={`${category.slug}-${index}`}
            href={`/category/${category.slug}`}
            dir="rtl"
            className="group relative block h-56 w-40 shrink-0 overflow-hidden rounded-2xl sm:h-64 sm:w-48"
          >
            <NewsIllustration
              category={category.slug}
              className="absolute inset-0 flex h-full w-full items-center justify-center"
            />
            <div className="absolute inset-0 bg-black/45 transition-colors group-hover:bg-black/55" />
            <span className="absolute inset-x-0 bottom-6 text-center text-lg font-bold text-white sm:text-xl">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
