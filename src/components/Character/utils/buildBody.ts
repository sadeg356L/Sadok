import * as THREE from "three";
import type { CharacterMaterials } from "./materials";
import {
  curveFrom,
  loftRings,
  profile,
  superellipseRing,
  sweptTube,
} from "./geometry";

export type BodyRig = {
  root: THREE.Group;
  neck: THREE.Group;
  chest: THREE.Group;
};

const torsoY = [-0.9, -0.6, -0.3, 0, 0.25, 0.52, 0.72, 0.84, 0.94, 1.02];
const torsoRx = [0.78, 0.8, 0.82, 0.84, 0.86, 0.87, 0.82, 0.68, 0.46, 0.32];
const torsoRz = [0.38, 0.415, 0.435, 0.44, 0.43, 0.4, 0.37, 0.33, 0.29, 0.26];
const torsoZc = [-0.02, -0.01, 0, 0.01, 0.02, 0.02, 0.01, 0, 0, 0];
const torsoP = 2.55;

function torsoFrontZ(x: number, y: number): number {
  const rx = profile(
    torsoY.map((v, i) => [v, torsoRx[i]] as [number, number]),
    y
  );
  const rz = profile(
    torsoY.map((v, i) => [v, torsoRz[i]] as [number, number]),
    y
  );
  const zc = profile(
    torsoY.map((v, i) => [v, torsoZc[i]] as [number, number]),
    y
  );
  const ratio = Math.min(0.999, Math.abs(x) / Math.max(0.001, rx));
  return zc + rz * Math.pow(Math.max(0, 1 - Math.pow(ratio, torsoP)), 1 / torsoP);
}

function buildNeck(materials: CharacterMaterials) {
  const group = new THREE.Group();
  group.name = "neck";
  group.position.set(0, 0.84, -0.02);

  const rings = [
    superellipseRing(0, 0.37, 0.31, 0, 0, 56, 2.3),
    superellipseRing(0.08, 0.31, 0.275, 0, 0, 56, 2.2),
    superellipseRing(0.22, 0.27, 0.25, 0, 0, 56, 2.2),
    superellipseRing(0.4, 0.252, 0.238, 0, 0.005, 56, 2.15),
    superellipseRing(0.58, 0.245, 0.232, 0, 0.008, 56, 2.1),
    superellipseRing(0.78, 0.25, 0.238, 0, 0.01, 56, 2.1),
  ];
  const mesh = new THREE.Mesh(loftRings(rings, true, true), materials.nose);
  mesh.name = "neck-mesh";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return group;
}

function buildTorso(materials: CharacterMaterials, detail: boolean) {
  const group = new THREE.Group();
  group.name = "torso";

  const rings = torsoY.map((y, i) =>
    superellipseRing(
      y,
      torsoRx[i],
      torsoRz[i],
      0,
      torsoZc[i],
      detail ? 80 : 54,
      torsoP
    )
  );
  const torso = new THREE.Mesh(loftRings(rings, true, true), materials.cloth);
  torso.name = "jacket";
  torso.castShadow = true;
  torso.receiveShadow = true;
  group.add(torso);

  for (const side of [-1, 1]) {
    const armRings: THREE.Vector3[][] = [];
    const armData: Array<[number, number, number, number]> = [
      [-0.95, 1.0, 0.185, 0.19],
      [-0.72, 1.0, 0.195, 0.2],
      [-0.4, 0.99, 0.205, 0.21],
      [-0.05, 0.97, 0.215, 0.22],
      [0.3, 0.94, 0.22, 0.225],
      [0.58, 0.92, 0.225, 0.235],
      [0.78, 0.9, 0.2, 0.22],
      [0.9, 0.88, 0.09, 0.12],
    ];
    for (const [y, cx, rx, rz] of armData) {
      armRings.push(
        superellipseRing(
          y,
          rx,
          rz,
          side * cx,
          0,
          detail ? 40 : 28,
          2.15
        )
      );
    }
    const arm = new THREE.Mesh(
      loftRings(armRings, true, true),
      materials.cloth
    );
    arm.name = "arm";
    arm.castShadow = true;
    arm.receiveShadow = true;
    group.add(arm);
  }

  // Deltoid volume to soften the shoulder / arm join.
  const deltoidGeometry = new THREE.SphereGeometry(1, 32, 22);
  for (const side of [-1, 1]) {
    const deltoid = new THREE.Mesh(deltoidGeometry, materials.cloth);
    deltoid.position.set(side * 0.9, 0.73, 0);
    deltoid.scale.set(0.27, 0.19, 0.3);
    deltoid.castShadow = true;
    deltoid.receiveShadow = true;
    group.add(deltoid);
  }

  const zipperPoints: Array<[number, number, number]> = [];
  for (let y = 0.98; y >= -0.9; y -= 0.1) {
    zipperPoints.push([0, y, torsoFrontZ(0, y) + 0.008]);
  }
  const zipper = new THREE.Mesh(
    sweptTube(curveFrom(zipperPoints, 0.4), () => 0.007, 80, 6, 1, 0.6),
    materials.metal
  );
  zipper.name = "zipper";
  group.add(zipper);

  const pull = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.055, 0.014),
    materials.metal
  );
  pull.position.set(0, 0.58, torsoFrontZ(0, 0.58) + 0.028);
  group.add(pull);

  for (const side of [-1, 1]) {
    const seamPoints: Array<[number, number, number]> = [];
    for (let y = 0.92; y >= -0.86; y -= 0.08) {
      seamPoints.push([
        side * 0.44,
        y,
        torsoFrontZ(side * 0.44, y) + 0.006,
      ]);
    }
    const seam = new THREE.Mesh(
      sweptTube(curveFrom(seamPoints, 0.35), () => 0.0045, 90, 5),
      materials.clothPanel
    );
    group.add(seam);

    const yoke = new THREE.Mesh(
      sweptTube(
        curveFrom(
          [
            [side * 0.15, 0.94, torsoFrontZ(side * 0.15, 0.94) + 0.012],
            [side * 0.36, 0.91, torsoFrontZ(side * 0.36, 0.91) + 0.012],
            [side * 0.57, 0.86, torsoFrontZ(side * 0.57, 0.86) + 0.01],
            [side * 0.74, 0.79, torsoFrontZ(side * 0.74, 0.79) + 0.008],
            [side * 0.87, 0.7, 0.12],
            [side * 0.93, 0.6, 0.05],
          ],
          0.4
        ),
        () => 0.004,
        48,
        5
      ),
      materials.trim
    );
    group.add(yoke);

    const vSeam = new THREE.Mesh(
      sweptTube(
        curveFrom(
          [
            [side * 0.26, 0.9, torsoFrontZ(side * 0.26, 0.9) + 0.01],
            [side * 0.18, 0.72, torsoFrontZ(side * 0.18, 0.72) + 0.01],
            [side * 0.055, 0.5, torsoFrontZ(side * 0.055, 0.5) + 0.012],
          ],
          0.4
        ),
        () => 0.004,
        32,
        5
      ),
      materials.clothPanel
    );
    group.add(vSeam);

    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.0055, 8, 48),
      materials.clothPanel
    );
    cuff.position.set(side * 0.985, 0.34, 0);
    cuff.rotation.x = Math.PI / 2;
    cuff.scale.z = 1.02;
    group.add(cuff);
  }

  const emblemBack = new THREE.Mesh(
    new THREE.TorusGeometry(0.062, 0.007, 8, 28),
    materials.metal
  );
  emblemBack.position.set(-0.44, 0.33, torsoFrontZ(-0.44, 0.33) + 0.012);
  group.add(emblemBack);

  const emblem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.012, 6),
    materials.trim
  );
  emblem.position.set(-0.44, 0.33, torsoFrontZ(-0.44, 0.33) + 0.02);
  emblem.rotation.x = Math.PI / 2;
  group.add(emblem);

  return group;
}

function buildCollar(materials: CharacterMaterials) {
  const group = new THREE.Group();
  group.name = "collar";

  const rings = [
    superellipseRing(0.95, 0.34, 0.295, 0, 0, 64, 2.2),
    superellipseRing(1.02, 0.327, 0.282, 0, 0.002, 64, 2.2),
    superellipseRing(1.08, 0.307, 0.268, 0, 0.004, 64, 2.2),
  ];
  const band = new THREE.Mesh(
    loftRings(rings, false, false),
    materials.clothPanel
  );
  band.castShadow = true;
  group.add(band);

  const annulus = new THREE.Mesh(
    new THREE.RingGeometry(0.252, 0.307, 64, 1),
    materials.clothPanel
  );
  annulus.rotation.x = -Math.PI / 2;
  annulus.position.set(0, 1.08, 0.004);
  group.add(annulus);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.283, 0.0055, 8, 80),
    materials.trim
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 1.082, 0.004);
  rim.scale.y = 0.93;
  group.add(rim);

  return group;
}

export function buildBody(
  materials: CharacterMaterials,
  detail: boolean
): BodyRig {
  const root = new THREE.Group();
  root.name = "body";

  const neck = buildNeck(materials);
  const chest = buildTorso(materials, detail);
  const collar = buildCollar(materials);

  chest.add(collar);
  root.add(neck);
  root.add(chest);

  return { root, neck, chest };
}
