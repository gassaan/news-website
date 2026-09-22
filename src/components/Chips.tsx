import Link from "next/link";
import { Category } from "@/lib/articles";

export default function Chips({
  categories,
  active,
}: {
  categories: Category[];
  active: string;
}) {
  return (
    <div className="chips" role="tablist" aria-label="ކެޓެގަރީތައް">
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/category/${category.slug}`}
          className="chip"
          role="tab"
          aria-selected={category.slug === active}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
