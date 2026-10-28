import * as THREE from "three";

/**
 * Cinematic lighting for VESPER.
 *
 * The environment map is painted into a canvas at runtime (violet softboxes
 * over a near-black studio), then pre-filtered with PMREM. Nothing is loaded
 * from disk, so the scene keeps the "no external assets" rule.
 */
function createEnvironment(
  renderer: THREE.WebGLRenderer
): { texture: THREE.Texture; dispose: () => void } {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return {
      texture: new THREE.Texture(),
      dispose: () => undefined,
    };
  }

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#07040f");
  sky.addColorStop(0.38, "#1b0f36");
  sky.addColorStop(0.55, "#2a1750");
  sky.addColorStop(0.72, "#0d0719");
  sky.addColorStop(1, "#030208");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const softbox = (
    x: number,
    y: number,
    radius: number,
    inner: string,
    outer: string
  ) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.45, outer);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };

  softbox(250, 150, 230, "rgba(255, 238, 226, 0.95)", "rgba(255, 178, 140, 0.22)");
  softbox(742, 186, 200, "rgba(140, 176, 255, 0.72)", "rgba(70, 98, 200, 0.16)");
  softbox(560, 370, 260, "rgba(156, 92, 255, 0.42)", "rgba(90, 46, 170, 0.1)");
  softbox(70, 300, 170, "rgba(255, 118, 214, 0.22)", "rgba(120, 40, 120, 0.06)");

  const floor = ctx.createLinearGradient(0, height * 0.6, 0, height);
  floor.addColorStop(0, "rgba(0,0,0,0)");
  floor.addColorStop(1, "rgba(4, 2, 10, 0.85)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * 0.6, width, height * 0.4);

  const equirect = new THREE.CanvasTexture(canvas);
  equirect.mapping = THREE.EquirectangularReflectionMapping;
  equirect.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(equirect);
  const texture = target.texture;
  pmrem.dispose();
  equirect.dispose();

  return {
    texture,
    dispose: () => {
      target.dispose();
      texture.dispose();
    },
  };
}

export function buildLighting(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer
) {
  const environment = createEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.7;

  const hemi = new THREE.HemisphereLight(0xa99cff, 0x120b1c, 0.8);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffe5d6, 3.1);
  key.position.set(3.1, 4.8, 4.6);
  key.target.position.set(0, 1.55, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 3.4;
  key.shadow.camera.bottom = -1.6;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.022;
  scene.add(key, key.target);

  const fill = new THREE.DirectionalLight(0x9db4ff, 2.1);
  fill.position.set(-4.6, 2.4, 4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xa45cff, 3.4);
  rim.position.set(-3.4, 3.4, -4.2);
  rim.target.position.set(0, 1.9, 0);
  scene.add(rim, rim.target);

  const rimBlue = new THREE.DirectionalLight(0x4f8dff, 2.2);
  rimBlue.position.set(3.8, 1.4, -3.8);
  rimBlue.target.position.set(0, 1.6, 0);
  scene.add(rimBlue, rimBlue.target);

  const bounce = new THREE.PointLight(0xffb3a4, 4.2, 6, 2);
  bounce.position.set(0.35, 0.35, 3.4);
  scene.add(bounce);

  return {
    environment,
    dispose: () => {
      scene.remove(hemi, key, key.target, fill, rim, rim.target, rimBlue, rimBlue.target, bounce);
      hemi.dispose();
      key.dispose();
      fill.dispose();
      rim.dispose();
      rimBlue.dispose();
      bounce.dispose();
      scene.environment = null;
      scene.environmentIntensity = 1;
      environment.dispose();
    },
  };
}
