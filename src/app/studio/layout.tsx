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
