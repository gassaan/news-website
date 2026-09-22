import Link from "next/link";
import HeroSlider from "@/components/HeroSlider";
import NewsTicker from "@/components/NewsTicker";
import SectionCarousel from "@/components/SectionCarousel";
import Card from "@/components/Card";
import CardGrid from "@/components/CardGrid";
import CategoryTile from "@/components/CategoryTile";
import AdSlot from "@/components/AdSlot";
import StoryCard from "@/components/StoryCard";
import GalleryShot from "@/components/GalleryShot";
import GraphicsCoverflow from "@/components/GraphicsCoverflow";
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
  const visibleCategories = categories.filter((c) => c.slug !== "report");

  return (
    <>
      <HeroSlider articles={heroArticles} />

      <NewsTicker headlines={tickerHeadlines} />

      <section id="latest" className="wrap">
        <div className="sec-head">
          <h2>އެންމެ ފަހުގެ ޚަބަރު</h2>
          <Link className="more" href="/category/siyaasee">
            އިތުރު ލިޔުން <span aria-hidden="true">›</span>
          </Link>
        </div>
        <CardGrid articles={latest} />
      </section>

      <section id="cats">
        <div className="cats">
          <div className="cats-track">
            {[...visibleCategories, ...visibleCategories].map((category, index) => (
              <CategoryTile key={`${category.slug}-${index}`} category={category} />
            ))}
          </div>
        </div>
      </section>

      <AdSlot />

      <section id="popular" className="wrap">
        <div className="sec-head">
          <h2>އެންމެ މަގުބޫލް</h2>
          <Link className="more" href="/category/siyaasee">
            އިތުރު ލިޔުން <span aria-hidden="true">›</span>
          </Link>
        </div>
        <CardGrid articles={popular} />
      </section>

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
        </div>
        <GraphicsCoverflow shots={galleryShots} />
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
