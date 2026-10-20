import { chromium } from "playwright";
import fs from "fs";
const dir = "C:/Users/nisho/AppData/Local/Temp/opencode/shots/screencast";
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
await page.goto("http://127.0.0.1:5173/?v=cast#join", { waitUntil: "networkidle" });
await page.waitForTimeout(6800);
await page.mouse.move(1050, 600);
await page.waitForTimeout(600);
const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async ({ data, sessionId, metadata }) => {
  frames.push({ data, ts: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
const clickAt = Date.now();
await page.mouse.click(1050, 600);
await page.waitForTimeout(1500);
await cdp.send("Page.stopScreencast").catch(() => {});
console.log("click", clickAt, "frames", frames.length);
frames.forEach((f, i) => {
  fs.writeFileSync(`${dir}/frame-${String(i).padStart(3, "0")}.jpg`, Buffer.from(f.data, "base64"));
});
fs.writeFileSync(`${dir}/meta.json`, JSON.stringify(frames.map(f => f.ts), null, 2));
await browser.close();
