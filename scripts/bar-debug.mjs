import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
const info = await page.evaluate(() => {
  const el = document.getElementById("pageProgress");
  const r = el?.getBoundingClientRect();
  const cs = el ? getComputedStyle(el) : null;
  const top = document.elementFromPoint(120, 1);
  return {
    scrollY: window.scrollY,
    progress: el ? { width: r.width, height: r.height, opacity: cs.opacity, styleWidth: el.style.width, styleOpacity: el.style.opacity, bg: cs.backgroundColor } : null,
    topElement: top ? `${top.tagName}#${top.id}.${top.className}` : null,
    topBg: top ? getComputedStyle(top).backgroundColor : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
