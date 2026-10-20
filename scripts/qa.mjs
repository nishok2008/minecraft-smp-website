import { chromium } from "playwright";
import fs from "node:fs";

const outDir = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push("CONSOLE: " + msg.text());
});
page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(6500);

const result = {};

result.initial = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  bedwarsTop: document.querySelector(".bedwars")?.getBoundingClientRect().top,
  modes: [...document.querySelectorAll("[data-mode]")].map((b) => ({
    mode: b.dataset.mode,
    name: b.querySelector(".mode__name")?.textContent.trim(),
    pressed: b.getAttribute("aria-pressed"),
  })),
}));

await page.evaluate(() => document.querySelector(".bedwars")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(2400);
await page.screenshot({ path: `${outDir}/08-bedwars.png` });

result.bedwars = await page.evaluate(() => {
  const el = document.querySelector(".bedwars");
  const btn = document.querySelector("[data-bed-blast]");
  const r = el?.getBoundingClientRect();
  const br = btn?.getBoundingClientRect();
  return {
    card: r ? { top: r.top, bottom: r.bottom, width: r.width, height: r.height } : null,
    btn: br ? { top: br.top, bottom: br.bottom, left: br.left, right: br.right } : null,
    btnVisible: br ? br.top >= 0 && br.bottom <= window.innerHeight : false,
  };
});

await page.click("[data-bed-blast]");
await page.waitForTimeout(260);
await page.screenshot({ path: `${outDir}/09-blast.png` });
result.blast = await page.evaluate(() => ({
  toast: document.querySelector("#toast")?.textContent.trim(),
  toastVisible: document.querySelector("#toast")?.classList.contains("is-visible"),
  cardHit: document.querySelector(".bedwars")?.classList.contains("is-hit"),
  label: document.querySelector(".bedwars__blast-label")?.textContent,
}));
await page.waitForTimeout(1800);

await page.evaluate(() => document.querySelector("#modes")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(1600);
await page.click('[data-mode="creative"]');
await page.waitForTimeout(600);
result.mode = await page.evaluate(() => ({
  selected: document.querySelector("#selectedMode")?.textContent.trim(),
  selectedColor: getComputedStyle(document.querySelector("#selectedMode")).color,
  pressed: [...document.querySelectorAll("[data-mode]")].map((b) => ({
    mode: b.dataset.mode,
    pressed: b.getAttribute("aria-pressed"),
  })),
}));

await page.evaluate(() => document.querySelector("#sky")?.scrollIntoView({ block: "start" }));
await page.waitForTimeout(2200);
await page.click('[data-time="noon"]');
await page.waitForTimeout(2600);
result.noon = await page.evaluate(() => ({
  hud: document.querySelector("#hudTime")?.textContent,
  label: document.querySelector(".time-readout__label")?.textContent.trim(),
  time: document.querySelector("#timeValue")?.textContent,
  pressed: [...document.querySelectorAll("[data-time]")].map((b) => ({
    time: b.dataset.time,
    pressed: b.getAttribute("aria-pressed"),
  })),
  world: window.__world?.debug?.(),
}));
await page.screenshot({ path: `${outDir}/10-noon.png` });

await page.click('[data-time="night"]');
await page.waitForTimeout(2600);
await page.screenshot({ path: `${outDir}/11-night.png` });

result.errors = errors;
console.log(JSON.stringify(result, null, 2));
await browser.close();
