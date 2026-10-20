import { chromium, devices } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ ...devices["iPhone 13"], defaultBrowserType: undefined });
const page = await context.newPage();
await page.goto("http://192.168.0.101:4173/?v=4#join", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);
const info = await page.evaluate(() => ({
  scrollY: Math.round(scrollY),
  joinTop: document.getElementById("join").offsetTop,
  innerHeight,
  hash: location.hash,
  squadRectTop: Math.round(document.querySelector(".join__squad").getBoundingClientRect().top),
}));
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/r01-mobile-hash.png" });
await browser.close();
