/**
 * Template factories for actor source files in the scaffolded game project.
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

/**
 * Returns the `src/actors/Asteroid.ts` source.
 *
 * @returns The TypeScript source string (with trailing newline).
 */
export function asteroidActorTemplate(): string {
  return `import { defineActor, onStart, useTransform } from '@gwenjs/core/actor'
import { AsteroidPrefab } from '../prefabs/Asteroid'

/**
 * Asteroid actor — spawned repeatedly by SpawnSystem.
 *
 * Spawn with \`useActor(AsteroidActor).spawn({ x, y, radius, speedX, speedY, rotSpeed })\`.
 * Each call creates an independent entity that falls down the screen.
 */
export const AsteroidActor = defineActor(
  AsteroidPrefab,
  (props: { x: number; y: number; radius: number; speedX: number; speedY: number; rotSpeed: number }) => {
    const transform = useTransform()

    onStart(() => {
      transform.setPosition(props.x, props.y, 0)
    })

    return {}
  }
)
`;
}
