import { chromium } from "playwright";
const url = "https://worked-documentation-pill-roman.trycloudflare.com/?v=8#join";
const errors = [];
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(7000);
await page.evaluate(() => window.scrollBy(0, 30));
await page.waitForTimeout(700);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/j01-public-join.png" });
const box = await page.locator(".warrior-wrap").first().boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.42);
await page.waitForTimeout(800);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/j02-public-hover.png" });
const info = await page.evaluate(() => ({
  count: document.querySelectorAll(".warrior-wrap").length,
  hovered: document.querySelector(".warrior-wrap").className,
  cursorClass: document.querySelector(".cursor").className,
  cursorRot: getComputedStyle(document.querySelector(".cursor__rotor")).width,
  swordMirror: getComputedStyle(document.querySelector(".cursor__sword")).transform,
  headTransform: getComputedStyle(document.querySelector(".warrior__head")).transform,
  seams: getComputedStyle(document.querySelector(".warrior__seams")).opacity,
  overflowX: document.documentElement.scrollWidth > innerWidth,
  rowTop: document.querySelector(".join__squad-row").getBoundingClientRect().top,
}));
await page.mouse.down();
await page.waitForTimeout(100);
const during = await page.evaluate(() => ({
  trail: getComputedStyle(document.querySelector(".cursor__trail")).opacity,
  rotor: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
}));
await page.mouse.up();
console.log(JSON.stringify({ info, during, errors }, null, 2));
await browser.close();
