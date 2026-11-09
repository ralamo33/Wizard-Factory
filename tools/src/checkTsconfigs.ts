import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const baseConfig = "../tsconfig.base.json";
const requiredLeaf = JSON.stringify({ extends: baseConfig });
const browserPackages = new Set(["web"]);

const leafConfigs = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== "node_modules")
  .map((entry) => ({ name: entry.name, path: join(root, entry.name, "tsconfig.json") }))
  .filter(({ path }) => existsSync(path));

const extendsBase = (parsed: unknown): boolean =>
  typeof parsed === "object" && parsed !== null && "extends" in parsed && parsed.extends === baseConfig;

const isValid = (name: string, path: string): boolean => {
  const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));

  return browserPackages.has(name) ? extendsBase(parsed) : JSON.stringify(parsed) === requiredLeaf;
};

const violations = leafConfigs.filter(({ name, path }) => !isValid(name, path));

violations.forEach(({ name, path }) => {
  console.error(
    browserPackages.has(name)
      ? `${path} must extend ${baseConfig}`
      : `${path} must be exactly ${requiredLeaf}; shared settings belong in tsconfig.base.json`,
  );
});

process.exitCode = violations.length === 0 ? 0 : 1;
