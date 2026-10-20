import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
await page.goto("http://127.0.0.1:5173/?v=trail2#join", { waitUntil: "networkidle" });
await page.waitForTimeout(6500);
await page.mouse.move(1050, 600);
await page.waitForTimeout(350);
await page.mouse.down();
const t0 = Date.now();
for (let i = 0; i < 4; i++) {
  await page.waitForTimeout(i === 0 ? 90 : 170);
  const info = await page.evaluate(() => {
    const t = document.querySelector('.cursor__trail');
    const s = document.querySelector('.cursor__sword');
    return { trailOpacity: getComputedStyle(t).opacity, swordTransform: getComputedStyle(s).transform, rotor: getComputedStyle(document.querySelector('.cursor__rotor')).transform };
  });
  console.log("before shot", i, Date.now() - t0, info);
  await page.screenshot({ path: `C:/Users/nisho/AppData/Local/Temp/opencode/shots/g0${i+1}-trail.png`, clip: { x: 960, y: 510, width: 180, height: 180 } });
  console.log("after shot", Date.now() - t0);
}
await page.mouse.up();
await browser.close();
