import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);
await page.mouse.move(900, 450);
await page.waitForTimeout(600);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/w07-cursor-hero.png" });

const btn = page.locator(".header-actions .btn--primary");
const box = await btn.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(600);
const hover = await page.evaluate(() => ({
  cursorClass: document.getElementById("cursor")?.className,
  rotor: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
}));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/w08-cursor-hover.png" });
console.log(JSON.stringify({ errors, hover }, null, 2));
await browser.close();
