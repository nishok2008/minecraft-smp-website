import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];

// Desktop: Discord toast
const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
desktop.on("console", (msg) => { if (msg.type() === "error") errors.push("DESKTOP CONSOLE: " + msg.text()); });
desktop.on("pageerror", (err) => errors.push("DESKTOP PAGEERROR: " + err.message));
await desktop.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await desktop.waitForTimeout(7000);
await desktop.evaluate(() => window.scrollTo(0, document.getElementById("join").offsetTop));
await desktop.waitForTimeout(2200);
await desktop.click("[data-discord]");
await desktop.waitForTimeout(250);
const toast = await desktop.evaluate(() => document.getElementById("toastText")?.textContent);
await desktop.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/discord-toast.png" });

// Mobile: menu open/close
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
mobile.on("console", (msg) => { if (msg.type() === "error") errors.push("MOBILE CONSOLE: " + msg.text()); });
mobile.on("pageerror", (err) => errors.push("MOBILE PAGEERROR: " + err.message));
await mobile.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await mobile.waitForTimeout(7000);
await mobile.tap("#menuBtn");
await mobile.waitForTimeout(700);
const menuState = await mobile.evaluate(() => ({
  open: document.body.classList.contains("menu-open"),
  expanded: document.getElementById("menuBtn")?.getAttribute("aria-expanded"),
  menuVisible: getComputedStyle(document.getElementById("menu")).visibility,
}));
await mobile.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/m09-menu.png" });
await mobile.tap('#menu a[href="#world"]');
await mobile.waitForTimeout(900);
const closed = await mobile.evaluate(() => ({
  open: document.body.classList.contains("menu-open"),
  expanded: document.getElementById("menuBtn")?.getAttribute("aria-expanded"),
  scrollY: window.scrollY,
}));

console.log(JSON.stringify({ errors, toast, menuState, closed }, null, 2));
await browser.close();
