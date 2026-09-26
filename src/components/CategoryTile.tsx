import Link from "next/link";
import { Category } from "@/lib/articles";
import { getCategoryImage } from "@/lib/categoryImages";
import ArticleImage from "./ArticleImage";

export default function CategoryTile({ category }: { category: Category }) {
  return (
    <Link href={`/category/${category.slug}`} className="cat">
      <ArticleImage slug={`cat-${category.slug}`} src={getCategoryImage(category.slug)} alt="" />
      <span>{category.name}</span>
    </Link>
  );
}
