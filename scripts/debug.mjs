import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => console.log("CONSOLE", m.type(), m.text()));
page.on("pageerror", (e) => console.log("ERR", e.message));
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(6000);
const info = await page.evaluate(() => ({
  scrollY: window.scrollY,
  docH: document.documentElement.scrollHeight,
  innerH: window.innerHeight,
  progressWidth: document.getElementById("pageProgress")?.style.width,
  progressRect: document.getElementById("pageProgress")?.getBoundingClientRect().width,
  parentRect: document.querySelector(".page-progress")?.getBoundingClientRect().width,
  railFill: document.getElementById("railFill")?.style.height,
  canvas: document.getElementById("worldCanvas")?.getBoundingClientRect().toJSON(),
  hasWebgl: !document.body.classList.contains("no-webgl"),
}));
console.log(info);
await browser.close();
