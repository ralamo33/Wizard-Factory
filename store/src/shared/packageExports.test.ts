import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";

import { closeDb } from "./dbTestOnly.ts";

const packageRoot = new URL("../../", import.meta.url);
const testOnlySubpath = "./dbTestOnly";

const subpathsOf = (manifest: unknown): readonly (readonly [string, unknown])[] =>
  typeof manifest === "object" && manifest !== null && "exports" in manifest && typeof manifest.exports === "object" && manifest.exports !== null
    ? Object.entries(manifest.exports)
    : [];

const runtimeExportsOf = async ([subpath, file]: readonly [string, unknown]): Promise<readonly [string, readonly string[]]> => {
  const module: unknown = await import(new URL(String(file), packageRoot).href);

  return [subpath, typeof module === "object" && module !== null ? Object.keys(module).toSorted() : []];
};

after(closeDb);

test("store exposes only transactionSealed and the repositories at runtime", async () => {
  const manifest: unknown = JSON.parse(await readFile(new URL("package.json", packageRoot), "utf8"));
  const runtimeSubpaths = subpathsOf(manifest).filter(([subpath]) => subpath !== testOnlySubpath);
  const runtimeExports = Object.fromEntries(await Promise.all(runtimeSubpaths.map(runtimeExportsOf)));

  assert.deepEqual(runtimeExports, { "./identity": ["users"], "./shared": ["transactionSealed"] });
});
