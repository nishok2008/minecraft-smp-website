import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const page = await context.newPage();
const events = [];
page.on("pageerror", (e) => events.push("PAGEERROR " + e.message));
page.on("console", (m) => { if (m.type() === "error") events.push("CONSOLE " + m.text()); });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(6000);
await page.evaluate(() => {
  window.__pd = 0;
  window.addEventListener("pointerdown", () => { window.__pd++; }, true);
});
await page.mouse.move(760, 420);
await page.waitForTimeout(400);
const before = await page.evaluate(() => ({
  cls: document.getElementById("cursor").className,
  inline: document.querySelector(".cursor__rotor").style.transform,
  computed: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
}));
await page.mouse.down();
await page.waitForTimeout(100);
const t100 = await page.evaluate(() => ({
  pd: window.__pd,
  cls: document.getElementById("cursor").className,
  inline: document.querySelector(".cursor__rotor").style.transform,
  computed: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
}));
await page.waitForTimeout(150);
const t250 = await page.evaluate(() => ({
  pd: window.__pd,
  cls: document.getElementById("cursor").className,
  inline: document.querySelector(".cursor__rotor").style.transform,
  computed: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
}));
await page.waitForTimeout(600);
const t850 = await page.evaluate(() => ({
  pd: window.__pd,
  cls: document.getElementById("cursor").className,
  inline: document.querySelector(".cursor__rotor").style.transform,
  computed: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
}));
await page.mouse.up();
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n05-reduced-spin.png" });
console.log(JSON.stringify({ events, before, t100, t250, t850 }, null, 2));
await browser.close();
