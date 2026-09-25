import "./studio.css";

export const metadata = { title: "Hulhangu – Studio" };

// Own root layout: the editor dashboard runs left-to-right without the site header and footer.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
