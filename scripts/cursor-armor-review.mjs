import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:5173/?v=hover1#join", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);

// Put the join viewport at a point where the squad is fully visible.
await page.evaluate(() => window.scrollBy(0, 30));
await page.waitForTimeout(800);

const first = page.locator(".warrior-wrap").first();
const box = await first.boundingBox();
console.log("first warrior", box);
const cx = box.x + box.width / 2;
const cy = box.y + box.height * 0.45;

// Cursor at rest, away from the squad
await page.mouse.move(720, 480);
await page.waitForTimeout(500);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/e01-cursor-rest.png", clip: { x: 640, y: 400, width: 160, height: 160 } });

// Cursor sweep mid-click
await page.mouse.down();
await page.waitForTimeout(140);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/e02-cursor-sweep.png", clip: { x: 640, y: 400, width: 160, height: 160 } });
await page.mouse.up();
await page.waitForTimeout(600);

// Armor hover
await page.mouse.move(cx, cy);
await page.waitForTimeout(850);
await page.locator(".join__squad-row").screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/e03-armor-hover-row.png" });
const hoverInfo = await page.evaluate(() => {
  const warrior = document.querySelector(".warrior-wrap");
  const head = warrior.querySelector(".warrior__head");
  const torso = warrior.querySelector(".warrior__torso");
  const legs = warrior.querySelector(".warrior__legs");
  const seams = warrior.querySelector(".warrior__seams");
  const cut = warrior.querySelector(".warrior__cut");
  const cursor = document.querySelector(".cursor");
  const sword = document.querySelector(".cursor__sword");
  const rotor = document.querySelector(".cursor__rotor");
  const cs = getComputedStyle(sword);
  return {
    warriorClass: warrior.className,
    dataCursor: warrior.getAttribute("data-cursor"),
    headTransform: getComputedStyle(head).transform,
    torsoTransform: getComputedStyle(torso).transform,
    legsTransform: getComputedStyle(legs).transform,
    seamsOpacity: getComputedStyle(seams).opacity,
    cutOpacity: getComputedStyle(cut).opacity,
    cursorClass: cursor.className,
    cursorSize: { w: getComputedStyle(rotor).width, h: getComputedStyle(rotor).height },
    swordTransform: cs.transform,
    swordFilter: cs.filter,
    headBox: head.getBoundingClientRect().toJSON(),
  };
});
console.log("hoverInfo", JSON.stringify(hoverInfo, null, 2));

// Click while on armor to see cursor sweep over the plate
await page.mouse.down();
await page.waitForTimeout(150);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/e04-armor-sweep.png" });
await page.mouse.up();
await page.waitForTimeout(500);

// Move away and confirm pieces reset
await page.mouse.move(1200, 200);
await page.waitForTimeout(800);
console.log("after leave", await page.evaluate(() => ({
  warriorClass: document.querySelector('.warrior-wrap').className,
  headTransform: getComputedStyle(document.querySelector('.warrior__head')).transform,
  seamsOpacity: getComputedStyle(document.querySelector('.warrior__seams')).opacity,
  cursorClass: document.querySelector('.cursor').className,
  overflowX: document.documentElement.scrollWidth > innerWidth,
})));
console.log("errors", errors);
await browser.close();
