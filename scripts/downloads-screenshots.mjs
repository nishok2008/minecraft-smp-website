import { chromium } from "playwright";
import fs from "fs";

const BASE = "http://127.0.0.1:4174/?v=downloads#top";
const OUT = "C:/Users/nisho/Downloads";
const errors = [];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });

async function boot(page) {
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(9000);
  await page.addStyleTag({
    content: `.cursor, .cursor-dots, .cursor-glow, #cursorGlow, .toast { display: none !important; }`,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
}

async function worldSection(page) {
  await page.evaluate(() => document.getElementById("world").scrollIntoView({ behavior: "instant", block: "start" }));
  await page.waitForTimeout(1800);
  await page.evaluate(() => {
    window.scrollBy(0, -2);
    document.getElementById("siteHeader")?.classList.remove("is-hidden");
  });
  await page.waitForTimeout(900);
}

async function cleanWorld(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1600);
  await page.addStyleTag({
    content: `.site-header, .page-progress, .hero__hud, .hero__content, .hero__foot, .rail, .scroll-cue, .hero__scrim { visibility: hidden !important; }`,
  });
  await page.waitForTimeout(700);
}

/* ── Desktop ─────────────────────────────────────────────── */
const desktop = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await boot(desktop);

await desktop.screenshot({ path: `${OUT}/nishok-homepage-desktop.png` });
await worldSection(desktop);
await desktop.screenshot({ path: `${OUT}/nishok-voxel-world-section-desktop.png` });
await cleanWorld(desktop);
await desktop.screenshot({ path: `${OUT}/nishok-voxel-world-desktop.png` });

/* ── Mobile ──────────────────────────────────────────────── */
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
await boot(mobile);

await mobile.screenshot({ path: `${OUT}/nishok-homepage-mobile.png` });
await worldSection(mobile);
await mobile.screenshot({ path: `${OUT}/nishok-voxel-world-section-mobile.png` });
await cleanWorld(mobile);
await mobile.screenshot({ path: `${OUT}/nishok-voxel-world-mobile.png` });

console.log(JSON.stringify({ errors }, null, 2));
await browser.close();
