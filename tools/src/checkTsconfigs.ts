import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const requiredLeaf = JSON.stringify({ extends: "../tsconfig.base.json" });

const leafConfigs = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "node_modules")
  .map((entry) => join(root, entry.name, "tsconfig.json"))
  .filter((path) => existsSync(path));

const violations = leafConfigs.filter((path) => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
  return JSON.stringify(parsed) !== requiredLeaf;
});

violations.forEach((path) => {
  console.error(`${path} must be exactly ${requiredLeaf}; shared settings belong in tsconfig.base.json`);
});

process.exitCode = violations.length === 0 ? 0 : 1;
