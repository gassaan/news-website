import type { Metadata } from "next";
import { Noto_Sans_Thaana } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const notoSansThaana = Noto_Sans_Thaana({
  variable: "--font-thaana",
  subsets: ["thaana"],
  weight: ["400", "500", "600", "700"],
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
      className={`${notoSansThaana.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-thaana">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
