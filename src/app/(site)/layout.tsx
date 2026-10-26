import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";
import localFont from "next/font/local";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CardRipple from "@/components/CardRipple";
import "./globals.css";

// Loading skeleton for pictures: marks each picture once it has arrived (or failed), so
// its frame can shimmer until then and the picture fades in (globals.css). Runs before
// any picture is on the page, so none is missed.
const IMG_WAIT_SCRIPT = `(function(){var d=document;d.documentElement.setAttribute("data-imgwait","");function m(e){var t=e.target;if(t&&t.tagName==="IMG")t.setAttribute(e.type==="load"?"data-ok":"data-bad","");}d.addEventListener("load",m,true);d.addEventListener("error",m,true);})();`;
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

const democratsAkBlack = localFont({
  src: "../../fonts/Democrats-AK-Black.woff2",
  weight: "900",
  variable: "--font-democrats-ak",
  display: "swap",
});

const democratsAkuruBold = localFont({
  src: "../../fonts/Democrats-Akuru-Bold.woff2",
  weight: "700",
  variable: "--font-akuru-bold",
  display: "swap",
});

const democratsAkuruRegular = localFont({
  src: "../../fonts/Democrats-Akuru-Regular.woff2",
  weight: "400",
  variable: "--font-akuru-regular",
  display: "swap",
});

// Article page headlines (Mv MAG Round). Not preloaded: only article pages use it,
// so other pages never download it.
const magRound = localFont({
  src: "../../fonts/Mv-MAG-Round-XBold.woff2",
  weight: "700",
  variable: "--font-mag-round",
  display: "swap",
  preload: false,
});
// Inter (Latin) is kept in the project rather than fetched from Google Fonts at
// build time, so a Google hiccup can't stop the site from updating.
const inter = localFont({
  src: "../../fonts/Inter-latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

// Browser bar colour matches the header.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#150735" },
    { media: "(prefers-color-scheme: light)", color: "#3e2180" },
  ],
};

export const metadata: Metadata = {
  title: "Hulhangu",
  description: "ދިވެހި ބަހުން ޚަބަރު ފެތުރުމަށް ހަދާފައިވާ ސައިޓެއް",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Photos come from the dashboard's image service: open that connection early.
  preconnect("https://cdn.sanity.io");
  return (
    <html
      lang="dv"
      dir="rtl"
      suppressHydrationWarning
      className={`${democratsAkBlack.variable} ${democratsAkuruBold.variable} ${democratsAkuruRegular.variable} ${magRound.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="bg-ground text-text font-body flex min-h-full flex-col font-bold">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: IMG_WAIT_SCRIPT }} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CardRipple />
        {/* Cloudflare Web Analytics: visit counts without cookies. The token only sends
            counts and is public by design. Not on the dashboard (studio) pages. */}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "a5b07fb501f44044927cf0e49479873c"}'
        />
      </body>
    </html>
  );
}
