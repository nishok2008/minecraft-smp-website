import { chromium } from "playwright";
import fs from "node:fs";

const outDir = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("CONSOLE: " + msg.text());
});
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);
await page.screenshot({ path: `${outDir}/01-hero.png` });

const scrollTo = async (sel, offset = 0) => {
  await page.evaluate(([s, o]) => {
    const el = document.querySelector(s);
    if (el) window.scrollTo(0, el.offsetTop + o);
  }, [sel, offset]);
  await page.waitForTimeout(2200);
};

await scrollTo("#world", 0);
await page.screenshot({ path: `${outDir}/02-world.png` });
await scrollTo("#modes", 0);
await page.screenshot({ path: `${outDir}/03-modes.png` });
await scrollTo("#sky", 0);
await page.screenshot({ path: `${outDir}/04-sky.png` });
await scrollTo("#join", 0);
await page.screenshot({ path: `${outDir}/05-join.png` });

await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(1800);
await page.screenshot({ path: `${outDir}/07-footer.png` });

// night mode
await scrollTo("#sky", 0);
await page.click('[data-time="night"]');
await page.waitForTimeout(3500);
await page.screenshot({ path: `${outDir}/06-night.png` });

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
