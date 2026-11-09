import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { ESLint } from "eslint";
import tseslint from "typescript-eslint";

const root = join(import.meta.dirname, "..", "..");
const eslint = new ESLint({ cwd: root, overrideConfig: tseslint.configs.disableTypeChecked });
const typedEslint = new ESLint({
  cwd: root,
  overrideConfig: {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["tools/src/fixture.ts", "tools/src/fixture_file.ts"],
          defaultProject: "tools/tsconfig.json",
        },
        tsconfigRootDir: root,
      },
    },
  },
});

const restrictedSyntaxCount = async (code: string): Promise<number> => {
  const [result] = await eslint.lintText(code, {
    filePath: join(root, "tools", "src", "fixture.ts"),
  });
  assert.ok(result !== undefined);
  assert.equal(result.fatalErrorCount, 0);
  return result.messages.filter((message) => message.ruleId === "no-restricted-syntax").length;
};

type LintOptions = Readonly<{ fileName?: string; isTyped?: boolean }>;

const reportedRules = async (
  code: string,
  { fileName = "fixture.ts", isTyped = true }: LintOptions = {},
): Promise<readonly (string | null)[]> => {
  const linter = isTyped ? typedEslint : eslint;
  const [result] = await linter.lintText(code, { filePath: join(root, "tools", "src", fileName) });
  assert.ok(result !== undefined);
  assert.equal(result.fatalErrorCount, 0, result.messages[0]?.message);
  return result.messages.map((message) => message.ruleId);
};

const assertReports = async (rule: string, code: string, options?: LintOptions): Promise<void> => {
  assert.ok((await reportedRules(code, options)).includes(rule), `expected ${rule} to be reported`);
};

await test("bans Record with string keys", async () => {
  assert.equal(await restrictedSyntaxCount("export type Users = Record<string, number>;\n"), 1);
});

await test("bans Record with number keys", async () => {
  assert.equal(await restrictedSyntaxCount("export type Users = Record<number, number>;\n"), 1);
});

await test("bans index signatures", async () => {
  assert.equal(await restrictedSyntaxCount("export interface Users { [id: string]: number }\n"), 1);
});

await test("allows Record with a fixed union of keys", async () => {
  assert.equal(await restrictedSyntaxCount('export type Labels = Record<"admin" | "member", string>;\n'), 0);
});

await test("ignores eslint-disable comments", async () => {
  await assertReports(
    "eqeqeq",
    "// eslint-disable-next-line eqeqeq\nexport const same = (a: number, b: number): boolean => a == b;\n",
  );
});

await test("bans type assertions", async () => {
  await assertReports("@typescript-eslint/consistent-type-assertions", 'export const n = JSON.parse("1") as number;\n');
});

await test("bans ts-expect-error even with a description", async () => {
  await assertReports(
    "@typescript-eslint/ban-ts-comment",
    '// @ts-expect-error -- deliberately assigning a string here\nexport const n: number = "x";\n',
  );
});

await test("requires explicit return types", async () => {
  await assertReports("@typescript-eslint/explicit-function-return-type", "export const one = () => 1;\n");
});

await test("requires exhaustive switches", async () => {
  await assertReports(
    "@typescript-eslint/switch-exhaustiveness-check",
    'export const label = (role: "a" | "b"): string => {\n  switch (role) {\n    case "a": {\n      return "A";\n    }\n  }\n  return "";\n};\n',
  );
});

await test("requires boolean conditions", async () => {
  await assertReports(
    "@typescript-eslint/strict-boolean-expressions",
    'export const describe = (name: string): string => (name ? "named" : "anonymous");\n',
  );
});

await test("requires a compare function for sort", async () => {
  await assertReports(
    "@typescript-eslint/require-array-sort-compare",
    "export const sorted = (xs: readonly number[]): number[] => [...xs].sort();\n",
  );
});

await test("requires promise-returning functions to be async", async () => {
  await assertReports(
    "@typescript-eslint/promise-function-async",
    "export const later = (): Promise<number> => Promise.resolve(1);\n",
  );
});

await test("bans shadowed variables", async () => {
  await assertReports(
    "@typescript-eslint/no-shadow",
    "export const value = 1;\nexport const read = (value: number): number => value;\n",
  );
});

await test("bans returning values where void is expected", async () => {
  await assertReports(
    "@typescript-eslint/strict-void-return",
    "const run = (fn: () => void): void => {\n  fn();\n};\nrun(() => 1);\n",
  );
});

await test("requires strict equality", async () => {
  await assertReports("eqeqeq", "export const same = (a: number, b: number): boolean => a == b;\n");
});

await test("bans implicit coercion", async () => {
  await assertReports("no-implicit-coercion", 'export const text = (n: number): string => "" + n;\n');
});

await test("bans reassigning parameters", async () => {
  await assertReports(
    "no-param-reassign",
    "export const bump = (n: number): number => {\n  n = n + 1;\n  return n;\n};\n",
  );
});

await test("bans await inside loops", async () => {
  await assertReports(
    "no-await-in-loop",
    "export const all = async (xs: readonly Promise<number>[]): Promise<void> => {\n  for (const x of xs) {\n    await x;\n  }\n};\n",
  );
});

await test("requires braces on every block", async () => {
  await assertReports(
    "curly",
    "export const sign = (n: number): number => {\n  if (n > 0) return 1;\n  return 0;\n};\n",
  );
});

await test("bans throw statements", async () => {
  await assertReports(
    "functional/no-throw-statements",
    'export const fail = (): never => {\n  throw new Error("x");\n};\n',
  );
});

await test("bans try statements", async () => {
  await assertReports(
    "functional/no-try-statements",
    "export const safe = (): number => {\n  try {\n    return 1;\n  } catch {\n    return 0;\n  }\n};\n",
  );
});

await test("bans loop statements", async () => {
  await assertReports(
    "functional/no-loop-statements",
    "export const visit = (xs: readonly number[]): void => {\n  for (const x of xs) {\n    void x;\n  }\n};\n",
  );
});

await test("bans let", async () => {
  await assertReports("functional/no-let", "export let count = 1;\n");
});

await test("requires readonly parameters", async () => {
  await assertReports(
    "@typescript-eslint/prefer-readonly-parameter-types",
    "export const total = (xs: number[]): number => xs.length;\n",
  );
});

await test("bans console", async () => {
  await assertReports("no-console", 'console.log("x");\n');
});

await test("bans warning comments", async () => {
  await assertReports("no-warning-comments", "// TODO: later\nexport const one = 1;\n");
});

await test("requires the node: protocol", async () => {
  await assertReports(
    "unicorn/prefer-node-protocol",
    'import { readFileSync } from "fs";\nexport const read = readFileSync;\n',
  );
});

await test("bans null", async () => {
  await assertReports("unicorn/no-null", "export const nothing = null;\n");
});

await test("requires camelCase filenames", async () => {
  await assertReports("unicorn/filename-case", "export const one = 1;\n", { fileName: "fixture_file.ts" });
});

await test("enforces naming conventions", async () => {
  await assertReports("@typescript-eslint/naming-convention", "export const Bad_name = 1;\n");
});

await test("requires boolean names to start with a prefix", async () => {
  await assertReports("@typescript-eslint/naming-convention", "export const ready = Math.random() > 0.5;\n");
});

await test("bans default exports", async () => {
  await assertReports("import-x/no-default-export", "const one = 1;\nexport default one;\n");
});

await test("bans imports missing from package.json", async () => {
  await assertReports(
    "import-x/no-extraneous-dependencies",
    'import ts from "typescript";\nexport const version = ts.version;\n',
    { isTyped: false },
  );
});

const byethrowImport = 'import { Result } from "@praha/byethrow";\n';

await test("requires the Result namespace for byethrow", async () => {
  await assertReports(
    "byethrow/consistent-namespace",
    'import { R } from "@praha/byethrow";\nexport type Parsed = R.Result<number, "invalid">;\n',
  );
});

await test("bans ambiguous Result error types", async () => {
  await assertReports(
    "byethrow/no-ambiguous-error-type",
    `${byethrowImport}export type Parsed = Result.Result<number, Error>;\n`,
  );
});

await test("bans ambiguous Result success types", async () => {
  await assertReports(
    "byethrow/no-ambiguous-success-type",
    `${byethrowImport}export type Parsed = Result.Result<unknown, "invalid">;\n`,
  );
});

await test("bans negated Result type guards", async () => {
  await assertReports(
    "byethrow/no-negated-type-guards",
    `${byethrowImport}export const isBroken = (parsed: Result.Result<number, "invalid">): boolean => !Result.isSuccess(parsed);\n`,
  );
});

await test("requires ResultAsync over Promise of Result", async () => {
  await assertReports(
    "byethrow/prefer-result-async",
    `${byethrowImport}export type Later = Promise<Result.Result<number, "invalid">>;\n`,
  );
});

await test("requires ResultMaybeAsync over a Result or ResultAsync union", async () => {
  await assertReports(
    "byethrow/prefer-result-maybe-async",
    `${byethrowImport}export type Either = Result.Result<number, "invalid"> | Result.ResultAsync<number, "invalid">;\n`,
  );
});

await test("ignores eslint-disable comments for byethrow rules", async () => {
  await assertReports(
    "byethrow/no-ambiguous-error-type",
    `${byethrowImport}// eslint-disable-next-line byethrow/no-ambiguous-error-type\nexport type Parsed = Result.Result<number, Error>;\n`,
  );
});

const projectEslint = new ESLint({ cwd: root });

const packageFileRules = async (packageName: string, code: string): Promise<readonly (string | null)[]> => {
  const fixtureDir = mkdtempSync(join(root, packageName, "src", "fixture-"));
  const filePath = join(fixtureDir, "fixture.ts");
  writeFileSync(filePath, code);
  const results = await projectEslint.lintFiles(filePath);
  rmSync(fixtureDir, { recursive: true });
  const [result] = results;
  assert.ok(result !== undefined);
  assert.equal(result.fatalErrorCount, 0, result.messages[0]?.message);
  return result.messages.map((message) => message.ruleId);
};

await test("bans function exports from domain", async () => {
  const rules = await packageFileRules("domain", "export const one = (): number => 1;\n");
  assert.ok(rules.includes("wizard/schema-exports"));
});

await test("bans interface exports from domain", async () => {
  const rules = await packageFileRules("domain", "export interface Named {\n  readonly name: string;\n}\n");
  assert.ok(rules.includes("wizard/schema-exports"));
});

await test("allows zod schemas and inferred types in domain", async () => {
  const rules = await packageFileRules(
    "domain",
    'import { z } from "zod";\nexport const nameSchema = z.string();\nexport type Name = z.infer<typeof nameSchema>;\n',
  );
  assert.equal(rules.includes("wizard/schema-exports"), false);
});

await test("bans non-function exports from trpc", async () => {
  const rules = await packageFileRules("trpc", "export const limit = 10;\n");
  assert.ok(rules.includes("wizard/function-exports"));
});

await test("allows function exports from trpc", async () => {
  const rules = await packageFileRules("trpc", "export const one = (): number => 1;\n");
  assert.equal(rules.includes("wizard/function-exports"), false);
});

const mapMutation = 'const counts = new Map<string, number>();\nexport const count = (): void => {\n  counts.set("a", 1);\n};\n';

await test("bans data mutation in trpc", async () => {
  const rules = await packageFileRules("trpc", mapMutation);
  assert.ok(rules.includes("functional/immutable-data"));
});

await test("allows data mutation in store", async () => {
  const rules = await packageFileRules("store", mapMutation);
  assert.equal(rules.includes("functional/immutable-data"), false);
});

await test("bans import cycles", async (context) => {
  const cycleDir = mkdtempSync(join(root, "tools", "src", "cycle-"));
  context.after(() => {
    rmSync(cycleDir, { recursive: true });
  });
  writeFileSync(join(cycleDir, "first.ts"), 'import { second } from "./second.ts";\nexport const first = second;\n');
  writeFileSync(join(cycleDir, "second.ts"), 'import { first } from "./first.ts";\nexport const second = first;\n');
  const [result] = await eslint.lintFiles(join(cycleDir, "first.ts"));
  assert.ok(result !== undefined);
  assert.ok(result.messages.some((message) => message.ruleId === "import-x/no-cycle"));
});
