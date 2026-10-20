import { chromium } from "playwright";

const LOCAL = "http://127.0.0.1:4174/?v=ambience1#top";
const PUBLIC = "https://vol-hugo-array-thriller.trycloudflare.com/?v=ambience1#top";
const browser = await chromium.launch({ channel: "chrome", headless: true });

function watch(page, label) {
  const errors = [];
  const warnings = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
    if (m.type() === "warning") warnings.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${String(e)}`));
  return { label, errors, warnings };
}

async function snapshot(page) {
  return page.evaluate(() => {
    const btn = document.getElementById("ambience");
    const audio = document.getElementById("ambienceAudio");
    const credit = document.querySelector(".ambience__credit");
    const btnBox = btn.getBoundingClientRect();
    const creditBox = credit.getBoundingClientRect();
    return {
      ariaPressed: btn.getAttribute("aria-pressed"),
      ariaLabel: btn.getAttribute("aria-label"),
      isOn: btn.classList.contains("is-on"),
      src: audio ? audio.getAttribute("src") : null,
      absoluteSrc: audio ? audio.src : null,
      loop: audio?.loop,
      preload: audio?.preload,
      paused: audio?.paused,
      volume: audio?.volume,
      currentTime: audio?.currentTime,
      readyState: audio?.readyState,
      networkState: audio?.networkState,
      duration: Number.isFinite(audio?.duration) ? audio.duration : null,
      creditText: credit?.textContent.trim(),
      creditDisplay: credit ? getComputedStyle(credit).display : null,
      creditColor: credit ? getComputedStyle(credit).color : null,
      creditOpacity: credit ? getComputedStyle(credit).opacity : null,
      creditBesideButton:
        creditBox.width > 0 &&
        creditBox.left > btnBox.left &&
        creditBox.right > btnBox.right &&
        Math.abs(creditBox.top + creditBox.height / 2 - (btnBox.top + btnBox.height / 2)) < 20,
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
}

async function waitForPlayback(page, timeout = 30000) {
  await page.waitForFunction(
    () => {
      const a = document.getElementById("ambienceAudio");
      const b = document.getElementById("ambience");
      return a && !a.paused && b.getAttribute("aria-pressed") === "true";
    },
    { timeout }
  );
}

async function waitForStop(page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const a = document.getElementById("ambienceAudio");
      const b = document.getElementById("ambience");
      return a && a.paused && b.getAttribute("aria-pressed") === "false";
    },
    { timeout }
  );
}

const local = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const localLog = watch(local, "local");
await local.goto(LOCAL, { waitUntil: "networkidle", timeout: 90000 });
await local.waitForTimeout(7000);

const initial = await snapshot(local);
const preloadRequests = await local.evaluate(() =>
  performance.getEntriesByType("resource").filter((e) => e.name.includes(".mp3")).map((e) => e.name)
);

await local.locator("#ambience").click();
await waitForPlayback(local);
await local.waitForTimeout(1900);
const started = await snapshot(local);

await local.locator("#ambience").click();
const stoppingUI = await snapshot(local);
await waitForStop(local);
await local.waitForTimeout(250);
const stopped = await snapshot(local);

// Seven fast clicks, starting from off: should finish on with exactly one audible playback.
for (let i = 0; i < 7; i++) {
  await local.locator("#ambience").click();
  await local.waitForTimeout(80);
}
await waitForPlayback(local);
await local.waitForTimeout(1900);
const afterRapidOn = await snapshot(local);

await local.locator("#ambience").click();
await waitForStop(local);
await local.waitForTimeout(250);
const afterRapidOff = await snapshot(local);

// Four fast clicks from off should finish off without stray audio.
for (let i = 0; i < 4; i++) {
  await local.locator("#ambience").click();
  await local.waitForTimeout(80);
}
await local.waitForTimeout(1800);
const afterEvenRapid = await snapshot(local);

// Recover to an on state for a visual header check.
await local.locator("#ambience").click();
await waitForPlayback(local);
await local.waitForTimeout(1700);
await local.screenshot({
  path: "C:/Users/nisho/AppData/Local/Temp/opencode/shots/ambience-desktop-header.png",
  clip: { x: 900, y: 0, width: 540, height: 90 },
});

const results = {
  initial,
  preloadRequests,
  started,
  stoppingUI,
  stopped,
  afterRapidOn,
  afterRapidOff,
  afterEvenRapid,
  errors: localLog.errors,
  warnings: localLog.warnings,
};

// Loading/playback error handling: abort the MP3 request, confirm UI reverts and a toast appears.
const errPage = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errLog = watch(errPage, "error-path");
await errPage.route("**/audio/rizzlas-c418.mp3*", (route) => route.abort());
await errPage.goto(LOCAL, { waitUntil: "networkidle", timeout: 90000 });
await errPage.waitForTimeout(7000);
await errPage.locator("#ambience").click();
await errPage.waitForTimeout(2200);
const errorState = await errPage.evaluate(() => {
  const btn = document.getElementById("ambience");
  const audio = document.getElementById("ambienceAudio");
  const toast = document.getElementById("toast");
  return {
    ariaPressed: btn.getAttribute("aria-pressed"),
    isOn: btn.classList.contains("is-on"),
    paused: audio?.paused,
    volume: audio?.volume,
    toastVisible: toast?.classList.contains("is-visible"),
    toastText: document.getElementById("toastText")?.textContent,
  };
});

// Retrying after a transient network failure should recover.
await errPage.unroute("**/audio/rizzlas-c418.mp3*");
await errPage.locator("#ambience").click();
await waitForPlayback(errPage, 30000);
await errPage.waitForTimeout(1800);
const retryState = await snapshot(errPage);
await errPage.close();

results.errorPath = { ...errorState, errors: errLog.errors, warnings: errLog.warnings };
results.retryAfterError = retryState;
results.localErrors = localLog.errors;
results.localWarnings = localLog.warnings;

// Desktop/tablet/mobile header layout check.
const layouts = {};
for (const [name, viewport] of Object.entries({
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
})) {
  const p = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await p.goto(LOCAL, { waitUntil: "networkidle", timeout: 90000 });
  await p.waitForTimeout(5000);
  layouts[name] = await snapshot(p);
  await p.screenshot({
    path: `C:/Users/nisho/AppData/Local/Temp/opencode/shots/ambience-${name}-header.png`,
    clip: { x: 0, y: 0, width: viewport.width, height: 100 },
  });
  await p.close();
}
results.layouts = layouts;

// Deployed build: verify the same playback path over the public tunnel.
const pub = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const pubLog = watch(pub, "public");
await pub.goto(PUBLIC, { waitUntil: "networkidle", timeout: 90000 });
await pub.waitForTimeout(7000);
const publicInitial = await snapshot(pub);
await pub.locator("#ambience").click();
await waitForPlayback(pub, 45000);
await pub.waitForTimeout(2000);
const publicStarted = await snapshot(pub);
await pub.locator("#ambience").click();
await waitForStop(pub, 15000);
await pub.waitForTimeout(300);
const publicStopped = await snapshot(pub);
results.public = {
  initial: publicInitial,
  started: publicStarted,
  stopped: publicStopped,
  errors: pubLog.errors,
  warnings: pubLog.warnings,
};

console.log(JSON.stringify(results, null, 2));
await browser.close();
