import Link from "next/link";
import { Category } from "@/lib/articles";
import ArticleImage from "./ArticleImage";

export default function CategoryTile({ category }: { category: Category }) {
  return (
    <Link href={`/category/${category.slug}`} className="cat">
      <ArticleImage slug={`cat-${category.slug}`} alt="" />
      <span>{category.name}</span>
    </Link>
  );
}
