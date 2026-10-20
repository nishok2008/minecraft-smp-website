import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push("CONSOLE: " + msg.text()); });
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7000);

const squadInfo = await page.evaluate(() => {
  const squad = document.querySelector(".join__squad");
  const swords = Array.from(document.querySelectorAll(".warrior__sword"));
  return {
    count: document.querySelectorAll(".warrior-wrap").length,
    squadTop: squad ? squad.getBoundingClientRect().top + window.scrollY : null,
    swordCount: swords.length,
    swordTransform: swords[0]?.getAttribute("transform"),
  };
});

await page.evaluate(() => window.scrollTo(0, document.getElementById("join").offsetTop));
await page.waitForTimeout(2500);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/w01-join-top.png" });

await page.evaluate(() => {
  const squad = document.querySelector(".join__squad");
  window.scrollTo(0, squad.getBoundingClientRect().top + window.scrollY - 320);
});
await page.waitForTimeout(2600);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/w02-squad-raised.png" });

const raisedInfo = await page.evaluate(() => {
  const swords = Array.from(document.querySelectorAll(".warrior__sword"));
  const arms = Array.from(document.querySelectorAll(".warrior__swordarm"));
  return {
    swordTransforms: swords.map((s) => s.getAttribute("transform")),
    armTransforms: arms.map((a) => a.getAttribute("transform")),
  };
});

// Cursor visual + click rotation
await page.mouse.move(900, 420);
await page.waitForTimeout(500);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/w03-cursor.png" });
const beforeRotation = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);
await page.mouse.down();
await page.waitForTimeout(180);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/w04-cursor-spin.png" });
await page.mouse.up();
await page.waitForTimeout(900);
const afterRotation = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__rotor")).transform);

// Mobile squad
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
mobile.on("console", (msg) => { if (msg.type() === "error") errors.push("MOBILE CONSOLE: " + msg.text()); });
mobile.on("pageerror", (err) => errors.push("MOBILE PAGEERROR: " + err.message));
await mobile.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await mobile.waitForTimeout(7000);
const mobileOverflow = await mobile.evaluate(() => {
  const squad = document.querySelector(".join__squad");
  window.scrollTo(0, squad.getBoundingClientRect().top + window.scrollY - 280);
  return {
    count: document.querySelectorAll(".warrior-wrap").length,
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    rowWidth: document.querySelector(".join__squad-row").getBoundingClientRect().width,
  };
});
await mobile.waitForTimeout(2500);
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/w05-mobile-squad.png" });

console.log(JSON.stringify({ errors, squadInfo, raisedInfo, beforeRotation, afterRotation, mobileOverflow }, null, 2));
await browser.close();
