import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./studio.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Added to a phone's home screen, the newsroom opens full screen like an app,
// with its own icon and name.
export const metadata: Metadata = {
  title: "Hulhangu – Studio",
  manifest: `${base}/studio.webmanifest`,
  appleWebApp: { capable: true, title: "Newsroom", statusBarStyle: "black" },
  icons: { apple: `${base}/studio-icons/apple-touch-icon.png` },
};
export const viewport: Viewport = { themeColor: "#150735" };

// The website's Thaana fonts, used across the dashboard (English stays in Sanity's Inter).
const thaana = localFont({
  src: [
    { path: "../../fonts/Democrats-Akuru-Regular.woff2", weight: "400" },
    { path: "../../fonts/Democrats-Akuru-Bold.woff2", weight: "700" },
  ],
  variable: "--font-thaana",
  display: "swap",
});

// After a reload of a deeper dashboard address, 404.html sends the browser here and saves
// the address; put it back before the Studio starts so it opens the same page.
const RESTORE_ADDRESS = `(function(){try{var r=sessionStorage.getItem("studio-redirect");if(r){sessionStorage.removeItem("studio-redirect");history.replaceState(null,"",r);}}catch(e){}})();`;

// Own root layout: the dashboard itself runs without the site header and footer.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={thaana.variable}>
      <body style={{ margin: 0 }}>
        <script dangerouslySetInnerHTML={{ __html: RESTORE_ADDRESS }} />
        {children}
      </body>
    </html>
  );
}
