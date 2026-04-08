/**
 * Template factory for the scaffolded project's `gwen.config.ts`.
 *
 * Generates a minimal but functional engine configuration:
 * - `@gwenjs/core` is registered with the scene router so the FSM is active.
 * - `@gwenjs/input` is registered so the starter game can capture keyboard input.
 * - Any extra modules selected during `gwen init` are appended.
 */

/**
 * Returns the `gwen.config.ts` content for a newly scaffolded GWEN project.
 *
 * @param extraModules - Additional `@gwenjs/*` module identifiers selected
 *   by the user (e.g. `['@gwenjs/physics2d', '@gwenjs/audio']`).
 * @returns The TypeScript source string (with trailing newline).
 */
export function gwenConfigTemplate(extraModules: string[] = []): string {
  const extraModulesList = extraModules.map((m) => `    '${m}',`).join("\n");
  const extraBlock = extraModules.length > 0 ? `\n${extraModulesList}` : "";

  return `import { defineConfig } from '@gwenjs/app'
import { AppRouter } from './src/router'

export default defineConfig({
  engine: { maxEntities: 2_000, targetFPS: 60 },
  modules: [
    ['@gwenjs/core', { router: AppRouter }],
    '@gwenjs/input',${extraBlock}
  ],
})
`;
}
