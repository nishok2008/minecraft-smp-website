import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("https://vol-hugo-array-thriller.trycloudflare.com/?v=ambience-mobile2#top", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(6000);
const initial = await page.evaluate(() => {
  const credit = document.querySelector(".ambience__credit");
  const r = credit.getBoundingClientRect();
  return {
    creditDisplay: getComputedStyle(credit).display,
    creditVisible: r.width > 0 && r.height > 0,
    creditText: credit.textContent.trim(),
    overflowX: document.documentElement.scrollWidth > innerWidth,
  };
});
await page.locator("#ambience").click();
await page.waitForFunction(() => {
  const a = document.getElementById("ambienceAudio");
  return a && !a.paused && document.getElementById("ambience").getAttribute("aria-pressed") === "true";
}, { timeout: 45000 });
await page.waitForTimeout(1900);
const playing = await page.evaluate(() => {
  const a = document.getElementById("ambienceAudio");
  return {
    ariaPressed: document.getElementById("ambience").getAttribute("aria-pressed"),
    paused: a.paused,
    volume: a.volume,
    currentTime: a.currentTime,
    loop: a.loop,
  };
});
await page.screenshot({
  path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/ambience-mobile-playing.png",
  clip: { x: 0, y: 0, width: 390, height: 100 },
});
await page.locator("#ambience").click();
await page.waitForFunction(() => document.getElementById("ambienceAudio").paused, { timeout: 10000 });
const stopped = await page.evaluate(() => ({
  ariaPressed: document.getElementById("ambience").getAttribute("aria-pressed"),
  paused: document.getElementById("ambienceAudio").paused,
  volume: document.getElementById("ambienceAudio").volume,
}));
console.log(JSON.stringify({ initial, playing, stopped, errors }, null, 2));
await browser.close();
