import { chromium } from "playwright";

const SHOTS = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
const errors = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("https://worked-documentation-pill-roman.trycloudflare.com/?v=21#join", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(6000);
await page.evaluate(() => window.scrollBy(0, 30));
await page.waitForTimeout(500);

await page.mouse.move(420, 640);
await page.waitForTimeout(250);
await page.mouse.move(1020, 430, { steps: 30 });
await page.waitForTimeout(60);

const trail = await page.evaluate(() => {
  const streak = document.querySelector(".cursor__streak");
  return {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    dotCount: document.querySelectorAll(".cursor-dot").length,
    streakInline: streak.style.opacity,
    streakComputed: getComputedStyle(streak).opacity,
    streakTransform: streak.style.transform,
  };
});
await page.screenshot({ path: `${SHOTS}/p02-reduced-dot-trail.png`, clip: { x: 380, y: 360, width: 700, height: 380 } });
await page.waitForTimeout(1000);
const after = await page.evaluate(() => document.querySelectorAll(".cursor-dot").length);

console.log(JSON.stringify({ trail, dotsAfterFade: after, errors }, null, 2));
await browser.close();
