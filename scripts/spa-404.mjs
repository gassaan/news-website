// GitHub Pages serves out/404.html for any unknown address, e.g. when a dashboard
// page like /studio/structure/article is reloaded. This adds a tiny script to that page
// that remembers the address, opens /studio/ instead, and the Studio layout restores it.
import { readFileSync, writeFileSync } from "node:fs";

const file = new URL("../out/404.html", import.meta.url);
const html = readFileSync(file, "utf8");
const script =
  `<script>(function(){var p=location.pathname,i=p.indexOf("/studio/");` +
  `if(i!==-1&&p.length>i+8){sessionStorage.setItem("studio-redirect",p+location.search+location.hash);` +
  `location.replace(p.slice(0,i)+"/studio/");}})();</script>`;
if (!html.includes("studio-redirect")) {
  writeFileSync(file, html.replace("<head>", `<head>${script}`));
  console.log("[404] Added dashboard reload redirect to 404.html");
}
