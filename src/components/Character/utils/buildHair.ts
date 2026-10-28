import * as THREE from "three";
import type { CharacterMaterials } from "./materials";
import {
  TAU,
  curveFrom,
  loftRings,
  profile,
  smoothstep,
} from "./geometry";
import { facePoint, sampleHeadSurface } from "./buildHead";

const hairlineProfile: Array<[number, number]> = [
  [0, 57],
  [28, 58],
  [48, 63],
  [66, 70],
  [82, 78],
  [100, 88],
  [126, 96],
  [152, 100],
  [180, 101],
];

const RAD = Math.PI / 180;

function boundaryAngle(azimuth: number): number {
  const deg = Math.abs(azimuth) / RAD;
  const base = profile(hairlineProfile, deg);
  // Asymmetric cut: the character's left side is clipper-short.
  const asymmetry = 5 * Math.sin(azimuth);
  return (base + asymmetry) * RAD;
}

function buildCap(materials: CharacterMaterials, detail: boolean): THREE.Mesh {
  const cols = detail ? 150 : 100;
  const rows = detail ? 46 : 30;
  const positions: number[] = [0, 0.982, 0];
  const indices: number[] = [];

  for (let j = 1; j <= rows; j += 1) {
    const v = j / rows;
    for (let i = 0; i < cols; i += 1) {
      const azimuth = (i / cols) * TAU;
      const boundary = boundaryAngle(azimuth);
      const theta = boundary * Math.pow(v, 0.9);
      const sinTheta = Math.sin(theta);
      const nx = sinTheta * Math.sin(azimuth);
      const ny = Math.cos(theta);
      const nz = sinTheta * Math.cos(azimuth);

      const point = sampleHeadSurface(nx, ny, nz);
      const radial = 1.035 + 0.045 * Math.sin(Math.PI * Math.pow(v, 0.85));
      const lift = 0.035 * (1 - v) + 0.012;
      point.x *= radial;
      point.z *= radial;
      point.y += lift;
      positions.push(point.x, point.y, point.z);
    }
  }

  const ringStart = (j: number) => 1 + (j - 1) * cols;
  for (let i = 0; i < cols; i += 1) {
    const next = (i + 1) % cols;
    indices.push(0, ringStart(1) + i, ringStart(1) + next);
  }
  for (let j = 1; j < rows; j += 1) {
    const a = ringStart(j);
    const b = ringStart(j + 1);
    for (let i = 0; i < cols; i += 1) {
      const next = (i + 1) % cols;
      indices.push(a + i, a + next, b + i);
      indices.push(a + next, b + next, b + i);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const mesh = new THREE.Mesh(geometry, materials.hair);
  mesh.name = "hair-cap";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function sampleWidth(widths: number[], t: number): number {
  if (widths.length === 1) return widths[0];
  const scaled = t * (widths.length - 1);
  const index = Math.min(widths.length - 2, Math.floor(scaled));
  const local = smoothstep(0, 1, scaled - index);
  return widths[index] + (widths[index + 1] - widths[index]) * local;
}

/**
 * A flat lock of hair that follows a curve and keeps its broad face tangent
 * to the skull. Used for the fringe, temple panels and crown ridges.
 */
function buildLock(
  material: THREE.Material,
  points: Array<number[]>,
  widths: number[],
  thickness: number,
  segments = 26
): THREE.Mesh {
  const curve = curveFrom(points, 0.5);
  const rings: THREE.Vector3[][] = [];
  const radial = 10;
  const dummy = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const outward = center.clone().normalize();
    if (outward.lengthSq() < 0.01) outward.copy(dummy);
    const widthAxis = new THREE.Vector3()
      .crossVectors(outward, tangent)
      .normalize();
    if (widthAxis.lengthSq() < 0.01) widthAxis.set(1, 0, 0);
    const thicknessAxis = new THREE.Vector3()
      .crossVectors(tangent, widthAxis)
      .normalize();

    const width = sampleWidth(widths, t);
    const height = thickness * (0.5 + 0.5 * Math.sin(Math.PI * t)) + 0.002;
    const ring: THREE.Vector3[] = [];
    for (let k = 0; k < radial; k += 1) {
      const angle = (k / radial) * TAU;
      const p = center
        .clone()
        .addScaledVector(widthAxis, Math.cos(angle) * width)
        .addScaledVector(thicknessAxis, Math.sin(angle) * height);
      ring.push(p);
    }
    rings.push(ring);
  }

  const geometry = loftRings(rings, true, true);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "hair-lock";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function fringeLocks(materials: CharacterMaterials, detail: boolean) {
  const group = new THREE.Group();
  group.name = "fringe";

  group.add(
    buildLock(
      materials.hair,
      [
        facePoint(-0.26, 0.8, 0.055).toArray(),
        facePoint(-0.12, 0.75, 0.075).toArray(),
        facePoint(0.08, 0.67, 0.08).toArray(),
        facePoint(0.3, 0.59, 0.065).toArray(),
        facePoint(0.47, 0.54, 0.045).toArray(),
      ],
      [0.04, 0.09, 0.108, 0.072, 0.006],
      0.032,
      detail ? 34 : 20
    )
  );

  group.add(
    buildLock(
      materials.hair,
      [
        facePoint(-0.4, 0.75, 0.045).toArray(),
        facePoint(-0.24, 0.685, 0.062).toArray(),
        facePoint(0, 0.605, 0.078).toArray(),
        facePoint(0.24, 0.525, 0.062).toArray(),
        facePoint(0.4, 0.475, 0.035).toArray(),
      ],
      [0.025, 0.07, 0.085, 0.052, 0.005],
      0.028,
      detail ? 30 : 18
    )
  );

  group.add(
    buildLock(
      materials.hair,
      [
        facePoint(-0.53, 0.7, 0.035).toArray(),
        facePoint(-0.47, 0.58, 0.045).toArray(),
        facePoint(-0.4, 0.445, 0.04).toArray(),
      ],
      [0.035, 0.05, 0.005],
      0.024,
      detail ? 22 : 14
    )
  );

  group.add(
    buildLock(
      materials.hair,
      [
        facePoint(0.54, 0.63, 0.03).toArray(),
        facePoint(0.6, 0.42, 0.03).toArray(),
        facePoint(0.58, 0.19, 0.022).toArray(),
      ],
      [0.048, 0.043, 0.006],
      0.026,
      detail ? 22 : 14
    )
  );

  return group;
}

function crownRidges(materials: CharacterMaterials, detail: boolean) {
  const group = new THREE.Group();
  group.name = "crown-ridges";

  group.add(
    buildLock(
      materials.hair,
      [
        [-0.14, 0.9, 0.3],
        [0.0, 0.995, 0.1],
        [0.16, 0.985, -0.12],
        [0.25, 0.9, -0.31],
      ],
      [0.012, 0.045, 0.038, 0.005],
      0.024,
      detail ? 24 : 14
    )
  );

  group.add(
    buildLock(
      materials.hair,
      [
        [-0.31, 0.86, 0.24],
        [-0.12, 0.95, 0.01],
        [0.07, 0.94, -0.25],
        [0.19, 0.87, -0.43],
      ],
      [0.008, 0.034, 0.03, 0.005],
      0.02,
      detail ? 22 : 12
    )
  );

  return group;
}

function accentStreak(materials: CharacterMaterials) {
  return buildLock(
    materials.hairAccent,
    [
      facePoint(-0.15, 0.78, 0.095).toArray(),
      facePoint(0.0, 0.72, 0.108).toArray(),
      facePoint(0.16, 0.655, 0.1).toArray(),
      facePoint(0.28, 0.6, 0.085).toArray(),
    ],
    [0.008, 0.018, 0.014, 0.003],
    0.007,
    18
  );
}

export function buildHair(
  materials: CharacterMaterials,
  detail: boolean
): THREE.Group {
  const group = new THREE.Group();
  group.name = "hair";
  group.add(buildCap(materials, detail));
  group.add(fringeLocks(materials, detail));
  group.add(crownRidges(materials, detail));
  group.add(accentStreak(materials));
  return group;
}
