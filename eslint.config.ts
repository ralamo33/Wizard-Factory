import js from "@eslint/js";
import byethrow from "@praha/byethrow-oxlint";
import stylistic from "@stylistic/eslint-plugin";
import type { ESLint } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import functional from "eslint-plugin-functional";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import playwright from "eslint-plugin-playwright";
import reactHooks from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

import { exportRules } from "./exportRules.ts";

const namingConvention = [
  { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
  { selector: "import", format: ["camelCase", "PascalCase"] },
  { selector: "function", format: ["camelCase", "PascalCase"] },
  { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow" },
  { selector: "typeLike", format: ["PascalCase"] },
  { selector: "objectLiteralProperty", format: null },
  { selector: "variable", types: ["boolean"], format: ["PascalCase"], prefix: ["is", "has", "should", "can"] },
];

export default defineConfig(
  globalIgnores(["**/routeTree.gen.ts", "**/dist/"]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat["recommended-latest"],
  {
    linterOptions: {
      noInlineConfig: true,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      // Oxlint's Plugin type allows `fixable: null`, which ESLint's type rejects; runtime is ESLint-compatible.
      byethrow: byethrow as unknown as ESLint.Plugin,
      functional,
      unicorn,
      "@stylistic": stylistic,
      "simple-import-sort": simpleImportSort,
      "import-x": importX,
      // typescript-eslint's RuleModule type doesn't match ESLint's Plugin type; runtime is compatible.
      wizard: exportRules as unknown as ESLint.Plugin,
    },
    settings: {
      "import-x/extensions": [".ts", ".tsx", ".js"],
      "import-x/parsers": { "@typescript-eslint/parser": [".ts", ".tsx"] },
      "import-x/resolver-next": [createNodeResolver()],
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSTypeReference[typeName.name='Record'][typeArguments.params.0.type=/^TS(String|Number)Keyword$/]",
          message: "Use Map<K, V> for dynamic keys. Record is only for a fixed union of keys.",
        },
        {
          selector: "TSIndexSignature",
          message: "Use Map<K, V> for dynamic keys.",
        },
      ],
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/ban-ts-comment": ["error", { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true, "ts-check": false }],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/strict-boolean-expressions": ["error", { allowString: false, allowNumber: false, allowNullableObject: false }],
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/strict-void-return": "error",
      "@typescript-eslint/prefer-readonly-parameter-types": ["error", { ignoreInferredTypes: true }],
      "@typescript-eslint/naming-convention": ["error", ...namingConvention],
      eqeqeq: "error",
      "no-implicit-coercion": "error",
      "no-param-reassign": ["error", { props: false }],
      "no-await-in-loop": "error",
      "no-nested-ternary": "error",
      "max-depth": ["error", 3],
      "max-params": ["error", 8],
      "max-nested-callbacks": ["error", 3],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: ["const", "let"], next: "*" },
        { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },
        { blankLine: "always", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block-like", next: "*" },
      ],
      "no-console": "error",
      "no-warning-comments": "error",
      "functional/no-let": "error",
      "functional/no-throw-statements": "error",
      "functional/no-try-statements": "error",
      "functional/no-loop-statements": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/no-null": "error",
      "unicorn/filename-case": ["error", { case: "camelCase" }],
      "import-x/no-default-export": "error",
      "import-x/no-cycle": "error",
      "import-x/no-extraneous-dependencies": "error",
      "byethrow/consistent-namespace": "error",
      "byethrow/no-ambiguous-error-type": "error",
      "byethrow/no-ambiguous-success-type": "error",
      "byethrow/no-negated-type-guards": "error",
      "byethrow/prefer-result-async": "error",
      "byethrow/prefer-result-maybe-async": "error",
    },
  },
  {
    files: ["eslint.config.ts"],
    rules: {
      "import-x/no-default-export": "off",
      "unicorn/no-null": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  {
    files: ["domain/src/**/*.ts"],
    rules: {
      "wizard/schema-exports": "error",
    },
  },
  {
    files: ["service/src/**/*.ts"],
    rules: {
      "wizard/function-exports": "error",
    },
  },
  {
    files: ["trpc/src/**/*.ts"],
    rules: {
      "wizard/function-exports": ["error", { allow: ["appRouter", "publicProcedure"] }],
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
    },
  },
  {
    files: ["exportRules.ts"],
    rules: {
      "@typescript-eslint/prefer-readonly-parameter-types": "off",
      "@typescript-eslint/naming-convention": ["error", ...namingConvention, { selector: "objectLiteralMethod", filter: "^Program$", format: null }],
    },
  },
  {
    ...playwright.configs["flat/recommended"],
    files: ["web/e2e/**/*.ts"],
  },
  {
    files: ["web/vite.config.ts", "web/playwright.config.ts"],
    rules: {
      "import-x/no-default-export": "off",
    },
  },
  {
    files: ["tools/src/checkTsconfigs.ts"],
    rules: {
      "no-console": "off",
    },
  },
  eslintConfigPrettier,
  {
    rules: {
      curly: ["error", "all"],
    },
  },
);
