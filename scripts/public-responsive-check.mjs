import { chromium } from "playwright";
const url = "https://worked-documentation-pill-roman.trycloudflare.com/?v=10#join";
const browser = await chromium.launch({ channel: "chrome", headless: true });

async function run(name, options, reducedMotion = "no-preference") {
  const context = await browser.newContext({ ...options, reducedMotion });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `C:/Users/nisho/AppData/Local/Temp/opencode/shots/l-${name}.png` });
  const info = await page.evaluate(() => {
    const row = document.querySelector(".join__squad-row").getBoundingClientRect();
    const eyes = document.querySelector(".warrior__eyes");
    const arms = [...document.querySelectorAll(".warrior__swordarm")].map((el) => getComputedStyle(el).transform);
    return {
      viewport: { w: innerWidth, h: innerHeight },
      count: document.querySelectorAll(".warrior-wrap").length,
      row: { top: row.top, bottom: row.bottom, h: row.height },
      overflowX: document.documentElement.scrollWidth > innerWidth,
      hasCursor: document.documentElement.classList.contains("has-cursor"),
      cursorDisplay: getComputedStyle(document.querySelector(".cursor")).display,
      cursorSize: getComputedStyle(document.querySelector(".cursor__rotor")).width,
      swordMirror: getComputedStyle(document.querySelector(".cursor__sword")).transform,
      eyesOpacity: getComputedStyle(eyes).opacity,
      eyesFilter: getComputedStyle(eyes).filter,
      armTransform: arms[0],
      trail: !!document.querySelector(".cursor__trail"),
    };
  });
  console.log(name, JSON.stringify(info), "errors", errors);
  await context.close();
}

await run("mobile", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await run("laptop", { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
await run("reduced", { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, "reduce");
await browser.close();
