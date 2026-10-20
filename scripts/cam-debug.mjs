import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);

const meta = await page.evaluate(() => {
  const scenes = [...document.querySelectorAll("[data-scene]")].map((el) => ({
    id: el.id,
    top: el.offsetTop,
    height: el.offsetHeight,
  }));
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const vh = window.innerHeight;
  return {
    scrollY: window.scrollY,
    pageHeight: document.documentElement.scrollHeight,
    max,
    vh,
    scenes,
    stops: scenes.map((s, i) => (i === 0 ? 0 : (s.top - vh * 0.15) / max)),
  };
});

const skyTop = meta.scenes.find((s) => s.id === "sky")?.top ?? 0;
await page.evaluate((y) => window.scrollTo(0, y), skyTop);
await page.waitForTimeout(2600);

const state = await page.evaluate(() => {
  const w = window.__world;
  return {
    scrollY: window.scrollY,
    progress: window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
    world: w?.debug ? w.debug() : null,
  };
});

console.log(JSON.stringify({ meta, state }, null, 2));
await browser.close();
