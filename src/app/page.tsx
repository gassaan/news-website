import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import NewsTicker from "@/components/NewsTicker";
import SectionCarousel from "@/components/SectionCarousel";
import Card from "@/components/Card";
import CategoryTile from "@/components/CategoryTile";
import AdSlot from "@/components/AdSlot";
import StoryCard from "@/components/StoryCard";
import GalleryShot from "@/components/GalleryShot";
import ArticleImage from "@/components/ArticleImage";
import {
  categories,
  getFeaturedArticles,
  getGalleryShots,
  getLatestArticles,
  getPopularArticles,
  reports,
  stories,
  articles,
} from "@/lib/articles";

export default function Home() {
  const featured = getFeaturedArticles();
  const heroArticles = featured.length > 0 ? featured : articles.slice(0, 3);
  const latest = getLatestArticles(6);
  const popular = getPopularArticles(6);
  const tickerHeadlines = latest.slice(0, 4).map((a) => a.title);
  const galleryShots = getGalleryShots();

  return (
    <>
      <HeroSlider articles={heroArticles} />

      <NewsTicker headlines={tickerHeadlines} />

      <SectionCarousel id="latest" title="އެންމެ ފަހުގެ ޚަބަރު" moreHref="/category/siyaasee">
        {latest.map((article) => (
          <Card key={article.slug} article={article} />
        ))}
      </SectionCarousel>

      <section id="cats" className="wrap">
        <div className="cats">
          {categories
            .filter((c) => c.slug !== "report")
            .map((category) => (
              <CategoryTile key={category.slug} category={category} />
            ))}
        </div>
      </section>

      <AdSlot />

      <SectionCarousel id="popular" title="އެންމެ މަގުބޫލް" moreHref="/category/siyaasee">
        {popular.map((article) => (
          <Card key={article.slug} article={article} />
        ))}
      </SectionCarousel>

      <SectionCarousel id="reports" title="ރިޕޯޓް" moreHref="/category/report">
        {reports.map((article) => (
          <Card key={article.slug} article={article} />
        ))}
      </SectionCarousel>

      <AdSlot />

      <section id="stories" className="wrap">
        <div className="sec-head">
          <h2>ވާހަކަ</h2>
          <Link className="more" href="/stories">
            އިތުރު ލިޔުން <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="carousel">
          <div className="track">
            {stories.map((story) => (
              <StoryCard key={story.slug} article={story} />
            ))}
          </div>
        </div>
      </section>

      <section className="graphics" id="graphics">
        <div className="wrap">
          <div className="sec-head">
            <h2>ގުރެފިކްސް</h2>
          </div>
          <div className="track">
            {galleryShots.map((shot) => (
              <ArticleImage key={shot.slug} slug={`gfx-${shot.slug}`} alt="" className="gfx" />
            ))}
          </div>
        </div>
      </section>

      <section className="wrap gallery" id="gallery">
        <div className="sec-head">
          <h2>ފޮޓޯ ގެލެރީ</h2>
        </div>
        <div className="carousel">
          <div className="track">
            {galleryShots.map((shot) => (
              <GalleryShot key={shot.slug} shot={shot} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
