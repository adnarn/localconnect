import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, cp } from "fs/promises";
import { chdir } from "process";
import path from "path";

console.log("🔨 Build script starting...");

const allowlist = [
  "bcryptjs",
  "better-sqlite3",
  "date-fns",
  "dotenv",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-session",
  "memorystore",
  "multer",
  "nanoid",
  "ws",
  "zod",
  "zod-validation-error",
];

// Native modules that need to be bundled
const nativeModules = ["better-sqlite3"];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  const originalDir = process.cwd();
  chdir("client");
  await viteBuild({ configFile: "vite.config.ts" });
  chdir(originalDir);

  // Copy client build to dist/public for server
  console.log("copying client build to dist/public...");
  await mkdir("dist", { recursive: true });
  await cp("client/dist", "dist/public", { recursive: true });

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
