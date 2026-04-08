/**
 * Template factory for `src/actors/Player.ts` in the scaffolded project.
 */

/**
 * Returns the `src/actors/Player.ts` source.
 *
 * @returns The TypeScript source string (with trailing newline).
 */
export function playerActorTemplate(): string {
  return `import { defineActor, onStart, useTransform } from '@gwenjs/core/actor'
import { PlayerPrefab } from '../prefabs/Player'

/**
 * The player ship actor — a singleton instance managed by the engine.
 *
 * Spawn once per scene with \`useActor(PlayerActor).spawnOnce({ x, y })\`.
 * The actor sets its initial world position via the transform handle.
 */
export const PlayerActor = defineActor(PlayerPrefab, (props: { x: number; y: number }) => {
  const transform = useTransform()

  onStart(() => {
    transform.setPosition(props.x, props.y, 0)
  })

  return {}
})
`;
}
