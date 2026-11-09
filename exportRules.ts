import { ESLintUtils, type ParserServicesWithTypeInformation, type TSESTree } from "@typescript-eslint/utils";
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
  ts.isTypeAliasDeclaration(declaration) &&
  ts.isTypeReferenceNode(declaration.type) &&
  zodInferTypes.includes(declaration.type.typeName.getText());

const isSchemaExport = (checker: ts.TypeChecker, symbol: ts.Symbol): boolean =>
  (!isValue(symbol) || checker.getTypeOfSymbol(symbol).getProperty("_zod") !== undefined) &&
  (symbol.declarations ?? [])
    .filter((declaration) => ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))
    .every(isZodInferAlias);

const isFunctionExport = (checker: ts.TypeChecker, symbol: ts.Symbol): boolean =>
  !isValue(symbol) || checker.getTypeOfSymbol(symbol).getCallSignatures().length > 0;

const schemaExports = createRule({
  meta: {
    type: "problem",
    schema: [],
    messages: { notSchema: "`{{name}}` must be a zod schema or a z.infer type." },
    defaultOptions: [],
  },
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const checker = services.program.getTypeChecker();
    return {
      Program(program): void {
        exportsOf(services, program)
          .filter(({ symbol }) => !isSchemaExport(checker, symbol))
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

export const exportRules = {
  rules: { "schema-exports": schemaExports, "function-exports": functionExports },
};
