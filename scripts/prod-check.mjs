import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);

await page.evaluate(() => window.scrollTo(0, document.getElementById("join").offsetTop));
await page.waitForTimeout(2200);
await page.click("#copyIp");
await page.waitForTimeout(300);
const copyToast = await page.evaluate(() => document.getElementById("toastText")?.textContent);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n05-prod-join.png" });

await page.evaluate(() => window.scrollTo(0, document.getElementById("modes").offsetTop + 600));
await page.waitForTimeout(2000);
const blastBefore = await page.evaluate(() => typeof window.__world?.blastBed === "function");
await page.click("[data-bed-blast]");
await page.waitForTimeout(220);
const blastToast = await page.evaluate(() => document.getElementById("toastText")?.textContent);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n06-prod-blast.png" });

console.log(JSON.stringify({ errors, copyToast, blastBefore, blastToast }, null, 2));
await browser.close();
