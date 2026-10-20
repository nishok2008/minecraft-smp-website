import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
await page.addStyleTag({ content: `
  .hero__scrim, .vignette, .grain, .site-header, .hero__content, .hero__hud, .hero__foot, .cursor, .cursor-glow { display: none !important; }
` });
await page.waitForTimeout(400);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/sky-debug.png" });
await browser.close();
