import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);
await page.evaluate(() => {
  const el = document.querySelector(".bedwars");
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 140);
});
await page.waitForTimeout(2200);
const overflow = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
  bedWidth: document.querySelector(".bedwars")?.getBoundingClientRect().width,
}));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/m07-bedwars.png" });
await page.tap("[data-bed-blast]");
await page.waitForTimeout(220);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/m08-bedblast.png" });
console.log(JSON.stringify({ errors, overflow }, null, 2));
await browser.close();
