import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:5173/?v=trailreview#join", { waitUntil: "networkidle" });
await page.waitForTimeout(6500);
await page.mouse.move(1050, 600);
await page.waitForTimeout(400);
await page.mouse.down();
for (const [i, delay] of [40, 70, 100, 150, 220, 320, 450].entries()) {
  await page.waitForTimeout(i === 0 ? 40 : delay - [40, 70, 100, 150, 220, 320, 450][i - 1]);
  await page.screenshot({ path: `C:/Users/nisho/AppData/Local/Temp/opencode/shots/f0${i+1}-trail-${delay}ms.png`, clip: { x: 940, y: 490, width: 220, height: 220 } });
  const info = await page.evaluate(() => {
    const t = document.querySelector('.cursor__trail');
    const r = t.getBoundingClientRect();
    const cs = getComputedStyle(t);
    return { opacity: cs.opacity, transform: cs.transform, box: { x: r.x, y: r.y, w: r.width, h: r.height } };
  });
  console.log(delay, info);
}
await page.mouse.up();
console.log("errors", errors);
await browser.close();
