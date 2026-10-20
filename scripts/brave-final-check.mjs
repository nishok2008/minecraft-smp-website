import { chromium } from "playwright";

const brave = "C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe";
const URL = "https://worked-documentation-pill-roman.trycloudflare.com/?v=brave19#join";
const SHOTS = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
const errors = [];

const browser = await chromium.launch({ executablePath: brave, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(URL, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(7000);
await page.evaluate(() => window.scrollBy(0, 30));
await page.waitForTimeout(600);

const base = await page.evaluate(() => ({
  assets: [...document.querySelectorAll('script[src*="/assets/index-"], link[href*="/assets/index-"]')].map((el) => el.src || el.href),
  hasCursor: document.documentElement.classList.contains("has-cursor"),
  cursorDisplay: getComputedStyle(document.querySelector(".cursor")).display,
  rotor: { w: getComputedStyle(document.querySelector(".cursor__rotor")).width, h: getComputedStyle(document.querySelector(".cursor__rotor")).height },
  swordMirror: getComputedStyle(document.querySelector(".cursor__sword")).transform,
  rowTop: document.querySelector(".join__squad-row").getBoundingClientRect().top,
  rowBottom: document.querySelector(".join__squad-row").getBoundingClientRect().bottom,
  count: document.querySelectorAll(".warrior-wrap").length,
  cutNodes: document.querySelectorAll(".warrior__cut").length,
  overflowX: document.documentElement.scrollWidth > innerWidth,
}));

// Live blue motion streak.
await page.mouse.move(900, 460);
await page.waitForTimeout(250);
await page.mouse.move(1100, 600, { steps: 10 });
await page.waitForTimeout(45);
const motionTrail = await page.evaluate(() => {
  const el = document.querySelector(".cursor__streak");
  return {
    inlineOpacity: el.style.opacity,
    computedOpacity: getComputedStyle(el).opacity,
    transform: el.style.transform,
    zIndex: getComputedStyle(el).zIndex,
    dotCount: document.querySelectorAll(".cursor-dot").length,
    dotSize: document.querySelector(".cursor-dot") ? getComputedStyle(document.querySelector(".cursor-dot")).width : null,
  };
});
await page.screenshot({ path: `${SHOTS}/k03-brave-motion-trail.png`, clip: { x: 1000, y: 500, width: 200, height: 200 } });

// Hover dissection without the white cut line.
const box = await page.locator(".warrior-wrap").first().boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.42);
await page.waitForTimeout(800);
await page.screenshot({ path: `${SHOTS}/k04-brave-hover-new.png` });
const hover = await page.evaluate(() => ({
  cls: document.querySelector(".warrior-wrap").className,
  cursorCls: document.querySelector(".cursor").className,
  head: getComputedStyle(document.querySelector(".warrior__head")).transform,
  seams: getComputedStyle(document.querySelector(".warrior__seams")).opacity,
  cutNodes: document.querySelectorAll(".warrior__cut").length,
}));

// Spam clicks, then make sure the sword settles at the -45 degree base angle.
for (let i = 0; i < 8; i += 1) {
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(40);
}
await page.waitForTimeout(2200);
const settled = await page.evaluate(() => ({
  rotor: getComputedStyle(document.querySelector(".cursor__rotor")).transform,
  sword: getComputedStyle(document.querySelector(".cursor__sword")).transform,
}));

console.log(JSON.stringify({ base, motionTrail, hover, settled, errors }, null, 2));
await browser.close();
