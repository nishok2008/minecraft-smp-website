import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5173/?v=traillog#join", { waitUntil: "networkidle" });
await page.waitForTimeout(6500);
await page.mouse.move(1050, 600);
await page.waitForTimeout(300);
const t0 = Date.now();
await page.mouse.down();
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(60);
  const info = await page.evaluate(() => {
    const t = document.querySelector('.cursor__trail');
    const r = document.querySelector('.cursor__rotor');
    return {
      tOpacity: getComputedStyle(t).opacity,
      tTransform: getComputedStyle(t).transform,
      rTransform: getComputedStyle(r).transform,
    };
  });
  console.log(Date.now() - t0, info);
}
await page.mouse.up();
await browser.close();
