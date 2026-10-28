# NOTICE — third-party rights and removed assets

This project started from a publicly available portfolio template. This notice
records what that means for anyone who clones, deploys, or audits the repository.

## 1. Template licence (PPL v1.0)

- **Original author:** Moncy Yohannan — https://www.moncy.dev/
- **Licence:** Personal Portfolio License (PPL) v1.0 — see `LICENSE`.
- **Copyright:** (c) 2026 Moncy Yohannan.

The licence allows studying the code and using small portions for personal
learning. It **does not** allow:

- copying, replicating, or cloning the full website/design/experience,
- commercial use or client work,
- re-uploading or redistributing the project,
- creating tutorials or courses from the exact project,
- using any original assets (3D models, avatar, visuals).

**If you intend to use this repository commercially, the PPL does not grant you
that right.** Contact the original author or replace the derived template with a
permissively licensed base before deploying commercially.

Attribution required by the licence: “Moncy Yohannan”, linked to the original
source.

## 2. Proprietary 3D assets — removed, not included

The template's hero avatar and its environment map are proprietary and are
**not** part of the PPL grant. They were deleted from this project.

Removed and not redistributed:

| Asset | Type | Status |
| --- | --- | --- |
| `character.enc` | encrypted 3D avatar (AES) | Deleted |
| `character_decoded.glb` | decrypted avatar (temporary test artifact) | Deleted |
| `character.glb` | placeholder avatar file | Deleted |
| `char_enviorment.hdr` | HDR environment map | Deleted |
| `public/models/`, `public/draco/` | model + decoder directories | Deleted |

No copy of these files exists in this repository, in `dist/`, or in Git
history (the project was never committed). Any attempt to extract them from the
original live site is prohibited by the original licence.

The project also does **not** use the original logo, brand name, copy, or social
links.

### Build-level protection

`vite.config.ts` defines the `sadok:guard-proprietary-assets` plugin. It walks
`public/` before the build and `dist/` after it, and **fails the build** if any of
these extensions are found:

```
.enc  .hdr  .glb  .gltf  .fbx  .vrm
```

This is intentional. It prevents the proprietary avatar or environment map from
being reintroduced by accident (for example, by copying files from the reference
folder). Do not disable it to "make a build pass".

## 3. What is original to this project

- The `SADOK // AURA-9` 3D scene (`src/components/Character/`) is generated
  procedurally in code. It contains no third-party model, texture, or HDR file.
- All Arabic copy, the identity, the palette, the layout, and the component
  structure were written for this project.
- The three project preview images (`public/previews/*.svg`) are original
  abstract SVG illustrations, labelled "ILLUSTRATIVE PREVIEW". They are not
  screenshots of the live projects.
- The word-based Arabic text splitter, the GSAP entrance/reveal utilities, and
  the licence guard plugin were written for this project.

## 4. Third-party software

| Package | Licence |
| --- | --- |
| React, React DOM | MIT |
| Vite | MIT |
| TypeScript | Apache-2.0 |
| Three.js | MIT |
| GSAP | Standard "no charge" licence for the core + ScrollTrigger (no Club plugins used) |
| react-icons | MIT (icon sets carry their own licences) |
| IBM Plex Sans Arabic, Space Grotesk | SIL Open Font License (served via Google Fonts) |

No GSAP Club/trial plugin is installed. The former `gsap-trial` dependency and
its trial-only `ScrollSmoother`/`SplitText` imports were removed so the
production build carries no trial warning and no trial-licence exposure.

## 5. Project content and links

- Project names, descriptions, and links refer to SADOK's own public
  repositories under https://github.com/sadeg356L.
- The contact email in `src/data/content.ts` was taken from SADOK's own
  published site and is documented there as replaceable.
- `NAWAH` (Volt Arc Portfolio) is described in the UI as built on an MIT
  template. That attribution is intentional.

## 6. Questions

For rights to the original template or its avatar, contact the original author
via https://www.moncy.dev/. For anything specific to this repository, open an
issue on https://github.com/sadeg356L.
