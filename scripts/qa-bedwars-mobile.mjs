import { chromium } from "playwright";
import fs from "node:fs";

const outDir = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));

await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(5800);

await page.evaluate(() => document.querySelectorAll("[data-mode]")[3]?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outDir}/m07-modes-bedwars.png` });

await page.evaluate(() => document.querySelector(".bedwars")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1600);
await page.screenshot({ path: `${outDir}/m08-bedwars.png` });

await page.click('[data-mode="bedwars"]');
await page.waitForTimeout(500);
const mode = await page.evaluate(() => ({
  selected: document.querySelector("#selectedMode")?.textContent.trim(),
  color: getComputedStyle(document.querySelector("#selectedMode")).color,
  pressed: [...document.querySelectorAll("[data-mode]")].map((b) => ({
    mode: b.dataset.mode,
    pressed: b.getAttribute("aria-pressed"),
  })),
}));

await page.click("[data-bed-blast]");
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/m09-blast.png` });
const blast = await page.evaluate(() => ({
  toast: document.querySelector("#toast")?.textContent.trim(),
  label: document.querySelector(".bedwars__blast-label")?.textContent,
  hit: document.querySelector(".bedwars")?.classList.contains("is-hit"),
}));

const layout = await page.evaluate(() => {
  const card = document.querySelector(".bedwars")?.getBoundingClientRect();
  const btn = document.querySelector("[data-bed-blast]")?.getBoundingClientRect();
  return {
    card: card ? { top: card.top, bottom: card.bottom, width: card.width } : null,
    btn: btn ? { top: btn.top, bottom: btn.bottom, left: btn.left, right: btn.right } : null,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };
});

console.log(JSON.stringify({ mode, blast, layout, errors }, null, 2));
await browser.close();
