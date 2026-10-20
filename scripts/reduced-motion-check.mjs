import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
for (const base of ["http://127.0.0.1:4173/", "http://127.0.0.1:5173/"]) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.mouse.move(800, 450);
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => ({
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    fine: matchMedia("(pointer: fine)").matches,
    hasCursor: document.documentElement.classList.contains("has-cursor"),
    cursorDisplay: getComputedStyle(document.getElementById("cursor")).display,
    cursorVisible: document.getElementById("cursor").classList.contains("is-visible"),
    squadCount: document.querySelectorAll(".warrior-wrap").length,
    squadOffset: Math.round(document.querySelector(".join__squad").getBoundingClientRect().top + scrollY),
    sword: document.querySelector(".warrior__sword")?.getAttribute("transform"),
  }));
  console.log(base, JSON.stringify({ errors, info }, null, 2));
  await context.close();
}
await browser.close();
