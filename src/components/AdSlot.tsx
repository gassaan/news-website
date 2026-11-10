import Link from "next/link";
import AdBox from "./AdBox";
import { adStatus, getAds, type AdPlace } from "@/lib/ads";

// An advert space between sections. With adverts for this place (managed in the
// newsroom under Ads) it shows one of them; otherwise "Advertise here".
export default function AdSlot({ place, className = "" }: { place: AdPlace; className?: string }) {
  const ads = getAds(place);
  // The empty space leads businesses to the page about advertising.
  const placeholder = (
    <Link href="/advertise" className="slot">
      Advertise here
    </Link>
  );
  if (!ads.length) {
    return (
      <div className={`wrap ad ${className}`}>
        {placeholder}
        <small>Sponsored</small>
      </div>
    );
  }
  // eslint-disable-next-line react-hooks/purity -- the site is built ahead: the time of the build picks the first advert
  const built = Date.now();
  const first = ads.find((a) => adStatus(a, built) === "running")?.id ?? null;
  return (
    <div className={`wrap ad ${className}`}>
      <AdBox ads={ads} first={first} sizes="(max-width: 1240px) 94vw, 1200px" placeholder={placeholder}>
        <small>Sponsored</small>
      </AdBox>
    </div>
  );
}

// The advert inside an article (after the first paragraph, or beside the text on wide
// screens): the advert's square picture when it has one. Without one, the article
// keeps its own placeholder.
export function InArticleAd({ placeholder }: { placeholder: React.ReactNode }) {
  const ads = getAds("article-in");
  if (!ads.length) return <>{placeholder}</>;
  // eslint-disable-next-line react-hooks/purity -- the site is built ahead: the time of the build picks the first advert
  const built = Date.now();
  const first = ads.find((a) => adStatus(a, built) === "running")?.id ?? null;
  return <AdBox ads={ads} first={first} square sizes="(max-width: 720px) 92vw, 340px" placeholder={placeholder} />;
}
