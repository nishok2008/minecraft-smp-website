import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function check(name, width, height, dpr, file) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://127.0.0.1:5173/?v=art3#join", { waitUntil: "networkidle" });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: file });
  const info = await page.evaluate(() => {
    const row = document.querySelector(".join__squad-row").getBoundingClientRect();
    const join = document.querySelector("#join").getBoundingClientRect();
    const wrap = document.querySelector(".warrior-wrap").getBoundingClientRect();
    return {
      scrollY,
      viewport: { w: innerWidth, h: innerHeight },
      join: { top: join.top, height: join.height },
      row: { x: row.x, y: row.y, w: row.width, h: row.height, bottom: row.bottom },
      wrap: { w: wrap.width, h: wrap.height },
      overflowX: document.documentElement.scrollWidth > innerWidth,
      hasCursor: document.documentElement.classList.contains("has-cursor"),
    };
  });
  console.log(name, JSON.stringify(info), "errors", errors);
  await page.close();
}
await check("desktop-hash", 1440, 900, 1, "C:/Users/nisho/AppData/Local/Temp/opencode/shots/c01-desktop-hash.png");
await check("mobile-hash", 390, 844, 2, "C:/Users/nisho/AppData/Local/Temp/opencode/shots/c02-mobile-hash.png");
await check("laptop-hash", 1366, 768, 1, "C:/Users/nisho/AppData/Local/Temp/opencode/shots/c03-laptop-hash.png");
await browser.close();
