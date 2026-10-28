import * as THREE from "three";
import { createMaterials } from "./materials";
import { buildHead } from "./buildHead";
import { buildEyes, type EyeRig } from "./buildEyes";
import { buildHair } from "./buildHair";
import { buildBody } from "./buildBody";

export type CharacterState = {
  headYaw: number;
  headPitch: number;
  neckYaw: number;
  eyeYawLeft: number;
  eyePitchLeft: number;
  eyeYawRight: number;
  eyePitchRight: number;
  blink: number;
  pointerX: number;
  pointerY: number;
};

export type CharacterRig = {
  group: THREE.Group;
  update: (
    elapsed: number,
    pointer: THREE.Vector2,
    delta: number,
    reduced: boolean
  ) => void;
  getState: () => CharacterState;
  blinkNow: () => void;
  dispose: () => void;
};

const HEAD_YAW_LIMIT = 0.46;
const HEAD_PITCH_LIMIT = 0.24;
const EYE_YAW_LIMIT = 0.28;
const EYE_PITCH_LIMIT = 0.18;

function createHalo(): {
  sprite: THREE.Sprite;
  dispose: () => void;
} {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const material = new THREE.SpriteMaterial({ color: 0x7d4dff });
    const sprite = new THREE.Sprite(material);
    return {
      sprite,
      dispose: () => material.dispose(),
    };
  }

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(154, 112, 255, 0.5)");
  gradient.addColorStop(0.28, "rgba(108, 66, 214, 0.24)");
  gradient.addColorStop(0.62, "rgba(61, 32, 130, 0.08)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.6, 4.6, 1);
  sprite.position.set(0, 2.0, -2.3);

  return {
    sprite,
    dispose: () => {
      texture.dispose();
      material.dispose();
    },
  };
}

function createDust(
  material: THREE.PointsMaterial,
  count: number
): THREE.Points {
  const positions = new Float32Array(count * 3);
  let seed = 917331;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (rand() - 0.5) * 5.6;
    positions[i * 3 + 1] = -0.4 + rand() * 4.1;
    positions[i * 3 + 2] = -1.3 + rand() * 2.9;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  const points = new THREE.Points(geometry, material);
  points.name = "dust";
  return points;
}

export function buildCharacter(detail = true): CharacterRig {
  const bundle = createMaterials();
  const { materials } = bundle;
  const group = new THREE.Group();
  group.name = "vesper";

  const body = buildBody(materials, detail);

  const headPivot = new THREE.Group();
  headPivot.name = "head-pivot";
  headPivot.position.set(0, 1.56, -0.04);
  headPivot.rotation.order = "YXZ";

  const headGroup = buildHead(materials, detail);
  headGroup.position.set(0, 0.44, 0.04);
  headPivot.add(headGroup);

  const eyes: EyeRig[] = buildEyes(materials, detail);
  for (const eye of eyes) headGroup.add(eye.root);

  headGroup.add(buildHair(materials, detail));

  group.add(body.root, headPivot);

  const backdrop = new THREE.Group();
  backdrop.name = "backdrop";
  const arcs: THREE.Mesh[] = [];
  const arcSpecs: Array<[number, number, number, number]> = [
    [1.62, 0.0045, -0.2, 1.35],
    [2.24, 0.0055, 0.5, 1.15],
    [2.92, 0.0045, -0.7, 0.9],
  ];
  for (const [radius, tube, rotation, arc] of arcSpecs) {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 6, detail ? 180 : 110, arc),
      materials.arc
    );
    mesh.position.set(0, 1.95, -2.5);
    mesh.rotation.z = rotation;
    arcs.push(mesh);
    backdrop.add(mesh);
  }

  const dust = createDust(materials.particle, detail ? 180 : 80);
  backdrop.add(dust);
  group.add(backdrop);

  const halo = createHalo();
  group.add(halo.sprite);

  let headYaw = 0;
  let headPitch = 0;
  let neckYaw = 0;
  let eyeYaw = 0;
  let eyePitch = 0;
  let blink = 0;
  let blinkStart = -1;
  let nextBlink = 3.4 + Math.random() * 3.2;
  let lastElapsed = 0;
  let pointerX = 0;
  let pointerY = 0;

  const clamp = THREE.MathUtils.clamp;

  const update = (
    elapsed: number,
    pointer: THREE.Vector2,
    delta: number,
    reduced: boolean
  ) => {
    const dt = Math.min(0.05, Math.max(0.0001, delta));
    lastElapsed = elapsed;
    pointerX = pointer.x;
    pointerY = pointer.y;

    const idle = reduced ? 0 : 1;
    const swayY = Math.sin(elapsed * 0.52) * 0.014 * idle;
    const swayX = Math.sin(elapsed * 0.73 + 1.4) * 0.008 * idle;

    const targetYaw = clamp(pointer.x * 0.44 + swayY, -HEAD_YAW_LIMIT, HEAD_YAW_LIMIT);
    const targetPitch = clamp(
      pointer.y * 0.23 + swayX,
      -HEAD_PITCH_LIMIT,
      HEAD_PITCH_LIMIT
    );

    headYaw = THREE.MathUtils.damp(headYaw, targetYaw, 3.6, dt);
    headPitch = THREE.MathUtils.damp(headPitch, targetPitch, 3.9, dt);
    neckYaw = THREE.MathUtils.damp(neckYaw, headYaw * 0.22, 2.6, dt);

    headPivot.rotation.y = headYaw;
    headPivot.rotation.x = headPitch;
    headPivot.rotation.z = -headYaw * 0.035;

    body.neck.rotation.y = neckYaw;
    body.neck.rotation.x = headPitch * 0.2;

    const eyeTargetYaw = clamp(
      pointer.x * 0.55 - headYaw * 0.72 + Math.sin(elapsed * 0.9) * 0.006 * idle,
      -EYE_YAW_LIMIT,
      EYE_YAW_LIMIT
    );
    const eyeTargetPitch = clamp(
      pointer.y * 0.36 - headPitch * 0.7 + Math.cos(elapsed * 0.8) * 0.004 * idle,
      -EYE_PITCH_LIMIT,
      EYE_PITCH_LIMIT
    );

    eyeYaw = THREE.MathUtils.damp(eyeYaw, eyeTargetYaw, 11, dt);
    eyePitch = THREE.MathUtils.damp(eyePitch, eyeTargetPitch, 11, dt);

    for (const eye of eyes) {
      eye.gaze.rotation.y = eyeYaw + eye.side * 0.006;
      eye.gaze.rotation.x = eyePitch;
    }

    if (!reduced) {
      if (elapsed > nextBlink && blinkStart < 0) {
        blinkStart = elapsed;
        nextBlink = elapsed + 2.9 + Math.random() * 4.3;
      }
      if (blinkStart >= 0) {
        const t = (elapsed - blinkStart) / 0.185;
        if (t >= 1) {
          blinkStart = -1;
          blink = 0;
        } else {
          blink = Math.pow(Math.sin(Math.PI * Math.min(1, t)), 0.8);
        }
      }
    } else {
      blink = 0;
    }

    for (const eye of eyes) {
      eye.upperLid.rotation.x = -0.62 * blink;
      eye.lowerLid.rotation.x = 0.16 * blink;
    }

    const breath = reduced ? 0 : Math.sin(elapsed * 1.15);
    body.chest.scale.y = 1 + breath * 0.0035;
    body.chest.scale.z = 1 + breath * 0.005;
    body.chest.position.y = breath * 0.0025;

    backdrop.rotation.y = Math.sin(elapsed * 0.16) * 0.06;
    dust.rotation.y = elapsed * 0.035;
    for (let i = 0; i < arcs.length; i += 1) {
      arcs[i].rotation.z =
        arcSpecs[i][2] + (reduced ? 0 : Math.sin(elapsed * 0.18 + i) * 0.06);
    }
  };

  const getState = (): CharacterState => ({
    headYaw,
    headPitch,
    neckYaw,
    eyeYawLeft: eyeYaw - 0.006,
    eyePitchLeft: eyePitch,
    eyeYawRight: eyeYaw + 0.006,
    eyePitchRight: eyePitch,
    blink,
    pointerX,
    pointerY,
  });

  const blinkNow = () => {
    if (blinkStart < 0) {
      blinkStart = lastElapsed;
      nextBlink = lastElapsed + 3 + Math.random() * 3;
    }
  };

  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materialSet = new Set<THREE.Material>();

    group.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          for (const material of mesh.material) materialSet.add(material);
        } else {
          materialSet.add(mesh.material);
        }
      }
    });

    for (const geometry of geometries) geometry.dispose();
    for (const material of materialSet) material.dispose();
    halo.dispose();
    bundle.dispose();
    group.clear();
  };

  return { group, update, getState, blinkNow, dispose };
}
