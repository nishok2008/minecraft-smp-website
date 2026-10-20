import { chromium } from "playwright";

const SHOTS = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
const errors = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("https://vol-hugo-array-thriller.trycloudflare.com/?v=22#join", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(7000);
await page.evaluate(() => window.scrollBy(0, 30));
await page.waitForTimeout(600);

await page.mouse.move(420, 640);
await page.waitForTimeout(250);
await page.mouse.move(1020, 430, { steps: 30 });
await page.waitForTimeout(60);

const trail = await page.evaluate(() => {
  const layer = document.getElementById("cursorDots");
  const dots = [...document.querySelectorAll(".cursor-dot")];
  const sample = dots[dots.length - 1];
  return {
    layerDisplay: getComputedStyle(layer).display,
    layerZ: getComputedStyle(layer).zIndex,
    count: dots.length,
    sample: sample
      ? {
          w: getComputedStyle(sample).width,
          h: getComputedStyle(sample).height,
          opacity: getComputedStyle(sample).opacity,
          left: sample.style.left,
          top: sample.style.top,
          bg: getComputedStyle(sample).backgroundImage.slice(0, 80),
        }
      : null,
  };
});

await page.screenshot({ path: `${SHOTS}/p01-dot-trail.png`, clip: { x: 380, y: 360, width: 700, height: 380 } });

await page.waitForTimeout(900);
const after = await page.evaluate(() => document.querySelectorAll(".cursor-dot").length);

console.log(JSON.stringify({ trail, dotsAfterFade: after, errors }, null, 2));
await browser.close();
