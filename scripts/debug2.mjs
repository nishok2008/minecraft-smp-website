import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(6000);
console.log(await page.evaluate(async () => {
  const fonts = {
    pixel: document.fonts.check('16px "Pixelify Sans"'),
    space: document.fonts.check('16px "Space Grotesk"'),
    mono: document.fonts.check('16px "JetBrains Mono"'),
    status: document.fonts.status,
  };
  const h1font = getComputedStyle(document.querySelector(".hero__title")).fontFamily;
  const h1weight = getComputedStyle(document.querySelector(".hero__title")).fontWeight;
  return { fonts, h1font, h1weight };
}));
await page.evaluate(() => {
  const el = document.querySelector("#world");
  window.scrollTo(0, el.offsetTop);
});
await page.waitForTimeout(2500);
console.log(await page.evaluate(() => ({
  scrollY: window.scrollY,
  docH: document.documentElement.scrollHeight,
  innerH: window.innerHeight,
  progressWidth: document.getElementById("pageProgress")?.style.width,
  railFill: document.getElementById("railFill")?.style.height,
  railPct: document.getElementById("railPct")?.textContent,
  bodyClass: document.body.className,
  headerClass: document.getElementById("siteHeader")?.className,
})));
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/topclip-02.png", clip: { x: 0, y: 0, width: 1440, height: 120 } });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);
await page.screenshot({ path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/topclip-01.png", clip: { x: 0, y: 0, width: 1440, height: 120 } });
await browser.close();
