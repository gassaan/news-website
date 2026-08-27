import type { Metadata } from "next";
import localFont from "next/font/local";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

const democratsAkuruRegular = localFont({
  src: "../fonts/Democrats-Akuru-Regular.ttf",
  variable: "--font-thaana",
  display: "swap",
});

const democratsAkBlack = localFont({
  src: "../fonts/Democrats-AK-Black.ttf",
  variable: "--font-democrats-ak",
  display: "swap",
});

const mvMagRoundBold = localFont({
  src: "../fonts/Mv-MAG-Round-Bold.otf",
  variable: "--font-mv-mag-round",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ދިވެހި ޚަބަރު",
  description: "ދިވެހި ބަހުން ޚަބަރު ފެތުރުމަށް ހަދާފައިވާ ސައިޓެއް",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="dv"
      dir="rtl"
      suppressHydrationWarning
      className={`${democratsAkuruRegular.variable} ${democratsAkBlack.variable} ${mvMagRoundBold.variable} h-full antialiased`}
    >
      <body className="bg-background flex min-h-full flex-col font-thaana">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
