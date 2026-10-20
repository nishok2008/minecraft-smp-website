import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/* ══════════════════════════════════════════════════════════════
   NISHOK-SMP — procedural voxel world
   ══════════════════════════════════════════════════════════════ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};
const damp = (rate, dt) => 1 - Math.exp(-rate * dt);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix, iy, seed) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise2(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function fbm(x, y, seed, octaves = 3) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, y * freq, seed + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/* ── Palettes ────────────────────────────────────────────────── */

const PALETTES = {
  dawn: {
    top: "#33456f", horizon: "#ffbf95", fog: "#9b858f", sun: "#ffd8b0",
    sunIntensity: 3.0, hemiSky: "#ffe0c2", hemiGround: "#55483a", hemiIntensity: 1.05,
    ambient: 0.4, stars: 0.06, exposure: 1.1, fireflies: 0.15, torch: 10,
    cloud: "#f7e1d4", sunPos: [-0.3, 0.18, -0.94], sunScale: 30, glow: 0.7,
    waterDeep: "#22576a", waterShallow: "#63b8c1",
  },
  noon: {
    top: "#4383c6", horizon: "#d5ecf9", fog: "#aecbd8", sun: "#fff8e6",
    sunIntensity: 3.5, hemiSky: "#e4f2ff", hemiGround: "#56623f", hemiIntensity: 1.4,
    ambient: 0.48, stars: 0, exposure: 1.1, fireflies: 0, torch: 2,
    cloud: "#ffffff", sunPos: [-0.1, 0.8, -0.6], sunScale: 22, glow: 0.35,
    waterDeep: "#1a7893", waterShallow: "#62d0da",
  },
  dusk: {
    top: "#232b5c", horizon: "#ff9466", fog: "#745763", sun: "#ffc28c",
    sunIntensity: 2.9, hemiSky: "#ffc9a0", hemiGround: "#42332d", hemiIntensity: 1.0,
    ambient: 0.36, stars: 0.22, exposure: 1.12, fireflies: 0.45, torch: 14,
    cloud: "#f8d7c3", sunPos: [-0.3, 0.12, -0.95], sunScale: 30, glow: 0.9,
    waterDeep: "#1e5368", waterShallow: "#58b0bd",
  },
  night: {
    top: "#040814", horizon: "#1a2745", fog: "#0e1828", sun: "#c8d8ff",
    sunIntensity: 0.95, hemiSky: "#3a5380", hemiGround: "#0e1418", hemiIntensity: 0.55,
    ambient: 0.22, stars: 0.95, exposure: 1.18, fireflies: 1, torch: 30,
    cloud: "#6b7690", sunPos: [0.4, 0.55, -0.7], sunScale: 20, glow: 0.45,
    waterDeep: "#0a2233", waterShallow: "#215066",
  },
};

const PALETTE_KEYS = ["top", "horizon", "fog", "sun", "hemiSky", "hemiGround", "cloud", "waterDeep", "waterShallow"];

const TYPE_COLORS = {
  grass: "#855c3b",
  dirt: "#855c3b",
  stone: "#767b80",
  stoneDark: "#63686c",
  sand: "#ddc993",
  path: "#b39464",
  plank: "#b08854",
  plankDark: "#946e44",
  log: "#755332",
  roof: "#a84a3c",
  roofDark: "#8c3c32",
  leaves1: "#478b3a",
  leaves2: "#569d45",
  leaves3: "#3b7831",
};

const CAM_KEYS = [
  { pos: [46, 20, 62], target: [-12, 5, 0], fov: 40 },
  { pos: [44, 24, 64], target: [0, 5, 0], fov: 36 },
  { pos: [-46, 26, 48], target: [0, 4, 0], fov: 38 },
  { pos: [12, 34, 78], target: [0, 10, 0], fov: 45 },
  { pos: [38, 22, 56], target: [0, 7, 0], fov: 40 },
];

const TORCH_SPOTS = [
  [-1.2, 6, 8.1], [6.4, 6, 8.1], [13.2, 6, 8.1],
  [7.1, 6, 14.4], [1.6, 6, 15.2],
  [13.2, 6, 2.6], [-1.2, 6, 1.6],
  [-6.6, 2, -2.2], [-8.4, 2, -5.2],
];

/* ══════════════════════════════════════════════════════════════ */

export function createWorld({ canvas, reducedMotion = false }) {
  const isTouch = window.matchMedia("(hover: none)").matches;
  const isSmall = window.matchMedia("(max-width: 900px)").matches;
  const lowPower = isSmall || isTouch;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      stencil: false,
    });
  } catch (err) {
    return null;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 1.8);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x745763, 92, 235);

  const camera = new THREE.PerspectiveCamera(37, window.innerWidth / window.innerHeight, 0.1, 620);
  camera.position.set(46, 30, 60);

  // Camera rig shared with the scroll controller.
  const camPos = new THREE.Vector3(46, 30, 60);
  const camTarget = new THREE.Vector3(-6, 1, 0);
  const currentPos = camPos.clone();
  const currentTarget = camTarget.clone();
  const keyPosA = new THREE.Vector3();
  const keyPosB = new THREE.Vector3();
  const keyTargetA = new THREE.Vector3();
  const keyTargetB = new THREE.Vector3();
  let currentFov = 37;
  let cameraStops = [0, 0.24, 0.48, 0.72, 1];
  let progress = 0;
  let smoothProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothPointerX = 0;
  let smoothPointerY = 0;
  let introStart = 0;
  const introDuration = reducedMotion ? 0.001 : 3200;
  let started = false;
  let paused = false;

  /* ── Sky dome ─────────────────────────────────────────────── */

  const skyUniforms = {
    uTop: { value: new THREE.Color(PALETTES.dusk.top) },
    uHorizon: { value: new THREE.Color(PALETTES.dusk.horizon) },
    uSunColor: { value: new THREE.Color(PALETTES.dusk.sun) },
    uSunDir: { value: new THREE.Vector3(...PALETTES.dusk.sunPos).normalize() },
    uGlow: { value: PALETTES.dusk.glow },
  };

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(230, 32, 20),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: skyUniforms,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        uniform vec3 uTop;
        uniform vec3 uHorizon;
        uniform vec3 uSunColor;
        uniform vec3 uSunDir;
        uniform float uGlow;
        void main() {
          vec3 d = normalize(vDir);
          float h = smoothstep(-0.24, 0.02, d.y);
          vec3 col = mix(uHorizon, uTop, h);
          float sun = max(dot(d, normalize(uSunDir)), 0.0);
          col += uSunColor * pow(sun, 16.0) * 0.6 * uGlow;
          col += uSunColor * pow(sun, 3.0) * 0.1 * uGlow;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    })
  );
  sky.renderOrder = -100;
  sky.frustumCulled = false;
  scene.add(sky);

  /* ── Stars ────────────────────────────────────────────────── */

  const starCount = lowPower ? 380 : 900;
  const starPos = new Float32Array(starCount * 3);
  const starRng = mulberry32(77);
  for (let i = 0; i < starCount; i++) {
    const theta = starRng() * Math.PI * 2;
    const y = starRng() * 0.95 + 0.03;
    const r = Math.sqrt(1 - y * y);
    starPos[i * 3] = Math.cos(theta) * r * 200;
    starPos[i * 3 + 1] = y * 200;
    starPos[i * 3 + 2] = Math.sin(theta) * r * 200;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0xdfe8ff,
    size: 0.85,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -90;
  scene.add(stars);

  /* ── Sun / moon sprite ────────────────────────────────────── */

  function radialTexture(inner = 0.14, mid = 0.4) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(inner, "rgba(255,255,255,0.95)");
    g.addColorStop(mid, "rgba(255,255,255,0.28)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const sunSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialTexture(0.1, 0.32),
      color: new THREE.Color(PALETTES.dusk.sun),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
  );
  sunSprite.scale.setScalar(34);
  sunSprite.renderOrder = -80;
  scene.add(sunSprite);

  /* ── Lights ───────────────────────────────────────────────── */

  const hemi = new THREE.HemisphereLight(0xffc9a0, 0x42332d, 1.0);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.36);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffc28c, 2.9);
  sun.position.set(-45, 26, -36);
  sun.castShadow = !lowPower;
  if (!lowPower) {
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 170;
    sun.shadow.camera.left = -40;
    sun.shadow.camera.right = 40;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.06;
  }
  sun.target.position.set(0, 2, 0);
  scene.add(sun, sun.target);

  // cool rim light to carve the island out of the sky
  const rim = new THREE.DirectionalLight(0x88a8ff, 0.8);
  rim.position.set(30, 8, -48);
  scene.add(rim);

  const torchLights = [];
  const torchLightSpots = [
    [-1.2, 8, 8.1],
    [13.2, 8, 2.6],
    [-8.4, 4, -5.2],
  ];
  for (const [x, y, z] of torchLightSpots) {
    const light = new THREE.PointLight(0xffa45e, 0, 15, 2);
    light.position.set(x, y, z);
    scene.add(light);
    torchLights.push(light);
  }

  /* ── Voxel world generation ───────────────────────────────── */

  const blocks = new Map();
  const caps = new Map();
  const glowEntries = [];
  const postEntries = [];
  const crystals = [];
  const heights = new Map();

  const key = (x, y, z) => `${x}|${y}|${z}`;
  const colKey = (x, z) => `${x}|${z}`;

  function setBlock(x, y, z, type) {
    blocks.set(key(x, y, z), { x, y, z, type });
  }
  function delBlock(x, y, z) {
    blocks.delete(key(x, y, z));
  }
  function setCap(x, y, z) {
    caps.set(key(x, y, z), { x, y, z });
  }
  function clearCap(x, z, fromY = -10, toY = 40) {
    for (let y = fromY; y <= toY; y++) caps.delete(key(x, y, z));
  }
  function addGlow(x, y, z, color = "#ffc978", scale = 1, intensity = 2.4) {
    glowEntries.push({ x, y, z, color, scale, intensity });
  }
  function addTorch(x, z, groundY) {
    postEntries.push({ x, y: groundY + 0.62, z });
    addGlow(x, groundY + 0.9, z, "#ffb45e", 0.24, 2.8);
  }

  /* Path distance */
  const PATH = [
    [13, 15], [11, 11], [8, 8], [4, 8], [1, 7], [-3, 4], [-6, 0], [-8, -4],
  ];
  const pathCols = new Set();

  function distToSegment(px, pz, ax, az, bx, bz) {
    const abx = bx - ax;
    const abz = bz - az;
    const apx = px - ax;
    const apz = pz - az;
    const t = clamp((apx * abx + apz * abz) / (abx * abx + abz * abz || 1), 0, 1);
    return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
  }
  function distToPath(x, z) {
    let d = Infinity;
    for (let i = 0; i < PATH.length - 1; i++) {
      d = Math.min(d, distToSegment(x, z, PATH[i][0], PATH[i][1], PATH[i + 1][0], PATH[i + 1][1]));
    }
    return d;
  }

  const FLAT_ZONES = [
    { x0: -2, x1: 6, z0: 0, z1: 7 },
    { x0: 7, x1: 13, z0: 1, z1: 7 },
    { x0: 1, x1: 8, z0: 9, z1: 14 },
  ];
  const inFlatZone = (x, z) => FLAT_ZONES.some((f) => x >= f.x0 && x <= f.x1 && z >= f.z0 && z <= f.z1);

  const R = 23;
  for (let x = -R; x <= R; x++) {
    for (let z = -R; z <= R; z++) {
      const dn = Math.hypot(x, z) + (noise2(x * 0.15, z * 0.15, 7) - 0.5) * 6;
      if (dn > R) continue;

      const edge = smoothstep(R, R - 9, dn);
      let h = 3.2 + fbm(x * 0.085, z * 0.085, 11, 3) * 5.6 + noise2(x * 0.31, z * 0.31, 19) * 0.9;
      h *= 0.48 + 0.52 * edge;
      h = Math.round(h);

      // Lake basin
      const ld = Math.hypot(x + 10, z + 7) + (noise2(x * 0.38, z * 0.38, 23) - 0.5) * 2.4;
      const lake = smoothstep(9.5, 5.2, ld);
      if (lake > 0) h = Math.round(lerp(h, -2.4, lake));

      // Village plateau
      const vd = Math.hypot(x - 5, z - 6);
      h = Math.round(lerp(h, 5, smoothstep(13, 7, vd)));

      // Guaranteed flat house plots
      if (inFlatZone(x, z)) h = 5;

      if (h < -3) h = -3;

      const ck = colKey(x, z);
      const isPath = distToPath(x, z) < 1.15 && h >= 0 && !inFlatZone(x, z);
      if (isPath) pathCols.add(ck);

      const topType = h <= 0 ? "sand" : "grass";
      const bottom = h - (3 + Math.round(edge * 8 + noise2(x * 0.4, z * 0.4, 41) * 3));

      for (let y = bottom; y <= h; y++) {
        let type;
        if (y === h) type = isPath ? "path" : topType;
        else if (y >= h - 2) type = topType === "sand" ? "sand" : "dirt";
        else type = hash2(x + y * 3, z - y, 3) > 0.52 ? "stoneDark" : "stone";
        setBlock(x, y, z, type);
      }

      // hanging rock spikes under the floating island
      if (dn < 17 && hash2(x, z, 77) > 0.78) {
        const spike = 1 + Math.floor(hash2(x, z, 78) * 5);
        for (let i = 1; i <= spike; i++) {
          setBlock(x, bottom - i, z, i > spike - 2 ? "stone" : "stoneDark");
        }
      }

      if (topType === "grass" && !isPath) setCap(x, h, z);
      heights.set(ck, h);
    }
  }

  /* ── Houses ───────────────────────────────────────────────── */

  function buildHouse(x0, z0, w, d, baseY, variant = 0) {
    const doorX = x0 + Math.floor(w / 2);
    for (let x = x0 - 1; x <= x0 + w; x++) {
      for (let z = z0 - 1; z <= z0 + d; z++) {
        clearCap(x, z);
        for (let y = baseY; y <= baseY + 9; y++) delBlock(x, y, z);
      }
    }
    for (let x = x0; x < x0 + w; x++) {
      for (let z = z0; z < z0 + d; z++) setBlock(x, baseY - 1, z, "plank");
    }

    for (let y = baseY; y < baseY + 3; y++) {
      for (let x = x0; x < x0 + w; x++) {
        for (let z = z0; z < z0 + d; z++) {
          const ex = x === x0 || x === x0 + w - 1;
          const ez = z === z0 || z === z0 + d - 1;
          if (!ex && !ez) continue;
          const corner = ex && ez;
          if (y === baseY && x === doorX && z === z0 + d - 1) continue;
          if (y === baseY + 1 && x === doorX && z === z0 + d - 1) continue;
          setBlock(x, y, z, corner ? "log" : "plank");
        }
      }
    }

    // windows
    const winY = baseY + 1;
    for (const wx of [x0 + 1, x0 + w - 2]) {
      if (wx !== doorX) {
        delBlock(wx, winY, z0 + d - 1);
        addGlow(wx, winY, z0 + d - 1, "#ffc37c", 1, 1.35);
      }
    }
    for (const wz of [z0 + 1, z0 + d - 2]) {
      delBlock(x0, winY, wz);
      addGlow(x0, winY, wz, "#ffc37c", 1, 1.35);
      if (w > 5) {
        delBlock(x0 + w - 1, winY, wz);
        addGlow(x0 + w - 1, winY, wz, "#ffc37c", 1, 1.35);
      }
    }

    // interior warm light
    addGlow(x0 + Math.floor(w / 2), baseY + 1, z0 + Math.floor(d / 2), "#ffb45e", 0.5, 0.9);

    // stepped roof
    for (let x = x0 - 1; x <= x0 + w; x++) {
      for (let z = z0 - 1; z <= z0 + d; z++) {
        setBlock(x, baseY + 3, z, variant === 1 ? "roofDark" : "roof");
      }
    }
    for (let x = x0; x < x0 + w; x++) {
      for (let z = z0; z < z0 + d; z++) {
        setBlock(x, baseY + 4, z, "roofDark");
      }
    }
    for (let x = x0 + 1; x < x0 + w - 1; x++) {
      for (let z = z0 + 1; z < z0 + d - 1; z++) {
        setBlock(x, baseY + 5, z, "roof");
      }
    }

    // chimney
    if (variant === 0) {
      for (let y = baseY + 3; y <= baseY + 6; y++) {
        setBlock(x0 + 1, y, z0 + 1, "stone");
      }
      addGlow(x0 + 1, baseY + 6.4, z0 + 1, "#ff9d4a", 0.3, 1.8);
    }

    // porch step + torches
    setBlock(doorX, baseY - 1, z0 + d, "path");
    addTorch(x0 - 0.6, z0 + d + 0.35, baseY);
    addTorch(x0 + w + 0.4, z0 + d + 0.35, baseY);

    // interior floor light
    addTorch(doorX + 0.9, z0 + d - 0.7, baseY);
  }

  buildHouse(-1, 1, 7, 6, 6, 0);
  buildHouse(8, 2, 5, 5, 6, 1);
  buildHouse(2, 10, 6, 4, 6, 0);

  /* ── BedWars bed + blast FX ───────────────────────────────── */

  const bedGroup = new THREE.Group();
  const bedWood = new THREE.MeshLambertMaterial({ color: "#5b3020" });
  const bedSheet = new THREE.MeshLambertMaterial({ color: "#d33c45" });
  const bedBlanket = new THREE.MeshLambertMaterial({ color: "#8e1f2d" });
  const bedPillow = new THREE.MeshLambertMaterial({ color: "#f1e9d9" });
  const bedParts = [
    [3.4, 0.26, 1.9, 0, 0.13, 0, bedWood],
    [3.16, 0.3, 1.7, 0, 0.38, 0, bedSheet],
    [1.8, 0.18, 1.72, 0.6, 0.6, 0, bedBlanket],
    [0.82, 0.26, 1.5, -1.1, 0.58, 0, bedPillow],
  ];
  bedParts.forEach(([w, h, d, x, y, z, mat]) => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    part.position.set(x, y, z);
    part.castShadow = !lowPower;
    bedGroup.add(part);
  });
  for (const [x, z] of [[-1.45, -0.7], [1.45, -0.7], [-1.45, 0.7], [1.45, 0.7]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), bedWood);
    leg.position.set(x, 0.0, z);
    bedGroup.add(leg);
  }
  bedGroup.position.set(2.5, 12.0, 4.0);
  bedGroup.rotation.y = Math.PI * 0.04;
  scene.add(bedGroup);

  const blastCount = lowPower ? 34 : 96;
  const blastMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: true,
  });
  const blastMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), blastMat, blastCount);
  blastMesh.frustumCulled = false;
  blastMesh.visible = false;
  scene.add(blastMesh);

  const blastPalette = ["#ff4d5e", "#ffbd63", "#f3f0e6", "#b9f34b", "#8e1f2d", "#ff8092"];
  const blastParticles = [];
  for (let i = 0; i < blastCount; i++) {
    const particle = {
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      rot: new THREE.Euler(),
      spin: new THREE.Vector3(),
      size: 0.16 + Math.random() * 0.34,
    };
    blastParticles.push(particle);
    blastMesh.setColorAt(i, new THREE.Color(blastPalette[i % blastPalette.length]));
  }
  if (blastMesh.instanceColor) blastMesh.instanceColor.needsUpdate = true;

  const blastLight = new THREE.PointLight("#ffb36b", 0, 30, 2);
  scene.add(blastLight);
  const blastRingMat = new THREE.MeshBasicMaterial({
    color: "#ffc078",
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const blastRing = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.0, 48), blastRingMat);
  blastRing.rotation.x = -Math.PI / 2;
  blastRing.visible = false;
  scene.add(blastRing);

  const blastDummy = new THREE.Object3D();
  let blastAge = 99;
  let blastShake = 0;
  let bedRespawn = 0;
  const bedAnchor = new THREE.Vector3(2.5, 12.35, 4.0);

  function blastBed() {
    blastAge = 0;
    blastShake = 1;
    bedGroup.visible = false;
    bedRespawn = 1.55;
    blastMesh.visible = true;
    blastMat.opacity = 1;
    blastLight.position.copy(bedAnchor).add(new THREE.Vector3(0, 0.6, 0));
    blastLight.intensity = 120;
    blastRing.position.copy(bedAnchor);
    blastRing.scale.setScalar(1);
    blastRing.visible = true;
    blastRingMat.opacity = 0.95;
    blastParticles.forEach((p) => {
      p.pos.set(
        bedAnchor.x + (Math.random() - 0.5) * 1.8,
        bedAnchor.y + Math.random() * 0.8,
        bedAnchor.z + (Math.random() - 0.5) * 1.5
      );
      const power = 4.5 + Math.random() * 8.5;
      const angle = Math.random() * Math.PI * 2;
      p.vel.set(Math.cos(angle) * power, 4 + Math.random() * 9, Math.sin(angle) * power);
      p.rot.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      p.spin.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      p.size = 0.16 + Math.random() * 0.38;
    });
    updateBlastParticles(0.001);
  }

  function updateBlastParticles(dt) {
    if (bedRespawn > 0) {
      bedRespawn -= dt;
      if (bedRespawn <= 0) bedGroup.visible = true;
    }
    if (blastAge > 2.4) {
      if (blastMesh.visible) {
        blastMesh.visible = false;
        blastRing.visible = false;
        blastMat.opacity = 0;
        blastRingMat.opacity = 0;
        blastLight.intensity = 0;
      }
      return;
    }
    blastAge += dt;
    const t = blastAge;
    const fade = Math.max(0, 1 - t / 2.05);
    const pop = t < 0.08 ? t / 0.08 : 1;
    for (let i = 0; i < blastCount; i++) {
      const p = blastParticles[i];
      p.vel.y -= 16 * dt;
      p.pos.addScaledVector(p.vel, dt);
      p.rot.x += p.spin.x * dt;
      p.rot.y += p.spin.y * dt;
      p.rot.z += p.spin.z * dt;
      blastDummy.position.copy(p.pos);
      blastDummy.rotation.copy(p.rot);
      blastDummy.scale.setScalar(Math.max(0.001, p.size * fade * pop));
      blastDummy.updateMatrix();
      blastMesh.setMatrixAt(i, blastDummy.matrix);
    }
    blastMesh.instanceMatrix.needsUpdate = true;
    blastMat.opacity = Math.max(0, 1 - t / 1.95);
    blastLight.intensity = Math.max(0, 120 * (1 - t / 0.55));
    blastRingMat.opacity = Math.max(0, 0.95 * (1 - t / 1.1));
    blastRing.scale.setScalar(1 + Math.min(t / 1.0, 1) * 10);
    blastShake = Math.max(0, 1 - t / 0.7);
  }

  /* ── Dock ─────────────────────────────────────────────────── */

  for (let x = -12; x <= -7; x++) {
    for (let z = -7; z <= -3; z++) {
      if (x >= -9 || z >= -5) setBlock(x, 1, z, (x + z) % 3 === 0 ? "plankDark" : "plank");
    }
  }
  for (const [x, z] of [[-11, -6], [-11, -4], [-8, -6], [-8, -4]]) {
    for (let y = -2; y <= 0; y++) setBlock(x, y, z, "log");
  }
  addTorch(-11.2, -6.6, 2);
  addTorch(-8.2, -3.6, 2);

  /* ── Trees ────────────────────────────────────────────────── */

  const treeRng = mulberry32(912);
  const treeSpots = [
    [-14, 4, 1.15], [-12, 13, 1], [-6, 15, 1.1], [15, 10, 1.05],
    [18, 2, 1], [12, 16, 0.9], [-17, -1, 1.1], [-4, -13, 1],
    [10, -10, 1.2], [17, -7, 0.9], [0, 18, 1.05], [-17, 11, 1],
    [-15, -11, 0.9], [20, 14, 0.95], [-20, 5, 1], [-7, 19, 0.9],
    [21, -3, 1.05], [14, -14, 0.85], [-19, -7, 0.9], [6, 19, 0.85],
  ];

  function buildTree(x, z, baseY, scale) {
    const hTree = Math.round((4.4 + treeRng() * 2.2) * scale);
    for (let i = 0; i < hTree; i++) setBlock(x, baseY + i, z, "log");
    const top = baseY + hTree;
    const radius = scale > 1.05 ? 3 : 2;
    for (let dy = 0; dy <= radius + 1; dy++) {
      const rad = dy === 0 ? radius : Math.max(0, radius - Math.floor(dy * 0.9));
      for (let dx = -rad; dx <= rad; dx++) {
        for (let dz = -rad; dz <= rad; dz++) {
          if (Math.abs(dx) + Math.abs(dz) > rad + 1) continue;
          if (dx === 0 && dz === 0 && dy < 2) continue;
          if (treeRng() < 0.17) continue;
          const px = x + dx;
          const py = top - 2 + dy;
          const pz = z + dz;
          if (!blocks.has(key(px, py, pz))) {
            setBlock(px, py, pz, treeRng() < 0.42 ? "leaves2" : treeRng() < 0.5 ? "leaves3" : "leaves1");
          }
        }
      }
    }
  }

  for (const [tx, tz, ts] of treeSpots) {
    const h = heights.get(colKey(tx, tz));
    if (h === undefined || h < 0.5) continue;
    if (inFlatZone(tx, tz) || distToPath(tx, tz) < 1.6) continue;
    buildTree(tx, tz, h + 1, ts);
  }

  // A lone tree on the hill
  const hillH = heights.get(colKey(-13, 9));
  if (hillH !== undefined && hillH > 1) {
    for (let x = -15; x <= -11; x++) {
      for (let z = 7; z <= 11; z++) clearCap(x, z);
    }
    buildTree(-13, 9, hillH + 1, 1.4);
  }

  /* ── Torches ──────────────────────────────────────────────── */

  for (const [x, z] of [[13, 16], [3, 17], [-6.6, -2.2], [-8.4, -5.2]]) {
    const h = heights.get(colKey(Math.round(x), Math.round(z)));
    if (h !== undefined) addTorch(x, z, h + 1);
  }
  for (const [x, , z] of TORCH_SPOTS) {
    const h = heights.get(colKey(Math.round(x), Math.round(z)));
    if (h !== undefined) addTorch(x, z, h + 1);
  }

  /* ── Floating satellites ──────────────────────────────────── */

  function buildSatellite(cx, cy, cz, radius, seed) {
    const rng = mulberry32(seed);
    for (let x = -Math.ceil(radius); x <= Math.ceil(radius); x++) {
      for (let z = -Math.ceil(radius); z <= Math.ceil(radius); z++) {
        const d = Math.hypot(x, z) + (rng() - 0.5) * 1.1;
        if (d > radius) continue;
        const h = cy + Math.round((1 - d / radius) * 2);
        const depth = 2 + Math.round((1 - d / radius) * 2);
        for (let y = h - depth; y <= h; y++) {
          setBlock(cx + x, y, cz + z, y === h ? "grass" : y > h - 2 ? "dirt" : "stone");
        }
        if (h > cy) setCap(cx + x, h, cz + z);
      }
    }
    return { x: cx, y: cy, z: cz };
  }

  buildSatellite(-27, 9, -3, 3.4, 5);
  buildSatellite(24, -1, -16, 2.9, 9);
  buildSatellite(19, 15, 19, 2.7, 13);
  buildSatellite(-19, -4, 17, 2.4, 17);
  buildSatellite(30, 6, 9, 1.9, 23);

  /* ── Crystals ─────────────────────────────────────────────── */

  const crystalSpots = [
    [-5, 13, -3, 1.0], [9, 15, 7, 0.85], [-13, 12, 11, 0.7], [13, 11, -9, 0.9],
    [-27, 14.5, -3, 0.65], [19, 21, 19, 0.8], [24, 4, -16, 0.55], [-2, 19, 9, 0.6],
  ];
  for (const [x, y, z, s] of crystalSpots) crystals.push({ x, y, z, s, phase: Math.random() * 10 });

  /* ── Build meshes ─────────────────────────────────────────── */

  function makeBlockTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 16;
    const ctx = c.getContext("2d");
    const rng = mulberry32(31);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = Math.floor(215 + rng() * 40);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, 16, 1);
    ctx.fillRect(0, 15, 16, 1);
    ctx.fillRect(0, 0, 1, 16);
    ctx.fillRect(15, 0, 1, 16);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(1, 1, 14, 1);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return t;
  }

  const blockTexture = makeBlockTexture();
  const blockGeo = new THREE.BoxGeometry(1, 1, 1);
  const blockMat = new THREE.MeshLambertMaterial({ map: blockTexture });
  const capMat = new THREE.MeshLambertMaterial({ map: blockTexture });
  const glowMat = new THREE.MeshBasicMaterial({ toneMapped: true });

  const blockEntries = Array.from(blocks.values());
  const blockMesh = new THREE.InstancedMesh(blockGeo, blockMat, blockEntries.length);
  blockMesh.castShadow = !lowPower;
  blockMesh.receiveShadow = !lowPower;
  const dummy = new THREE.Object3D();
  const tmpColor = new THREE.Color();
  const colorCache = new Map();

  function getTypeColor(type, variation = 0) {
    if (!colorCache.has(type)) colorCache.set(type, new THREE.Color(TYPE_COLORS[type] || "#888888"));
    return colorCache.get(type).clone().multiplyScalar(1 + variation);
  }

  blockEntries.forEach((b, i) => {
    dummy.position.set(b.x + 0.5, b.y + 0.5, b.z + 0.5);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    blockMesh.setMatrixAt(i, dummy.matrix);
    const v = (hash2(b.x, b.y * 7 + b.z, 5) - 0.5) * 0.14;
    blockMesh.setColorAt(i, getTypeColor(b.type, v));
  });
  blockMesh.instanceMatrix.needsUpdate = true;
  if (blockMesh.instanceColor) blockMesh.instanceColor.needsUpdate = true;
  scene.add(blockMesh);

  // Grass caps
  const capEntries = Array.from(caps.values());
  const capGeo = new THREE.BoxGeometry(1, 0.14, 1);
  const capMesh = new THREE.InstancedMesh(capGeo, capMat, capEntries.length);
  capMesh.castShadow = !lowPower;
  capMesh.receiveShadow = !lowPower;
  const capColors = [new THREE.Color("#8fd34a"), new THREE.Color("#83c641"), new THREE.Color("#99dc52")];
  capEntries.forEach((c, i) => {
    dummy.position.set(c.x + 0.5, c.y + 1.03, c.z + 0.5);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    capMesh.setMatrixAt(i, dummy.matrix);
    capMesh.setColorAt(i, capColors[Math.floor(hash2(c.x, c.z, 9) * 3)]);
  });
  capMesh.instanceMatrix.needsUpdate = true;
  if (capMesh.instanceColor) capMesh.instanceColor.needsUpdate = true;
  scene.add(capMesh);

  // Glowing windows / torch tips
  const glowGeo = new THREE.BoxGeometry(1, 1, 1);
  const glowMesh = new THREE.InstancedMesh(glowGeo, glowMat, glowEntries.length);
  glowEntries.forEach((g, i) => {
    dummy.position.set(g.x + 0.5, g.y + 0.5, g.z + 0.5);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(g.scale);
    dummy.updateMatrix();
    glowMesh.setMatrixAt(i, dummy.matrix);
    tmpColor.set(g.color).multiplyScalar(g.intensity);
    glowMesh.setColorAt(i, tmpColor);
  });
  glowMesh.instanceMatrix.needsUpdate = true;
  if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
  scene.add(glowMesh);

  // Torch posts
  const postGeo = new THREE.BoxGeometry(0.14, 1.32, 0.14);
  const postMat = new THREE.MeshLambertMaterial({ color: 0x6b4b2e });
  const postMesh = new THREE.InstancedMesh(postGeo, postMat, postEntries.length);
  postEntries.forEach((p, i) => {
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    postMesh.setMatrixAt(i, dummy.matrix);
  });
  postMesh.instanceMatrix.needsUpdate = true;
  postMesh.castShadow = false;
  scene.add(postMesh);

  // Crystals
  const crystalGeo = new THREE.OctahedronGeometry(0.34, 0);
  const crystalMat = new THREE.MeshBasicMaterial({ color: 0xa9fff0, toneMapped: true });
  const crystalMesh = new THREE.InstancedMesh(crystalGeo, crystalMat, crystals.length);
  crystals.forEach((c, i) => {
    crystalMesh.setColorAt(i, new THREE.Color("#9ff6e2").multiplyScalar(1.5));
  });
  if (crystalMesh.instanceColor) crystalMesh.instanceColor.needsUpdate = true;
  scene.add(crystalMesh);

  /* ── Clouds ───────────────────────────────────────────────── */

  const cloudRng = mulberry32(404);
  const cloudBlocks = [];
  const clusters = lowPower ? 20 : 36;
  for (let i = 0; i < clusters; i++) {
    const angle = Math.PI * 0.56 + cloudRng() * Math.PI * 1.42;
    const rad = 46 + cloudRng() * 48;
    const cx = Math.cos(angle) * rad;
    const cz = Math.sin(angle) * rad;
    const cy = 8 + cloudRng() * 17;
    const speed = 0.2 + cloudRng() * 0.45;
    const n = 3 + Math.floor(cloudRng() * 4);
    for (let j = 0; j < n; j++) {
      cloudBlocks.push({
        ox: (cloudRng() - 0.5) * 13,
        oy: (cloudRng() - 0.5) * 1.8,
        oz: (cloudRng() - 0.5) * 7,
        sx: 2.2 + cloudRng() * 4,
        sy: 0.9 + cloudRng() * 1.1,
        sz: 1.8 + cloudRng() * 3.4,
        cx, cy, cz, speed,
      });
    }
  }
  const cloudGeo = new THREE.BoxGeometry(1, 1, 1);
  const cloudMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(PALETTES.dusk.cloud),
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const cloudMesh = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudBlocks.length);
  cloudMesh.frustumCulled = false;
  scene.add(cloudMesh);

  /* ── Water ────────────────────────────────────────────────── */

  const waterUniforms = {
    uTime: { value: 0 },
    uDeep: { value: new THREE.Color(PALETTES.dusk.waterDeep) },
    uShallow: { value: new THREE.Color(PALETTES.dusk.waterShallow) },
    uSun: { value: new THREE.Color(PALETTES.dusk.sun) },
  };
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(10.8, 48),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: waterUniforms,
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec3 vWorld;
        void main() {
          vec3 p = position;
          p.z += sin(p.x * 0.85 + uTime * 1.15) * 0.055
               + cos(p.y * 1.1 - uTime * 0.85) * 0.045;
          vec4 wp = modelMatrix * vec4(p, 1.0);
          vWorld = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uDeep;
        uniform vec3 uShallow;
        uniform vec3 uSun;
        varying vec3 vWorld;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorld);
          float fres = pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 2.2);
          float band = sin((vWorld.x + vWorld.z) * 0.6 + uTime * 0.9) * 0.5 + 0.5;
          vec3 col = mix(uDeep, uShallow, band * 0.45 + fres * 0.4);
          vec2 grid = abs(fract(vWorld.xz * 0.5) - 0.5);
          float line = smoothstep(0.42, 0.5, max(grid.x, grid.y));
          col += line * 0.055;
          float sparkle = pow(max(0.0, sin(vWorld.x * 2.7 + uTime * 1.9) * cos(vWorld.z * 2.3 - uTime * 1.3)), 22.0);
          col += uSun * sparkle * 0.16;
          gl_FragColor = vec4(col, 0.86);
        }
      `,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(-10, 0.55, -7);
  water.renderOrder = 2;
  scene.add(water);

  /* ── Fireflies ────────────────────────────────────────────── */

  const fireflyCount = lowPower ? 70 : 160;
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyBase = new Float32Array(fireflyCount * 3);
  const fireflyPos = new Float32Array(fireflyCount * 3);
  const fireflySeed = new Float32Array(fireflyCount);
  const ffRng = mulberry32(88);
  for (let i = 0; i < fireflyCount; i++) {
    const angle = ffRng() * Math.PI * 2;
    const rad = 4 + ffRng() * 20;
    const x = Math.cos(angle) * rad;
    const z = Math.sin(angle) * rad;
    const h = heights.get(colKey(Math.round(x), Math.round(z)));
    const y = (h === undefined ? 5 : h + 1) + ffRng() * 7;
    fireflyBase[i * 3] = x;
    fireflyBase[i * 3 + 1] = y;
    fireflyBase[i * 3 + 2] = z;
    fireflyPos[i * 3] = x;
    fireflyPos[i * 3 + 1] = y;
    fireflyPos[i * 3 + 2] = z;
    fireflySeed[i] = ffRng() * 100;
  }
  fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPos, 3));
  const fireflyMat = new THREE.PointsMaterial({
    map: radialTexture(0.2, 0.5),
    color: 0xd8ffa0,
    size: 0.55,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false,
  });
  const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  fireflies.renderOrder = 3;
  scene.add(fireflies);

  /* ── Post processing ──────────────────────────────────────── */

  let composer = null;
  let bloom = null;
  if (!lowPower) {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.34,
      0.55,
      0.88
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  /* ── Palette state ────────────────────────────────────────── */

  const state = {
    top: new THREE.Color(PALETTES.dusk.top),
    horizon: new THREE.Color(PALETTES.dusk.horizon),
    fog: new THREE.Color(PALETTES.dusk.fog),
    sun: new THREE.Color(PALETTES.dusk.sun),
    hemiSky: new THREE.Color(PALETTES.dusk.hemiSky),
    hemiGround: new THREE.Color(PALETTES.dusk.hemiGround),
    cloud: new THREE.Color(PALETTES.dusk.cloud),
    waterDeep: new THREE.Color(PALETTES.dusk.waterDeep),
    waterShallow: new THREE.Color(PALETTES.dusk.waterShallow),
    sunIntensity: PALETTES.dusk.sunIntensity,
    hemiIntensity: PALETTES.dusk.hemiIntensity,
    ambient: PALETTES.dusk.ambient,
    stars: PALETTES.dusk.stars,
    exposure: PALETTES.dusk.exposure,
    fireflies: PALETTES.dusk.fireflies,
    torch: PALETTES.dusk.torch,
    sunScale: PALETTES.dusk.sunScale,
    glow: PALETTES.dusk.glow,
    sunPos: new THREE.Vector3(...PALETTES.dusk.sunPos).normalize(),
  };

  const target = {
    ...state,
    top: state.top.clone(),
    horizon: state.horizon.clone(),
    fog: state.fog.clone(),
    sun: state.sun.clone(),
    hemiSky: state.hemiSky.clone(),
    hemiGround: state.hemiGround.clone(),
    cloud: state.cloud.clone(),
    waterDeep: state.waterDeep.clone(),
    waterShallow: state.waterShallow.clone(),
    sunPos: state.sunPos.clone(),
  };

  function setTimeOfDay(name) {
    const p = PALETTES[name] || PALETTES.dusk;
    for (const k of PALETTE_KEYS) target[k].set(p[k]);
    target.sunIntensity = p.sunIntensity;
    target.hemiIntensity = p.hemiIntensity;
    target.ambient = p.ambient;
    target.stars = p.stars;
    target.exposure = p.exposure;
    target.fireflies = p.fireflies;
    target.torch = p.torch;
    target.sunScale = p.sunScale;
    target.glow = p.glow;
    target.sunPos.set(...p.sunPos).normalize();
  }

  /* ── Camera rig ───────────────────────────────────────────── */

  function sampleCamera(p) {
    let i = 0;
    while (i < cameraStops.length - 2 && p > cameraStops[i + 1]) i++;
    const a = cameraStops[i];
    const b = cameraStops[i + 1];
    const raw = (p - a) / Math.max(1e-5, b - a);
    const t = smoothstep(0, 1, clamp(raw, 0, 1));
    const kA = CAM_KEYS[i] || CAM_KEYS[0];
    const kB = CAM_KEYS[i + 1] || CAM_KEYS[CAM_KEYS.length - 1];
    keyPosA.fromArray(kA.pos);
    keyPosB.fromArray(kB.pos);
    keyTargetA.fromArray(kA.target);
    keyTargetB.fromArray(kB.target);
    camPos.lerpVectors(keyPosA, keyPosB, t);
    camTarget.lerpVectors(keyTargetA, keyTargetB, t);
    const fov = lerp(kA.fov, kB.fov, t);
    return fov;
  }

  /* ── Animation loop ───────────────────────────────────────── */

  let lastFrameTime = performance.now();
  let elapsed = 0;
  let frames = 0;

  function updateClouds(dt, time) {
    cloudBlocks.forEach((b, i) => {
      let x = b.cx + b.ox + time * b.speed;
      const range = 70;
      x = ((((x + range) % (range * 2)) + range * 2) % (range * 2)) - range;
      dummy.position.set(x, b.cy + b.oy + Math.sin(time * 0.25 + i) * 0.35, b.cz + b.oz);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(b.sx, b.sy, b.sz);
      dummy.updateMatrix();
      cloudMesh.setMatrixAt(i, dummy.matrix);
    });
    cloudMesh.instanceMatrix.needsUpdate = true;
  }

  function updateCrystals(time) {
    crystals.forEach((c, i) => {
      dummy.position.set(
        c.x + Math.sin(time * 0.4 + c.phase) * 0.35,
        c.y + Math.sin(time * 0.7 + c.phase) * 0.55,
        c.z + Math.cos(time * 0.33 + c.phase) * 0.35
      );
      dummy.rotation.set(time * 0.3 + c.phase, time * 0.5 + c.phase, 0);
      dummy.scale.setScalar(c.s);
      dummy.updateMatrix();
      crystalMesh.setMatrixAt(i, dummy.matrix);
    });
    crystalMesh.instanceMatrix.needsUpdate = true;
  }

  function updateFireflies(time) {
    const arr = fireflyGeo.attributes.position.array;
    for (let i = 0; i < fireflyCount; i++) {
      const s = fireflySeed[i];
      arr[i * 3] = fireflyBase[i * 3] + Math.sin(time * 0.4 + s) * 1.6;
      arr[i * 3 + 1] = fireflyBase[i * 3 + 1] + Math.sin(time * 0.55 + s * 1.7) * 0.9;
      arr[i * 3 + 2] = fireflyBase[i * 3 + 2] + Math.cos(time * 0.36 + s * 1.3) * 1.6;
    }
    fireflyGeo.attributes.position.needsUpdate = true;
  }

  function applyPalette(dt) {
    const k = damp(1.7, dt);
    for (const keyName of PALETTE_KEYS) state[keyName].lerp(target[keyName], k);
    state.sunIntensity = lerp(state.sunIntensity, target.sunIntensity, k);
    state.hemiIntensity = lerp(state.hemiIntensity, target.hemiIntensity, k);
    state.ambient = lerp(state.ambient, target.ambient, k);
    state.stars = lerp(state.stars, target.stars, k);
    state.exposure = lerp(state.exposure, target.exposure, k);
    state.fireflies = lerp(state.fireflies, target.fireflies, k);
    state.torch = lerp(state.torch, target.torch, k);
    state.sunScale = lerp(state.sunScale, target.sunScale, k);
    state.glow = lerp(state.glow, target.glow, k);
    state.sunPos.lerp(target.sunPos, k).normalize();

    skyUniforms.uTop.value.copy(state.top);
    skyUniforms.uHorizon.value.copy(state.horizon);
    skyUniforms.uSunColor.value.copy(state.sun);
    skyUniforms.uSunDir.value.copy(state.sunPos);
    skyUniforms.uGlow.value = state.glow;

    scene.fog.color.copy(state.fog);
    scene.fog.near = lerp(86, 104, state.glow);
    scene.fog.far = lerp(220, 262, state.glow);

    hemi.color.copy(state.hemiSky);
    hemi.groundColor.copy(state.hemiGround);
    hemi.intensity = state.hemiIntensity;
    ambient.intensity = state.ambient;
    rim.intensity = lerp(0.45, 1.0, 1 - state.stars);
    sun.color.copy(state.sun);
    sun.intensity = state.sunIntensity;
    sun.position.copy(state.sunPos).multiplyScalar(80);
    renderer.toneMappingExposure = state.exposure;

    starMat.opacity = state.stars;
    stars.rotation.y = elapsed * 0.004;
    fireflyMat.opacity = state.fireflies * 0.85;

    sunSprite.position.copy(camera.position).addScaledVector(state.sunPos, 165);
    sunSprite.scale.setScalar(state.sunScale);
    sunSprite.material.color.copy(state.sun);
    sunSprite.material.opacity = lerp(0.45, 0.95, state.glow);

    cloudMat.color.copy(state.cloud);
    waterUniforms.uDeep.value.copy(state.waterDeep);
    waterUniforms.uShallow.value.copy(state.waterShallow);
    waterUniforms.uSun.value.copy(state.sun);

    torchLights.forEach((light, i) => {
      const flicker = 0.88 + Math.sin(elapsed * 7 + i * 2.1) * 0.08 + Math.sin(elapsed * 13 + i) * 0.04;
      light.intensity = state.torch * flicker;
    });

    if (bloom) bloom.strength = lerp(0.28, 0.46, state.stars);
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isSmall || isTouch ? 1.5 : 1.8));
    renderer.setSize(w, h, false);
    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      if (bloom) bloom.setSize(w, h);
    }
  }

  window.addEventListener("resize", resize);

  function render() {
    if (paused) return;
    const now = performance.now();
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;
    elapsed += dt;

    smoothProgress = lerp(smoothProgress, progress, damp(4.5, dt));
    smoothPointerX = lerp(smoothPointerX, pointerX, damp(4, dt));
    smoothPointerY = lerp(smoothPointerY, pointerY, damp(4, dt));

    const fov = sampleCamera(smoothProgress);
    currentFov = lerp(currentFov, fov, damp(3, dt));
    camera.fov = currentFov;
    camera.updateProjectionMatrix();

    const aspect = window.innerWidth / window.innerHeight;
    const mobileBoost = aspect < 0.9 ? 1.42 : aspect < 1.2 ? 1.16 : 1;
    const targetPos = camPos.clone();
    const targetLook = camTarget.clone();
    if (mobileBoost > 1) {
      const dir = targetPos.clone().sub(targetLook).multiplyScalar(mobileBoost);
      targetPos.copy(targetLook).add(dir);
      targetPos.y += 4;
      targetLook.y += 1;
    }

    if (started) {
      const t = clamp((performance.now() - introStart) / introDuration, 0, 1);
      const e = 1 - Math.pow(1 - t, 3);
      const introPos = targetPos.clone().multiplyScalar(1.5).add(new THREE.Vector3(0, 24, 0));
      const introLook = targetLook.clone().add(new THREE.Vector3(0, 4, 0));
      currentPos.lerpVectors(introPos, targetPos, e);
      currentTarget.lerpVectors(introLook, targetLook, e);
    } else {
      currentPos.copy(targetPos).multiplyScalar(1.5).add(new THREE.Vector3(0, 24, 0));
      currentTarget.copy(targetLook).add(new THREE.Vector3(0, 4, 0));
    }

    // idle drift + pointer parallax (disabled when motion is reduced)
    const motionTime = reducedMotion ? 0 : elapsed;
    const driftX = reducedMotion ? 0 : Math.sin(elapsed * 0.22) * 0.45 + smoothPointerX * 1.4;
    const driftY = reducedMotion ? 0 : Math.cos(elapsed * 0.17) * 0.3 - smoothPointerY * 0.9;

    camera.position.copy(currentPos);
    camera.lookAt(currentTarget);
    camera.translateX(driftX);
    camera.translateY(driftY);
    if (!reducedMotion) camera.rotation.z += Math.sin(elapsed * 0.13) * 0.004;
    if (blastShake > 0) {
      camera.translateX((Math.random() - 0.5) * blastShake * 0.7);
      camera.translateY((Math.random() - 0.5) * blastShake * 0.45);
      camera.rotation.z += (Math.random() - 0.5) * blastShake * 0.014;
    }

    sky.position.copy(camera.position);
    stars.position.copy(camera.position);

    applyPalette(dt);
    waterUniforms.uTime.value = motionTime;
    updateClouds(dt, motionTime);
    updateCrystals(motionTime);
    updateFireflies(motionTime);
    updateBlastParticles(dt);

    if (composer) composer.render();
    else renderer.render(scene, camera);

    if (frames === 3) canvas.classList.add("is-ready");
    frames++;
  }

  renderer.setAnimationLoop(render);

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!document.hidden) lastFrameTime = performance.now();
  });

  function startIntro() {
    if (started) return;
    started = true;
    introStart = performance.now();
  }

  function dispose() {
    renderer.setAnimationLoop(null);
    window.removeEventListener("resize", resize);
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
  }

  return {
    setProgress: (p) => {
      progress = clamp(p, 0, 1);
    },
    blastBed,
    debug: () => ({
      stops: cameraStops.slice(),
      progress: smoothProgress,
      fov: camera.fov,
      pos: camera.position.toArray(),
      target: currentTarget.toArray(),
      top: `#${state.top.getHexString()}`,
    }),
    setCameraStops: (stops) => {
      if (Array.isArray(stops) && stops.length === CAM_KEYS.length) cameraStops = stops;
    },
    setPointer: (x, y) => {
      pointerX = clamp(x, -1, 1);
      pointerY = clamp(y, -1, 1);
    },
    setTimeOfDay,
    startIntro,
    resize,
    dispose,
  };
}
