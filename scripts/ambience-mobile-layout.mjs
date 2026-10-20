import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const width of [430, 390, 360, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 2 });
  await page.goto("http://127.0.0.1:4174/?v=ambience-mobile#top", { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(4500);
  const info = await page.evaluate(() => {
    const header = document.querySelector(".site-header__inner");
    const brand = document.querySelector(".brand");
    const credit = document.querySelector(".ambience__credit");
    const button = document.getElementById("ambience");
    const menu = document.querySelector(".menu-btn");
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), width: Math.round(r.width) };
    };
    return {
      viewport: innerWidth,
      header: box(header),
      brand: box(brand),
      button: box(button),
      credit: box(credit),
      menu: box(menu),
      overflowX: document.documentElement.scrollWidth > innerWidth,
      creditFont: getComputedStyle(credit).fontSize,
      creditText: credit.textContent.trim(),
    };
  });
  console.log(JSON.stringify(info));
  await page.screenshot({ path: `C:/Users/nisho/AppData/Local/Temp/opencode/shots/ambience-mobile-credit-${width}.png`, clip: { x: 0, y: 0, width, height: 100 } });
  await page.close();
}
await browser.close();
