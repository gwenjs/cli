/**
 * Template factory for `src/scenes/game.ts` in the scaffolded project.
 *
 * Wires all Starfield Shooter systems into the main game scene and spawns
 * the player entity during setup.
 */

/**
 * Returns the `src/scenes/game.ts` source for the landing game.
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
import { useEngine } from '@gwenjs/core'
import { MovementSystem } from '../systems/Movement'
import { InputSystem } from '../systems/Input'
import { CollisionSystem } from '../systems/Collision'
import { SpawnSystem } from '../systems/Spawn'
import { RenderSystem } from '../systems/Render'
import { Position, Velocity, Size, Shooter, PlayerTag, Score } from '../components/Game'

const CANVAS_W = 800
const CANVAS_H = 600

export const GameScene = defineScene('Game', () => {
  const engine = useEngine()

  // Spawn the player ship at the bottom-centre of the canvas.
  const playerId = engine.createEntity()
  engine.addComponent(playerId, Position, { x: CANVAS_W / 2, y: CANVAS_H - 70 })
  engine.addComponent(playerId, Velocity, { vx: 0, vy: 0 })
  engine.addComponent(playerId, Size, { w: 28, h: 28 })
  engine.addComponent(playerId, Shooter, { cooldown: 0.22, timer: 0 })
  engine.addComponent(playerId, PlayerTag, { active: true })
  engine.addComponent(playerId, Score, { value: 0, lives: 3, invincible: 0 })

  return {
    systems: [InputSystem, MovementSystem, CollisionSystem, SpawnSystem, RenderSystem],
  }
})
`;
}
