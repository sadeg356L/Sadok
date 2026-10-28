import * as THREE from "three";
import type { CharacterMaterials } from "./materials";
import {
  TAU,
  buildSphereGrid,
  curveFrom,
  gaussian,
  loftRings,
  profile,
  smoothstep,
  sweptTube,
} from "./geometry";

export const EYE_RADIUS = 0.145;
export const EYE_X = 0.318;
export const EYE_Y = 0.1;
export const EYE_Z = 0.59;

const WIDTH = 0.685;
const HEIGHT = 0.92;
const DEPTH = 0.8;

const widthProfile: Array<[number, number]> = [
  [-1, 0.36],
  [-0.9, 0.46],
  [-0.78, 0.58],
  [-0.62, 0.76],
  [-0.45, 0.88],
  [-0.25, 0.96],
  [-0.05, 1.0],
  [0.18, 1.02],
  [0.42, 1.0],
  [0.66, 0.94],
  [0.85, 0.78],
  [1, 0.4],
];

const depthProfile: Array<[number, number]> = [
  [-1, 0.42],
  [-0.9, 0.52],
  [-0.78, 0.64],
  [-0.62, 0.76],
  [-0.45, 0.86],
  [-0.25, 0.94],
  [-0.05, 0.99],
  [0.2, 1.02],
  [0.5, 1.0],
  [0.75, 0.93],
  [0.9, 0.8],
  [1, 0.5],
];

const frontBoostProfile: Array<[number, number]> = [
  [-1, 0.16],
  [-0.88, 0.24],
  [-0.76, 0.3],
  [-0.62, 0.22],
  [-0.48, 0.14],
  [-0.32, 0.06],
  [-0.18, 0.015],
  [0, 0],
  [1, 0],
];

function shapeHead(
  nx: number,
  ny: number,
  nz: number,
  out: THREE.Vector3
): THREE.Vector3 {
  const width = profile(widthProfile, ny) * WIDTH;
  const depth = profile(depthProfile, ny) * DEPTH;
  const front = Math.max(0, nz);
  const frontFactor = Math.pow(smoothstep(0, 0.7, front), 1.25);

  let x = nx * width;
  const y = ny * HEIGHT;
  let z =
    nz * depth * (nz < 0 ? 1.045 : 1) +
    profile(frontBoostProfile, ny) * frontFactor;

  const cheek =
    gaussian(ny, -0.08, 0.2) *
    smoothstep(0.22, 0.86, Math.abs(nx)) *
    smoothstep(0.02, 0.6, nz);
  x += Math.sign(nx) * cheek * 0.03;
  z += cheek * 0.018;

  const temple =
    gaussian(ny, 0.42, 0.24) *
    smoothstep(0.62, 0.95, Math.abs(nx)) *
    smoothstep(0, 0.5, nz);
  x -= Math.sign(nx) * temple * 0.022;

  const eyeSocketAt = (centerX: number) => {
    const dx = (x - centerX) / 0.26;
    const dy = (y - EYE_Y) / 0.175;
    return Math.exp(-(dx * dx + dy * dy) * 1.4) * frontFactor;
  };
  const eyeSocket = Math.max(eyeSocketAt(EYE_X), eyeSocketAt(-EYE_X));
  z -= eyeSocket * 0.04;
  x -= Math.sign(x) * eyeSocket * 0.006;

  const brow =
    gaussian(y, 0.33, 0.11) *
    gaussian(Math.abs(x), 0.32, 0.24) *
    frontFactor;
  z += brow * 0.028;

  const lowerRim =
    gaussian(y, -0.07, 0.07) *
    gaussian(Math.abs(x), 0.34, 0.22) *
    frontFactor;
  z += lowerRim * 0.012;

  const cheekApple =
    gaussian(y, -0.2, 0.16) *
    gaussian(Math.abs(x), 0.36, 0.2) *
    frontFactor;
  z += cheekApple * 0.022;

  const muzzle =
    gaussian(y, -0.48, 0.14) *
    gaussian(x, 0, 0.34) *
    frontFactor;
  z += muzzle * 0.026;

  const chin =
    gaussian(y, -0.72, 0.1) *
    gaussian(x, 0, 0.22) *
    frontFactor;
  z += chin * 0.036;

  const jawCorner =
    gaussian(y, -0.48, 0.12) *
    smoothstep(0.45, 0.9, Math.abs(nx)) *
    smoothstep(-0.1, 0.6, Math.abs(nx));
  x += Math.sign(x) * jawCorner * 0.018;

  out.set(x, y, z);
  return out;
}

export function sampleHeadSurface(nx: number, ny: number, nz: number) {
  return shapeHead(nx, ny, nz, new THREE.Vector3());
}

/**
 * Approximate a point on the front of the face at a target (x, y), pushed
 * outwards by `offset`. Used to seat brows, fringe locks and hair ridges on
 * the actual displaced skull instead of guessing a Z value.
 */
export function facePoint(x: number, y: number, offset = 0) {
  const ny = Math.min(0.995, Math.max(-0.995, y / HEIGHT));
  const width = profile(widthProfile, ny) * WIDTH;
  const nx = Math.min(0.995, Math.max(-0.995, x / width));
  const nz = Math.sqrt(Math.max(0.02, 1 - nx * nx - ny * ny));
  const point = sampleHeadSurface(nx, ny, nz);
  if (offset !== 0) {
    const outward = point.clone().normalize();
    point.addScaledVector(outward, offset);
  }
  return point;
}

function createHeadGeometry(cols: number, rows: number): THREE.BufferGeometry {
  const scratch = new THREE.Vector3();
  const geometry = buildSphereGrid(cols, rows, (u, v) => {
    const ny = Math.cos(v * Math.PI);
    const radius = Math.sin(v * Math.PI);
    const phi = u * TAU;
    return shapeHead(radius * Math.cos(phi), ny, radius * Math.sin(phi), scratch);
  });

  const position = geometry.getAttribute("position");
  const colors: number[] = [];
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const front = smoothstep(0.05, 0.6, z);

    const socket =
      Math.exp(
        -(
          Math.pow((Math.abs(x) - EYE_X) / 0.24, 2) +
          Math.pow((y - EYE_Y) / 0.17, 2)
        ) * 1.5
      ) * front;
    const underBrow =
      gaussian(y, 0.27, 0.09) *
      gaussian(Math.abs(x), 0.33, 0.26) *
      front;
    const jawShade =
      smoothstep(-0.35, -0.95, y) * (0.35 + 0.65 * front);
    const templeShade =
      gaussian(y, 0.45, 0.24) *
      smoothstep(0.55, 0.95, Math.abs(x)) *
      front;
    const noseShade =
      gaussian(x, 0, 0.1) *
      gaussian(y, -0.05, 0.2) *
      front;
    const cheekWarmth =
      gaussian(y, -0.18, 0.18) *
      gaussian(Math.abs(x), 0.36, 0.19) *
      front;

    let value = 1;
    value -= socket * 0.24;
    value -= underBrow * 0.09;
    value -= jawShade * 0.09;
    value -= templeShade * 0.075;
    value -= noseShade * 0.02;
    value += cheekWarmth * 0.035;

    const grain =
      Math.sin(x * 41.7 + y * 63.1 + z * 87.3) * 43758.5453;
    const noise = grain - Math.floor(grain);
    value *= 1 + (noise - 0.5) * 0.028;

    const warm = 1 + cheekWarmth * 0.06;
    color.setRGB(
      Math.max(0, value * warm),
      Math.max(0, value * 0.985),
      Math.max(0, value * (0.955 - cheekWarmth * 0.05))
    );
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function addNose(group: THREE.Group, materials: CharacterMaterials) {
  const rings: THREE.Vector3[][] = [];
  const sections: Array<[number, number, number, number, number]> = [
    [-0.285, 0.755, 0.062, 0.014, 0.03],
    [-0.245, 0.79, 0.094, 0.032, 0.045],
    [-0.205, 0.83, 0.107, 0.06, 0.05],
    [-0.155, 0.85, 0.099, 0.073, 0.055],
    [-0.09, 0.84, 0.086, 0.072, 0.052],
    [-0.01, 0.815, 0.072, 0.058, 0.05],
    [0.09, 0.785, 0.06, 0.047, 0.048],
    [0.19, 0.752, 0.05, 0.035, 0.045],
    [0.285, 0.725, 0.04, 0.022, 0.04],
  ];

  for (const [y, zc, width, front, back] of sections) {
    const ring: THREE.Vector3[] = [];
    for (let i = 0; i < 28; i += 1) {
      const angle = (i / 28) * TAU;
      const s = Math.sin(angle);
      const depth = s > 0 ? front : back;
      ring.push(
        new THREE.Vector3(
          Math.cos(angle) * width,
          y,
          zc + s * depth
        )
      );
    }
    rings.push(ring);
  }

  const mesh = new THREE.Mesh(loftRings(rings), materials.nose);
  mesh.name = "nose";
  group.add(mesh);

  const wingGeometry = new THREE.SphereGeometry(1, 24, 18);
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(wingGeometry, materials.nose);
    wing.position.set(side * 0.093, -0.222, 0.845);
    wing.scale.set(0.052, 0.042, 0.058);
    wing.name = "nose-wing";
    group.add(wing);

    const nostril = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      materials.nostril
    );
    nostril.position.set(side * 0.072, -0.252, 0.825);
    nostril.scale.set(0.03, 0.015, 0.022);
    nostril.rotation.z = side * 0.32;
    group.add(nostril);
  }
}

function addMouth(group: THREE.Group, materials: CharacterMaterials) {
  const upper = sweptTube(
    curveFrom([
      [-0.13, -0.468, 0.7],
      [-0.065, -0.452, 0.731],
      [-0.025, -0.443, 0.741],
      [0, -0.44, 0.744],
      [0.025, -0.443, 0.741],
      [0.065, -0.452, 0.731],
      [0.13, -0.468, 0.7],
    ]),
    (t) => 0.035 * (0.4 + 0.6 * Math.sin(Math.PI * t)),
    40,
    10,
    1.25,
    0.72
  );
  const upperMesh = new THREE.Mesh(upper, materials.lip);
  upperMesh.name = "upper-lip";
  group.add(upperMesh);

  const lower = sweptTube(
    curveFrom([
      [-0.122, -0.524, 0.699],
      [-0.055, -0.541, 0.729],
      [0, -0.548, 0.74],
      [0.055, -0.541, 0.729],
      [0.122, -0.524, 0.699],
    ]),
    (t) => 0.042 * (0.35 + 0.65 * Math.sin(Math.PI * t)),
    40,
    10,
    1.35,
    0.8
  );
  const lowerMesh = new THREE.Mesh(lower, materials.lip);
  lowerMesh.name = "lower-lip";
  group.add(lowerMesh);

  const line = sweptTube(
    curveFrom([
      [-0.132, -0.493, 0.705],
      [-0.06, -0.486, 0.737],
      [0, -0.484, 0.743],
      [0.06, -0.486, 0.737],
      [0.132, -0.493, 0.705],
    ]),
    (t) => 0.0065 * (0.45 + 0.55 * Math.sin(Math.PI * t)),
    40,
    6,
    1,
    1
  );
  group.add(new THREE.Mesh(line, materials.lipLine));

  const philtrum = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    materials.lip
  );
  philtrum.position.set(0, -0.417, 0.728);
  philtrum.scale.set(0.028, 0.05, 0.014);
  group.add(philtrum);
}

function addBrows(group: THREE.Group, materials: CharacterMaterials) {
  for (const side of [-1, 1]) {
    const points: Array<[number, number, number]> = [
      [side * 0.105, 0.352, 0.703],
      [side * 0.2, 0.392, 0.712],
      [side * 0.31, 0.404, 0.692],
      [side * 0.42, 0.392, 0.652],
      [side * 0.51, 0.362, 0.592],
      [side * 0.575, 0.328, 0.53],
    ];
    const curve = curveFrom(points, 0.35);
    const geometry = sweptTube(
      curve,
      (t) => {
        const taper = Math.sin(Math.PI * Math.pow(t, 0.78));
        return 0.011 + 0.027 * taper * (1 - t * 0.22);
      },
      52,
      9,
      1.0,
      1.35
    );
    const brow = new THREE.Mesh(geometry, materials.brow);
    brow.name = "brow";
    group.add(brow);
  }
}

function earShape(side: number): THREE.Shape {
  const outline: Array<[number, number]> = [
    [0.02, 0.215],
    [0.085, 0.185],
    [0.125, 0.115],
    [0.138, 0.02],
    [0.128, -0.075],
    [0.095, -0.16],
    [0.045, -0.222],
    [-0.005, -0.238],
    [-0.052, -0.19],
    [-0.075, -0.09],
    [-0.083, 0.03],
    [-0.07, 0.13],
    [-0.032, 0.2],
  ];
  // Right ear: forward maps to local -X after the +90deg Y rotation.
  const forwardSign = side > 0 ? -1 : 1;
  const shape = new THREE.Shape();
  outline.forEach(([forward, up], index) => {
    const x = forward * forwardSign;
    if (index === 0) shape.moveTo(x, up);
    else shape.lineTo(x, up);
  });
  shape.closePath();
  return shape;
}

function addEars(group: THREE.Group, materials: CharacterMaterials) {
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.645, 0.015, -0.035);
    pivot.rotation.y = side * (Math.PI / 2);
    pivot.rotation.z = -side * 0.07;

    const outer = new THREE.ExtrudeGeometry(earShape(side), {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.018,
      bevelSegments: 3,
      curveSegments: 6,
      steps: 1,
    });
    const outerMesh = new THREE.Mesh(outer, materials.nose);
    outerMesh.name = "ear";
    pivot.add(outerMesh);

    const innerShape = earShape(side);
    const inner = new THREE.ExtrudeGeometry(innerShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
      curveSegments: 4,
      steps: 1,
    });
    inner.scale(0.58, 0.62, 1);
    const innerMesh = new THREE.Mesh(inner, materials.innerEar);
    innerMesh.position.set(side > 0 ? 0.008 : -0.008, -0.01, 0.058);
    innerMesh.rotation.y = Math.PI;
    pivot.add(innerMesh);

    group.add(pivot);
  }
}

export function buildHead(
  materials: CharacterMaterials,
  detail: boolean
): THREE.Group {
  const group = new THREE.Group();
  group.name = "head";

  const geometry = createHeadGeometry(detail ? 168 : 120, detail ? 120 : 84);
  const head = new THREE.Mesh(geometry, materials.skin);
  head.name = "head-mesh";
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  addNose(group, materials);
  addMouth(group, materials);
  addBrows(group, materials);
  addEars(group, materials);

  return group;
}
