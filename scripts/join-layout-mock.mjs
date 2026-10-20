import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(7000);
await page.evaluate(() => {
  const inner = document.querySelector(".join__inner");
  const squad = document.querySelector(".join__squad");
  const small = document.querySelector(".join__small");
  inner.insertBefore(squad, small);
  const style = document.createElement("style");
  style.textContent = `
    .join { padding-top: clamp(5.5rem, 10vw, 8rem) !important; }
    .join__squad { margin-top: 1.5rem !important; }
  `;
  document.head.appendChild(style);
  window.dispatchEvent(new Event("resize"));
});
await page.waitForTimeout(1600);
const metrics = await page.evaluate(() => {
  const jr = document.getElementById("join").getBoundingClientRect();
  const rel = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { top: Math.round(r.top - jr.top), bottom: Math.round(r.bottom - jr.top) }; };
  window.scrollTo(0, jr.top + scrollY);
  return { title: rel(".join__title"), actions: rel(".join__actions"), squad: rel(".join__squad"), row: rel(".join__squad-row"), status: rel(".join__status") };
});
await page.waitForTimeout(2200);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/m01-join-mock.png" });
console.log(JSON.stringify(metrics, null, 2));

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await mobile.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await mobile.waitForTimeout(7000);
await mobile.evaluate(() => {
  const inner = document.querySelector(".join__inner");
  const squad = document.querySelector(".join__squad");
  const small = document.querySelector(".join__small");
  inner.insertBefore(squad, small);
  const style = document.createElement("style");
  style.textContent = `.join { padding-top: clamp(5.5rem, 10vw, 8rem) !important; } .join__squad { margin-top: 1.5rem !important; }`;
  document.head.appendChild(style);
  window.dispatchEvent(new Event("resize"));
});
await mobile.waitForTimeout(1600);
const mpos = await mobile.evaluate(() => {
  const jr = document.getElementById("join").getBoundingClientRect();
  const rel = (sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { top: Math.round(r.top - jr.top), bottom: Math.round(r.bottom - jr.top) }; };
  window.scrollTo(0, jr.top + scrollY);
  return { title: rel(".join__title"), actions: rel(".join__actions"), squad: rel(".join__squad"), row: rel(".join__squad-row") };
});
await mobile.waitForTimeout(2200);
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/m02-join-mobile-mock.png" });
console.log(JSON.stringify(mpos, null, 2));
await browser.close();
