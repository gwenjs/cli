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

export function packageJsonTemplate(name: string, gwenVersion: string, scope?: string): string {
  return JSON.stringify(
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
  );
}

export function tsconfigTemplate(): string {
  return JSON.stringify(
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
  );
}

/**
 * Generates a TypeScript configuration file for type-checking including tests.
 *
 * @returns The content of `tsconfig.test.json`.
 */
export function tsconfigTestTemplate(): string {
  return JSON.stringify(
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
  );
}

export function viteConfigTemplate(): string {
  return `import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      include: ['src'],
      outDir: 'dist',
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        module: resolve(__dirname, 'src/module.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@gwenjs/core',
        '@gwenjs/kit',
        /^@gwenjs\\/.*/,
      ],
    },
  },
})
`;
}

/**
 * Generates a basic vitest configuration file.
 *
 * @returns The content of `vitest.config.ts`.
 */
export function vitestConfigTemplate(): string {
  return `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
})
`;
}

/**
 * Generates a basic test file scaffold for the package.
 *
 * @param name - The package name in kebab-case.
 * @param scope - Optional npm scope without `@`
 * @returns The content of `tests/<name>.test.ts`.
 */
export function testFileTemplate(name: string, scope?: string): string {
  const pkg = toPackageName(name, scope);
  return `import { describe, it, expect } from 'vitest'

describe('${name}', () => {
  it('is importable', async () => {
    // TODO: import from '${pkg}' and test your plugin
    expect(true).toBe(true)
  })
})
`;
}

export function typesTemplate(name: string, scope?: string): string {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return `/**
 * Public types for ${pkg}.
 */

export interface ${Pascal}Config {
  // Add your plugin configuration options here
}

export interface ${Pascal}Service {
  // Add your service methods here
}
`;
}

export function augmentTemplate(name: string, scope?: string): string {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return `/**
 * Declaration merging — types engine.inject('${name}') as ${Pascal}Service.
 * Activated as a side-effect when importing from '${pkg}'.
 */

import type { ${Pascal}Service } from './types.js'

declare module '@gwenjs/core' {
  interface GwenProvides {
    '${name}': ${Pascal}Service
  }
}

export {}
`;
}

export function pluginTemplate(name: string, scope?: string): string {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return `import { definePlugin } from '@gwenjs/kit/plugin'
import type { GwenEngine } from '@gwenjs/core'
import type { ${Pascal}Config, ${Pascal}Service } from './types.js'

export const ${Pascal}Plugin = definePlugin((config: ${Pascal}Config = {}) => {
  let service: ${Pascal}Service | null = null

  return {
    name: '${pkg}',

    setup(engine: GwenEngine) {
      // TODO: implement your service
      service = {} as ${Pascal}Service
      engine.provide('${name}', service)
    },

    teardown() {
      service = null
    },
  }
})
`;
}

export function composablesTemplate(name: string, scope?: string): string {
  const Pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const pkg = toPackageName(name, scope);
  return `import { useEngine, GwenPluginNotFoundError } from '@gwenjs/core'
import type { ${Pascal}Service } from './types.js'
import './augment.js'

/**
 * Returns the ${Pascal} service registered by ${Pascal}Plugin.
 *
 * @throws {GwenPluginNotFoundError} If ${Pascal}Plugin is not registered.
 */
export function use${Pascal}(): ${Pascal}Service {
  const engine = useEngine()
  const ${camel} = engine.tryInject('${name}')
  if (${camel}) return ${camel}
  throw new GwenPluginNotFoundError({
    pluginName: '${pkg}',
    hint: "Add '${pkg}' to modules in gwen.config.ts",
  })
}
`;
}

export function moduleTemplate(name: string, scope?: string): string {
  const Pascal = toPascalCase(name);
  const pkg = toPackageName(name, scope);
  return `/**
 * Build-time module for ${pkg}.
 *
 * Add to gwen.config.ts:
 *   modules: ['${pkg}']
 *
 * IMPORTANT: This file must never import from './index.js'.
 * Always import from './plugin.js' or './types.js' directly.
 */

import { defineGwenModule } from '@gwenjs/kit/module'
import { definePluginTypes } from '@gwenjs/kit/plugin'
import type { ${Pascal}Config } from './types.js'

export default defineGwenModule<${Pascal}Config>({
  meta: { name: '${pkg}' },
  defaults: {},
  async setup(options, kit) {
    // Direct import from plugin.ts — never from index.ts
    const { ${Pascal}Plugin } = await import('./plugin.js')

    kit.addPlugin(${Pascal}Plugin(options))

    kit.addAutoImports([
      { name: 'use${Pascal}', from: '${pkg}' },
    ])

    kit.addTypeTemplate({
      filename: '${name}.d.ts',
      getContents: () =>
        definePluginTypes({
          imports: ["import type { ${Pascal}Service } from '${pkg}'"],
          provides: { '${name}': '${Pascal}Service' },
        }),
    })
  },
})
`;
}

export function indexTemplate(name: string): string {
  const Pascal = toPascalCase(name);
  return `// Side-effect: activates typed engine.inject('${name}') in manual mode
import './augment.js'

// Plugin factory — for manual registration in plugins: []
export { ${Pascal}Plugin } from './plugin.js'

// Composables — use${Pascal}() for runtime access
export { use${Pascal} } from './composables.js'

// Public types
export type { ${Pascal}Config, ${Pascal}Service } from './types.js'

// The build-time module is exported via the './module' package export.
// Do NOT re-export it here — that would create a circular dependency.
`;
}

export function gitignoreTemplate(): string {
  return `node_modules/
dist/
*.local
.DS_Store
`;
}
