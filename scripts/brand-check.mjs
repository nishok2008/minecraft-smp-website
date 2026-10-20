import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

async function inspect(page, label) {
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`${label} CONSOLE: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`${label} PAGEERROR: ${err.message}`));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(7000);
  return page.evaluate(() => {
    const header = document.querySelector(".site-header__inner");
    const brand = document.querySelector(".brand");
    return {
      title: document.title,
      brandText: document.querySelector(".brand__name")?.textContent,
      badge: document.querySelector(".brand__badge")?.textContent,
      menuIp: document.querySelector(".menu__ip")?.textContent,
      joinIp: document.querySelector(".ip-btn__value")?.textContent,
      preloader: document.querySelector(".preloader__word")?.textContent,
      footerWatermark: document.querySelector(".footer__watermark")?.textContent,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      header: header ? { width: header.getBoundingClientRect().width, scrollWidth: header.scrollWidth } : null,
      brand: brand ? { width: brand.getBoundingClientRect().width, right: brand.getBoundingClientRect().right } : null,
    };
  });
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const desktopInfo = await inspect(desktop, "DESKTOP");
await desktop.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n01-hero.png" });
await desktop.evaluate(() => window.scrollTo(0, document.getElementById("modes").offsetTop));
await desktop.waitForTimeout(2200);
await desktop.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n02-modes.png" });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const mobileInfo = await inspect(mobile, "MOBILE");
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n03-mobile-hero.png" });
await mobile.tap("#menuBtn");
await mobile.waitForTimeout(700);
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n04-mobile-menu.png" });

console.log(JSON.stringify({ errors, desktopInfo, mobileInfo }, null, 2));
await browser.close();
