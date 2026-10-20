import { chromium } from "playwright";
import fs from "node:fs";

const outDir = "C:/Users/nisho/AppData/Local/Temp/opencode/shots";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const results = [];

const viewports = [
  { name: "mobile", width: 390, height: 844, scale: 2, mobile: true },
  { name: "tablet", width: 768, height: 1024, scale: 1, mobile: false },
  { name: "small-desktop", width: 1024, height: 768, scale: 1, mobile: false },
  { name: "desktop", width: 1440, height: 900, scale: 1, mobile: false },
];

for (const vp of viewports) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.scale,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`${vp.name} CONSOLE: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`${vp.name} PAGEERROR: ${err.message}`));
  await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(5200);

  const overflow = await page.evaluate(() => {
    const vw = window.innerWidth;
    const doc = document.documentElement;
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.position === "absolute") continue;
      if (style.display === "none" || style.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 2 || r.left < -2) {
        offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className).slice(0, 80),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
        });
      }
    }
    const uniq = [];
    const seen = new Set();
    for (const o of offenders) {
      const k = o.tag + o.cls;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(o);
    }
    return {
      viewport: vw,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      horizontalOverflow: doc.scrollWidth > doc.clientWidth + 1,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      offenders: uniq.slice(0, 20),
      pageHeight: doc.scrollHeight,
    };
  });

  const sections = await page.evaluate(() =>
    [...document.querySelectorAll("[data-scene]")].map((s) => ({
      id: s.id,
      top: s.offsetTop,
      height: s.offsetHeight,
    }))
  );

  // Mobile menu behaviour
  let menu = null;
  if (vp.width <= 1020) {
    await page.click("#menuBtn");
    await page.waitForTimeout(650);
    menu = await page.evaluate(() => ({
      open: document.querySelector("#menu")?.classList.contains("is-open"),
      ariaHidden: document.querySelector("#menu")?.getAttribute("aria-hidden"),
      expanded: document.querySelector("#menuBtn")?.getAttribute("aria-expanded"),
      bodyLocked: document.body.classList.contains("menu-open"),
    }));
    await page.screenshot({ path: `${outDir}/audit-${vp.name}-menu.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(550);
    menu.afterEscape = await page.evaluate(() => ({
      open: document.querySelector("#menu")?.classList.contains("is-open"),
      ariaHidden: document.querySelector("#menu")?.getAttribute("aria-hidden"),
      expanded: document.querySelector("#menuBtn")?.getAttribute("aria-expanded"),
      bodyLocked: document.body.classList.contains("menu-open"),
    }));
  }

  // Copy IP
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  let copy = null;
  try {
    await page.evaluate(() => document.querySelector("#join")?.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(1400);
    await page.click("#copyIp");
    await page.waitForTimeout(350);
    copy = await page.evaluate(async () => ({
      clip: await navigator.clipboard.readText(),
      toast: document.querySelector("#toast")?.textContent.trim(),
      toastVisible: document.querySelector("#toast")?.classList.contains("is-visible"),
      label: document.querySelector("#copyLabel")?.textContent,
    }));
  } catch (e) {
    copy = { error: e.message };
  }

  // Section screenshots for the small viewport
  if (vp.name === "tablet") {
    for (const sel of ["#world", "#modes", "#sky", "#join"]) {
      await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: "start" }), sel);
      await page.waitForTimeout(1900);
      await page.screenshot({ path: `${outDir}/audit-${vp.name}-${sel.slice(1)}.png` });
    }
  }

  results.push({ ...vp, sections, overflow, menu, copy });
  await page.close();
}

console.log(JSON.stringify({ results, errors }, null, 2));
await browser.close();
