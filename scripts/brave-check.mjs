import { chromium } from "playwright";
const brave = "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
const browser = await chromium.launch({ executablePath: brave, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:4173/?v=4#join", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);
const info = await page.evaluate(() => ({
  scrollY: Math.round(scrollY),
  joinTop: document.getElementById("join").offsetTop,
  hud: document.querySelector(".join__squad")?.getBoundingClientRect().top,
  count: document.querySelectorAll(".warrior-wrap").length,
  cursorDisplay: getComputedStyle(document.getElementById("cursor")).display,
  hasCursor: document.documentElement.classList.contains("has-cursor"),
  cursorImg: document.querySelector(".cursor__sword")?.naturalWidth,
}));
await page.mouse.move(900, 430);
await page.waitForTimeout(500);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/r02-brave-join.png" });
await page.mouse.down();
await page.waitForTimeout(200);
const spin = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);
await page.mouse.up();
console.log(JSON.stringify({ errors, info, spin }, null, 2));
await browser.close();
