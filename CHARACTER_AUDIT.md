# CHARACTER AUDIT — SADOK vs. moncy.dev

> **Update (2026-10-28, later the same day):** AURA-9 has been retired and
> replaced by the original procedural human bust **SADOK // VESPER**
> (`buildCharacter.ts` + `buildHead` / `buildEyes` / `buildHair` / `buildBody`).
> `buildCore.ts` was deleted. The audit below is kept as the pre-replacement
> record; VESPER's measurements are in `TEST_REPORT.md` §7.

**Date:** 2026-10-28
**Scope:** the 3D element rendered in `C:\Users\TPC\Downloads\portfolio`
compared with the 3D avatar used by `https://www.moncy.dev/`.
**Method:** source inspection, runtime module test, live mouse test, network
capture, WebGL matrix capture, licence review.
**No assets were deleted, decrypted, extracted, or replaced during this audit.**

---

## 0. Answer in one paragraph

**The project does not contain a character.** It renders an original, abstract,
fully procedural WebGL artifact called **AURA-9** (icosahedron core, wire shell,
three rings, three satellites, particles, glow sprite). There is **no model
file**, **no GLTFLoader**, **no skeleton**, **no bones**, **no head**, **no eyes**,
and **no animation clips**. The moncy.dev avatar is a different, proprietary
humanoid model that exists only in the separate reference folder as an encrypted
`character.enc`. It is **not** in this project, and its licence does **not**
allow reuse. The mouse moves the artifact's group (tilt + lateral shift), while
the camera stays fixed.

---

## 1. The component that renders the 3D element

| Layer | File | Role |
| --- | --- | --- |
| Wrapper | `src/components/Character/index.tsx` | Imports and renders `Scene` |
| Scene component | `src/components/Character/Scene.tsx` | Creates renderer, camera, lights, mounts canvas, runs the loop |
| Geometry | `src/components/Character/utils/buildCore.ts` | Builds the AURA-9 artifact from Three.js primitives |
| Lighting | `src/components/Character/utils/lighting.ts` | Five lights authored in code |
| Styles | `src/components/Character/Character.css` | Container, canvas, caption, fallback |

`Scene.tsx` creates the renderer at lines 27–31, the camera at lines 43–44, and
appends the canvas at lines 51–54. The GPU object is added at lines 56–58:

```ts
const lighting = buildLighting(scene);
const core = buildCore();
scene.add(core.group);
```

The page mounts exactly **one** canvas, with class `character__canvas`, inside
`.character__stage`. Verified at runtime: `canvases: 1`.

---

## 2. Model file and loading method

### In this project

**There is no model file and no loader.**

- `public/` contains only `.nojekyll`, `favicon.svg`, `og.png`, `og.svg`, and
  three preview SVGs. There is no `public/models` directory.
- A recursive search of the project (excluding `node_modules`) for
  `.enc`, `.hdr`, `.glb`, `.gltf`, `.fbx`, `.vrm` returned **zero files**.
- A search of `src/` for `GLTFLoader`, `DRACOLoader`, `three-stdlib`,
  `decryptFile`, `AnimationMixer`, `SkinnedMesh`, `Skeleton`, `Bone`,
  `AnimationClip`, `.animations`, `.bones` returned **no matches**.
- The runtime network log for the page contains only HTML, the JS/CSS bundles,
  Google Fonts, and the three preview SVGs. **No `.glb`, `.gltf`, `.enc`, or
  `.hdr` request is made.**
- The artifact is generated in memory at runtime by `buildCore()`. Its glow
  texture is drawn on a 2D canvas (`buildCore.ts:15–43`), not loaded from disk.

`vite.config.ts` also enforces this: the `sadok:guard-proprietary-assets` plugin
(`vite.config.ts:11–55`) fails the build if any of those 3D file types appears
in `public/` or `dist/`.

### In the moncy.dev reference (separate folder)

The reference lives at `C:\Users\TPC\Desktop\my website` and is **not** part of
this project.

| Item | Path | Size |
| --- | --- | --- |
| Encrypted avatar | `public/models/character.enc` | 1,537,344 bytes |
| Placeholder GLB | `public/models/character.glb` | 132 bytes (not the real avatar) |
| HDR environment | `public/models/char_enviorment.hdr` | 295,667 bytes |
| Encryption helper | `public/models/encrypt.cjs` | shows AES password-based encryption |

Loading method (`src/components/Character/utils/character.ts:11–23`):

1. `new GLTFLoader()` + `new DRACOLoader()` with decoder path `/draco/`.
2. `decryptFile("/models/character.enc", "<hardcoded password>")`.
3. Wrap the decrypted bytes in a `Blob` and `URL.createObjectURL`.
4. `loader.load(blobUrl, ...)`, then `renderer.compileAsync(...)`.
5. After load, `setCharTimeline` and `setAllTimeline` are called, and the foot
   bones `footR` / `footL` are adjusted.

The password is present in the reference source but is **not reproduced here**,
because reproducing it would encourage extracting a protected asset.

**Conclusion:** the project does not load any character model. The reference
loads a humanoid GLB from an encrypted file via GLTFLoader + Draco.

---

## 3. Is the visible 3D object the original character?

**No.** It is not the original avatar, not a modified copy of it, and not a
humanoid model. It is a different asset created procedurally for this project.

Runtime inspection of the built group returned **10 children**:

| # | Type | Geometry | Material |
| --- | --- | --- | --- |
| 1 | Mesh | `IcosahedronGeometry` (core) | `MeshStandardMaterial` |
| 2 | Mesh | `IcosahedronGeometry` (wire shell) | `MeshBasicMaterial` |
| 3 | Mesh | `TorusGeometry` (ring 1) | `MeshBasicMaterial` |
| 4 | Mesh | `TorusGeometry` (ring 2) | `MeshBasicMaterial` |
| 5 | Mesh | `TorusGeometry` (ring 3) | `MeshBasicMaterial` |
| 6 | Mesh | `OctahedronGeometry` (satellite 1) | `MeshStandardMaterial` |
| 7 | Mesh | `OctahedronGeometry` (satellite 2) | `MeshStandardMaterial` |
| 8 | Mesh | `OctahedronGeometry` (satellite 3) | `MeshStandardMaterial` |
| 9 | Points | `BufferGeometry` (640 particles) | `PointsMaterial` |
| 10 | Sprite | `BufferGeometry` (glow) | `SpriteMaterial` |

The component even labels itself:

```tsx
// Scene.tsx:164–168
<span className="character__caption-name latin">AURA-9</span>
<span className="character__caption-meta latin">PROCEDURAL · WEBGL</span>
```

`buildCore.ts:5–6` states the same:

> An original, fully procedural WebGL artifact built from Three.js primitives.
> No external model, no downloaded texture, no licensed character asset.

The reference, by contrast, is a rigged humanoid with named head/neck/foot bones
and clips such as `introAnimation`, `Blink`, `typing`, and `browup`.

---

## 4. Head, eyes, rig, bones, animations

### This project — none

Runtime traversal of the actual `core.group`:

```json
{
  "skinnedMeshes": [],
  "bones": [],
  "namedObjects": [],
  "animations": 0
}
```

- **Head:** none. There is no head mesh and no head bone.
- **Eyes:** none. No eye geometry, no blink, no gaze.
- **Rig:** none. No armature, no `SkinnedMesh`, no `Skeleton`.
- **Bones:** none. `bones: []`.
- **Animations:** none. `group.animations.length === 0`.
- **Mouse interaction:** handled manually by rotating/translating the whole
  `THREE.Group`, not by a rig or an animation mixer.

So there is nothing in this project that can move a head or eyes, because there
is no head or eyes to move.

### moncy.dev reference — rigged humanoid (per its source)

The reference code references the following (in
`src/components/Character/` and `src/data/boneData.ts`):

| Feature | Evidence |
| --- | --- |
| Head bone | `character.getObjectByName("spine006")` — `Scene.tsx:64` |
| Neck bone | `character.getObjectByName("spine005")` — `utils/GsapScroll.ts:63` |
| Eyebrow bones | `eyebrow_L`, `eyebrow_R` — `data/boneData.ts:58` |
| Blink | `gltf.animations.find(clip => clip.name === "Blink")` — `animationUtils.ts:43` |
| Intro | `introAnimation` — `animationUtils.ts:9–15`, `35–45` |
| Idle/typing | `key1`, `key2`, `key5`, `key6`, `typing` — `animationUtils.ts:16–33` |
| Brow raise on hover | `browup` filtered to eyebrow bones — `animationUtils.ts:48–67` |
| Humanoid rig hints | finger, palm, thumb, forearm, thigh, shin, foot, toe, heel bone lists — `data/boneData.ts:1–56` |

**Limit of this check:** the reference's real avatar is encrypted. I did **not**
decrypt it, extract it, or inspect its meshes, because the licence forbids reuse
and extraction. Therefore the bone/animation names above are verified from the
reference **source code**, not from a decrypted model. I cannot honestly claim
to have visually counted its eye meshes.

---

## 5. Mouse test — what actually moves?

### 5.1 Live page test

The mouse was moved to the far left, far right, top, and bottom of the artifact's
stage on the running production preview, with 900 ms between positions.
Eight screenshots were saved:

```
shots/mouse-left-1.png   shots/mouse-right-1.png
shots/mouse-left-2.png   shots/mouse-right-2.png
shots/mouse-top-1.png    shots/mouse-bottom-1.png
shots/mouse-top-2.png    shots/mouse-bottom-2.png
shots/mouse-center.png
```

The rendered frames change with pointer position. A pure pixel-centroid
comparison is noisy because the artifact also auto-rotates around Y and its
satellites orbit continuously, so the screenshots alone cannot attribute the
change to the pointer. The attribution comes from the module test below.

### 5.2 Module-level test (exact animation code)

`buildCore()` was imported from the dev server and driven directly with fixed
`elapsed` and `delta`, so the result is not affected by the live render loop.
`delta = 1` makes damping snap to the target (the real UI eases at ~0.016 s per
frame).

| Pointer input | `group.position.x` | `group.rotation.x` | `group.rotation.y` |
| --- | --- | --- | --- |
| centre `(0, 0)` | 0 | 0 | 0 |
| left `(-1, 0)` | **−0.209** | 0 | 0.16 |
| right `(+1, 0)` | **+0.1986** | 0 | 0.32 |
| top `(0, −1)` | ~0 | **+0.22 rad** | 0.64 |
| bottom `(0, +1)` | ~0 | **−0.22 rad** | 0.80 |
| recentre `(0, 0)` | **0** | **0** | — |

(`rotation.y` keeps increasing because the artifact auto-spins at
`0.16 rad` per unit delta; that is independent of the pointer.)

The code that produces this is `buildCore.ts:217–229`:

```ts
group.rotation.y += delta * 0.16;                    // auto-spin
group.rotation.x = lerp(group.rotation.x, pointerEase.y * -0.22, damping);
group.position.x = damp(group.position.x, pointerEase.x * 0.22, 3, delta);
group.position.y = Math.sin(elapsed * 0.8) * 0.075;  // idle float
```

Pointer input also slightly rotates the rings and changes the core's emissive
intensity (`buildCore.ts:237–266`), but those are secondary effects.

### 5.3 Camera behaviour

- The camera is created once and positioned once:
  `camera.position.set(0, 0.1, 7.6)` — `Scene.tsx:43–44`.
- It is never reassigned in `onPointerMove` (`Scene.tsx:82–91`), in the render
  loop (`Scene.tsx:95–103`), or in `buildCore.ts`.
- `resize()` only updates `camera.aspect` and the projection matrix
  (`Scene.tsx:67–80`), not its position.
- There is no OrbitControls, no camera rig, and no camera animation.

**Result:** on this project, **the artifact moves (tilt + lateral offset), not
the camera.** The camera is fixed.

For comparison, in moncy.dev the mouse rotates the **head bone** `spine006`
(`utils/mouseUtils.ts:37–75`), while the **camera moves only on scroll**
(`utils/GsapScroll.ts:66–90`, camera `z` to 22 then 75). So even the reference
does not move its camera with the mouse; it moves the head. The difference is
that the reference has a head, and this project does not.

---

## 6. Licence check

### Reference licence

- `C:\Users\TPC\Desktop\my website\README.md:44–52`:
  - the original 3D avatar is **not included** in the repository,
  - it is a custom asset created over ~1 month,
  - it is **not open source and not available for reuse**,
  - any extraction or redistribution from the live site is **strictly prohibited**.
- `LICENSE:25–28`:
  - all 3D assets (avatar, models, textures, visuals) are **proprietary**,
  - they are **not part of the licence**,
  - they may not be copied, used, or redistributed without explicit permission.

### This project's licence

`LICENSE` is the same **PPL v1.0**. It also forbids commercial use and full-site
replication. See `NOTICE.md` for the full rights breakdown.

### What this means

1. The fact that `character.enc` exists in the separate reference folder does
   **not** grant permission to decrypt or reuse it.
2. Copying it into this project would violate the reference licence and is
   blocked by the build guard.
3. The current project is licence-safe **with respect to the avatar**: it does
   not contain or load it.
4. The project as a whole is still derived from a PPL template, which restricts
   commercial use. That is a separate issue and must be resolved before any
   commercial deployment.

---

## 7. What was not done

- No file in `C:\Users\TPC\Desktop\my website` was modified or deleted.
- No file in `C:\Users\TPC\Downloads\portfolio` was deleted or replaced.
- `character.enc` was **not** decrypted, extracted, or converted.
- The proprietary avatar was **not** copied into the project.
- The AURA-9 artifact was **not** replaced or hidden for this audit.

The only files created by the audit are the screenshots in `shots/mouse-*.png`
and this report.

---

## 8. Final verdict

| Question | Answer |
| --- | --- |
| Which component renders the 3D element? | `src/components/Character/Scene.tsx`, geometry from `utils/buildCore.ts` |
| Which model file? | **None.** Fully procedural in memory |
| Is it the original moncy.dev character? | **No.** It is an abstract AURA-9 artifact, not a humanoid |
| Head / eyes / rig / bones / animations? | **None** (0 skinned meshes, 0 bones, 0 animations) |
| What does the mouse move? | The artifact group: `position.x` ±0.22, `rotation.x` ±0.22 rad |
| Does the camera move? | **No.** Camera fixed at `(0, 0.1, 7.6)` |
| Is the original avatar in the project? | **No** |
| Is reusing the original avatar allowed? | **No.** Proprietary, explicitly non-reusable |

If the goal is to have the same humanoid character as moncy.dev, it cannot be
achieved by enabling or restoring anything in this project: the asset is not
here, and its licence forbids reuse. A new character would have to be authored
or licensed independently.

---

## 9. Post-audit outcome — VESPER

The audit above describes the project **before** the replacement. After it, a
new humanoid was authored from scratch, so the verdict table no longer describes
the current build:

| Question | Current answer |
| --- | --- |
| Which component renders 3D? | `Scene.tsx`, geometry from `buildCharacter.ts` |
| Model file? | **None.** Procedural in memory (no GLTFLoader) |
| Human head / eyes / lids / hair / body? | **Yes** — skull, jaw, nose, lips, ears, two eyes with iris/pupil, moving lids, brows, hair, neck, shoulders |
| Bones / skinned mesh / clips? | **None.** Direct group transforms only |
| What does the mouse move? | Head yaw ±0.46 / pitch ±0.24, plus independent eye yaw ±0.28 / pitch ±0.18; the bust itself does not translate |
| Camera | Fixed at runtime; the pointer does not move it |
| Original moncy.dev assets used? | **No** — no `.enc`, `.hdr`, `.glb`, textures or extracted data |
| AURA-9 files | `buildCore.ts` deleted; AURA-9 is no longer imported or shipped |

The new character is intentionally stylized and procedural; it is not a
photoreal scan. Measurements and interaction tests are in `TEST_REPORT.md` §7.
