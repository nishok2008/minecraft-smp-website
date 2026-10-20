import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function shot(viewport, name, isMobile = false) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: isMobile ? 2 : 1, isMobile, hasTouch: isMobile });
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(name + " CONSOLE: " + msg.text()); });
  page.on("pageerror", (err) => errors.push(name + " PAGEERROR: " + err.message));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(7000);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const w = document.querySelector(".footer__watermark");
    return {
      watermark: w?.textContent,
      watermarkWidth: w?.scrollWidth,
      watermarkClient: w?.clientWidth,
      footerCredit: document.querySelector(".footer__byline")?.textContent,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  await page.screenshot({ path: `C:/Users/nisho/AppData/Local/Temp/opencode/shots/${name}.png` });
  await page.close();
  return info;
}

const desktop = await shot({ width: 1440, height: 900 }, "n07-footer-desktop");
const mobile = await shot({ width: 390, height: 844 }, "n08-footer-mobile", true);
console.log(JSON.stringify({ errors, desktop, mobile }, null, 2));
await browser.close();
