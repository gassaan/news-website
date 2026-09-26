import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

const democratsAkBlack = localFont({
  src: "../../fonts/Democrats-AK-Black.ttf",
  weight: "900",
  variable: "--font-democrats-ak",
  display: "swap",
});

const democratsAkuruBold = localFont({
  src: "../../fonts/Democrats-Akuru-Bold.ttf",
  weight: "700",
  variable: "--font-akuru-bold",
  display: "swap",
});

const democratsAkuruRegular = localFont({
  src: "../../fonts/Democrats-Akuru-Regular.ttf",
  weight: "400",
  variable: "--font-akuru-regular",
  display: "swap",
});

const mvMagRound = localFont({
  src: "../../fonts/MV-MAG-Round-Bold.otf",
  weight: "700",
  variable: "--font-mag-round",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hulhangu",
  description: "ދިވެހި ބަހުން ޚަބަރު ފެތުރުމަށް ހަދާފައިވާ ސައިޓެއް",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="dv"
      dir="rtl"
      suppressHydrationWarning
      className={`${democratsAkBlack.variable} ${democratsAkuruBold.variable} ${democratsAkuruRegular.variable} ${mvMagRound.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="bg-ground text-text font-body flex min-h-full flex-col font-bold">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
