import { pseudoHue } from "@/lib/hue";
import { cmsImage } from "@/lib/cmsImages";

export default function ArticleImage({
  slug,
  src,
  alt = "",
  className = "",
}: {
  slug: string;
  src?: string;
  alt?: string;
  className?: string;
}) {
  const hue = pseudoHue(slug);
  // A photo from the dashboard fills the slot when no image was passed in.
  const fromCms = src ? undefined : cmsImage(slug);
  const imageSrc = src ?? fromCms?.src;

  return (
    <div className={`ph ${className}`} style={{ "--h": hue } as React.CSSProperties}>
      {imageSrc && (
        <img src={imageSrc} alt={alt} style={fromCms?.pos ? { objectPosition: fromCms.pos } : undefined} />
      )}
    </div>
  );
}
