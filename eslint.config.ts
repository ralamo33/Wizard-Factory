import js from "@eslint/js";
import byethrow from "@praha/byethrow-oxlint";
import type { ESLint } from "eslint";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import functional from "eslint-plugin-functional";
import unicorn from "eslint-plugin-unicorn";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
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
      "import-x": importX,
    },
    settings: {
      "import-x/extensions": [".ts", ".js"],
      "import-x/parsers": { "@typescript-eslint/parser": [".ts"] },
      "import-x/resolver-next": [createNodeResolver()],
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "TSTypeReference[typeName.name='Record'][typeArguments.params.0.type=/^TS(String|Number)Keyword$/]",
          message: "Use Map<K, V> for dynamic keys. Record is only for a fixed union of keys.",
        },
        {
          selector: "TSIndexSignature",
          message: "Use Map<K, V> for dynamic keys.",
        },
      ],
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true, "ts-check": false },
      ],
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        { allowString: false, allowNumber: false, allowNullableObject: false },
      ],
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/strict-void-return": "error",
      "@typescript-eslint/prefer-readonly-parameter-types": ["error", { ignoreInferredTypes: true }],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "import", format: ["camelCase", "PascalCase"] },
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"], leadingUnderscore: "allow" },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "objectLiteralProperty", format: null },
        { selector: "variable", types: ["boolean"], format: ["PascalCase"], prefix: ["is", "has", "should", "can"] },
      ],
      eqeqeq: "error",
      "no-implicit-coercion": "error",
      "no-param-reassign": ["error", { props: false }],
      "no-await-in-loop": "error",
      curly: ["error", "all"],
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
    files: ["tools/src/checkTsconfigs.ts"],
    rules: {
      "no-console": "off",
    },
  },
);
