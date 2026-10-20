# NISHOK-SMP

A cinematic Minecraft-inspired landing page with a real-time procedural voxel world.

## Run it

Double-click **`start.bat`**, or from this folder run:

```powershell
npm install
npm start
```

`npm start` opens <http://127.0.0.1:5173/> automatically. Use `npm run dev` if you do not want the browser to open.

## Build

```powershell
npm run build
npm run preview
```

The production build is written to `dist/`.

## Interactions

- **World** — scroll to fly the camera through the voxel island.
- **Modes** — select Survival, Creative, Hardcore, or BedWars.
- **BedWars blast** — fire the particle explosion from the BedWars card.
- **Sky** — switch dawn / noon / dusk / night; the 3D scene and palette transition with you.
- **Netherite squad** — four glowing trim-armored players raise their swords as the join section scrolls into view.
- **Sword cursor** — a pixel diamond sword follows the pointer and does a smooth 360° turn on every click.
- **Join** — click the IP button to copy `nishok-smp.mc.fun`.
- **Ambience** — toggle the generated ambient soundscape in the header.
- **Menu** — available on tablet and mobile sizes.

## Tech

- Vite
- Three.js (procedural voxel world, bloom, custom water and sky shaders)
- GSAP + ScrollTrigger
- Lenis smooth scrolling
- Playwright QA scripts in `scripts/`

## Notes

NISHOK-SMP is a fan-made concept and is not affiliated with Mojang or Microsoft.
