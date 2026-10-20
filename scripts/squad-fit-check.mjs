import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function shot(name, width, height, file) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://127.0.0.1:5173/?v=art4#join", { waitUntil: "networkidle" });
  await page.waitForTimeout(6500);
  await page.screenshot({ path: file });
  const info = await page.evaluate(() => {
    const row = document.querySelector(".join__squad-row").getBoundingClientRect();
    const sweep = document.querySelector(".warrior__sweep");
    return {
      scrollY,
      row: { top: row.top, bottom: row.bottom, h: row.height },
      wrapW: document.querySelector(".warrior-wrap").getBoundingClientRect().width,
      sweepOpacity: getComputedStyle(sweep).opacity,
      overflowX: document.documentElement.scrollWidth > innerWidth,
    };
  });
  console.log(name, JSON.stringify(info), "errors", errors);
  await page.close();
}
await shot("desktop-1440x900", 1440, 900, "C:/Users/nisho/AppData/Local/Temp/opencode/shots/d01-1440x900.png");
await shot("laptop-1366x768", 1366, 768, "C:/Users/nisho/AppData/Local/Temp/opencode/shots/d02-1366x768.png");
await shot("laptop-1280x720", 1280, 720, "C:/Users/nisho/AppData/Local/Temp/opencode/shots/d03-1280x720.png");
await browser.close();
