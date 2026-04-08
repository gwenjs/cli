/**
 * Template factories for `src/prefabs/` in the scaffolded project.
 */

/**
 * Returns the `src/prefabs/Bullet.ts` source.
 *
 * @returns The TypeScript source string (with trailing newline).
 */
export function bulletPrefabTemplate(): string {
  return `import { definePrefab } from '@gwenjs/core/actor'
import { Position, Velocity, BulletTag, Size } from '../components/Game'

/**
 * Reusable entity template for player bullets.
 *
 * Spawn with \`usePrefab(BulletPrefab).spawn({ x, y })\` from any system.
 * Velocity and lifetime use their defaults unless overridden.
 */
export const BulletPrefab = definePrefab([
  { def: Position, defaults: { x: 0, y: 0 } },
  { def: Velocity, defaults: { vx: 0, vy: -500 } },
  { def: BulletTag, defaults: { lifetime: 2.5 } },
  { def: Size, defaults: { w: 4, h: 14 } },
])
`;
}

/**
 * Returns the `src/prefabs/Player.ts` source.
 *
 * @returns The TypeScript source string (with trailing newline).
 */
export function playerPrefabTemplate(): string {
  return `import { definePrefab } from '@gwenjs/core/actor'
import { Position, Velocity, Size, Shooter, PlayerTag, Score } from '../components/Game'

/**
 * Entity template for the player ship.
 *
 * Used by \`PlayerActor\` — do not spawn directly with \`usePrefab()\`.
 */
export const PlayerPrefab = definePrefab([
  { def: Position, defaults: { x: 0, y: 0 } },
  { def: Velocity, defaults: { vx: 0, vy: 0 } },
  { def: Size, defaults: { w: 28, h: 28 } },
  { def: Shooter, defaults: { cooldown: 0.22, timer: 0 } },
  { def: PlayerTag, defaults: { active: true } },
  { def: Score, defaults: { value: 0, lives: 3, invincible: 0 } },
])
`;
}

/**
 * Returns the `src/prefabs/Asteroid.ts` source.
 *
 * @returns The TypeScript source string (with trailing newline).
 */
export function asteroidPrefabTemplate(): string {
  return `import { definePrefab } from '@gwenjs/core/actor'
import { Position, Velocity, AsteroidTag } from '../components/Game'

/**
 * Reusable entity template for asteroids.
 *
 * Spawn via \`useActor(AsteroidActor).spawn({ x, y, radius, speedX, speedY, rotSpeed })\`.
 * Defaults are overridden by the actor on each spawn.
 */
export const AsteroidPrefab = definePrefab([
  { def: Position, defaults: { x: 0, y: 0 } },
  { def: Velocity, defaults: { vx: 0, vy: 60 } },
  { def: AsteroidTag, defaults: { radius: 20, rotation: 0, rotSpeed: 0 } },
])
`;
}
