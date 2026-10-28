import * as THREE from "three";

export const TAU = Math.PI * 2;

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}

export function gaussian(x: number, mu: number, sigma: number): number {
  const d = (x - mu) / sigma;
  return Math.exp(-d * d);
}

/** Smooth scalar profile through [x, y] control points (ascending x). */
export function profile(points: Array<[number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (x >= x0 && x <= x1) {
      const t = smoothstep(0, 1, (x - x0) / (x1 - x0 || 1e-6));
      return y0 + (y1 - y0) * t;
    }
  }
  return last[1];
}

/**
 * Closed UV sphere with a single shared seam and welded poles.
 * `map(u, v)` returns the displaced position; u is azimuth [0, 1), v is
 * latitude [0, 1] from north pole to south pole.
 */
export function buildSphereGrid(
  cols: number,
  rows: number,
  map: (u: number, v: number) => THREE.Vector3
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const top = map(0, 0);
  positions.push(top.x, top.y, top.z);
  uvs.push(0.5, 1);

  for (let j = 1; j < rows; j += 1) {
    const v = j / rows;
    for (let i = 0; i < cols; i += 1) {
      const u = i / cols;
      const p = map(u, v);
      positions.push(p.x, p.y, p.z);
      uvs.push(u, 1 - v);
    }
  }

  const bottom = map(0, 1);
  const bottomIndex = 1 + cols * (rows - 1);
  positions.push(bottom.x, bottom.y, bottom.z);
  uvs.push(0.5, 0);

  const ring = (j: number) => 1 + (j - 1) * cols;

  for (let i = 0; i < cols; i += 1) {
    const next = (i + 1) % cols;
    indices.push(0, ring(1) + next, ring(1) + i);
  }

  for (let j = 1; j < rows - 1; j += 1) {
    const a0 = ring(j);
    const a1 = ring(j + 1);
    for (let i = 0; i < cols; i += 1) {
      const next = (i + 1) % cols;
      indices.push(a0 + i, a0 + next, a1 + next);
      indices.push(a0 + i, a1 + next, a1 + i);
    }
  }

  const lastRing = ring(rows - 1);
  for (let i = 0; i < cols; i += 1) {
    const next = (i + 1) % cols;
    indices.push(lastRing + i, lastRing + next, bottomIndex);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Tube swept along a curve with a per-t curve radius. Used for brows, lashes,
 * seams, trims and hair strands.
 */
export function sweptTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusAt: (t: number) => number,
  tubularSegments = 48,
  radialSegments = 8,
  scaleN = 1,
  scaleB = 1
): THREE.BufferGeometry {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    const center = curve.getPointAt(t);
    const radius = Math.max(0.0015, radiusAt(t));
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    for (let j = 0; j < radialSegments; j += 1) {
      const angle = (j / radialSegments) * TAU;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      positions.push(
        center.x + normal.x * cos * radius * scaleN + binormal.x * sin * radius * scaleB,
        center.y + normal.y * cos * radius * scaleN + binormal.y * sin * radius * scaleB,
        center.z + normal.z * cos * radius * scaleN + binormal.z * sin * radius * scaleB
      );
    }
  }

  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const next = (j + 1) % radialSegments;
      const a = i * radialSegments + j;
      const b = i * radialSegments + next;
      const c = (i + 1) * radialSegments + next;
      const d = (i + 1) * radialSegments + j;
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Lofts a stack of equal-length rings. Rings are ordered bottom to top and
 * each ring is expected to run counter-clockwise in XZ. Caps are optional.
 */
export function loftRings(
  rings: THREE.Vector3[][],
  capStart = false,
  capEnd = false
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const ringSize = rings[0].length;

  for (const ring of rings) {
    for (const p of ring) positions.push(p.x, p.y, p.z);
  }

  for (let r = 0; r < rings.length - 1; r += 1) {
    const base = r * ringSize;
    const nextBase = (r + 1) * ringSize;
    for (let i = 0; i < ringSize; i += 1) {
      const next = (i + 1) % ringSize;
      const a = base + i;
      const b = base + next;
      const c = nextBase + next;
      const d = nextBase + i;
      indices.push(a, c, b);
      indices.push(a, d, c);
    }
  }

  const addCap = (ringIndex: number, flip: boolean) => {
    const ring = rings[ringIndex];
    const center = new THREE.Vector3();
    for (const p of ring) center.add(p);
    center.divideScalar(ring.length);
    const centerIndex = positions.length / 3;
    positions.push(center.x, center.y, center.z);
    const ringStart = ringIndex * ringSize;
    for (let i = 0; i < ring.length; i += 1) {
      const next = (i + 1) % ring.length;
      if (flip) {
        indices.push(centerIndex, ringStart + next, ringStart + i);
      } else {
        indices.push(centerIndex, ringStart + i, ringStart + next);
      }
    }
  };

  if (capStart) addCap(0, false);
  if (capEnd) addCap(rings.length - 1, true);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function superellipseRing(
  y: number,
  rx: number,
  rz: number,
  centerX = 0,
  centerZ = 0,
  segments = 72,
  exponent = 2.4
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const power = 2 / exponent;
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * TAU;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = centerX + Math.sign(cos) * Math.pow(Math.abs(cos), power) * rx;
    const z = centerZ + Math.sign(sin) * Math.pow(Math.abs(sin), power) * rz;
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

/** Sphere cap centred on +Z, used for iris and pupil. */
export function frontCap(
  radius: number,
  halfAngle: number,
  segments = 48,
  rings = 10
): THREE.BufferGeometry {
  const positions: number[] = [0, 0, radius];
  const uvs: number[] = [0.5, 0.5];
  const indices: number[] = [];
  const cols = segments;
  const rim = Math.max(1e-5, Math.sin(halfAngle));

  // Seam duplicated so the radial iris texture does not smear.
  for (let r = 1; r <= rings; r += 1) {
    const a = (r / rings) * halfAngle;
    for (let i = 0; i <= cols; i += 1) {
      const b = (i / cols) * TAU;
      const x = radius * Math.sin(a) * Math.cos(b);
      const y = radius * Math.sin(a) * Math.sin(b);
      positions.push(x, y, radius * Math.cos(a));
      uvs.push(
        0.5 + x / (2 * radius * rim),
        0.5 + y / (2 * radius * rim)
      );
    }
  }

  const stride = cols + 1;
  const ringStart = (r: number) => 1 + (r - 1) * stride;

  for (let i = 0; i < cols; i += 1) {
    indices.push(0, ringStart(1) + i, ringStart(1) + i + 1);
  }

  for (let r = 1; r < rings; r += 1) {
    const a = ringStart(r);
    const b = ringStart(r + 1);
    for (let i = 0; i < cols; i += 1) {
      indices.push(a + i, a + i + 1, b + i + 1);
      indices.push(a + i, b + i + 1, b + i);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Eyelid shell around an eye centred at the origin, +Z forward.
 * Elevation is measured from the eye equator; azimuth wraps sideways.
 */
export function lidPatch(
  radius: number,
  elevMin: number,
  elevMax: number,
  azimMin: number,
  azimMax: number,
  elevSegments = 8,
  azimSegments = 20
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= elevSegments; i += 1) {
    const el = elevMin + ((elevMax - elevMin) * i) / elevSegments;
    for (let j = 0; j <= azimSegments; j += 1) {
      const az = azimMin + ((azimMax - azimMin) * j) / azimSegments;
      const cosEl = Math.cos(el);
      positions.push(
        radius * Math.sin(az) * cosEl,
        radius * Math.sin(el),
        radius * Math.cos(az) * cosEl
      );
    }
  }

  const stride = azimSegments + 1;
  for (let i = 0; i < elevSegments; i += 1) {
    for (let j = 0; j < azimSegments; j += 1) {
      const a = i * stride + j;
      const b = a + 1;
      const c = a + stride + 1;
      const d = a + stride;
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function curveFrom(
  points: Array<number[]>,
  tension = 0.5
): THREE.CatmullRomCurve3 {
  const vectors = points.map(
    ([x, y, z]) => new THREE.Vector3(x, y, z)
  );
  const curve = new THREE.CatmullRomCurve3(vectors, false, "catmullrom", tension);
  return curve;
}
