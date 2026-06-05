import { build, context } from "esbuild";
import { mkdir, copyFile } from "fs/promises";
import path from "path";

const outdir = "build";
const entryPoints = {
  background: "src/background/index.ts",
  content: "src/content/index.ts",
  popup: "src/popup/popup.ts",
};

const buildOptions = {
  entryPoints,
  outdir,
  bundle: true,
  format: "esm",
  sourcemap: true,
  target: ["es2020"],
  platform: "browser",
};

async function copyAssets() {
  await mkdir(outdir, { recursive: true });
  const popupSource = path.join("src", "popup", "popup.html");
  const popupTarget = path.join(outdir, "popup.html");
  await copyFile(popupSource, popupTarget);
}

async function run() {
  const isWatch = process.argv.includes("--watch");

  if (isWatch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    await copyAssets();
    console.log("Extension build watching...");
    return;
  }

  await build(buildOptions);
  await copyAssets();
  console.log("Extension build complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
