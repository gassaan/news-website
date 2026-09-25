import localFont from "next/font/local";
import "./studio.css";

export const metadata = { title: "Hulhangu – Studio" };

// Same reading font as the website, used in the dashboard's text boxes.
const akuru = localFont({
  src: "../../fonts/Democrats-Akuru-Regular.ttf",
  weight: "400",
  variable: "--font-akuru",
  display: "swap",
});

// Own root layout: the dashboard itself runs without the site header and footer.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={akuru.variable}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
