# REFERENCE_ANALYSIS — moncy.dev

**Purpose:** record what the reference portfolio actually does, what this project
borrowed technically, and what was deliberately replaced. This document exists so
the origin of the design decisions is honest and auditable.

- **Reference:** https://www.moncy.dev/
- **Author:** Moncy Yohannan
- **Local copy studied:** `C:\Users\TPC\Desktop\my website` (read-only reference)
- **Analysed:** 2026-10-28

---

## 1. Verified observations

These values were read from the live page and the local copy.

| Property | Value |
| --- | --- |
| Page background | `#050405` (`rgb(5, 4, 5)`) |
| Primary text | `#eae5ec` (`rgb(234, 229, 236)`) |
| Accent | `#c2a4ff` (violet), with related light `#c7a9ff` |
| Display typeface | ClashDisplay |
| Body typeface | Geist |
| Language | `lang="en"`, LTR |
| Page type | Single page with anchored sections |
| WebGL canvases | 2 |
| Main sections | landing / about / work / contact |
| Navigation | Minimal, text links, fixed header |
| Decorative elements | Two blurred circles in the navbar area (`landing-circle1`, `landing-circle2`) |
| 3D approach | A single character is the hero focal point; head follows the pointer; HDR environment lighting; Draco-compressed model |

### 3D asset pipeline in the reference

The local copy loads its avatar from an encrypted file (`character.enc`),
decrypted in the browser and parsed through GLTF + Draco, with an HDR environment
map (`char_enviorment.hdr`).

**This pipeline was not reused.** The reference repository's own README states
that the avatar is a custom asset created over roughly a month, is **not** open
source, and may not be extracted or redistributed. `LICENSE` (PPL v1.0) repeats
that all 3D assets — models, avatar, textures, visuals — are proprietary and
outside the licence.

Consequences for this project:

- `public/models`, `character.enc`, the decrypted `.glb`, and the `.hdr` were
  removed.
- The previous attempt to decrypt and reuse the avatar was abandoned. Its claims
  were deleted from the old test report.
- `vite.config.ts` now refuses to build if any `.enc`, `.hdr`, `.glb`, `.gltf`,
  `.fbx`, or `.vrm` file appears in `public/` or `dist/`.

---

## 2. What was borrowed (ideas and technique only)

- A dark, high-contrast single-page portfolio with generous negative space.
- A large display name in the hero and a minimal fixed navigation.
- A 3D element as the hero focal point instead of a static image.
- GSAP-driven entrance motion and scroll reveals.
- A custom cursor on desktop.
- Lazy-loading the 3D code so the first paint stays light.

These are common portfolio patterns. No source file, stylesheet, component, or
text was copied from the reference into this project.

---

## 3. What was intentionally changed

| Area | Reference | SADOK |
| --- | --- | --- |
| Identity | Moncy Yohannan, "Creative Developer / Designer" | SADOK, Full-Stack Developer, Tunisia |
| Language | English, LTR | Arabic, `lang="ar" dir="rtl"` |
| Palette | `#050405` / `#eae5ec` / `#c2a4ff` | Deeper violet-black `#06040a`, warmer text `#efeaf6`, accent `#b98cff` |
| Type | ClashDisplay + Geist | IBM Plex Sans Arabic + Space Grotesk |
| Hero visual | Licensed humanoid avatar | Original procedural `AURA-9` artifact (icosahedron core, wire shell, orbital rings, satellites, particles) |
| Sections | landing / about / work / contact | Hero / About / Approach / Skills / Work / Contact / Footer |
| Scroll | GSAP `ScrollSmoother` | Native scrolling (no smooth-scroll hijack) |
| Text splitting | `SplitText` | Custom word-based splitter that never breaks Arabic glyph joins |
| Skills | Percentage bars | Eight grouped skill lists, no unverifiable percentages |
| Projects | Template demo content | Three real, live projects with verifiable repos |
| Motion fallback | — | Full `prefers-reduced-motion` support; reveals animate `opacity` |
| Build safety | — | Licence guard plugin rejecting proprietary 3D file types |

The section order was also adjusted: `Approach` was added to explain working
method without inventing experience, and `Skills` became its own section instead
of being folded into "what I do".

---

## 4. What was removed from the inherited template

The starting code was the PPL-licensed template, so it shipped with several
things that had to go:

- **GSAP Club trial plugins** (`gsap-trial`, `ScrollSmoother`, `SplitText`).
  Trial builds print a console warning and are not licensed for production.
  They were replaced with GSAP core + `ScrollTrigger` and a local splitter. The
  warning was fixed at the source, **not** hidden with
  `gsap.config({ trialWarn: false })`.
- **The encrypted avatar and its HDR environment**, plus all Draco/GLTF loaders
  that existed only to serve it.
- **Unused dependencies:** react-three-fiber/drei, rapier, cannon,
  postprocessing, three-stdlib, `@gsap/react`, marquee, Vercel analytics.
- **Template sections and assets:** `WhatIDo`, `Career`, `TechStack`, `WorkImage`,
  `HoverLinks`, `boneData.ts`, old CSS, `public/images`, `public/draco`.
- **Template copy and branding**, including the original logo and social links.

Dependencies are now limited to `gsap`, `react`, `react-dom`, `react-icons`, and
`three`.

---

## 5. Deliberate divergences from the reference experience

- **No smooth-scroll hijack.** Native scrolling is more predictable, works with
  keyboard/assistive tech, and avoids the accessibility problems that come with
  transform-based scrolling.
- **No mouse-driven head tracking.** The AURA-9 artifact reacts to pointer
  position subtly, but there is no face or gaze to animate.
- **No percentage skill bars.** They imply measurement that does not exist.
- **No invented metrics.** No years-of-experience counters, client counts,
  revenue, or testimonials.
- **Honest previews.** Project cards use original SVG illustrations explicitly
  labelled "ILLUSTRATIVE PREVIEW" rather than pretending to be screenshots.

---

## 6. Items not verifiable

Marked rather than guessed:

- Exact frame-by-frame animation timings of the reference.
- Exact GSAP easing values and timeline ordering.
- Full original text of every reference section.
- Reference Lighthouse scores (not measured here).
- Whether the reference disables its custom cursor on every touch device.

Anything not listed in section 1 should be treated as unverified.

---

## 7. Conclusion

The reference supplied a genre and a technical direction: dark, cinematic,
single-page, 3D-led. The implementation here is independent: its own identity,
Arabic RTL content, its own palette and type scale, a fully procedural 3D scene,
real projects, and a licence-safe build pipeline. The proprietary avatar and
trial plugins are gone, and the build now enforces that they stay gone.
