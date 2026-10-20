import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createWorld } from "./world.js";

gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const body = document.body;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

html.classList.add("js");
body.classList.add("is-loading");

const worldCanvas = document.getElementById("worldCanvas");
let world = null;
try {
  world = createWorld({ canvas: worldCanvas, reducedMotion });
  if (import.meta.env.DEV) window.__world = world;
} catch (error) {
  console.error("World failed to initialise", error);
}
if (!world) body.classList.add("no-webgl");

/* ══════════════════════════════════════════════════════════════
   TEXT SPLITTING
   ══════════════════════════════════════════════════════════════ */

function splitChars(el) {
  const nodes = Array.from(el.childNodes);
  el.textContent = "";
  const chars = [];
  const appendChars = (parent, text) => {
    for (const ch of text) {
      if (!ch.trim()) {
        parent.appendChild(document.createTextNode("\u00A0"));
        continue;
      }
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      parent.appendChild(span);
      chars.push(span);
    }
  };
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      appendChars(el, node.textContent);
    } else {
      const clone = node.cloneNode(false);
      appendChars(clone, node.textContent);
      el.appendChild(clone);
    }
  }
  return chars;
}

function wrapHeadingLines(el) {
  if (!el || el.dataset.linesWrapped === "true") return [];
  el.dataset.linesWrapped = "true";
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts
    .map(
      (part) =>
        `<span class="h-line"><span class="h-line__inner">${part.trim()}</span></span>`
    )
    .join("");
  return Array.from(el.querySelectorAll(".h-line__inner"));
}

let heroChars = [];
if (!reducedMotion) {
  document.querySelectorAll("[data-split]").forEach((el) => {
    heroChars.push(...splitChars(el));
  });
  gsap.set(heroChars, { yPercent: 118, rotateX: -88, opacity: 0 });
}

const headingLines = new Map();
if (!reducedMotion) {
  document.querySelectorAll('[data-reveal="lines"]').forEach((el) => {
    const lines = wrapHeadingLines(el);
    headingLines.set(el, lines);
    if (lines.length) {
      gsap.set(lines, { yPercent: 112 });
      gsap.set(el, { opacity: 1, y: 0, clipPath: "none" });
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   SMOOTH SCROLL
   ══════════════════════════════════════════════════════════════ */

let lenis = null;
if (!reducedMotion) {
  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.3,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ══════════════════════════════════════════════════════════════
   SCROLL PROGRESS / CAMERA STOPS / HEADER
   ══════════════════════════════════════════════════════════════ */

const header = document.getElementById("siteHeader");
const pageProgress = document.getElementById("pageProgress");
const railFill = document.getElementById("railFill");
const railPct = document.getElementById("railPct");
const sections = Array.from(document.querySelectorAll("[data-scene]"));
let lastScroll = 0;
let scrollTicking = false;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function computeCameraStops() {
  if (!world) return;
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const stops = [];
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    const anchor = top - window.innerHeight * 0.15;
    stops.push(clamp(anchor / max, 0, 1));
  });
  stops[0] = 0;
  for (let i = 1; i < stops.length; i++) {
    stops[i] = Math.max(stops[i], stops[i - 1] + 0.005);
  }
  world.setCameraStops(stops);
}

function updateScrollUI(scroll, direction = 0) {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const p = clamp(scroll / max, 0, 1);
  const pct = String(Math.round(p * 100)).padStart(3, "0");
  if (pageProgress) {
    pageProgress.style.width = `${p * 100}%`;
    pageProgress.style.opacity = scroll > 4 ? "1" : "0";
  }
  if (railFill) railFill.style.height = `${p * 100}%`;
  if (railPct) railPct.textContent = pct;
  if (world) world.setProgress(p);

  header?.classList.toggle("is-scrolled", scroll > 30);
  if (body.classList.contains("menu-open")) return;
  if (scroll > 260 && direction > 0) header?.classList.add("is-hidden");
  else if (direction < 0 || scroll < 260) header?.classList.remove("is-hidden");
}

window.addEventListener(
  "scroll",
  () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const scroll = window.scrollY;
      const direction = scroll > lastScroll ? 1 : scroll < lastScroll ? -1 : 0;
      updateScrollUI(scroll, direction);
      lastScroll = scroll;
      scrollTicking = false;
    });
  },
  { passive: true }
);

/* ══════════════════════════════════════════════════════════════
   POINTER / CURSOR
   ══════════════════════════════════════════════════════════════ */

const cursor = document.getElementById("cursor");
const cursorGlow = document.getElementById("cursorGlow");

if (finePointer) {
  html.classList.add("has-cursor");
  if (!reducedMotion) body.classList.add("has-pointer");

  const cursorX = gsap.quickTo(cursor, "x", { duration: 0.08, ease: "power3" });
  const cursorY = gsap.quickTo(cursor, "y", { duration: 0.08, ease: "power3" });
  const glowX = gsap.quickTo(cursorGlow, "x", { duration: 1.1, ease: "power3" });
  const glowY = gsap.quickTo(cursorGlow, "y", { duration: 1.1, ease: "power3" });
  const cursorRotor = cursor?.querySelector(".cursor__rotor");
  const cursorAura = cursor?.querySelector(".cursor__aura");
  const cursorTrail = cursor?.querySelector(".cursor__trail");
  const cursorStreak = cursor?.querySelector(".cursor__streak");
  const cursorDots = document.getElementById("cursorDots");
  let streakTimer = null;
  let lastPointer = null;
  let lastDot = { x: -999, y: -999, t: 0 };
  let spinToken = 0;

  window.addEventListener(
    "pointermove",
    (e) => {
      if (cursor && !cursor.classList.contains("is-visible")) {
        gsap.set([cursor, cursorGlow], { x: e.clientX, y: e.clientY });
        cursor.classList.add("is-visible");
      }
      cursorX(e.clientX);
      cursorY(e.clientY);
      glowX(e.clientX);
      glowY(e.clientY);
      if (world && !reducedMotion) {
        world.setPointer(
          (e.clientX / window.innerWidth) * 2 - 1,
          (e.clientY / window.innerHeight) * 2 - 1
        );
      }

      if (cursorStreak) {
        if (lastPointer) {
          const dx = e.clientX - lastPointer.x;
          const dy = e.clientY - lastPointer.y;
          const speed = Math.hypot(dx, dy);
          if (speed > 0.9) {
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
            cursorStreak.style.transform = `rotate(${angle}deg) scaleX(${Math.min(1.3, 0.75 + speed / 45)})`;
            cursorStreak.style.opacity = String(Math.min(0.9, 0.36 + speed / 26));
            clearTimeout(streakTimer);
            streakTimer = setTimeout(() => {
              if (cursorStreak) cursorStreak.style.opacity = "0";
            }, 200);
          }
        }
        lastPointer = { x: e.clientX, y: e.clientY };
      }

      if (cursorDots && cursor) {
        const now = performance.now();
        const cx = Number(gsap.getProperty(cursor, "x")) || e.clientX;
        const cy = Number(gsap.getProperty(cursor, "y")) || e.clientY;
        const dxd = cx - lastDot.x;
        const dyd = cy - lastDot.y;
        const dist = Math.hypot(dxd, dyd);
        const first = lastDot.x < -500;
        if (first || (now - lastDot.t > 8 && dist > 2.5)) {
          const segments = first ? 1 : Math.min(6, Math.max(1, Math.round(dist / 8)));
          for (let s = 1; s <= segments; s += 1) {
            const t = first ? 1 : s / (segments + 1);
            const px = first ? cx : lastDot.x + dxd * t;
            const py = first ? cy : lastDot.y + dyd * t;
            const dot = document.createElement("span");
            dot.className = "cursor-dot";
            dot.style.left = `${px}px`;
            dot.style.top = `${py}px`;
            if (cursorDots.childElementCount > 100) cursorDots.firstElementChild?.remove();
            cursorDots.appendChild(dot);
            gsap.fromTo(
              dot,
              { opacity: 0.95, scale: 1 },
              {
                opacity: 0,
                scale: 0.18,
                duration: 0.75,
                ease: "power2.out",
                onComplete: () => dot.remove(),
              }
            );
          }
          lastDot = { x: cx, y: cy, t: now };
        }
      }

      const interactive = e.target.closest("a, button, [data-cursor], input, label");
      cursor?.classList.toggle("is-hover", Boolean(interactive));
    },
    { passive: true }
  );

  window.addEventListener("pointerdown", () => {
    cursor?.classList.add("is-down");
    if (cursorStreak) {
      clearTimeout(streakTimer);
      cursorStreak.style.opacity = "0";
    }
    if (cursorRotor) {
      const token = ++spinToken;
      const current = Number(gsap.getProperty(cursorRotor, "rotation")) || 0;
      let target = Math.floor(current / 360) * 360;
      if (current - target < 180) target -= 360;
      gsap.killTweensOf(cursorRotor);
      gsap.to(cursorRotor, {
        rotation: target,
        duration: 0.82,
        ease: "power3.inOut",
        overwrite: "auto",
        onComplete: () => {
          if (token !== spinToken) return;
          gsap.set(cursorRotor, { rotation: 0 });
        },
      });
    }
    if (cursorTrail) {
      gsap.killTweensOf(cursorTrail);
      gsap.set(cursorTrail, { rotation: -24, scale: 0.86, opacity: 0 });
      gsap
        .timeline()
        .to(cursorTrail, { opacity: 0.95, duration: 0.07 }, 0)
        .to(cursorTrail, { rotation: -300, scale: 1.05, duration: 0.82, ease: "power2.out" }, 0)
        .to(cursorTrail, { opacity: 0, duration: 0.5, ease: "power2.in" }, 0.38);
    }
    if (cursorAura) {
      gsap.fromTo(
        cursorAura,
        { opacity: 0.68, scale: 1 },
        {
          opacity: 0,
          scale: 1.2,
          duration: 0.55,
          ease: "power2.out",
          overwrite: "auto",
          onComplete: () => gsap.set(cursorAura, { clearProps: "opacity,scale" }),
        }
      );
    }
  });
  window.addEventListener("pointerup", () => cursor?.classList.remove("is-down"));
  document.addEventListener("pointerleave", () => {
    cursor?.classList.remove("is-visible");
    if (cursorStreak) cursorStreak.style.opacity = "0";
    lastPointer = null;
  });
  document.addEventListener("pointerenter", () => {
    lastPointer = null;
    cursor?.classList.add("is-visible");
  });
}

/* ══════════════════════════════════════════════════════════════
   MAGNETIC BUTTONS + CARD TILT
   ══════════════════════════════════════════════════════════════ */

if (finePointer && !reducedMotion) {
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = el.classList.contains("ip-btn") ? 0.12 : 0.22;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * strength,
        y: (e.clientY - r.top - r.height / 2) * strength * 0.7,
        duration: 0.45,
        ease: "power3.out",
      });
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.45)" });
    });
  });

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      gsap.to(card, {
        rotateX: (0.5 - py) * 7,
        rotateY: (px - 0.5) * 9,
        y: -5,
        transformPerspective: 1000,
        transformOrigin: "center",
        duration: 0.55,
        ease: "power2.out",
      });
    });
    card.addEventListener("pointerleave", () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   SCROLL REVEALS
   ══════════════════════════════════════════════════════════════ */

function setFinalCounters() {
  document.querySelectorAll(".stat [data-count]").forEach((el) => {
    const targetValue = parseFloat(el.dataset.count || "0");
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    el.textContent = targetValue.toFixed(decimals);
  });
}

function setupReveals() {
  if (reducedMotion) {
    setFinalCounters();
    return;
  }

  document.querySelectorAll('[data-reveal="fade"]').forEach((el) => {
    if (el.closest(".hero")) return;
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(el, { opacity: 1, y: 0, duration: 1.15, ease: "power3.out" });
      },
    });
  });

  document.querySelectorAll('[data-reveal="card"]').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          delay: (i % 3) * 0.1,
        });
      },
    });
  });

  headingLines.forEach((lines, el) => {
    if (!lines.length) return;
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  document.querySelectorAll(".stat [data-count]").forEach((el) => {
    const targetValue = parseFloat(el.dataset.count || "0");
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const counter = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          v: targetValue,
          duration: 1.9,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = counter.v.toFixed(decimals);
          },
        });
      },
    });
  });
}

/* ══════════════════════════════════════════════════════════════
   PRELOADER + HERO INTRO
   ══════════════════════════════════════════════════════════════ */

const preloader = document.getElementById("preloader");
const preloaderFill = document.getElementById("preloaderFill");
const preloaderPct = document.getElementById("preloaderPct");
const preloaderStatus = document.getElementById("preloaderStatus");

function startHeroIntro() {
  if (world) world.startIntro();

  if (reducedMotion) {
    gsap.set(
      ".hero .eyebrow, .hero__sub, .hero__cta, .hero__meta, .hero__foot, .hero__hud, .splash",
      { opacity: 1, y: 0, scale: 1 }
    );
    header?.classList.remove("is-hidden");
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  tl.to(header, { opacity: 1, duration: 1, ease: "power2.out" }, 0)
    .to(".hero .eyebrow", { opacity: 1, y: 0, duration: 0.9 }, 0.05)
    .to(
      heroChars,
      {
        yPercent: 0,
        rotateX: 0,
        opacity: 1,
        duration: 1.25,
        stagger: 0.028,
        ease: "power4.out",
      },
      0.1
    )
    .fromTo(
      ".splash",
      { opacity: 0, scale: 0.5, rotate: -18 },
      { opacity: 1, scale: 1, rotate: -8, duration: 1, ease: "back.out(2.2)" },
      0.75
    )
    .to(".hero__sub", { opacity: 1, y: 0, duration: 1.05 }, 0.55)
    .to(".hero__cta", { opacity: 1, y: 0, duration: 1 }, 0.72)
    .to(".hero__meta", { opacity: 1, y: 0, duration: 0.9 }, 0.9)
    .to(".hero__hud", { opacity: 1, duration: 1.2 }, 0.6)
    .to(".hero__foot", { opacity: 1, y: 0, duration: 1 }, 0.85);

  gsap.set(".hero__hud", { opacity: 0 });
}

function revealSite() {
  if (reducedMotion) {
    preloader.style.display = "none";
    body.classList.remove("is-loading");
    startHeroIntro();
    setupReveals();
    computeCameraStops();
    updateScrollUI(window.scrollY, 0);
    setTimeout(() => ScrollTrigger.refresh(), 200);
    return;
  }

  gsap.set(header, { opacity: 0 });

  const progress = { v: 0 };
  const tl = gsap.timeline();
  tl.to(progress, {
    v: 100,
    duration: 1.9,
    ease: "power2.inOut",
    onUpdate: () => {
      const v = Math.round(progress.v);
      if (preloaderFill) preloaderFill.style.transform = `scaleX(${v / 100})`;
      if (preloaderPct) preloaderPct.textContent = `${String(v).padStart(2, "0")}%`;
      if (preloaderStatus) {
        preloaderStatus.textContent =
          v < 30
            ? "GENERATING TERRAIN"
            : v < 58
              ? "PLACING BLOCKS"
              : v < 82
                ? "LIGHTING TORCHES"
                : v < 97
                  ? "WAKING VILLAGERS"
                  : "WORLD READY";
      }
    },
  })
    .to(".preloader__content", { opacity: 0, y: -16, duration: 0.5, ease: "power2.in" }, "+=0.25")
    .to(
      ".preloader__curtain i",
      {
        yPercent: -100,
        duration: 1.05,
        ease: "power4.inOut",
        stagger: { each: 0.045, from: "start" },
      },
      "-=0.18"
    )
    .set(preloader, { display: "none" })
    .add(() => {
      body.classList.remove("is-loading");
      startHeroIntro();
      setTimeout(() => {
        computeCameraStops();
        ScrollTrigger.refresh();
      }, 100);
    }, "-=0.72");

  updateScrollUI(window.scrollY, 0);
}

setupReveals();
computeCameraStops();
requestAnimationFrame(revealSite);

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    computeCameraStops();
    ScrollTrigger.refresh();
  });
}

/* ══════════════════════════════════════════════════════════════
   NAVIGATION / MOBILE MENU
   ══════════════════════════════════════════════════════════════ */

const menu = document.getElementById("menu");
const menuBtn = document.getElementById("menuBtn");
let menuOpen = false;

function openMenu() {
  if (menuOpen) return;
  menuOpen = true;
  menu?.classList.add("is-open");
  menu?.setAttribute("aria-hidden", "false");
  menuBtn?.setAttribute("aria-expanded", "true");
  menuBtn?.setAttribute("aria-label", "Close menu");
  body.classList.add("menu-open");
  header?.classList.remove("is-hidden");
  lenis?.stop();
  setTimeout(() => menu?.querySelector("a")?.focus({ preventScroll: true }), 450);
}

function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;
  menu?.classList.remove("is-open");
  menu?.setAttribute("aria-hidden", "true");
  menuBtn?.setAttribute("aria-expanded", "false");
  menuBtn?.setAttribute("aria-label", "Open menu");
  body.classList.remove("menu-open");
  lenis?.start();
  menuBtn?.focus({ preventScroll: true });
}

menuBtn?.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuOpen) closeMenu();
});

function scrollToTarget(target) {
  if (target === null || target === undefined) return;
  if (lenis) {
    lenis.start();
    lenis.scrollTo(target, {
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
  } else {
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: reducedMotion ? "auto" : "smooth" });
    } else {
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    e.preventDefault();
    const target = href === "#top" ? 0 : document.querySelector(href);
    if (target === null) return;
    if (menuOpen) closeMenu();
    setTimeout(() => scrollToTarget(target), menuOpen ? 80 : 0);
  });
});

/* ══════════════════════════════════════════════════════════════
   TIME OF DAY
   ══════════════════════════════════════════════════════════════ */

const SKY_PRESETS = {
  dawn: { label: "Dawn", hud: "DAWN", time: 5 * 3600 + 42 * 60 + 12, accent: "#f3a878" },
  noon: { label: "Noon", hud: "NOON", time: 12 * 3600, accent: "#cfe8f7" },
  dusk: { label: "Dusk", hud: "DUSK", time: 19 * 3600 + 26 * 60 + 42, accent: "#ff8b5c" },
  night: { label: "Night", hud: "NIGHT", time: 0, accent: "#7f9bd6" },
};

let clockSeconds = SKY_PRESETS.dusk.time;
let clockTimer = null;
const timeValueEl = document.getElementById("timeValue");
const timeSecondsEl = document.getElementById("timeSeconds");
const timeLabelEl = document.querySelector(".time-readout__label");
const hudTime = document.getElementById("hudTime");
const timeButtons = Array.from(document.querySelectorAll("[data-time]"));

function formatClock(total) {
  const t = ((total % 86400) + 86400) % 86400;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return {
    hm: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    s: String(s).padStart(2, "0"),
  };
}

function renderClock() {
  const { hm, s } = formatClock(clockSeconds);
  if (timeValueEl) timeValueEl.textContent = hm;
  if (timeSecondsEl) timeSecondsEl.textContent = s;
}

function startClock() {
  if (clockTimer) return;
  renderClock();
  clockTimer = setInterval(() => {
    clockSeconds += 1;
    renderClock();
  }, 1000);
}

function selectTime(name) {
  const preset = SKY_PRESETS[name];
  if (!preset) return;
  timeButtons.forEach((btn) => {
    const active = btn.dataset.time === name;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  clockSeconds = preset.time;
  renderClock();
  if (hudTime) hudTime.textContent = preset.hud;
  if (timeLabelEl) {
    timeLabelEl.innerHTML = `Local realm time <i>—</i> ${preset.label}`;
  }
  html.style.setProperty("--sky-accent", preset.accent);
  world?.setTimeOfDay(name);

  if (!reducedMotion) {
    gsap.fromTo(
      ".time-readout__value",
      { opacity: 0.35, y: 8 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
    );
  }
}

timeButtons.forEach((btn) => {
  btn.addEventListener("click", () => selectTime(btn.dataset.time));
});
startClock();

/* ══════════════════════════════════════════════════════════════
   MODE SELECTOR
   ══════════════════════════════════════════════════════════════ */

const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
const selectedMode = document.getElementById("selectedMode");

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeButtons.forEach((b) => {
      const active = b === btn;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    if (selectedMode) {
      selectedMode.textContent = btn.dataset.mode.toUpperCase();
      selectedMode.style.color = getComputedStyle(btn).getPropertyValue("--mode-color").trim();
      if (!reducedMotion) {
        gsap.fromTo(
          selectedMode,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
        );
      }
    }
  });
});

/* ── BedWars bed blast ─────────────────────────────────────── */

const blastFlash = document.getElementById("blastFlash");
const bedwarsCard = document.querySelector(".bedwars");

document.querySelectorAll("[data-bed-blast]").forEach((btn) => {
  btn.addEventListener("click", () => {
    world?.blastBed?.();
    showToast("Bed destroyed — BedWars layer secured");
    btn.classList.add("is-fired");
    bedwarsCard?.classList.add("is-hit");
    if (blastFlash) {
      gsap.killTweensOf(blastFlash);
      if (reducedMotion) {
        gsap.fromTo(blastFlash, { opacity: 0.4 }, { opacity: 0, duration: 0.35 });
      } else {
        gsap.fromTo(blastFlash, { opacity: 0.72 }, { opacity: 0, duration: 0.8, ease: "power2.out" });
      }
    }
    const label = btn.querySelector(".bedwars__blast-label");
    if (label) {
      const original = label.textContent;
      label.textContent = "BED DESTROYED";
      setTimeout(() => {
        label.textContent = original;
      }, 1600);
    }
    setTimeout(() => {
      btn.classList.remove("is-fired");
      bedwarsCard?.classList.remove("is-hit");
    }, 650);
  });
});

/* ══════════════════════════════════════════════════════════════
   COPY IP + TOAST
   ══════════════════════════════════════════════════════════════ */

const toast = document.getElementById("toast");
const toastText = document.getElementById("toastText");
const copyLabel = document.getElementById("copyLabel");
let toastTimer = null;

function showToast(message) {
  if (!toast) return;
  if (toastText) toastText.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

const SERVER_IP = "nishok-smp.mc.fun";

document.querySelectorAll("[data-discord]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Discord invites open with Season IV — use the server IP for now");
  });
});

document.querySelectorAll("[data-copy-ip]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const ok = await copyText(SERVER_IP);
    if (!ok) {
      showToast(`Copy failed — ${SERVER_IP}`);
      return;
    }
    showToast(`Server IP copied — ${SERVER_IP}`);
    if (copyLabel) {
      copyLabel.textContent = "COPIED ✓";
      setTimeout(() => {
        copyLabel.textContent = "COPY IP";
      }, 2600);
    }
    if (!reducedMotion) {
      gsap.fromTo(
        btn,
        { scale: 1 },
        { scale: 1.02, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" }
      );
    }
  });
});

/* ══════════════════════════════════════════════════════════════
   AMBIENCE (WEB AUDIO)
   ══════════════════════════════════════════════════════════════ */

const ambienceBtn = document.getElementById("ambience");
let audioCtx = null;
let masterGain = null;
let ambienceOn = false;

function buildAmbience() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return false;
  audioCtx = new Ctx();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 480;
  filter.Q.value = 0.4;
  filter.connect(masterGain);

  const notes = [55, 82.41, 110, 164.81, 220];
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = i < 2 ? "sine" : "triangle";
    osc.frequency.value = freq;
    osc.detune.value = (i - 2) * 4;
    const g = audioCtx.createGain();
    g.gain.value = i === 0 ? 0.45 : 0.16 / (i + 1);
    osc.connect(g);
    g.connect(filter);
    osc.start();
  });

  // soft wind
  const length = Math.floor(audioCtx.sampleRate * 5);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const nf = audioCtx.createBiquadFilter();
  nf.type = "bandpass";
  nf.frequency.value = 540;
  nf.Q.value = 0.5;
  const ng = audioCtx.createGain();
  ng.gain.value = 0.05;
  noise.connect(nf);
  nf.connect(ng);
  ng.connect(masterGain);
  noise.start();

  // slow filter drift
  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  return true;
}

ambienceBtn?.addEventListener("click", async () => {
  if (!audioCtx && !buildAmbience()) return;
  if (audioCtx.state === "suspended") await audioCtx.resume();
  ambienceOn = !ambienceOn;
  const now = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setTargetAtTime(ambienceOn ? 0.07 : 0.0001, now, 1.4);
  ambienceBtn.classList.toggle("is-on", ambienceOn);
  ambienceBtn.setAttribute("aria-pressed", String(ambienceOn));
});

/* ══════════════════════════════════════════════════════════════
   NETHERITE SQUAD
   ══════════════════════════════════════════════════════════════ */

const squadRow = document.getElementById("joinSquadRow");
const warriorTemplate = document.getElementById("warriorTemplate");

if (squadRow && warriorTemplate) {
  const trims = [
    { color: "#c38bff", glow: "rgba(195, 139, 255, 0.55)", rgb: "195, 139, 255" },
    { color: "#74ffb2", glow: "rgba(116, 255, 178, 0.5)", rgb: "116, 255, 178" },
    { color: "#ffd36a", glow: "rgba(255, 211, 106, 0.5)", rgb: "255, 211, 106" },
    { color: "#ff6177", glow: "rgba(255, 97, 119, 0.5)", rgb: "255, 97, 119" },
  ];

  squadRow.replaceChildren();

  trims.forEach((trim) => {
    const warrior = warriorTemplate.content.firstElementChild.cloneNode(true);
    warrior.style.setProperty("--trim", trim.color);
    warrior.style.setProperty("--trim-glow", trim.glow);
    warrior.style.setProperty("--trim-rgb", trim.rgb);
    squadRow.appendChild(warrior);
  });

  squadRow.querySelectorAll(".warrior-wrap").forEach((warrior) => {
    warrior.setAttribute("data-cursor", "armor");
    if (finePointer) {
      warrior.addEventListener("pointerenter", () => warrior.classList.add("is-dissected"));
      warrior.addEventListener("pointerleave", () => warrior.classList.remove("is-dissected"));
    }
  });

  const squadArms = gsap.utils.toArray(".warrior__swordarm");
  const squadSwords = gsap.utils.toArray(".warrior__sword");
  const squadSweeps = gsap.utils.toArray(".warrior__sweep");

  gsap.set(squadSwords, { rotation: 158, svgOrigin: "95 101" });
  gsap.set(squadSweeps, { opacity: 0 });

  if (!reducedMotion) {
    const squadTl = gsap.timeline({
      scrollTrigger: {
        trigger: squadRow,
        start: "top 78%",
        end: "top 38%",
        scrub: 0.75,
      },
    });
    squadArms.forEach((arm, i) => {
      squadTl.to(arm, { rotation: -18, svgOrigin: "95 64", ease: "power2.inOut", duration: 1.2 }, i * 0.09);
    });
    squadSwords.forEach((sword, i) => {
      squadTl.to(
        sword,
        { rotation: 18, svgOrigin: "95 101", ease: "power3.inOut", duration: 1.4 },
        0.12 + i * 0.09
      );
    });
    squadSweeps.forEach((sweep, i) => {
      const at = 0.18 + i * 0.09;
      squadTl.to(sweep, { opacity: 0.8, duration: 0.55, ease: "power2.out" }, at);
      squadTl.to(sweep, { opacity: 0, duration: 0.55, ease: "power2.in" }, at + 0.85);
    });
  } else {
    gsap.set(squadSwords, { rotation: 18, svgOrigin: "95 101" });
    gsap.set(squadArms, { rotation: -18, svgOrigin: "95 64" });
  }

  ScrollTrigger.refresh();
}

/* ══════════════════════════════════════════════════════════════
   RESIZE / CLEANUP
   ══════════════════════════════════════════════════════════════ */

let resizeTimer = null;
window.addEventListener("resize", () => {
  world?.resize();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    computeCameraStops();
    ScrollTrigger.refresh();
  }, 220);
});

window.addEventListener("load", () => {
  computeCameraStops();
  ScrollTrigger.refresh();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    lenis?.stop();
  } else if (!menuOpen) {
    lenis?.start();
  }
});
