import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";

const html = await readFile("out/index.html", "utf8");
assert.ok(
  html.includes("Compare investimentos"),
  "Headline must exist before hydration",
);
assert.ok(html.includes("LCI / LCA"), "Comparison must exist before hydration");
assert.ok(
  html.includes("Evolução do ganho líquido"),
  "Chart must be prerendered",
);
assert.ok(
  !html.includes("Carregando..."),
  "Do not replace the page with a loading gate",
);
const assets = [
  ...new Set(
    [...html.matchAll(/(?:src|href)="([^"?]+\.(?:js|css))[^\"]*"/g)].map(
      (match) => match[1],
    ),
  ),
];
assert.ok(assets.length > 0, "Build must include its assets");
assert.ok(
  assets.every((asset) => asset.startsWith("/_next/")),
  "No third-party scripts or styles on first load",
);
const bytes =
  gzipSync(html).length +
  (
    await Promise.all(
      assets.map(
        async (asset) => gzipSync(await readFile(`out${asset}`)).length,
      ),
    )
  ).reduce((sum, size) => sum + size, 0);
assert.ok(
  bytes < 220 * 1024,
  `Initial HTML, JS and CSS exceeded 220 KiB gzip: ${bytes} bytes`,
);
console.log(
  `Static HTML, comparison and SVG verified. Initial HTML + JS + CSS: ${(bytes / 1024).toFixed(1)} KiB gzip (budget: 220 KiB).`,
);
