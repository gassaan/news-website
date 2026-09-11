import Link from "next/link";
import { Category } from "@/lib/articles";
import { PALETTES } from "./NewsIllustration";

const TAGLINE: Record<string, string> = {
  siyaasee: "ވެރިކަމާއި ސިޔާސަތު",
  viyafaari: "ބާޒާރާއި އިޤްތިޞާދު",
  kulhivaru: "މުބާރާތާއި ނަތީޖާ",
  dhuniye: "ބައިނަލްއަޤްވާމީ",
  life: "ދިރިއުޅުމާއި ސިއްޙަތު",
};

const BLURB: Record<string, string> = {
  siyaasee: "ސިޔާސީ މައިދާނުގެ އެންމެ ފަހުގެ ޚަބަރުތައް.",
  viyafaari: "ވިޔަފާރިއާއި ބާޒާރުގެ ޚަބަރުތައް ފަސޭހައިން.",
  kulhivaru: "ކުޅިވަރުގެ މުބާރާތްތަކާއި ނަތީޖާތައް.",
  dhuniye: "ދުނިޔޭގައި ހިނގާ ބޮޑެތި ކަންކަން.",
  life: "ދިރިއުޅުމާއި ސިއްޙަތުގެ ލިޔުންތައް.",
};

export default function CategoryShowcaseCard({
  category,
}: {
  category: Category;
}) {
  const palette = PALETTES[category.slug] ?? PALETTES.default;

  return (
    <Link
      href={`/category/${category.slug}`}
      dir="rtl"
      className="group relative block aspect-[3/4] w-64 shrink-0 overflow-hidden rounded-3xl border border-black/10 select-none"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.bg} 42%, ${palette.shape} 58%, ${palette.shape} 100%)`,
        }}
      />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent_0px,transparent_46px,rgba(0,0,0,0.06)_46px,rgba(0,0,0,0.06)_50px)]" />

      <svg
        viewBox="0 0 200 150"
        className="absolute top-[12%] left-1/2 h-[42%] w-[42%] -translate-x-1/2"
        aria-hidden="true"
      >
        <circle cx="100" cy="75" r="52" fill={palette.icon} opacity="0.12" />
        <rect x="55" y="45" width="90" height="60" rx="10" fill={palette.icon} opacity="0.92" />
        <rect x="66" y="56" width="68" height="38" rx="4" fill={palette.bg} />
        <rect x="72" y="64" width="20" height="6" rx="3" fill={palette.icon} />
        <rect x="72" y="76" width="34" height="6" rx="3" fill={palette.icon} />
        <circle cx="100" cy="112" r="5" fill={palette.icon} />
        <circle cx="80" cy="118" r="3" fill={palette.icon} opacity="0.7" />
        <circle cx="120" cy="118" r="3" fill={palette.icon} opacity="0.7" />
      </svg>

      <div className="absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-4">
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold"
          style={{ backgroundColor: palette.bg, color: palette.icon }}
        >
          {TAGLINE[category.slug]}
        </span>
        <h3 className="font-mv-mag-round text-2xl text-white">
          {category.name}
        </h3>
        <p className="max-w-[80%] text-right text-xs leading-5 text-white/75">
          {BLURB[category.slug]}
        </p>

        <span className="absolute bottom-4 left-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-black transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M7 17 17 7M9 7h8v8" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
