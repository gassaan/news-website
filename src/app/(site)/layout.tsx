import type { Metadata, Viewport } from "next";
import { preconnect } from "react-dom";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CardRipple from "@/components/CardRipple";
import "./globals.css";

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

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
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
      className={`${democratsAkBlack.variable} ${democratsAkuruBold.variable} ${democratsAkuruRegular.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="bg-ground text-text font-body flex min-h-full flex-col font-bold">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
