#!/usr/bin/env node
/**
 * Removes every `node_modules` and `dist` directory under the repo root.
 * Safe for the codebase: reinstall deps (npm/pnpm/yarn) and rebuild to restore.
 *
 * Usage:
 *   node scripts/clean-node-modules-and-dist.mjs              # from repo root, uses cwd
 *   node scripts/clean-node-modules-and-dist.mjs /path/to/api
 *   node scripts/clean-node-modules-and-dist.mjs --dry-run   # print only, no deletes
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2).filter((a) => a !== "--dry-run");
const dryRun = process.argv.includes("--dry-run");
const rootArg = args.find((a) => !a.startsWith("-"));
const ROOT = path.resolve(rootArg ?? process.cwd());

const SKIP_NAMES = new Set([".git", ".svn", ".hg"]);

/**
 * Only records the root of each tree; does not descend into node_modules or dist.
 */
function collectTargets(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (SKIP_NAMES.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (!ent.isDirectory()) continue;
    if (ent.name === "node_modules" || ent.name === "dist") {
      out.push(full);
      continue;
    }
    collectTargets(full, out);
  }
}

function rmRecursive(p) {
  const opts = { recursive: true, force: true };
  if (typeof fs.rmSync === "function") {
    fs.rmSync(p, opts);
  } else {
    fs.rmdirSync(p, { recursive: true });
  }
}

const targets = [];
collectTargets(ROOT, targets);

if (targets.length === 0) {
  console.log(`No node_modules or dist folders under ${ROOT}`);
  process.exit(0);
}

console.log(
  dryRun
    ? `[dry-run] Would remove ${targets.length} director(y/ies):`
    : `Removing ${targets.length} director(y/ies):`
);
for (const p of targets.sort()) {
  console.log(`  ${p}`);
}

if (dryRun) {
  process.exit(0);
}

let failed = 0;
for (const p of targets) {
  try {
    if (fs.existsSync(p)) {
      rmRecursive(p);
    }
  } catch (err) {
    failed += 1;
    console.error(`Failed: ${p}`, err.message ?? err);
  }
}

if (failed > 0) {
  console.error(`\n${failed} path(s) could not be removed (files in use or permissions).`);
  process.exit(1);
}

console.log("Done. Run your package manager install and build where needed.");
