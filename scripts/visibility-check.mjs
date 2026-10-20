import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
await page.evaluate(() => window.scrollTo(0, document.getElementById("join").offsetTop));
await page.waitForTimeout(2400);
const info = await page.evaluate(() => {
  const jr = document.getElementById("join").getBoundingClientRect();
  const rel = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { top: Math.round(r.top - jr.top), bottom: Math.round(r.bottom - jr.top) }; };
  const swords = [...document.querySelectorAll(".warrior__sword")];
  return {
    joinTop: Math.round(jr.top + scrollY),
    joinHeight: Math.round(jr.height),
    title: rel(".join__title"),
    actions: rel(".join__actions"),
    squad: rel(".join__squad"),
    row: rel(".join__squad-row"),
    small: rel(".join__small"),
    status: rel(".join__status"),
    swordTransforms: swords.map((s) => s.getAttribute("transform")),
  };
});
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n01-join-top.png" });
await page.evaluate(() => {
  const row = document.querySelector(".join__squad-row");
  window.scrollTo(0, row.getBoundingClientRect().top + scrollY - 440);
});
await page.waitForTimeout(2500);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n02-squad-raised.png" });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
mobile.on("pageerror", (e) => errors.push("MOBILE " + e.message));
await mobile.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await mobile.waitForTimeout(7000);
await mobile.evaluate(() => window.scrollTo(0, document.getElementById("join").offsetTop));
await mobile.waitForTimeout(2400);
const mobileInfo = await mobile.evaluate(() => ({
  joinTop: Math.round(document.getElementById("join").getBoundingClientRect().top + scrollY),
  squadTop: Math.round(document.querySelector(".join__squad").getBoundingClientRect().top - document.getElementById("join").getBoundingClientRect().top),
  rowBottom: Math.round(document.querySelector(".join__squad-row").getBoundingClientRect().bottom - document.getElementById("join").getBoundingClientRect().top),
  overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
}));
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n03-mobile-join.png" });

const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const rp = await reduced.newPage();
await rp.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await rp.waitForTimeout(7000);
await rp.mouse.move(760, 420);
await rp.waitForTimeout(400);
const reducedInfo = await rp.evaluate(() => ({
  reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
  hasCursor: document.documentElement.classList.contains("has-cursor"),
  cursorDisplay: getComputedStyle(document.getElementById("cursor")).display,
  cursorVisible: document.getElementById("cursor").classList.contains("is-visible"),
}));
await rp.mouse.down();
await rp.waitForTimeout(200);
const reducedSpin = await rp.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);
await rp.mouse.up();
await rp.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/n04-reduced-cursor.png" });
await reduced.close();

console.log(JSON.stringify({ errors, info, mobileInfo, reducedInfo, reducedSpin }, null, 2));
await browser.close();
