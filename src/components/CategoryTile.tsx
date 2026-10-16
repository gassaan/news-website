import Link from "next/link";
import { Category } from "@/lib/articles";
import { getCategoryImage } from "@/lib/categoryImages";
import ArticleImage from "./ArticleImage";

export default function CategoryTile({ category }: { category: Category }) {
  return (
    <Link href={`/category/${category.slug}`} className="cat">
      {/* The row slides by itself: load straight away so no tile shows up empty. */}
      <ArticleImage slug={`cat-${category.slug}`} src={getCategoryImage(category.slug)} alt="" sizes="(max-width: 720px) 45vw, 290px" priority />
      <span>{category.name}</span>
    </Link>
  );
}
