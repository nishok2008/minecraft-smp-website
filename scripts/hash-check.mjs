import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:4173/?v=3#join", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
console.log(await page.evaluate(() => ({ scrollY: Math.round(scrollY), joinTop: document.getElementById("join").offsetTop, hash: location.hash })));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/q05-hash-join.png" });
await browser.close();
