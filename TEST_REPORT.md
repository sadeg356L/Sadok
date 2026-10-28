# TEST REPORT — SADOK Portfolio

**Date:** 2026-10-28
**Platform:** Windows 10 (win32), PowerShell
**Node:** v24.21.0 · **npm:** 11.19.0
**Browser:** Chrome (Playwright automation), Intel Iris Xe / ANGLE D3D11
**Project:** `C:\Users\TPC\Downloads\portfolio`

This report contains only results that were actually measured in this project.
Nothing here is copied from the old template report, and the previous claim that
the encrypted avatar was "successfully decrypted and reused" has been removed:
that asset is proprietary and was intentionally deleted.

---

## 1. Static checks

| Check | Command | Result |
| --- | --- | --- |
| TypeScript project build | `npx tsc -b` | **PASS** — 0 errors |
| ESLint | `npm run lint` | **PASS** — 0 errors, 0 warnings |
| Production build | `npm run build` | **PASS** — `tsc -b && vite build` completed |
| Dependency audit of removed trial plugins | `Select-String -Path .\src\*.*,.\package.json -Pattern 'gsap-trial\|ScrollSmoother\|SplitText'` | **PASS** — no matches |

`tsconfig.app.json` runs with `strict`, `noUnusedLocals`, and
`noUnusedParameters`, so an unused import or an untyped escape hatch fails the
build rather than being silently tolerated.

---

## 2. Build output

Last production build (`dist/`):

| Asset | Raw | Gzip |
| --- | --- | --- |
| `index.html` | 3.11 kB | 1.29 kB |
| Base CSS | 1.12 kB | 0.54 kB |
| Main CSS | 27.50 kB | 6.34 kB |
| Main JS bundle | 290.49 kB | 104.50 kB |
| Lazy character chunk (`three` + VESPER) | 543.02 kB | 141.92 kB |

The Three.js scene is lazily imported, so the 3D chunk is not part of the
initial render path. `chunkSizeWarningLimit` is set to 900 kB specifically
because the lazy WebGL chunk is expected to be large.

---

## 3. Runtime verification

Both servers were started from the project root:

- Dev: `npm run dev` → `http://localhost:5173/`
- Production preview: `npm run build`, then `npm run preview` → `http://localhost:4173/`

| Check | Dev | Preview |
| --- | --- | --- |
| Page loads, no fatal error | PASS | PASS |
| Console errors | 0 | 0 |
| Console warnings | 0 | 0 |
| `Uncaught ReferenceError: useEffect is not defined` | Not reproduced | Not reproduced |
| Hero intro completes and content becomes visible | PASS | PASS |
| All seven project/contact links resolve | PASS | PASS |
| Character chunk loads | PASS | PASS |
| Network requests for `.glb` / `.gltf` / `.hdr` / `.enc` | 0 | 0 |

The production preview was re-tested after the VESPER replacement at
`http://localhost:4173/`: 0 console messages (errors or warnings), 13 network
requests (document, two local JS chunks, two local CSS files, Google Fonts),
and no model or environment-map fetch. Everything the character needs is
generated at runtime.

The `useEffect` error was a real bug in the earlier `Work.tsx` (hook imported
from the wrong module). `Work.tsx` was rewritten; the dev console is now clean.
The old GSAP trial warning is also gone at the root: the trial-only
`ScrollSmoother`/`SplitText` packages were removed and replaced with native
scrolling, `ScrollTrigger`, and a custom Arabic-safe word splitter. The warning
was **not** suppressed with `gsap.config({ trialWarn: false })`.

> Grepping the production bundle for the word `ScrollSmoother` returns three
> hits. Those are internal `ScrollTrigger` compatibility checks in GSAP core
> (`vars.id !== "ScrollSmoother"` and a global lookup), not the plugin. No
> `gsap-trial` module and no `SplitText` code is bundled.

---

## 4. Responsive layout

Tested at 320, 768, 1440, and 1920 px wide, plus the phone viewports used for
the character (390×844 and 360×740).

| Width | Horizontal overflow | Layout |
| --- | --- | --- |
| 320 px | None (`scrollWidth === clientWidth`) | Single column, mobile menu usable |
| 360 px | None (`scrollWidth` 350) | Single column, character canvas 308×308 |
| 390 px | None (`scrollWidth` 380) | Single column, character canvas 333×333 |
| 768 px | None | 2-column skills grid, stacked projects |
| 1440 px | None | Desktop layout, 4-column skills grid |
| 1920 px | None | Desktop layout, content stays centred |

The 3D canvas is sized by its container and does not force page width. Its
framing is aspect-independent: at both phone widths the bust occupies
35.5% of the canvas with an identical bounding box
(x 0.22–0.78, y 0.07–1.0). On phones the hero copy comes first, so the
character starts around 596 px down the 844 px first screen — the whole head
and upper shoulders are visible, and the rest is one short scroll away.

Long English technology names (`TypeScript`, `React Three Fiber`,
`prefers-reduced-motion`) are allowed to wrap instead of being clipped or
hyphenated.

---

## 5. Arabic / RTL correctness

| Check | Result |
| --- | --- |
| `<html lang="ar" dir="rtl">` | PASS |
| `document.documentElement.dir` | `rtl` |
| Arabic text split into individual letters | Not done — splitting is **word-based** only |
| `letter-spacing` on Arabic text | `normal` (0 — no disconnected glyphs) |
| English tech names keep LTR order | PASS |
| Anchor navigation with fixed header | Section top lands at ~96 px vs 85 px header |

`splitText.ts` splits Arabic copy on whitespace into whole words wrapped in
`<span>` elements. It never splits a word into characters, so Arabic shaping
(`اتصال`) is preserved.

---

## 6. Accessibility

| Check | Result |
| --- | --- |
| Skip link present and focusable | PASS — jumps to main content |
| Heading hierarchy | PASS — one `h1`, sections use `h2`/`h3` |
| Colour contrast (measured) | 8.04:1 – 12.41:1 (AA/AAA for normal text) |
| Keyboard: mobile menu open/close, `Escape` closes | PASS |
| Focus visible on links and buttons | PASS |
| Custom cursor disabled on touch / small screens | PASS |
| `prefers-reduced-motion: reduce` | Intro skipped, cursor removed, all reveals shown |
| Content reachable without animation | PASS — reveals animate `opacity`, not `visibility` |
| `<noscript>` fallback with GitHub link | PASS |
| Form-free contact (no fake submission) | PASS — mailto/GitHub only |

Reveal elements below the fold start at `opacity: 0` and are revealed by
`ScrollTrigger`. This is expected behaviour, not hidden content: after scrolling
to the bottom, all 28 `[data-reveal]` elements reach `opacity: 1`. With reduced
motion enabled they are visible immediately.

---

## 7. 3D scene (WebGL) — SADOK // VESPER

The scene is an original human bust built entirely from Three.js geometry. It
does not load a model, a texture file, or an HDR map: the iris, skin, cloth, and
environment are generated in code/canvas at runtime. Pixel measurements below
come from the running canvas, not from assumptions.

**Render framing** (dev, 780×780 backing buffer, device pixel ratio 1.5):

- Non-empty canvas: 35.4% of pixels, bounding box x 0.218–0.782, y 0.069–1.000.
- Centroid x 0.499 → the bust is horizontally centred.
- Crown/hair at y≈0.069, eye line y≈0.274, chin y≈0.487, shoulders below 0.60.
- The head is ~42% of the visible height and the frame contains head + shoulders,
  not a tiny full-body figure.

**Face and materials:**

- Landmark probes: forehead `223,171,161`; right cheek `213,136,108`; shadow-side
  left cheek `175,109,114` (readable, not crushed to black); nose tip `111,46,46`
  (under-nose shadow); chin band `55,12,12` (mentolabial shadow under the lip).
- Side view (90°): nose tip protrudes ≈0.17 world units from the face plane,
  lips sit slightly proud of the chin, the ear sits behind the cheek line, and
  the jaw runs from the ear to the chin without self-intersection.
- Skin uses per-vertex colour variation; cloth is a separate violet material.

**Eyes (ray-cast visibility map):** an ID map ray-cast against the real meshes
confirmed, on both eyes, that the pupil, iris, sclera, upper lid, lower lid and
lash line are all visible through the aperture. The opening is ≈0.19 × 0.10
world units (a wide almond). The iris/pupil are visible at rest; the left inner
corner is partly overlapped by the hair fringe, and the lateral sclera reads
slightly wider than the medial sclera.

**Mouse interaction (measured with deterministic 60 fps stepping):**

| Input | Head yaw | Head pitch | Eye yaw | Eye pitch | Neck yaw |
| --- | --- | --- | --- | --- | --- |
| pointer right (1, 0) | +0.449 | −0.008 | +0.219 / +0.231 | +0.005 | +0.098 |
| pointer left (−1, 0) | −0.453 | −0.008 | −0.225 / −0.213 | +0.007 | −0.100 |
| pointer up (0, −1) | +0.012 | −0.231 | — | −0.180 | +0.003 |
| pointer down (0, 1) | −0.010 | +0.238 | — | +0.180 | −0.002 |
| recentre (0, 0) after 200 frames | +0.007 | +0.001 | −0.014 / −0.002 | −0.001 | +0.002 |

Head rotation is clamped to ±0.46 yaw / ±0.24 pitch, eyes to ±0.28 yaw /
±0.18 pitch and move independently of the head. Damping constants are 3.6
(head), 3.9 (pitch), 2.6 (neck) and 11 (eyes). The tests were driven through
the same `update()` used by the render loop because this automation tab is
background-throttled to ~1 fps; that is a test-harness artifact, not a runtime
behaviour.

**Blink:** `blink` reached 0.445 about 100 ms after triggering and returned to 0
by ~230 ms. The automatic blink is scheduled every 2.9–7.2 s with a 185 ms
close/open curve; the lids rotate −0.62 (upper) and +0.16 (lower).

**Robustness and cleanup:**

- Weak devices (`innerWidth < 680`): fewer sphere segments/lashes, no shadow
  map, pixel ratio capped at 1.5; desktop caps at 2.
- `prefers-reduced-motion`: a single static frame, no idle sway, no blinking.
- The loop pauses when the tab is hidden or the hero is out of view.
- Geometries, materials, textures, the PMREM environment, the renderer, the
  observer, and all listeners are disposed on unmount.
- WebGL failure is caught and shows the CSS fallback instead of a blank hero.
- The bottom 20% of the canvas is faded with a CSS mask so the cut-off torso
  ends softly instead of on a hard edge.

**Honest limitation:** this is a stylized procedural character, not a scanned
or sculpted human. It has no skeleton, no facial muscles, and no skin shader
with subsurface scattering. The slight eye-aperture asymmetry is visible at
large zoom, and hair is composed of geometric shells rather than strands.

---

## 8. Link verification

All links return HTTP 200 (checked directly, not assumed):

| Project | Live | Repository |
| --- | --- | --- |
| KHOTWA (Sneaker Store 3D) | 200 | 200 |
| NAWAH (Volt Arc Portfolio) | 200 | 200 |
| AUREON | 200 | 200 |
| GitHub profile / contact | 200 | — |

The project names KHOTWA, NAWAH, and AUREON are the names currently used on the
live sites. "Sneaker Store 3D" and "Volt Arc Portfolio" are kept only as
`aka` labels so the repositories remain recognisable.

---

## 9. Licence guard

`vite.config.ts` contains the `sadok:guard-proprietary-assets` plugin. It scans
`public/` at `buildStart` and `dist/` at `closeBundle` and fails the build if any
`.enc`, `.hdr`, `.glb`, `.gltf`, `.fbx`, or `.vrm` file is present.

Verified in both directions:

1. A dummy forbidden file was placed in `public/` → `npm run build` exited **1**
   with the guard message.
2. The dummy was removed → build exits **0** and output is clean.

This prevents the proprietary avatar or environment map from being reintroduced
by accident.

---

## 10. Known limitations

These are real and should be understood before publishing:

1. **Open Graph URLs point at GitHub Pages.** `og:image` and `twitter:image`
   use `https://sadeg356L.github.io/Sadok/og.png`, and the JSON-LD `url` uses the
   same origin. If the repository is renamed or a custom domain is added, update
   those URLs in `index.html`.
2. **Licence.** The repository is derived from a PPL v1.0 template, which
   forbids commercial use and full-site replication. Read `LICENSE` and
   `NOTICE.md` before deploying. This is a licensing constraint, not a bug.
3. **The character is procedural, not photoreal.** It has no skeleton or facial
   rig beyond head/eye/lid motion, and the eyes show a small medial/lateral
   aperture asymmetry at high zoom. Treat it as a stylized cinematic bust.
4. **Mobile first screen.** At 390×844 the hero copy fills the first ~596 px,
   so the character begins near the bottom of the first screen; the head is
   visible, and the lower bust needs a short scroll. Desktop shows the full
   head-and-shoulders composition without scrolling.
5. **`#approach` is not in the navigation.** The section exists between About
   and Skills; the active nav item remains "نبذة" while scrolling through it.
   This is intentional to keep the nav short, not an accessibility failure.
6. **Bundle size.** The lazy character chunk is ~543 kB raw / ~142 kB gzipped.
   It is isolated from the initial load, but a very slow connection will show
   the hero without the 3D character until the chunk arrives.

---

## 11. Reproduce these checks

```powershell
cd C:\Users\TPC\Downloads\portfolio
npm ci
npm run lint
npm run build
npm run preview
```

Then open `http://localhost:4173/`. Use DevTools → Console (expect 0 errors),
toggle "Emulate CSS media feature prefers-reduced-motion", and resize the
viewport through 320 / 768 / 1440 / 1920 px.
