/**
 * Template factory for `src/router.ts` in the scaffolded project.
 */

/**
 * Returns the `src/router.ts` source.
 *
 * The router is a finite-state machine that orchestrates scene transitions.
 * Register it in `gwen.config.ts` via `['@gwenjs/core', { router: AppRouter }]`.
 *
 * @returns The TypeScript source string (with trailing newline).
 */
export function routerTemplate(): string {
  return `import { defineSceneRouter } from '@gwenjs/core/scene'
import { GameScene } from './scenes/GameScene'

export const AppRouter = defineSceneRouter({
  initial: 'game',
  routes: {
    game: {
      scene: GameScene,
      on: {},
    },
  },
})
`;
}
