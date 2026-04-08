/**
 * Template factory for the scaffolded project's `gwen.config.ts`.
 *
 * Generates a minimal but functional engine configuration with `@gwenjs/input`
 * registered as a module by default, plus any extra modules selected by the
 * user during `gwen init`.
 */

/**
 * Returns the `gwen.config.ts` content for a newly scaffolded GWEN project.
 *
 * `@gwenjs/input` is always included in `modules` so the starter game can
 * capture keyboard input immediately without additional setup.
 *
 * @param extraModules - Additional `@gwenjs/*` module identifiers selected
 *   by the user (e.g. `['@gwenjs/physics2d', '@gwenjs/audio']`).
 * @returns The TypeScript source string (with trailing newline).
 */
export function gwenConfigTemplate(extraModules: string[] = []): string {
  const allModules = ["'@gwenjs/input'", ...extraModules.map((m) => `'${m}'`)];
  const modulesList = allModules.map((m) => `  ${m},`).join("\n");

  return `import { defineConfig } from '@gwenjs/app'

export default defineConfig({
  engine: { maxEntities: 2_000, targetFPS: 60 },
  modules: [
${modulesList}
  ],
})
`;
}
