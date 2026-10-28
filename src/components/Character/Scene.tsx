import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildCharacter, type CharacterState } from "./utils/buildCharacter";
import { buildLighting } from "./utils/lighting";
import "./Character.css";

type DebugWindow = Window & {
  __SADOK_VESPER__?: {
    getState: () => CharacterState;
    blink: () => void;
    setPointer: (x: number, y: number) => void;
    setView: (azimuthDeg: number, elevationDeg?: number, zoom?: number) => void;
    resetView: () => void;
    project: (x: number, y: number, z: number) => { x: number; y: number; z: number } | null;
    analyze: () => Record<string, unknown>;
    ascii: (cols?: number, rows?: number) => string[];
    idMap: (side: number, cols?: number, rows?: number) => string[];
    simulate: (px: number, py: number, frames?: number) => CharacterState;
    probe: (points: number[][]) => Array<{ world: number[]; screen: number[]; rgba: number[] } | null>;
    ready: boolean;
  };
};

/**
 * SADOK // VESPER
 *
 * An original human bust authored entirely with Three.js geometry.
 *
 * Safety rules:
 * - If WebGL is unavailable the canvas is never mounted and the CSS fallback stays.
 * - Weak devices get reduced geometry, fewer particles and a lower pixel ratio.
 * - Reduced-motion visitors get a single static frame.
 * - The loop pauses when the hero is off-screen or the tab is hidden.
 * - Every GPU resource, texture, environment map and listener is released.
 */
const Scene = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch (error) {
      console.warn("WebGL unavailable — using the static fallback.", error);
      setFailed(true);
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const weakDevice =
      window.innerWidth < 680 ||
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const detail = !weakDevice;

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.16;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = detail;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 1.38, 7.5);

    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "character__canvas";
    mount.appendChild(canvas);

    const lighting = buildLighting(scene, renderer);
    const character = buildCharacter(detail);
    scene.add(character.group);

    const clock = new THREE.Clock();
    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let frame = 0;
    let visible = true;
    let inView = true;
    let touchTimer = 0;

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      const aspect = width / height;

      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, detail ? 2 : 1.5)
      );
      renderer.setSize(width, height, false);

      camera.aspect = aspect;
      const halfFov = Math.tan((camera.fov * Math.PI) / 360);
      const fitDistance = 1.38 / (halfFov * Math.max(0.35, aspect));
      const distance = Math.max(7.5, fitDistance);
      camera.position.set(0, 1.38, distance);
      camera.lookAt(0, 1.2, 0);
      camera.updateProjectionMatrix();

      renderer.render(scene, camera);
    };

    const setFromClient = (clientX: number, clientY: number) => {
      pointerTarget.set(
        (clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        (clientY / Math.max(1, window.innerHeight)) * 2 - 1
      );
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        setFromClient(event.clientX, event.clientY);
        window.clearTimeout(touchTimer);
        touchTimer = window.setTimeout(() => pointerTarget.set(0, 0), 1800);
        return;
      }
      setFromClient(event.clientX, event.clientY);
    };

    const onTouchEnd = () => {
      window.clearTimeout(touchTimer);
      touchTimer = window.setTimeout(() => pointerTarget.set(0, 0), 1200);
    };

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) pointerTarget.set(0, 0);
    };

    const onWindowBlur = () => pointerTarget.set(0, 0);

    const renderFrame = () => {
      frame = requestAnimationFrame(renderFrame);
      if (!visible || !inView) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, delta * 9);
      pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, delta * 9);
      character.update(elapsed, pointer, delta, reduced);
      renderer.render(scene, camera);
    };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) clock.getDelta();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const intersection = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.02 }
    );
    intersection.observe(mount);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut);
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("blur", onWindowBlur);

    resize();
    clock.start();

    const canvasSnapshot = () => {
      renderer.render(scene, camera);
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const ctx = off.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(canvas, 0, 0, off.width, off.height);
      return ctx.getImageData(0, 0, off.width, off.height);
    };

    const projectPoint = (x: number, y: number, z: number) => {
      const vector = new THREE.Vector3(x, y, z).project(camera);
      return {
        x: (vector.x + 1) / 2,
        y: (1 - vector.y) / 2,
        z: vector.z,
      };
    };

    const analyze = () => {
      const image = canvasSnapshot();
      if (!image) return { error: "canvas is not readable" };
      const { width, height } = image;
      const pixels = image.data;
      const alphaThreshold = 48;

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      let opaque = 0;
      let skin = 0;
      let dark = 0;
      let violet = 0;
      let sumX = 0;
      let sumY = 0;

      const bands = Array.from({ length: 12 }, () => ({
        count: 0,
        minX: width,
        maxX: -1,
      }));

      for (let py = 0; py < height; py += 1) {
        for (let px = 0; px < width; px += 1) {
          const i = (py * width + px) * 4;
          const a = pixels[i + 3];
          if (a < alphaThreshold) continue;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          opaque += 1;
          sumX += px;
          sumY += py;
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
          if (r > 70 && r >= g && g >= b * 0.75 && r - b > 16) skin += 1;
          if (r < 52 && g < 52 && b < 62) dark += 1;
          if (b > 105 && b - g > 26 && r > 34) violet += 1;
        }
      }

      if (maxX < 0) return { error: "nothing rendered" };

      const bbH = maxY - minY + 1;
      for (let py = minY; py <= maxY; py += 1) {
        const band = Math.min(11, Math.floor(((py - minY) / bbH) * 12));
        for (let px = 0; px < width; px += 1) {
          const i = (py * width + px) * 4;
          if (pixels[i + 3] < alphaThreshold) continue;
          bands[band].count += 1;
          if (px < bands[band].minX) bands[band].minX = px;
          if (px > bands[band].maxX) bands[band].maxX = px;
        }
      }

      const sample = (x: number, y: number, z: number) => {
        const p = projectPoint(x, y, z);
        const px = Math.round(p.x * (width - 1));
        const py = Math.round(p.y * (height - 1));
        if (px < 0 || py < 0 || px >= width || py >= height) return null;
        const i = (py * width + px) * 4;
        return {
          rgba: [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]],
          screen: [+(px / width).toFixed(4), +(py / height).toFixed(4)],
        };
      };

      return {
        width,
        height,
        pixelRatio: +(width / Math.max(1, canvas.clientWidth)).toFixed(3),
        coverage: +(opaque / (width * height)).toFixed(4),
        bbox: {
          x0: +(minX / width).toFixed(4),
          x1: +((maxX + 1) / width).toFixed(4),
          y0: +(minY / height).toFixed(4),
          y1: +((maxY + 1) / height).toFixed(4),
          w: +((maxX - minX + 1) / width).toFixed(4),
          h: +((maxY - minY + 1) / height).toFixed(4),
        },
        centroid: {
          x: +(sumX / opaque / width).toFixed(4),
          y: +(sumY / opaque / height).toFixed(4),
        },
        colorShare: {
          skin: +(skin / opaque).toFixed(3),
          dark: +(dark / opaque).toFixed(3),
          violet: +(violet / opaque).toFixed(3),
        },
        bands: bands.map((band, index) => ({
          band: index,
          count: band.count,
          left: band.maxX >= 0 ? +((width / 2 - band.minX) / width).toFixed(4) : 0,
          right: band.maxX >= 0 ? +((band.maxX - width / 2) / width).toFixed(4) : 0,
        })),
        landmarks: {
          crown: sample(0, 2.9, 0),
          hairLeft: sample(-0.42, 2.62, 0.3),
          hairRight: sample(0.42, 2.62, 0.3),
          forehead: sample(0, 2.38, 0.62),
          cheekLeft: sample(-0.38, 1.9, 0.5),
          cheekRight: sample(0.38, 1.9, 0.5),
          templeLeft: sample(-0.55, 2.28, 0.32),
          templeRight: sample(0.55, 2.28, 0.32),
          eyeLeft: sample(-0.318, 2.1, 0.62),
          eyeRight: sample(0.318, 2.1, 0.62),
          noseBridge: sample(0, 2.18, 0.72),
          noseTip: sample(0, 1.795, 0.87),
          lipUpper: sample(0, 1.53, 0.76),
          lipLower: sample(0, 1.46, 0.76),
          chin: sample(0, 1.26, 0.56),
          jawLeft: sample(-0.44, 1.5, 0.42),
          jawRight: sample(0.44, 1.5, 0.42),
          neck: sample(0, 1.05, 0.3),
          chest: sample(0, 0.35, 0.42),
          shoulderLeft: sample(-0.82, 0.62, 0.2),
          shoulderRight: sample(0.82, 0.62, 0.2),
        },
      };
    };

    const probe = (points: number[][]) => {
      const image = canvasSnapshot();
      if (!image) return points.map(() => null);
      const { width, height } = image;
      const pixels = image.data;
      return points.map(([x, y, z]) => {
        const p = projectPoint(x, y, z);
        const px = Math.round(p.x * (width - 1));
        const py = Math.round(p.y * (height - 1));
        if (px < 0 || py < 0 || px >= width || py >= height) return null;
        const i = (py * width + px) * 4;
        return {
          world: [x, y, z],
          screen: [+(px / width).toFixed(4), +(py / height).toFixed(4)],
          rgba: [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]],
        };
      });
    };

    const baseCamera = camera.position.clone();
    const baseTarget = new THREE.Vector3(0, 1.2, 0);
    const setView = (azimuthDeg: number, elevationDeg = 0, zoom = 1) => {
      const radius = baseCamera.distanceTo(baseTarget) / Math.max(0.4, zoom);
      const az = (azimuthDeg * Math.PI) / 180;
      const el = (elevationDeg * Math.PI) / 180;
      camera.position.set(
        baseTarget.x + radius * Math.sin(az) * Math.cos(el),
        baseTarget.y + radius * Math.sin(el),
        baseTarget.z + radius * Math.cos(az) * Math.cos(el)
      );
      camera.lookAt(baseTarget);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
    };

    const ascii = (cols = 64, rows = 64) => {
      const image = canvasSnapshot();
      if (!image) return ["canvas is not readable"];
      const { width, height } = image;
      const pixels = image.data;
      const out: string[] = [];

      for (let ry = 0; ry < rows; ry += 1) {
        let line = "";
        for (let rx = 0; rx < cols; rx += 1) {
          const x0 = Math.floor((rx / cols) * width);
          const x1 = Math.max(x0 + 1, Math.floor(((rx + 1) / cols) * width));
          const y0 = Math.floor((ry / rows) * height);
          const y1 = Math.max(y0 + 1, Math.floor(((ry + 1) / rows) * height));
          let r = 0;
          let g = 0;
          let b = 0;
          let a = 0;
          let n = 0;
          for (let y = y0; y < y1; y += 2) {
            for (let x = x0; x < x1; x += 2) {
              const i = (y * width + x) * 4;
              r += pixels[i];
              g += pixels[i + 1];
              b += pixels[i + 2];
              a += pixels[i + 3];
              n += 1;
            }
          }
          if (n === 0 || a / n < 40) {
            line += " ";
            continue;
          }
          r /= n;
          g /= n;
          b /= n;
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const skin = r > 62 && r >= g && g >= b * 0.72 && r - b > 18;
          const violet = b > r + 18 && b > 52;
          if (skin) line += lum > 118 ? "S" : "s";
          else if (violet) line += lum > 96 ? "V" : "v";
          else {
            const ramp = " .:-=+*#%@";
            const index = Math.min(
              ramp.length - 1,
              Math.max(1, Math.round((lum / 220) * (ramp.length - 1)))
            );
            line += ramp[index];
          }
        }
        out.push(line);
      }
      return out;
    };

    const asciiLabel = (object: THREE.Object3D): string => {
      let node: THREE.Object3D | null = object;
      for (let depth = 0; depth < 4 && node; depth += 1) {
        const name = node.name;
        if (name === "pupil") return "P";
        if (name === "iris") return "I";
        if (name === "eyeball") return "E";
        if (name === "upper-lid-skin") return "U";
        if (name === "lower-lid-skin") return "L";
        if (name === "lash" || name === "upper-lid" || name === "lower-lid")
          return "#";
        if (name === "head-mesh") return "s";
        if (name === "nose" || name === "nose-wing") return "n";
        if (name === "upper-lip" || name === "lower-lip") return "m";
        if (name === "brow") return "b";
        if (name === "ear") return "e";
        if (name === "hair-cap" || name === "hair-lock" || name === "fringe")
          return "h";
        if (
          name === "jacket" ||
          name === "collar" ||
          name === "arm" ||
          name === "neck-mesh" ||
          name === "zipper"
        )
          return "c";
        node = node.parent;
      }
      return "?";
    };

    const idMap = (side: number, cols = 49, rows = 27) => {
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const cx = side * 0.318;
      const width = 0.34;
      const height = 0.23;
      const out: string[] = [];

      for (let ry = 0; ry < rows; ry += 1) {
        let line = "";
        for (let rx = 0; rx < cols; rx += 1) {
          const wx = cx - width / 2 + ((rx + 0.5) / cols) * width;
          const wy =
            2.1 + height / 2 - ((ry + 0.5) / rows) * height;
          const p = projectPoint(wx, wy, 0.75);
          if (p.x < 0 || p.x > 1 || p.y < 0 || p.y > 1) {
            line += " ";
            continue;
          }
          ndc.set(p.x * 2 - 1, 1 - p.y * 2);
          raycaster.setFromCamera(ndc, camera);
          const hit = raycaster
            .intersectObject(character.group, true)
            .find((entry) => (entry.object as THREE.Mesh).isMesh);
          line += hit ? asciiLabel(hit.object) : " ";
        }
        out.push(line);
      }
      return out;
    };

    const simulate = (px: number, py: number, frames = 180) => {
      pointerTarget.set(px, py);
      const dt = 1 / 60;
      for (let i = 0; i < frames; i += 1) {
        pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, dt * 9);
        pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, dt * 9);
        clock.elapsedTime += dt;
        character.update(clock.elapsedTime, pointer, dt, false);
      }
      renderer.render(scene, camera);
      return character.getState();
    };

    const resetView = () => {
      camera.position.copy(baseCamera);
      camera.lookAt(baseTarget);
      camera.updateMatrixWorld();
      renderer.render(scene, camera);
    };

    let debugWindow: DebugWindow | null = null;
    if (import.meta.env.DEV) {
      debugWindow = window as DebugWindow;
      debugWindow.__SADOK_VESPER__ = {
        getState: character.getState,
        blink: character.blinkNow,
        setPointer: (x: number, y: number) => pointerTarget.set(x, y),
        setView,
        resetView,
        project: projectPoint,
        analyze,
        ascii,
        idMap,
        simulate,
        probe,
        ready: true,
      };
    }

    if (reduced) {
      character.update(0, pointer, 0.016, true);
      renderer.render(scene, camera);
    } else {
      renderFrame();
    }

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(touchTimer);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("blur", onWindowBlur);

      if (debugWindow) delete debugWindow.__SADOK_VESPER__;

      scene.remove(character.group);
      character.dispose();
      lighting.dispose();

      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, []);

  return (
    <div className="character">
      <div className="character__stage" ref={mountRef} />
      {failed && (
        <p className="character__fallback-note">
          عرض <span className="latin">3D</span> غير متاح على هذا الجهاز — النسخة
          الثابتة معروضة بدلًا منه.
        </p>
      )}
      <div className="character__caption" aria-hidden="true">
        <span className="character__caption-name latin">SADOK // VESPER</span>
        <span className="character__caption-meta latin">
          PROCEDURAL CHARACTER · WEBGL
        </span>
      </div>
    </div>
  );
};

export default Scene;
