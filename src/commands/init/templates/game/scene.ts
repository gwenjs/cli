/**
 * Template factory for `src/scenes/GameScene.ts` in the scaffolded project.
 *
 * Wires all Starfield Shooter systems into the main game scene and spawns
 * the player via the actor system during setup.
 */

/**
 * Returns the `src/scenes/GameScene.ts` source for the landing game.
 *
 * @returns The TypeScript source string (with trailing newline).
 */
export function sceneTemplate(): string {
  return `/**
 * Main game scene — Starfield Shooter.
 *
 * Wires all systems together and spawns the player ship during setup.
 * This file is the composition root for the landing game.
 */
import { defineScene } from '@gwenjs/core/scene'
import { useActor } from '@gwenjs/core/actor'
import { MovementSystem } from '../systems/Movement'
import { InputSystem } from '../systems/Input'
import { CollisionSystem } from '../systems/Collision'
import { SpawnSystem } from '../systems/Spawn'
import { RenderSystem } from '../systems/Render'
import { PlayerActor } from '../actors/Player'

const CANVAS_W = 800
const CANVAS_H = 600

export const GameScene = defineScene('Game', () => {
  // Spawn the player ship once at the bottom-centre of the canvas.
  useActor(PlayerActor).spawnOnce({ x: CANVAS_W / 2, y: CANVAS_H - 70 })

  return {
    systems: [InputSystem, MovementSystem, CollisionSystem, SpawnSystem, RenderSystem],
  }
})
`;
}
