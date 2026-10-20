import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:4174/?v=ambience-loop#top", { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(6000);
await page.locator("#ambience").click();
await page.waitForFunction(() => {
  const a = document.getElementById("ambienceAudio");
  return a && !a.paused && a.readyState === 4;
}, { timeout: 30000 });
await page.waitForTimeout(1700);
const before = await page.evaluate(() => {
  const a = document.getElementById("ambienceAudio");
  a.currentTime = a.duration - 0.35;
  return { duration: a.duration, currentTime: a.currentTime, volume: a.volume };
});
await page.waitForTimeout(1600);
const after = await page.evaluate(() => {
  const a = document.getElementById("ambienceAudio");
  return {
    currentTime: a.currentTime,
    paused: a.paused,
    loop: a.loop,
    ariaPressed: document.getElementById("ambience").getAttribute("aria-pressed"),
    isOn: document.getElementById("ambience").classList.contains("is-on"),
  };
});
await page.locator("#ambience").click();
await page.waitForFunction(() => document.getElementById("ambienceAudio").paused, { timeout: 10000 });
console.log(JSON.stringify({ before, after, looped: after.currentTime < 10 && !after.paused, errors }, null, 2));
await browser.close();
