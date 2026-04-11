import { genExport, genImport, genObjectFromRaw, genTypeImport } from "knitwork";
import { codeTemplate, textTemplate, type GeneratedTemplate } from "./render.js";

// ─── Name helpers ─────────────────────────────────────────────────────────────

/** "my-plugin" → "MyPlugin" */
export function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** "my-plugin" → "myPlugin" */
export function toCamelCase(name: string): string {
  const pascal = toPascalCase(name);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Returns the full npm package name.
 *
 * @param name  - The package name in kebab-case (e.g. `"gwen-my-plugin"` or `"my-plugin"`)
 * @param scope - Optional npm scope without `@` (e.g. `"monorg"`)
 * @returns `@scope/name` if scope is provided and non-empty, otherwise `name`
 *
 * @example
 * toPackageName("gwen-my-plugin", "monorg") // "@monorg/gwen-my-plugin"
 * toPackageName("gwen-my-plugin")           // "gwen-my-plugin"
 * toPackageName("my-plugin", "monorg")      // "@monorg/my-plugin"
 * toPackageName("my-plugin")                // "my-plugin"
 */
export function toPackageName(name: string, scope?: string): string {
  return scope ? `@${scope}/${name}` : name;
}

// ─── Templates ────────────────────────────────────────────────────────────────

const knitworkOptions = { singleQuotes: true } as const;

function statement(line: string): string {
  return line.replace(/;$/, "");
}

function interfaceWithComment(name: string, comment: string): string {
  return `export interface ${name} {\n  ${comment}\n}`;
}

export function packageJsonTemplate(
  name: string,
  gwenVersion: string,
  scope?: string,
): GeneratedTemplate {
  return textTemplate(
    JSON.stringify(
      {
        name: toPackageName(name, scope),
        version: "0.1.0",
        description: `${toPascalCase(name)} plugin for GWEN`,
        type: "module",
        files: ["dist"],
        exports: {
          ".": {
            types: "./dist/index.d.ts",
            import: "./dist/index.js",
          },
          "./module": {
            types: "./dist/module.d.ts",
            import: "./dist/module.js",
          },
        },
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        scripts: {
          dev: "vite build --watch",
          build: "vite build",
          test: "vitest run",
          typecheck: "tsc --noEmit",
          lint: "oxlint src/",
          format: "oxfmt src/",
          "format:check": "oxfmt --check src/",
        },
        dependencies: {
          "@gwenjs/core": gwenVersion,
          "@gwenjs/kit": gwenVersion,
        },
        devDependencies: {
          typescript: "^6.0.0",
          vite: "^8.0.0",
          "vite-plugin-dts": "^4.0.0",
          vitest: "^4.0.0",
          oxlint: "latest",
          oxfmt: "latest",
        },
      },
      null,
      2,
    ),
  );
}

export function tsconfigTemplate(): GeneratedTemplate {
  return textTemplate(
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          outDir: "./dist",
          rootDir: "./src",
          skipLibCheck: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist", "tests"],
      },
      null,
      2,
    ),
  );
}

/**
 * Generates a TypeScript configuration file for type-checking including tests.
 *
 * @returns The content of `tsconfig.test.json`.
 */
export function tsconfigTestTemplate(): GeneratedTemplate {
  return textTemplate(
    JSON.stringify(
      {
        extends: "./tsconfig.json",
        compilerOptions: {
          rootDir: ".",
          noEmit: true,
          declaration: false,
          declarationMap: false,
        },
        include: ["src/**/*", "tests/**/*"],
      },
      null,
      2,
    ),
  );
}

export function viteConfigTemplate(): GeneratedTemplate {
  return codeTemplate(
    [
      statement(genImport("vite", ["defineConfig"], knitworkOptions)),
      statement(genImport("path", ["resolve"], knitworkOptions)),
      statement(genImport("vite-plugin-dts", "dts", knitworkOptions)),
      "",
      "export default defineConfig({",
      "  plugins: [",
      "    dts({",
      "      include: ['src'],",
      "      outDir: 'dist',",
      "      rollupTypes: false,",
      "    }),",
      "  ],",
      "  build: {",
      "    lib: {",
      "      entry: {",
      "        index: resolve(__dirname, 'src/index.ts'),",
      "        module: resolve(__dirname, 'src/module.ts'),",
      "      },",
      "      formats: ['es'],",
      "    },",
      "    rollupOptions: {",
      "      external: [",
      "        '@gwenjs/core',",
      "        '@gwenjs/kit',",
      "        /^@gwenjs\\/.*/,",
      "      ],",
      "    },",
      "  },",
      "})",
    ].join("\n"),
  );
}

/**
 * Generates a basic vitest configuration file.
 *
 * @returns The content of `vitest.config.ts`.
 */
export function vitestConfigTemplate(): GeneratedTemplate {
  return codeTemplate(
    [
      statement(genImport("vitest/config", ["defineConfig"], knitworkOptions)),
      "",
      "export default defineConfig({",
      "  test: {",
      "    environment: 'node',",
      "    include: ['tests/**/*.test.ts'],",
      "    typecheck: {",
      "      tsconfig: './tsconfig.test.json',",
      "    },",
      "  },",
      "})",
    ].join("\n"),
  );
}

/**
 * Generates a basic test file scaffold for the package.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 * @returns The content of `tests/<name>.test.ts`.
 */
export function testFileTemplate(name: string, scope?: string): GeneratedTemplate {
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      statement(genImport("vitest", ["describe", "it", "expect"], knitworkOptions)),
      "",
      `describe('${name}', () => {`,
      "  it('is importable', async () => {",
      `    // TODO: import from '${pkg}' and test your plugin`,
      "    expect(true).toBe(true)",
      "  })",
      "})",
    ].join("\n"),
  );
}

export function typesTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      "/**",
      ` * Public types for ${pkg}.`,
      " */",
      "",
      interfaceWithComment(`${Pascal}Config`, "// Add your plugin configuration options here"),
      "",
      interfaceWithComment(`${Pascal}Service`, "// Add your service methods here"),
    ].join("\n"),
  );
}

export function augmentTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      "/**",
      ` * Declaration merging — types engine.inject('${name}') as ${Pascal}Service.`,
      ` * Activated as a side-effect when importing from '${pkg}'.`,
      " */",
      "",
      statement(genTypeImport("./types.js", [`${Pascal}Service`], knitworkOptions)),
      "",
      "declare module '@gwenjs/core' {",
      "  interface GwenProvides {",
      `    '${name}': ${Pascal}Service`,
      "  }",
      "}",
      "",
      "export {}",
    ].join("\n"),
  );
}

export function pluginTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      statement(genImport("@gwenjs/kit/plugin", ["definePlugin"], knitworkOptions)),
      statement(genTypeImport("@gwenjs/core", ["GwenEngine"], knitworkOptions)),
      statement(
        genTypeImport("./types.js", [`${Pascal}Config`, `${Pascal}Service`], knitworkOptions),
      ),
      "",
      `export const ${Pascal}Plugin = definePlugin((config: ${Pascal}Config = {}) => {`,
      `  let service: ${Pascal}Service | null = null`,
      "",
      "  return {",
      `    name: '${pkg}',`,
      "",
      "    setup(engine: GwenEngine) {",
      "      // TODO: implement your service",
      `      service = {} as ${Pascal}Service`,
      `      engine.provide('${name}', service)`,
      "    },",
      "",
      "    teardown() {",
      "      service = null",
      "    },",
      "  }",
      "})",
    ].join("\n"),
  );
}

export function composablesTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const pkg = toPackageName(name, scope);
  return codeTemplate(
    [
      statement(
        genImport("@gwenjs/core", ["useEngine", "GwenPluginNotFoundError"], knitworkOptions),
      ),
      statement(genTypeImport("./types.js", [`${Pascal}Service`], knitworkOptions)),
      statement(genImport("./augment.js", undefined, knitworkOptions)),
      "",
      "/**",
      ` * Returns the ${Pascal} service registered by ${Pascal}Plugin.`,
      " *",
      ` * @throws {GwenPluginNotFoundError} If ${Pascal}Plugin is not registered.`,
      " */",
      `export function use${Pascal}(): ${Pascal}Service {`,
      "  const engine = useEngine()",
      `  const ${camel} = engine.tryInject('${name}')`,
      `  if (${camel}) return ${camel}`,
      "  throw new GwenPluginNotFoundError({",
      `    pluginName: '${pkg}',`,
      `    hint: "Add '${pkg}' to modules in gwen.config.ts",`,
      "  })",
      "}",
    ].join("\n"),
  );
}

export function moduleTemplate(name: string, scope?: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  const autoImport = genObjectFromRaw(
    { name: `'use${Pascal}'`, from: `'${pkg}'` },
    "      ",
    knitworkOptions,
  );
  const serviceTypeImport = statement(genTypeImport(pkg, [`${Pascal}Service`], knitworkOptions));
  return codeTemplate(
    [
      "/**",
      ` * Build-time module for ${pkg}.`,
      " *",
      " * Add to gwen.config.ts:",
      ` *   modules: ['${pkg}']`,
      " *",
      " * IMPORTANT: This file must never import from './index.js'.",
      " * Always import from './plugin.js' or './types.js' directly.",
      " */",
      "",
      statement(genImport("@gwenjs/kit/module", ["defineGwenModule"], knitworkOptions)),
      statement(genImport("@gwenjs/kit/plugin", ["definePluginTypes"], knitworkOptions)),
      statement(genTypeImport("./types.js", [`${Pascal}Config`], knitworkOptions)),
      "",
      `export default defineGwenModule<${Pascal}Config>({`,
      `  meta: { name: '${pkg}' },`,
      "  defaults: {},",
      "  async setup(options, kit) {",
      "    // Direct import from plugin.ts — never from index.ts",
      `    const { ${Pascal}Plugin } = await import('./plugin.js')`,
      "",
      `    kit.addPlugin(${Pascal}Plugin(options))`,
      "",
      "    kit.addAutoImports([",
      `      ${autoImport},`,
      "    ])",
      "",
      "    kit.addTypeTemplate({",
      `      filename: '${name}.d.ts',`,
      "      getContents: () =>",
      "        definePluginTypes({",
      `          imports: ["${serviceTypeImport}"],`,
      `          provides: { '${name}': '${Pascal}Service' },`,
      "        }),",
      "    })",
      "  },",
      "})",
    ].join("\n"),
  );
}

export function indexTemplate(name: string): GeneratedTemplate {
  const Pascal = toPascalCase(name);
  return codeTemplate(
    [
      `// Side-effect: activates typed engine.inject('${name}') in manual mode`,
      statement(genImport("./augment.js", undefined, knitworkOptions)),
      "",
      "// Plugin factory — for manual registration in plugins: []",
      statement(genExport("./plugin.js", [`${Pascal}Plugin`], knitworkOptions)),
      "",
      `// Composables — use${Pascal}() for runtime access`,
      statement(genExport("./composables.js", [`use${Pascal}`], knitworkOptions)),
      "",
      "// Public types",
      `export type { ${Pascal}Config, ${Pascal}Service } from './types.js'`,
      "",
      "// The build-time module is exported via the './module' package export.",
      "// Do NOT re-export it here — that would create a circular dependency.",
    ].join("\n"),
  );
}

export function gitignoreTemplate(): GeneratedTemplate {
  return textTemplate(
    `node_modules/
dist/
*.local
.DS_Store`,
  );
}
