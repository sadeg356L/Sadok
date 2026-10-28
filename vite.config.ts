import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * The referenced template ships an encrypted 3D avatar whose license forbids
 * reuse. Those files were removed. This guard makes sure they can never be
 * re-added to a build by accident.
 */
const FORBIDDEN = [
  /\.enc$/i,
  /\.hdr$/i,
  /\.glb$/i,
  /\.gltf$/i,
  /\.fbx$/i,
  /\.vrm$/i,
];

function findForbidden(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stats = statSync(full);

    if (stats.isDirectory()) return findForbidden(full);
    return FORBIDDEN.some((pattern) => pattern.test(entry)) ? [full] : [];
  });
}

const guardProprietaryAssets = (): Plugin => ({
  name: "sadok:guard-proprietary-assets",
  apply: "build",
  buildStart() {
    const found = findForbidden(join(process.cwd(), "public"));
    if (found.length > 0) {
      this.error(
        `Licensed/3D model files are not allowed in this project:\n${found.join(
          "\n"
        )}`
      );
    }
  },
  closeBundle() {
    const found = findForbidden(join(process.cwd(), "dist"));
    if (found.length > 0) {
      this.error(
        `A 3D asset leaked into dist/ and must not be deployed:\n${found.join(
          "\n"
        )}`
      );
    }
  },
});

// https://vite.dev/config/
export default defineConfig({
  // Relative base keeps the build portable on GitHub Pages project sites.
  base: "./",
  plugins: [react(), guardProprietaryAssets()],
  build: {
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
  },
});
