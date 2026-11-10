import js from "@eslint/js";
import byethrow from "@praha/byethrow-oxlint";
import stylistic from "@stylistic/eslint-plugin";
import type { ESLint } from "eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import functional from "eslint-plugin-functional";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import playwright from "eslint-plugin-playwright";
import react from "eslint-plugin-react";
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

const restrictedSyntax = [
  {
    selector: "TSTypeReference[typeName.name='Record'][typeArguments.params.0.type=/^TS(String|Number)Keyword$/]",
    message: "Use Map<K, V> for dynamic keys. Record is only for a fixed union of keys.",
  },
  {
    selector: "TSIndexSignature",
    message: "Use Map<K, V> for dynamic keys.",
  },
];

const textLocator = "CallExpression[callee.property.name=/^getBy(Label|Text|Placeholder)$/]";
const withoutExact = ":not(:has(Property[key.name='exact'][value.value=true]))";
const exactMessage = "Pass { exact: true } so the locator cannot match a longer string.";

const locatorSyntax = [
  { selector: `${textLocator}:not([arguments.1])`, message: exactMessage },
  { selector: `${textLocator} > ObjectExpression${withoutExact}`, message: exactMessage },
  {
    selector: `CallExpression[callee.property.name='getByRole'] > ObjectExpression:has(Property[key.name='name'])${withoutExact}`,
    message: "Pass exact: true with name so the role cannot match a longer accessible name.",
  },
  {
    selector: "CallExpression[callee.property.name='getByTestId']",
    message: "Test IDs are banned; locate by role, label, text or placeholder.",
  },
];

const storeReexportMessage = "service must wrap store functions in its own function, not re-export them.";

const serviceSyntax = [
  ...restrictedSyntax,
  { selector: "ExportNamedDeclaration[source.value=/^@wizard.store/]", message: storeReexportMessage },
  { selector: "ExportAllDeclaration[source.value=/^@wizard.store/]", message: storeReexportMessage },
];

const contextIndexSyntax = [
  { selector: "ExportAllDeclaration", message: "A context index re-exports each function by name; export * is banned." },
  {
    selector: "ExportNamedDeclaration[source]:has(ExportSpecifier ~ ExportSpecifier)",
    message: "A context index re-exports one function per statement.",
  },
  { selector: "ImportDeclaration", message: "A context index never imports then exports; re-export each function with export { x } from ./x.ts." },
];

const stateLibraries = ["zustand", "jotai", "redux", "react-redux", "@reduxjs/toolkit"];
const stateLibraryMessage = "State lives in react-query or React; no external stores.";
const zodMessage = "web validates through @wizard/domain schemas and never imports zod.";
const animationLibraries = ["framer-motion", "gsap", "@gsap/react", "react-spring", "react-transition-group", "@formkit/auto-animate"];
const animationLibraryMessage = "Motion (motion/react) is the only animation library.";

const webImportPaths = [
  { name: "zod", message: zodMessage },
  ...stateLibraries.map((name) => ({ name, message: stateLibraryMessage })),
  ...animationLibraries.map((name) => ({ name, message: animationLibraryMessage })),
  {
    name: "react",
    importNames: ["default"],
    message: "Import React APIs by name, never through a default or namespace import, so lint can see restricted ones like createContext.",
  },
];

const webImportPatterns = [
  { group: ["zod/*"], message: zodMessage },
  { group: stateLibraries.map((name) => `${name}/*`), message: stateLibraryMessage },
  { group: [...animationLibraries.map((name) => `${name}/*`), "@react-spring/*"], message: animationLibraryMessage },
];

const createContextPath = {
  name: "react",
  importNames: ["createContext"],
  message: "createContext is allowed only in web/src/contextsGlobal and web/src/genericComponents.",
};

const reactQueryHooksPattern = {
  group: ["@tanstack/react-query"],
  importNamePattern: "^use",
  message: "Only domainViews/*/queries.ts may call react-query hooks; pass data down as props and events up as callbacks.",
};

const rawFormControlSyntax = {
  selector: "JSXOpeningElement[name.name=/^(input|select|textarea)$/]",
  message: "Use a genericComponents field such as TextField so the label, aria-invalid and error text stay wired.",
};

const rawTableSyntax = {
  selector: "JSXOpeningElement[name.name=/^(table|thead|tbody|tr|th|td|caption)$/]",
  message: "Use genericComponents/dataTable.tsx or table.tsx so the caption, headers and sort state stay accessible.",
};

const contextFile = "Program:has(ImportSpecifier[imported.name='createContext'])";
const notProviderOrHook = ":not([name=/(Provider$|^use[A-Z])/])";
const contextExportMessage = "A Context file exports only its XProvider and useX, never the Context object.";
const exportedVariable = `${contextFile} ExportNamedDeclaration > VariableDeclaration > VariableDeclarator`;

const contextExportSyntax = [
  { selector: `${exportedVariable} > Identifier.id${notProviderOrHook}`, message: contextExportMessage },
  {
    selector: `${exportedVariable}:not([init.type=/^(ArrowFunctionExpression|FunctionExpression)$/])`,
    message: "A Context file's XProvider and useX are functions; exporting any other value can leak the Context object.",
  },
  { selector: `${contextFile} ExportNamedDeclaration > FunctionDeclaration > Identifier.id${notProviderOrHook}`, message: contextExportMessage },
  {
    selector: `${contextFile} ExportNamedDeclaration[exportKind='value'] > ExportSpecifier[exportKind='value']`,
    message: "A Context file exports XProvider and useX as declarations, never through export { … }, so the Context object cannot be renamed out.",
  },
  { selector: `${contextFile} ExportAllDeclaration`, message: contextExportMessage },
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
      "no-restricted-syntax": ["error", ...restrictedSyntax],
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
    files: ["domain/src/shared/**/*.ts"],
    rules: {
      "wizard/schema-exports": ["error", { allowSchemaFactories: true }],
    },
  },
  {
    files: ["service/src/**/*.ts"],
    rules: {
      "wizard/function-exports": "error",
      "no-restricted-syntax": ["error", ...serviceSyntax],
    },
  },
  {
    files: ["service/src/*/index.ts"],
    rules: {
      "wizard/index-reexports": "error",
      "no-restricted-syntax": ["error", ...serviceSyntax, ...contextIndexSyntax],
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
      "@typescript-eslint/naming-convention": [
        "error",
        ...namingConvention,
        { selector: "objectLiteralMethod", filter: "^(Program|Literal|TemplateElement|Property|ExportNamedDeclaration)$", format: null },
      ],
    },
  },
  {
    ...jsxA11y.flatConfigs.strict,
    files: ["web/src/**/*.tsx"],
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      "jsx-a11y/no-noninteractive-tabindex": "off",
    },
  },
  {
    files: ["web/src/**/*.tsx"],
    plugins: { react },
    settings: { react: { version: "19.3" } },
    rules: {
      "react/jsx-handler-names": "error",
      "react/jsx-no-constructed-context-values": "error",
    },
  },
  {
    files: ["web/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [...webImportPaths, createContextPath], patterns: [...webImportPatterns, reactQueryHooksPattern] }],
    },
  },
  {
    files: ["web/src/**/*.{ts,tsx}"],
    ignores: ["web/src/**/*Chart.tsx"],
    rules: {
      "wizard/semantic-colors": "error",
    },
  },
  {
    files: ["web/src/**/*.{ts,tsx}"],
    ignores: ["web/src/genericComponents/motionTokens.ts"],
    rules: {
      "wizard/motion-tokens": "error",
    },
  },
  {
    files: ["web/src/domainViews/*/queries.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [...webImportPaths, createContextPath], patterns: webImportPatterns }],
    },
  },
  {
    files: ["web/src/contextsGlobal/**", "web/src/genericComponents/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: webImportPaths, patterns: [...webImportPatterns, reactQueryHooksPattern] }],
    },
  },
  {
    files: ["web/src/**/*.tsx"],
    ignores: ["web/src/genericComponents/**"],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax, rawFormControlSyntax, rawTableSyntax],
    },
  },
  {
    files: ["web/src/contextsGlobal/**"],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax, rawFormControlSyntax, rawTableSyntax, ...contextExportSyntax],
      "functional/no-throw-statements": "off",
    },
  },
  {
    files: ["web/src/genericComponents/**"],
    rules: {
      "no-restricted-syntax": ["error", ...restrictedSyntax, ...contextExportSyntax],
    },
  },
  {
    files: ["web/src/genericComponents/**/*Section.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "Program", message: "genericComponents are display-only; a *Section.tsx container belongs in a domain view or a route folder." },
      ],
    },
  },
  {
    files: ["web/src/genericComponents/**/*Context.tsx"],
    rules: {
      "functional/no-throw-statements": "off",
    },
  },
  {
    ...playwright.configs["flat/recommended"],
    files: ["web/e2e/**/*.ts"],
  },
  {
    files: ["web/e2e/**/*.ts"],
    rules: {
      "playwright/no-raw-locators": "error",
      "playwright/prefer-native-locators": "error",
      "playwright/no-nth-methods": "error",
      "playwright/prefer-web-first-assertions": "error",
      "no-restricted-syntax": ["error", ...restrictedSyntax, ...locatorSyntax],
    },
  },
  {
    files: ["web/e2e/**/*.spec.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { paths: [{ name: "@playwright/test", importNames: ["test"], message: "Import test from ./fixtures.ts so every test runs the axe check." }] },
      ],
    },
  },
  {
    // TanStack Router ignores `-`-prefixed folders, which is how route-private code lives beside its route.
    files: ["web/src/routes/**/-*/**"],
    rules: {
      "unicorn/filename-case": ["error", { case: "camelCase", checkDirectories: false }],
    },
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
