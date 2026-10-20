import { chromium } from "playwright";
import fs from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(7200);
await page.addStyleTag({
  content: ".cursor, .cursor-glow, .rail { display: none !important; }",
});
await page.screenshot({
  path: "public/og-image.jpg",
  type: "jpeg",
  quality: 84,
});
const size = fs.statSync("public/og-image.jpg").size;
console.log(JSON.stringify({ file: "public/og-image.jpg", bytes: size }));
await browser.close();
