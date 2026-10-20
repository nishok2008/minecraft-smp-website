import { chromium } from "playwright";
import fs from "node:fs";

const outDir = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("CONSOLE: " + msg.text());
});
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);
await page.screenshot({ path: `${outDir}/m01-hero.png` });

const scrollTo = async (sel) => {
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (el) window.scrollTo(0, el.offsetTop);
  }, sel);
  await page.waitForTimeout(2000);
};

await scrollTo("#world");
await page.screenshot({ path: `${outDir}/m02-world.png` });
await scrollTo("#modes");
await page.screenshot({ path: `${outDir}/m03-modes.png` });
await scrollTo("#sky");
await page.screenshot({ path: `${outDir}/m04-sky.png` });
await scrollTo("#join");
await page.screenshot({ path: `${outDir}/m05-join.png` });

await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(1600);
await page.screenshot({ path: `${outDir}/m06-footer.png` });

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
