import { chromium } from "playwright";

const URL = "https://worked-documentation-pill-roman.trycloudflare.com/?v=15#join";
const SHOTS = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
const errors = [];

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(7000);
await page.evaluate(() => window.scrollBy(0, 30));
await page.waitForTimeout(900);

const assets = await page.evaluate(() => ({
  js: [...document.scripts].map((s) => s.src).find((s) => s.includes("index-")),
  css: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href).find((s) => s.includes("index-")),
  cutNodes: document.querySelectorAll(".warrior__cut").length,
  streakNode: Boolean(document.querySelector(".cursor__streak")),
}));

const REST = { x: 420, y: 320 };
await page.mouse.move(REST.x, REST.y);
await page.waitForTimeout(900);

const rest = await page.evaluate(() => {
  const rotor = document.querySelector(".cursor__rotor");
  const sword = document.querySelector(".cursor__sword");
  return {
    rotorTransform: getComputedStyle(rotor).transform,
    swordTransform: getComputedStyle(sword).transform,
    swordWidth: getComputedStyle(sword).width,
    cursorVisible: document.querySelector(".cursor").classList.contains("is-visible"),
  };
});

// Freeze everything except the sword for a clean orientation screenshot.
await page.evaluate(() => {
  const hide = [document.querySelector(".cursor__aura"), document.querySelector(".cursor__streak"), document.querySelector(".cursor__trail"), document.getElementById("cursorGlow")];
  hide.forEach((el) => { if (el) el.style.visibility = "hidden"; });
});
await page.waitForTimeout(60);
await page.screenshot({
  path: `${SHOTS}/n01-cursor-rest.png`,
  clip: { x: REST.x - 46, y: REST.y - 46, width: 92, height: 92 },
});
await page.evaluate(() => {
  const hide = [document.querySelector(".cursor__aura"), document.querySelector(".cursor__streak"), document.querySelector(".cursor__trail"), document.getElementById("cursorGlow")];
  hide.forEach((el) => { if (el) el.style.visibility = ""; });
});

// Rapid spam clicks, then confirm the cursor settles pointing back to the base angle.
for (let i = 0; i < 8; i += 1) {
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(45);
}
const midSweep = await page.evaluate(() => ({
  rotorTransform: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
  trailOpacity: getComputedStyle(document.querySelector(".cursor__trail")).opacity,
}));
await page.waitForTimeout(2200);
const settled = await page.evaluate(() => ({
  rotorTransform: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
  swordTransform: getComputedStyle(document.querySelector(".cursor__sword")).transform,
}));
await page.evaluate(() => {
  const hide = [document.querySelector(".cursor__aura"), document.querySelector(".cursor__streak"), document.querySelector(".cursor__trail"), document.getElementById("cursorGlow")];
  hide.forEach((el) => { if (el) el.style.visibility = "hidden"; });
});
await page.waitForTimeout(60);
await page.screenshot({
  path: `${SHOTS}/n02-cursor-after-spam.png`,
  clip: { x: REST.x - 46, y: REST.y - 46, width: 92, height: 92 },
});
await page.evaluate(() => {
  const hide = [document.querySelector(".cursor__aura"), document.querySelector(".cursor__streak"), document.querySelector(".cursor__trail"), document.getElementById("cursorGlow")];
  hide.forEach((el) => { if (el) el.style.visibility = ""; });
});

// Motion streak: real pointer movement, sampled while still moving.
await page.mouse.move(300, 250, { steps: 2 });
await page.waitForTimeout(120);
const moveA = { x: 620, y: 430 };
await page.mouse.move(moveA.x, moveA.y, { steps: 10 });
await page.waitForTimeout(45);
const streakLive = await page.evaluate(() => {
  const el = document.querySelector(".cursor__streak");
  return {
    inlineOpacity: el.style.opacity,
    computedOpacity: getComputedStyle(el).opacity,
    transform: el.style.transform,
    zIndex: getComputedStyle(el).zIndex,
    background: getComputedStyle(el).backgroundImage,
  };
});
await page.screenshot({
  path: `${SHOTS}/n03-cursor-streak.png`,
  clip: { x: moveA.x - 60, y: moveA.y - 60, width: 120, height: 120 },
});
await page.waitForTimeout(650);
const streakFaded = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__streak")).opacity);

// Single click: confirm the sweeping trail still lights up.
await page.mouse.move(520, 360);
await page.waitForTimeout(300);
await page.mouse.down();
await page.waitForTimeout(100);
const clickTrail = await page.evaluate(() => getComputedStyle(document.querySelector(".cursor__trail")).opacity);
await page.mouse.up();
await page.waitForTimeout(900);

// Armor hover: pop stays, white slash is gone.
await page.evaluate(() => document.querySelector(".warrior-wrap")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(600);
const firstBox = await page.locator(".warrior-wrap").first().boundingBox();
await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height * 0.42);
await page.waitForTimeout(700);
const armor = await page.evaluate(() => {
  const wrap = document.querySelector(".warrior-wrap");
  return {
    hoverClass: wrap.classList.contains("is-dissected"),
    headTransform: getComputedStyle(document.querySelector(".warrior__head")).transform,
    seamsOpacity: getComputedStyle(document.querySelector(".warrior__seams")).opacity,
    cutNodes: document.querySelectorAll(".warrior__cut").length,
    cursorClass: document.querySelector(".cursor").classList.contains("is-hover"),
  };
});
await page.screenshot({
  path: `${SHOTS}/n04-armor-no-slash.png`,
  clip: { x: Math.max(0, firstBox.x - 30), y: Math.max(0, firstBox.y - 40), width: Math.min(1440, firstBox.width + 60), height: Math.min(900, firstBox.height + 80) },
});

console.log(JSON.stringify({ assets, rest, midSweep, settled, streakLive, streakFaded, clickTrail, armor, errors }, null, 2));
await browser.close();
