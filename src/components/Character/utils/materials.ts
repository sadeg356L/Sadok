import * as THREE from "three";

/**
 * SADOK // VESPER — shared material library.
 *
 * Everything here is authored in code. No texture is downloaded; the only
 * textures are small canvases generated at runtime (iris, iris roughness,
 * particle sprite) and every one of them is disposed by `disposeMaterials`.
 */
export type CharacterMaterials = {
  skin: THREE.MeshPhysicalMaterial;
  skinSoft: THREE.MeshPhysicalMaterial;
  nose: THREE.MeshPhysicalMaterial;
  lip: THREE.MeshPhysicalMaterial;
  lipLine: THREE.MeshStandardMaterial;
  nostril: THREE.MeshStandardMaterial;
  innerEar: THREE.MeshStandardMaterial;
  brow: THREE.MeshStandardMaterial;
  lash: THREE.MeshStandardMaterial;
  hair: THREE.MeshPhysicalMaterial;
  hairDark: THREE.MeshStandardMaterial;
  hairAccent: THREE.MeshStandardMaterial;
  sclera: THREE.MeshPhysicalMaterial;
  iris: THREE.MeshPhysicalMaterial;
  pupil: THREE.MeshStandardMaterial;
  catchlight: THREE.MeshBasicMaterial;
  cloth: THREE.MeshPhysicalMaterial;
  clothPanel: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  glow: THREE.MeshBasicMaterial;
  arc: THREE.MeshBasicMaterial;
  particle: THREE.PointsMaterial;
};

export type MaterialBundle = {
  materials: CharacterMaterials;
  dispose: () => void;
};

function irisTexture(): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const c = 128;
  ctx.clearRect(0, 0, 256, 256);

  const base = ctx.createRadialGradient(c, c, 4, c, c, 126);
  base.addColorStop(0, "#6b4a2c");
  base.addColorStop(0.34, "#8f6436");
  base.addColorStop(0.62, "#5c7f8c");
  base.addColorStop(0.86, "#39414f");
  base.addColorStop(1, "#141019");
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(c, c, 127, 0, Math.PI * 2);
  ctx.fill();

  // Radial fibres, deterministic so the result is stable between reloads.
  let seed = 20261028;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  for (let i = 0; i < 260; i += 1) {
    const angle = (i / 260) * Math.PI * 2 + rand() * 0.02;
    const inner = 26 + rand() * 18;
    const outer = 88 + rand() * 38;
    const alpha = 0.05 + rand() * 0.22;
    const cool = rand() > 0.55;
    ctx.strokeStyle = cool
      ? `rgba(150, 196, 214, ${alpha})`
      : `rgba(196, 148, 86, ${alpha})`;
    ctx.lineWidth = 0.6 + rand() * 1.8;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(angle) * inner, c + Math.sin(angle) * inner);
    ctx.lineTo(
      c + Math.cos(angle + 0.05) * outer,
      c + Math.sin(angle + 0.05) * outer
    );
    ctx.stroke();
  }

  // Limbal ring and pupil guard.
  const ring = ctx.createRadialGradient(c, c, 96, c, c, 128);
  ring.addColorStop(0, "rgba(10, 8, 14, 0)");
  ring.addColorStop(0.78, "rgba(10, 8, 14, 0.28)");
  ring.addColorStop(1, "rgba(6, 5, 9, 0.96)");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(c, c, 127, 0, Math.PI * 2);
  ctx.fill();

  const pupil = ctx.createRadialGradient(c, c, 0, c, c, 52);
  pupil.addColorStop(0, "rgba(4, 3, 7, 1)");
  pupil.addColorStop(0.9, "rgba(6, 5, 9, 1)");
  pupil.addColorStop(1, "rgba(10, 8, 14, 0)");
  ctx.fillStyle = pupil;
  ctx.beginPath();
  ctx.arc(c, c, 54, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function particleTexture(): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(226, 208, 255, 0.95)");
  g.addColorStop(0.3, "rgba(178, 138, 255, 0.45)");
  g.addColorStop(1, "rgba(120, 70, 220, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return canvas;
}

export function createMaterials(): MaterialBundle {
  const disposables: Array<{ dispose: () => void }> = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const irisCanvas = irisTexture();
  const irisMap = irisCanvas
    ? track(new THREE.CanvasTexture(irisCanvas))
    : null;
  if (irisMap) {
    irisMap.colorSpace = THREE.SRGBColorSpace;
    irisMap.anisotropy = 4;
    irisMap.needsUpdate = true;
  }

  const particleCanvas = particleTexture();
  const particleMap = particleCanvas
    ? track(new THREE.CanvasTexture(particleCanvas))
    : null;
  if (particleMap) particleMap.colorSpace = THREE.SRGBColorSpace;

  const skin = track(
    new THREE.MeshPhysicalMaterial({
      color: 0xc78a70,
      vertexColors: true,
      roughness: 0.56,
      metalness: 0,
      clearcoat: 0.14,
      clearcoatRoughness: 0.55,
      sheen: 0.45,
      sheenColor: new THREE.Color(0xff9f84),
      sheenRoughness: 0.9,
      envMapIntensity: 0.85,
    })
  );

  const materials: CharacterMaterials = {
    skin,
    skinSoft: track(
      new THREE.MeshPhysicalMaterial({
        color: 0xc78a70,
        roughness: 0.56,
        metalness: 0,
        clearcoat: 0.14,
        clearcoatRoughness: 0.55,
        sheen: 0.45,
        sheenColor: new THREE.Color(0xff9f84),
        sheenRoughness: 0.9,
        envMapIntensity: 0.85,
        side: THREE.DoubleSide,
      })
    ),
    nose: track(
      new THREE.MeshPhysicalMaterial({
        color: 0xcf9278,
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.18,
        clearcoatRoughness: 0.5,
        sheen: 0.4,
        sheenColor: new THREE.Color(0xff9f84),
        sheenRoughness: 0.9,
        envMapIntensity: 0.9,
      })
    ),
    lip: track(
      new THREE.MeshPhysicalMaterial({
        color: 0x9b5a55,
        roughness: 0.44,
        metalness: 0,
        clearcoat: 0.45,
        clearcoatRoughness: 0.34,
        sheen: 0.5,
        sheenColor: new THREE.Color(0xffb0a4),
        envMapIntensity: 1,
      })
    ),
    lipLine: track(
      new THREE.MeshStandardMaterial({
        color: 0x3a1c22,
        roughness: 0.62,
        metalness: 0,
      })
    ),
    nostril: track(
      new THREE.MeshStandardMaterial({
        color: 0x2a1317,
        roughness: 0.8,
        metalness: 0,
      })
    ),
    innerEar: track(
      new THREE.MeshStandardMaterial({
        color: 0x8c5348,
        roughness: 0.75,
        metalness: 0,
      })
    ),
    brow: track(
      new THREE.MeshStandardMaterial({
        color: 0x17100f,
        roughness: 0.62,
        metalness: 0.05,
      })
    ),
    lash: track(
      new THREE.MeshStandardMaterial({
        color: 0x0e0a11,
        roughness: 0.5,
        metalness: 0.05,
      })
    ),
    hair: track(
      new THREE.MeshPhysicalMaterial({
        color: 0x14101c,
        roughness: 0.3,
        metalness: 0.36,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        sheen: 1,
        sheenColor: new THREE.Color(0x7d5cff),
        sheenRoughness: 0.55,
        envMapIntensity: 1.15,
        side: THREE.DoubleSide,
      })
    ),
    hairDark: track(
      new THREE.MeshStandardMaterial({
        color: 0x0c0912,
        roughness: 0.55,
        metalness: 0.2,
        side: THREE.DoubleSide,
      })
    ),
    hairAccent: track(
      new THREE.MeshStandardMaterial({
        color: 0x35206e,
        emissive: new THREE.Color(0x6a36e0),
        emissiveIntensity: 1.1,
        roughness: 0.4,
        metalness: 0.4,
      })
    ),
    sclera: track(
      new THREE.MeshPhysicalMaterial({
        color: 0xe8dfe0,
        roughness: 0.24,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        sheen: 0.25,
        sheenColor: new THREE.Color(0xffd9e2),
        envMapIntensity: 1.2,
      })
    ),
    iris: track(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: irisMap,
        side: THREE.DoubleSide,
        roughness: 0.24,
        metalness: 0.1,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.35,
      })
    ),
    pupil: track(
      new THREE.MeshStandardMaterial({
        color: 0x050307,
        side: THREE.DoubleSide,
        roughness: 0.3,
        metalness: 0,
        envMapIntensity: 0.5,
      })
    ),
    catchlight: track(
      new THREE.MeshBasicMaterial({
        color: 0xfff4ff,
        toneMapped: false,
      })
    ),
    cloth: track(
      new THREE.MeshPhysicalMaterial({
        color: 0x191a2a,
        roughness: 0.68,
        metalness: 0.12,
        clearcoat: 0.22,
        clearcoatRoughness: 0.55,
        sheen: 0.9,
        sheenColor: new THREE.Color(0x7a63c8),
        sheenRoughness: 0.6,
        envMapIntensity: 0.8,
      })
    ),
    clothPanel: track(
      new THREE.MeshStandardMaterial({
        color: 0x24243a,
        roughness: 0.52,
        metalness: 0.28,
        envMapIntensity: 0.9,
      })
    ),
    trim: track(
      new THREE.MeshStandardMaterial({
        color: 0x5f3ea8,
        emissive: new THREE.Color(0x7d43ff),
        emissiveIntensity: 1.4,
        roughness: 0.35,
        metalness: 0.5,
      })
    ),
    metal: track(
      new THREE.MeshStandardMaterial({
        color: 0x9a9cae,
        roughness: 0.28,
        metalness: 0.9,
        envMapIntensity: 1.2,
      })
    ),
    glow: track(
      new THREE.MeshBasicMaterial({
        color: 0x8a5cff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    ),
    arc: track(
      new THREE.MeshBasicMaterial({
        color: 0x7d5cff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    ),
    particle: track(
      new THREE.PointsMaterial({
        color: 0xb99cff,
        size: 0.035,
        map: particleMap,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
        toneMapped: false,
      })
    ),
  };

  return {
    materials,
    dispose: () => {
      for (const item of disposables) item.dispose();
    },
  };
}
