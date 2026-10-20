import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto("http://127.0.0.1:5173/?v=debug", { waitUntil: "networkidle" });
await page.waitForTimeout(6000);
await page.evaluate(() => document.querySelector("#join")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollBy(0, 430));
await page.waitForTimeout(2200);
const data = await page.evaluate(() => {
  const wrap = document.querySelector(".warrior-wrap");
  const arm = wrap.querySelector(".warrior__swordarm");
  const sword = wrap.querySelector(".warrior__sword");
  const svg = wrap.querySelector("svg");
  const handRect = wrap.querySelector('rect[x="89"][y="92"]');
  const guard = sword.querySelector('rect[x="81"][y="97"]');
  const view = svg.viewBox.baseVal;
  const pt = svg.createSVGPoint();
  pt.x = 95; pt.y = 101;
  const screen = pt.matrixTransform(svg.getScreenCTM());
  const hand = handRect.getBoundingClientRect();
  const guardBox = guard.getBoundingClientRect();
  return {
    view: { x: view.x, y: view.y, w: view.width, h: view.height },
    armTransform: arm.getAttribute("transform") || getComputedStyle(arm).transform,
    swordTransform: sword.getAttribute("transform") || getComputedStyle(sword).transform,
    svgTransform: getComputedStyle(svg).transform,
    handBox: { x: hand.x, y: hand.y, w: hand.width, h: hand.height },
    guardBox: { x: guardBox.x, y: guardBox.y, w: guardBox.width, h: guardBox.height },
    localHandScreen: { x: screen.x, y: screen.y },
    swordBox: (() => { const b = sword.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; })(),
    armBox: (() => { const b = arm.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; })(),
    armInline: arm.style.cssText,
    swordInline: sword.style.cssText,
  };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
