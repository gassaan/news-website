import localFont from "next/font/local";
import "./studio.css";

export const metadata = { title: "Hulhangu – Studio" };

// The website's Thaana fonts, used across the dashboard (English stays in Sanity's Inter).
const thaana = localFont({
  src: [
    { path: "../../fonts/Democrats-Akuru-Regular.ttf", weight: "400" },
    { path: "../../fonts/Democrats-Akuru-Bold.ttf", weight: "700" },
  ],
  variable: "--font-thaana",
  display: "swap",
});

// Own root layout: the dashboard itself runs without the site header and footer.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={thaana.variable}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
