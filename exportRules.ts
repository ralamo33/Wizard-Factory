import path from "node:path";

import { AST_NODE_TYPES as AstNodeTypes, ESLintUtils, type ParserServicesWithTypeInformation, type TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";

type Exported = Readonly<{ name: string; symbol: ts.Symbol; node: TSESTree.Node }>;

const createRule = ESLintUtils.RuleCreator.withoutDocs;

const zodInferTypes: readonly string[] = ["z.infer", "z.input", "z.output"];

const exportsOf = (services: ParserServicesWithTypeInformation, program: TSESTree.Program): readonly Exported[] => {
  const checker = services.program.getTypeChecker();
  const moduleSymbol = checker.getSymbolAtLocation(services.esTreeNodeToTSNodeMap.get(program));

  return (moduleSymbol === undefined ? [] : checker.getExportsOfModule(moduleSymbol)).map((exportSymbol) => {
    const declaration = exportSymbol.declarations?.[0];

    return {
      name: exportSymbol.getName(),
      symbol: (exportSymbol.flags & ts.SymbolFlags.Alias) === 0 ? exportSymbol : checker.getAliasedSymbol(exportSymbol),
      node: (declaration === undefined ? undefined : services.tsNodeToESTreeNodeMap.get(declaration)) ?? program,
    };
  });
};

const isValue = (symbol: ts.Symbol): boolean => (symbol.flags & ts.SymbolFlags.Value) !== 0;

const isZodInferAlias = (declaration: ts.Declaration): boolean =>
  ts.isTypeAliasDeclaration(declaration) && ts.isTypeReferenceNode(declaration.type) && zodInferTypes.includes(declaration.type.typeName.getText());

const isSchemaExport = (checker: ts.TypeChecker, symbol: ts.Symbol): boolean =>
  (!isValue(symbol) || checker.getTypeOfSymbol(symbol).getProperty("_zod") !== undefined) &&
  (symbol.declarations ?? [])
    .filter((declaration) => ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))
    .every(isZodInferAlias);

const isFunctionExport = (checker: ts.TypeChecker, symbol: ts.Symbol): boolean =>
  !isValue(symbol) || checker.getTypeOfSymbol(symbol).getCallSignatures().length > 0;

const isSchemaFactoryExport = (checker: ts.TypeChecker, symbol: ts.Symbol): boolean => {
  const signatures = isValue(symbol) ? checker.getTypeOfSymbol(symbol).getCallSignatures() : [];

  return signatures.length > 0 && signatures.every((signature) => checker.getReturnTypeOfSignature(signature).getProperty("_zod") !== undefined);
};

type SchemaExportsOptions = [Readonly<{ allowSchemaFactories: boolean }>];

const schemaExports = createRule<SchemaExportsOptions, "notSchema">({
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: { allowSchemaFactories: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
    messages: { notSchema: "`{{name}}` must be a zod schema or a z.infer type." },
    defaultOptions: [{ allowSchemaFactories: false }],
  },
  create(context, [{ allowSchemaFactories }]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      Program(program): void {
        exportsOf(services, program)
          .filter(({ symbol }) => !isSchemaExport(checker, symbol) && !(allowSchemaFactories && isSchemaFactoryExport(checker, symbol)))
          .forEach(({ name, node }) => {
            context.report({ node, messageId: "notSchema", data: { name } });
          });
      },
    };
  },
});

type FunctionExportsOptions = [Readonly<{ allow: readonly string[] }>];

const functionExports = createRule<FunctionExportsOptions, "notFunction">({
  meta: {
    type: "problem",
    schema: [
      {
        type: "object",
        properties: { allow: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
    messages: { notFunction: "`{{name}}` must be a function." },
    defaultOptions: [{ allow: [] }],
  },
  create(context, [{ allow }]) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();

    return {
      Program(program): void {
        exportsOf(services, program)
          .filter(({ name, symbol }) => !allow.includes(name) && !isFunctionExport(checker, symbol))
          .forEach(({ name, node }) => {
            context.report({ node, messageId: "notFunction", data: { name } });
          });
      },
    };
  },
});

const paletteHues =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const paletteColor = `(?:(?:${paletteHues})-(?:50|[1-9]00|950)|white|black)`;

const bannedColorPatterns: readonly RegExp[] = [
  new RegExp(`(?<![\\w-])[a-z][a-z-]*-${paletteColor}(?![\\w-])`, "u"),
  new RegExp(`--color-${paletteColor}(?![\\w-])`, "u"),
  /(?<![\w#&])#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})(?![\w-])/iu,
  /\b(?:rgba?|hsla?|oklch|oklab)\(/iu,
];

const hasBannedColor = (text: string): boolean => bannedColorPatterns.some((pattern) => pattern.test(text));

const isHrefValue = (node: TSESTree.Literal): boolean =>
  node.parent.type === AstNodeTypes.JSXAttribute && node.parent.name.type === AstNodeTypes.JSXIdentifier && node.parent.name.name === "href";

const semanticColors = createRule({
  meta: {
    type: "problem",
    schema: [],
    messages: {
      bannedColor:
        "Palette and raw colors are banned in web/src; use a semantic token from src/index.css, or name the file *Chart.tsx for data visualization.",
    },
    defaultOptions: [],
  },
  create(context) {
    return {
      Literal(node): void {
        if (typeof node.value === "string" && !isHrefValue(node) && hasBannedColor(node.value)) {
          context.report({ node, messageId: "bannedColor" });
        }
      },
      TemplateElement(node): void {
        if (hasBannedColor(node.value.raw)) {
          context.report({ node, messageId: "bannedColor" });
        }
      },
    };
  },
});

const classSegments = /(?:\[[^\]]*\]|\([^)]*\)|[^:[(])+/gu;
const rawTimingUtility = /^(?:(?:duration|delay)-(?:\d[\d.]*|\[.*\]|\(.*\))|ease-(?:\[.*\]|\(.*\)|in|out|in-out|linear)|animate-(?:\[.*\]|\(.*\)))$/u;
const animateUtility = /^animate-(?!none$)[\w-]+$/u;
const reducedMotionVariant = /^motion-(?:safe|reduce)$/u;

type ClassProblem = "rawTiming" | "unguardedAnimation";

const classProblem = (token: string): ClassProblem | undefined => {
  const segments = token.match(classSegments) ?? [];
  const utility = (segments.at(-1) ?? "").replaceAll("!", "").replace(/^-/u, "");

  if (rawTimingUtility.test(utility)) {
    return "rawTiming";
  }

  return animateUtility.test(utility) && !segments.slice(0, -1).some((variant) => reducedMotionVariant.test(variant))
    ? "unguardedAnimation"
    : undefined;
};

const stringProblems = (text: string): readonly (ClassProblem | "cubicBezier")[] => [
  ...(/cubic-bezier\(/iu.test(text) ? ["cubicBezier" as const] : []),
  ...text.split(/\s+/u).flatMap((token) => classProblem(token) ?? []),
];

const styleTimingKeys: readonly string[] = ["animationDuration", "animationDelay", "transitionDuration", "transitionDelay"];
const motionTimingKeys: readonly string[] = [
  "duration",
  "delay",
  "ease",
  "delayChildren",
  "staggerChildren",
  "bounce",
  "visualDuration",
  "stiffness",
  "damping",
  "mass",
];
const transitionTypes: readonly unknown[] = ["spring", "tween"];
const motionProps: readonly string[] = [
  "transition",
  "animate",
  "initial",
  "exit",
  "whileHover",
  "whileTap",
  "whileInView",
  "whileFocus",
  "variants",
];
const literalInText = /(?<![\w$])\d|["'`[]/u;

const propertyName = (property: TSESTree.Property): string | undefined => {
  if (property.computed) {
    return undefined;
  }

  if (property.key.type === AstNodeTypes.Identifier) {
    return property.key.name;
  }

  return typeof property.key.value === "string" ? property.key.value : undefined;
};

const isMotionContext = (node: TSESTree.Node): boolean => {
  if (node.type === AstNodeTypes.Program) {
    return false;
  }

  if (node.type === AstNodeTypes.JSXAttribute) {
    return node.name.type === AstNodeTypes.JSXIdentifier && motionProps.includes(node.name.name);
  }

  return (node.type === AstNodeTypes.Property && propertyName(node) === "transition") || isMotionContext(node.parent);
};

const isStaticValue = (node: TSESTree.Node): boolean =>
  node.type === AstNodeTypes.Literal || (node.type === AstNodeTypes.TemplateLiteral && node.expressions.length === 0);

const motionTokens = createRule({
  meta: {
    type: "problem",
    schema: [],
    messages: {
      rawTiming:
        "Numeric and arbitrary durations, delays, easings and animations are banned; use a motion token from src/index.css (duration-fast, ease-standard, animate-*).",
      unguardedAnimation: "Prefix animate-* with motion-safe: (or motion-reduce:) so it respects prefers-reduced-motion.",
      cubicBezier: "cubic-bezier() is banned outside the motion tokens; use ease-* in CSS or ease from genericComponents/motionTokens.ts.",
      styleTiming: "Hard-coded animation and transition timings are banned in style objects; use a motion token or compute the value.",
      motionTiming:
        "Motion durations, delays, easings and springs must come from genericComponents/motionTokens.ts (...spring.smooth, duration.fast, ease.enter, i * staggerStep).",
    },
    defaultOptions: [],
  },
  create(context) {
    const tokenNames = context.sourceCode.ast.body.flatMap((statement) =>
      statement.type === AstNodeTypes.ImportDeclaration && /motionTokens(?:\.ts)?$/u.test(statement.source.value)
        ? statement.specifiers.map((specifier) => specifier.local.name)
        : [],
    );
    const referencesToken = (text: string): boolean => tokenNames.some((name) => new RegExp(`(?<![\\w$.])${name}(?![\\w$])`, "u").test(text));

    const reportString = (node: TSESTree.Node, text: string): void => {
      new Set(stringProblems(text)).forEach((messageId) => {
        context.report({ node, messageId });
      });
    };

    return {
      Literal(node): void {
        if (typeof node.value === "string") {
          reportString(node, node.value);
        }
      },
      TemplateElement(node): void {
        reportString(node, node.value.raw);
      },
      Property(node): void {
        const name = propertyName(node) ?? "";

        if (styleTimingKeys.includes(name) && isStaticValue(node.value)) {
          context.report({ node: node.value, messageId: "styleTiming" });
        }

        const valueText = context.sourceCode.getText(node.value);

        const isLiteralTiming = motionTimingKeys.includes(name) && literalInText.test(valueText) && !referencesToken(valueText);
        const isLiteralType = name === "type" && node.value.type === AstNodeTypes.Literal && transitionTypes.includes(node.value.value);

        if ((isLiteralTiming || isLiteralType) && isMotionContext(node.parent)) {
          context.report({ node: node.value, messageId: "motionTiming" });
        }
      },
    };
  },
});

const specifierName = (name: TSESTree.Identifier | TSESTree.StringLiteral): string =>
  name.type === AstNodeTypes.Identifier ? name.name : name.value;

const indexReexports = createRule({
  meta: {
    type: "problem",
    schema: [],
    messages: { nameMismatch: "`{{name}}` must be named after its file `{{file}}`; a context index re-exports one function per file." },
    defaultOptions: [],
  },
  create(context) {
    return {
      ExportNamedDeclaration(node): void {
        if (node.source === null) {
          return;
        }

        const file = path.basename(node.source.value, path.extname(node.source.value));

        node.specifiers
          .filter((specifier) => specifierName(specifier.exported) !== file)
          .forEach((specifier) => {
            context.report({ node: specifier, messageId: "nameMismatch", data: { name: specifierName(specifier.exported), file } });
          });
      },
    };
  },
});

export const exportRules = {
  rules: {
    "schema-exports": schemaExports,
    "function-exports": functionExports,
    "semantic-colors": semanticColors,
    "motion-tokens": motionTokens,
    "index-reexports": indexReexports,
  },
};
