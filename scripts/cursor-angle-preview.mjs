import { chromium } from "playwright";

const SHOTS = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto("https://worked-documentation-pill-roman.trycloudflare.com/?v=13", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(6000);

await page.evaluate(() => {
  const veil = document.createElement("div");
  veil.id = "measure-veil";
  veil.style.cssText = "position:fixed;inset:0;background:#000;z-index:299";
  document.body.appendChild(veil);
});
const P = { x: 720, y: 450 };
await page.mouse.move(P.x, P.y);
await page.waitForTimeout(700);

await page.screenshot({ path: `${SHOTS}/n05-cursor-rest-black.png`, clip: { x: P.x - 60, y: P.y - 60, width: 120, height: 120 } });

await page.evaluate(() => {
  const el = document.querySelector(".cursor__streak");
  el.style.transition = "none";
  el.style.opacity = "0.95";
  el.style.transform = "rotate(29deg) scaleX(1.3)";
});
await page.waitForTimeout(50);
await page.screenshot({ path: `${SHOTS}/n06-streak-forced-behind.png`, clip: { x: P.x - 60, y: P.y - 60, width: 120, height: 120 } });

await page.evaluate(() => {
  document.querySelector(".cursor__streak").style.zIndex = "2";
});
await page.waitForTimeout(50);
await page.screenshot({ path: `${SHOTS}/n07-streak-forced-front.png`, clip: { x: P.x - 60, y: P.y - 60, width: 120, height: 120 } });

console.log("done");
await browser.close();
