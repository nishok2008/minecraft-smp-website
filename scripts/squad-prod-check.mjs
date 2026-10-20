import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173/";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on("console", (msg) => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);

const initial = await page.evaluate(async () => {
  const squad = document.querySelector(".join__squad");
  const swords = Array.from(document.querySelectorAll(".warrior__sword"));
  const cursorImg = document.querySelector(".cursor__sword");
  const status = await fetch("/cursor-diamond-sword.png").then((r) => r.status).catch(() => 0);
  return {
    squadCount: document.querySelectorAll(".warrior-wrap").length,
    swordCount: swords.length,
    squadOffset: squad ? Math.round(squad.getBoundingClientRect().top + scrollY) : null,
    firstSwordTransform: swords[0]?.getAttribute("transform") || null,
    cursorSrc: cursorImg?.getAttribute("src") || null,
    cursorNaturalWidth: cursorImg?.naturalWidth || 0,
    cursorAssetStatus: status,
  };
});

// Rest state: squad just entering the viewport.
await page.evaluate(() => {
  const squad = document.querySelector(".join__squad");
  window.scrollTo(0, squad.getBoundingClientRect().top + window.scrollY - 790);
});
await page.waitForTimeout(2400);
const rest = await page.evaluate(() => ({
  sword: document.querySelector(".warrior__sword")?.getAttribute("transform"),
  arm: document.querySelector(".warrior__swordarm")?.getAttribute("transform"),
}));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/p01-squad-rest.png" });

// Raised state after scrolling further.
await page.evaluate(() => {
  const squad = document.querySelector(".join__squad");
  window.scrollTo(0, squad.getBoundingClientRect().top + window.scrollY - 360);
});
await page.waitForTimeout(2600);
const raised = await page.evaluate(() => ({
  swords: Array.from(document.querySelectorAll(".warrior__sword")).map((el) => el.getAttribute("transform")),
  arms: Array.from(document.querySelectorAll(".warrior__swordarm")).map((el) => el.getAttribute("transform")),
}));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/p02-squad-raised.png" });

// Cursor: visible, clicks into a 360° turn, clamps back to identity.
await page.mouse.move(880, 430);
await page.waitForTimeout(500);
const cursorBefore = await page.evaluate(() => ({
  visible: document.getElementById("cursor")?.classList.contains("is-visible"),
  rotor: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
}));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/p03-cursor.png" });
await page.mouse.down();
await page.waitForTimeout(220);
const cursorMid = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);
await page.mouse.up();
await page.waitForTimeout(950);
const cursorAfter = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);

// Mobile layout for the squad row.
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
mobile.on("console", (msg) => { if (msg.type() === "error") errors.push("MOBILE CONSOLE: " + msg.text()); });
mobile.on("pageerror", (err) => errors.push("MOBILE PAGEERROR: " + err.message));
await mobile.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
await mobile.waitForTimeout(7000);
await mobile.evaluate(() => {
  const squad = document.querySelector(".join__squad");
  window.scrollTo(0, squad.getBoundingClientRect().top + window.scrollY - 300);
});
await mobile.waitForTimeout(2500);
const mobileInfo = await mobile.evaluate(() => ({
  count: document.querySelectorAll(".warrior-wrap").length,
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
  rowWidth: Math.round(document.querySelector(".join__squad-row").getBoundingClientRect().width),
  viewport: window.innerWidth,
}));
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/p04-mobile-squad.png" });

console.log(JSON.stringify({ errors, initial, rest, raised, cursorBefore, cursorMid, cursorAfter, mobileInfo }, null, 2));
await browser.close();
