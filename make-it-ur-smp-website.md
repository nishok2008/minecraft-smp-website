## Make it your SMP

This site is a template. To use it for your own SMP, change the values below. Use your editor's **Find & Replace** (in VS Code: `Ctrl+Shift+F`) and keep the HTML tags and quotation marks intact.

| What to change | Search for | Main files |
| --- | --- | --- |
| Server name | `NISHOK-SMP` | `index.html`, `package.json`, `README.md` |
| Owner / byline | `BY NISHOK` and `Nishok` | `index.html` |
| Server IP | `nishok-smp.mc.fun` | `index.html`, `src/main.js` |
| Discord invite | `data-discord` | `index.html`, `src/main.js` |
| Background music | `rizzlas-c418.mp3` | `public/audio/`, `src/main.js`, `index.html` |

### 1. Server name

Replace every occurrence of `NISHOK-SMP` with your server name, for example `BLUESKY-SMP`.

This updates:

- the browser tab title
- SEO, Open Graph, and Twitter metadata
- the preloader text
- the header and footer logos
- the footer copyright and watermark

The main file is `index.html`. You can also update the `name` and `description` fields in `package.json` and the heading in this README; those are optional and do not affect the website.

The social preview image at `public/og-image.jpg` also has the NISHOK-SMP branding baked into it. Replace it with your own 1200×630 image if you want link previews to match your server.

### 2. Owner name / “A server by …”

Turn on **Match Case** in your editor before doing these replacements:

1. Replace `BY NISHOK` with `BY YOURNAME` (the small header badge).
2. Replace `Nishok` with `YourName`.

This changes the hero line, the join section credit, and the footer byline. Keep the `<b>` tags around the name if you want the same bold styling.

### 3. Server IP

Replace `nishok-smp.mc.fun` in **all files** with your Minecraft server address:

- `index.html`: the mobile menu IP and the large IP button in the Join section
- `src/main.js`: the `SERVER_IP` constant used by the copy button
- `README.md`: update the example in the Interactions section

The visible IP and the `SERVER_IP` value must match. If your server uses a port, include it in both places, for example `play.example.com:25565`.

### 4. Discord invite

There are two Discord links: one in the Join section and one in the footer. Both currently use `data-discord` as a placeholder.

In `index.html`, change both links to your real invite:

```html
<a
  class="btn btn--ghost"
  href="https://discord.gg/YOUR_INVITE"
  target="_blank"
  rel="noopener noreferrer"
  data-magnetic
>
  ...
  <span>Join the Discord</span>
</a>
```

```html
<a href="https://discord.gg/YOUR_INVITE" target="_blank" rel="noopener noreferrer">Discord</a>
```

Remove the `data-discord` attribute from both links. Then delete the placeholder click handler in `src/main.js`:

```js
document.querySelectorAll("[data-discord]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showToast("Discord invites open with Season IV — use the server IP for now");
  });
});
```

If you leave `data-discord` on the links, that handler will continue to block navigation and show the “invites open” message.

### 5. Background music

The track is loaded from `public/audio/` and is copied into `dist/audio/` during the production build.

**Easiest option:** replace `public/audio/rizzlas-c418.mp3` with your own MP3, keeping the same filename. No code changes are needed.

**If you use a different filename:**

1. Put the file in `public/audio/`, for example `public/audio/server-theme.mp3`.
2. Update the source in `src/main.js`:

```js
ambienceAudio.src = `${import.meta.env.BASE_URL}audio/server-theme.mp3`;
```

3. Update the credit beside the ambience button in `index.html`:

```html
<span class="ambience__credit" title="Your track and license">
  Artist by Track
</span>
```

The public URL for the audio will be `/audio/server-theme.mp3`. Do not use `/public/audio/...` in the JavaScript: files in `public/` are served from the site root.

The included track is from Pixabay and is used under the Pixabay Content License. Only upload music you have permission to redistribute, and update or remove the credit if you replace the track.

### Final check

After customizing, run:

```powershell
npm install
npm run build
npm run preview
```

Then check that:

- `dist/audio/<your-file>.mp3` exists
- the ambience button plays your track
- the IP button copies your new address
- the Discord links open your invite
- the new server name appears in the header, footer, and browser tab

When deploying to Vercel, use the Vite preset with build command `npm run build` and output directory `dist`. Vercel copies `public/` into `dist/` automatically. Make sure the Vercel project is connected to the repository and branch you are pushing to. The deployed audio URL should end in `/audio/<your-file>.mp3`; a URL at the site root without `/audio/` will return 404.
