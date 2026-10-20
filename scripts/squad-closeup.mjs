import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
await page.evaluate(() => {
  const row = document.querySelector(".join__squad-row");
  window.scrollTo(0, row.getBoundingClientRect().top + scrollY - 420);
});
await page.waitForTimeout(2600);
await page.locator(".join__squad").screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/s01-current-squad-2x.png" });
await browser.close();
