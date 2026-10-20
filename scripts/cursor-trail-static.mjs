import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
await page.goto("http://127.0.0.1:5173/?v=staticpreview#join", { waitUntil: "networkidle" });
await page.waitForTimeout(6500);
await page.mouse.move(1050, 600);
await page.waitForTimeout(300);
await page.evaluate(() => {
  const t = document.querySelector('.cursor__trail');
  const r = document.querySelector('.cursor__rotor');
  t.style.opacity = '0.95';
  t.style.transform = 'rotate(-145deg) scale(1.05)';
  r.style.transform = 'rotate(-65deg)';
});
await page.waitForTimeout(500);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/h01-trail-static.png", clip: { x: 950, y: 500, width: 200, height: 200 } });
await browser.close();
