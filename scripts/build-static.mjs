import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets/img", { recursive: true });

await Promise.all([
  cp("index.html", "dist/index.html"),
  cp("assets/img/hero-elzbieta.jpg", "dist/assets/img/hero-elzbieta.jpg"),
  cp("assets/img/about-elzbieta.jpg", "dist/assets/img/about-elzbieta.jpg"),
  cp("assets/img/extra-elzbieta.jpg", "dist/assets/img/extra-elzbieta.jpg"),
]);
