import * as THREE from "three";
import type { CharacterMaterials } from "./materials";
import {
  TAU,
  curveFrom,
  frontCap,
  lidPatch,
  sweptTube,
} from "./geometry";
import { EYE_RADIUS, EYE_X, EYE_Y, EYE_Z } from "./buildHead";

export type EyeRig = {
  side: number;
  root: THREE.Group;
  gaze: THREE.Group;
  upperLid: THREE.Group;
  lowerLid: THREE.Group;
};

function spherePoint(
  radius: number,
  elevation: number,
  azimuth: number
): THREE.Vector3 {
  const cosEl = Math.cos(elevation);
  return new THREE.Vector3(
    radius * Math.sin(azimuth) * cosEl,
    radius * Math.sin(elevation),
    radius * Math.cos(azimuth) * cosEl
  );
}

function marginCurve(
  radius: number,
  elevation: number,
  azimuthMin: number,
  azimuthMax: number,
  count: number
): THREE.CatmullRomCurve3 {
  const points: Array<[number, number, number]> = [];
  for (let i = 0; i < count; i += 1) {
    const az = azimuthMin + ((azimuthMax - azimuthMin) * i) / (count - 1);
    const p = spherePoint(radius, elevation, az);
    points.push([p.x, p.y, p.z]);
  }
  return curveFrom(points, 0.5);
}

function buildLashes(
  group: THREE.Group,
  materials: CharacterMaterials,
  detail: boolean
) {
  const count = detail ? 9 : 6;
  for (let i = 0; i < count; i += 1) {
    const az = -0.92 + (1.84 * i) / (count - 1);
    const root = spherePoint(0.157, 0.39, az);
    const outward = Math.sin(az);
    const length = 0.036 + 0.02 * Math.cos(az * 1.15);
    const points: Array<[number, number, number]> = [
      [root.x, root.y, root.z],
      [
        root.x + outward * 0.012,
        root.y + length * 0.55,
        root.z + length * 0.42,
      ],
      [
        root.x + outward * 0.034,
        root.y + length,
        root.z + length * 0.7,
      ],
    ];
    const geometry = sweptTube(
      curveFrom(points, 0.55),
      (t) => 0.0042 * (1 - t) + 0.0008,
      12,
      5,
      1,
      1
    );
    const lash = new THREE.Mesh(geometry, materials.lash);
    lash.name = "lash";
    group.add(lash);
  }
}

function buildEye(
  materials: CharacterMaterials,
  side: number,
  detail: boolean
): EyeRig {
  const root = new THREE.Group();
  root.position.set(side * EYE_X, EYE_Y, EYE_Z);
  root.name = side > 0 ? "eye-right" : "eye-left";

  const gaze = new THREE.Group();
  gaze.name = "gaze";
  gaze.rotation.order = "YXZ";
  root.add(gaze);

  const eyeball = new THREE.Mesh(
    new THREE.SphereGeometry(EYE_RADIUS, detail ? 40 : 28, detail ? 30 : 22),
    materials.sclera
  );
  eyeball.name = "eyeball";
  gaze.add(eyeball);

  const iris = new THREE.Mesh(
    frontCap(EYE_RADIUS * 1.008, 0.355, detail ? 56 : 40, detail ? 10 : 7),
    materials.iris
  );
  iris.name = "iris";
  gaze.add(iris);

  const pupil = new THREE.Mesh(
    frontCap(EYE_RADIUS * 1.015, 0.15, detail ? 40 : 28, 5),
    materials.pupil
  );
  pupil.name = "pupil";
  gaze.add(pupil);

  const catchMain = new THREE.Mesh(
    new THREE.SphereGeometry(0.0125, 16, 12),
    materials.catchlight
  );
  catchMain.position.copy(
    new THREE.Vector3(-0.36, 0.42, 0.92).normalize().multiplyScalar(0.147)
  );
  catchMain.scale.set(1, 1.15, 0.6);
  gaze.add(catchMain);

  const catchSmall = new THREE.Mesh(
    new THREE.SphereGeometry(0.0055, 12, 10),
    materials.catchlight
  );
  catchSmall.position.copy(
    new THREE.Vector3(0.34, -0.38, 0.9).normalize().multiplyScalar(0.147)
  );
  gaze.add(catchSmall);

  const upperLid = new THREE.Group();
  upperLid.name = "upper-lid";
  root.add(upperLid);

  const lidMesh = new THREE.Mesh(
    lidPatch(
      0.1535,
      0.365,
      1.5,
      -1.95,
      1.95,
      detail ? 10 : 7,
      detail ? 26 : 18
    ),
    materials.skinSoft
  );
  lidMesh.name = "upper-lid-skin";
  lidMesh.receiveShadow = true;
  upperLid.add(lidMesh);

  const lashLine = new THREE.Mesh(
    sweptTube(
      marginCurve(0.157, 0.372, -1.06, 1.06, 15),
      (t) => 0.0062 * (0.35 + 0.65 * Math.sin(Math.PI * t)),
      detail ? 40 : 26,
      6,
      1,
      1
    ),
    materials.lash
  );
  upperLid.add(lashLine);

  if (detail) buildLashes(upperLid, materials, detail);

  const lowerLid = new THREE.Group();
  lowerLid.name = "lower-lid";
  root.add(lowerLid);

  const lowerMesh = new THREE.Mesh(
    lidPatch(
      0.1535,
      -1.5,
      -0.305,
      -1.85,
      1.85,
      detail ? 8 : 6,
      detail ? 22 : 16
    ),
    materials.skinSoft
  );
  lowerMesh.name = "lower-lid-skin";
  lowerMesh.receiveShadow = true;
  lowerLid.add(lowerMesh);

  const lowerLine = new THREE.Mesh(
    sweptTube(
      marginCurve(0.156, -0.298, -0.92, 0.92, 13),
      (t) => 0.0034 * (0.3 + 0.7 * Math.sin(Math.PI * t)),
      detail ? 30 : 20,
      5,
      1,
      1
    ),
    materials.lash
  );
  lowerLid.add(lowerLine);

  // Wet corner highlight at the inner canthus.
  const caruncle = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 16, 12),
    materials.innerEar
  );
  caruncle.position.set(side * -0.122, -0.006, 0.048);
  caruncle.scale.set(1, 0.7, 0.7);
  root.add(caruncle);

  return { side, root, gaze, upperLid, lowerLid };
}

export function buildEyes(
  materials: CharacterMaterials,
  detail: boolean
): EyeRig[] {
  return [buildEye(materials, -1, detail), buildEye(materials, 1, detail)];
}

export const EYE_CONSTANTS = {
  radius: EYE_RADIUS,
  x: EYE_X,
  y: EYE_Y,
  z: EYE_Z,
  azimuth: TAU,
};
