import { cp, mkdir, rm } from "node:fs/promises";

// Stage only public teaching resources, never the repository or essays directory.
// Astro serves this same directory in development and copies it during build.
await rm(".legacy-public", { recursive: true, force: true });
await mkdir(".legacy-public", { recursive: true });
for (const directory of ["learning-the-instrument", "mechanics-of-music", "thematic-elements"]) {
  await cp(directory, `.legacy-public/${directory}`, { recursive: true });
}
await cp("public", ".legacy-public", { recursive: true });
await cp("barbershop-analyzer/dist", ".legacy-public/barbershop-analyzer", { recursive: true });
