import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);
await page.evaluate(() => window.scrollTo(0, document.getElementById("modes").offsetTop));
await page.waitForTimeout(2600);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/bedwars-before.png" });

const hasBlast = await page.evaluate(() => typeof window.__world?.blastBed === "function");
await page.click("[data-bed-blast]");
await page.waitForTimeout(180);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/bedwars-blast.png" });
await page.waitForTimeout(1800);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/bedwars-after.png" });

const toast = await page.evaluate(() => document.getElementById("toastText")?.textContent);
console.log(JSON.stringify({ errors, hasBlast, toast }, null, 2));
await browser.close();
