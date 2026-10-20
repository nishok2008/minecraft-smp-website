import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:4173/?v=2", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
await page.evaluate(() => window.scrollTo(0, document.getElementById("join").offsetTop));
await page.waitForTimeout(2400);
const info = await page.evaluate(() => {
  const jr = document.getElementById("join").getBoundingClientRect();
  const rel = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { top: Math.round(r.top - jr.top), bottom: Math.round(r.bottom - jr.top) }; };
  return {
    joinTop: Math.round(jr.top + scrollY),
    joinHeight: Math.round(jr.height),
    title: rel(".join__title"),
    actions: rel(".join__actions"),
    squad: rel(".join__squad"),
    row: rel(".join__squad-row"),
    count: document.querySelectorAll(".warrior-wrap").length,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
  };
});
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/q01-prod-join-top.png" });

// normal cursor spin
await page.mouse.move(900, 430);
await page.waitForTimeout(400);
await page.mouse.down();
await page.waitForTimeout(220);
const normalMid = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);
await page.mouse.up();
await page.waitForTimeout(700);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/q02-prod-cursor.png" });

// reduced motion still gets the sword cursor + click spin
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await context.newPage();
rp.on("pageerror", (e) => errors.push("REDUCED " + e.message));
await rp.goto("http://127.0.0.1:4173/?v=2", { waitUntil: "networkidle" });
await rp.waitForTimeout(6000);
await rp.mouse.move(760, 420);
await rp.waitForTimeout(400);
const reducedBefore = await rp.evaluate(() => ({ reduce: matchMedia("(prefers-reduced-motion: reduce)").matches, hasCursor: document.documentElement.classList.contains("has-cursor"), display: getComputedStyle(document.getElementById("cursor")).display }));
await rp.mouse.down();
await rp.waitForTimeout(250);
const reducedMid = await rp.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);
await rp.mouse.up();
await rp.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/q03-prod-reduced-cursor.png" });
await context.close();

// mobile join screen
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
mobile.on("pageerror", (e) => errors.push("MOBILE " + e.message));
await mobile.goto("http://127.0.0.1:4173/?v=2", { waitUntil: "networkidle" });
await mobile.waitForTimeout(7000);
await mobile.evaluate(() => window.scrollTo(0, document.getElementById("join").offsetTop));
await mobile.waitForTimeout(2400);
const mobileInfo = await mobile.evaluate(() => {
  const jr = document.getElementById("join").getBoundingClientRect();
  const row = document.querySelector(".join__squad-row").getBoundingClientRect();
  return { squadTop: Math.round(document.querySelector(".join__squad").getBoundingClientRect().top - jr.top), rowTop: Math.round(row.top - jr.top), rowBottom: Math.round(row.bottom - jr.top), overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
});
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/q04-prod-mobile-join.png" });

console.log(JSON.stringify({ errors, info, normalMid, reducedBefore, reducedMid, mobileInfo }, null, 2));
await browser.close();
