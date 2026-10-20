import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4174/?v=shots#top";
const OUT = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
const errors = [];

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function prepare(page) {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(8500);
  await page.addStyleTag({
    content: `.cursor, .cursor-dots, .cursor-glow, #cursorGlow, .toast { display: none !important; }`,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

// Desktop
const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
desktop.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
desktop.on("pageerror", (e) => errors.push(String(e)));
await prepare(desktop);
await desktop.screenshot({ path: `${OUT}/t01-home-desktop.png` });
await desktop.evaluate(() => document.getElementById("world").scrollIntoView({ behavior: "instant", block: "start" }));
await desktop.waitForTimeout(2200);
await desktop.screenshot({ path: `${OUT}/t02-world-desktop.png` });
const deskInfo = await desktop.evaluate(() => ({
  scrollY: window.scrollY,
  worldTop: document.getElementById("world").getBoundingClientRect().top,
  worldHeight: document.getElementById("world").getBoundingClientRect().height,
  fullHeight: document.documentElement.scrollHeight,
  overflowX: document.documentElement.scrollWidth > innerWidth,
}));

// Mobile
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
mobile.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
mobile.on("pageerror", (e) => errors.push(String(e)));
await prepare(mobile);
await mobile.screenshot({ path: `${OUT}/t03-home-mobile.png` });
await mobile.evaluate(() => document.getElementById("world").scrollIntoView({ behavior: "instant", block: "start" }));
await mobile.waitForTimeout(2200);
await mobile.screenshot({ path: `${OUT}/t04-world-mobile.png` });
const mobInfo = await mobile.evaluate(() => ({
  scrollY: window.scrollY,
  worldTop: document.getElementById("world").getBoundingClientRect().top,
  worldHeight: document.getElementById("world").getBoundingClientRect().height,
  fullHeight: document.documentElement.scrollHeight,
  overflowX: document.documentElement.scrollWidth > innerWidth,
}));

console.log(JSON.stringify({ deskInfo, mobInfo, errors }, null, 2));
await browser.close();
