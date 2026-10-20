import { chromium } from "playwright";

const OUT = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:4174/?v=shots2#top", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(8500);
await page.addStyleTag({ content: `.cursor, .cursor-dots, .cursor-glow, #cursorGlow, .toast { display: none !important; }` });

// World section with header restored
await page.evaluate(() => document.getElementById("world").scrollIntoView({ behavior: "instant", block: "start" }));
await page.waitForTimeout(1600);
await page.evaluate(() => {
  window.scrollBy(0, -2);
  document.getElementById("siteHeader")?.classList.remove("is-hidden");
});
await page.waitForTimeout(900);
await page.screenshot({ path: `${OUT}/t05-world-desktop-header.png` });

// Clean voxel world: remove UI overlay
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);
await page.addStyleTag({
  content: `.site-header, .page-progress, .hero__hud, .hero__content, .hero__foot, .rail, .scroll-cue, .hero__scrim { visibility: hidden !important; }`,
});
await page.waitForTimeout(700);
await page.screenshot({ path: `${OUT}/t06-world-clean-desktop.png` });

console.log("done");
await browser.close();
