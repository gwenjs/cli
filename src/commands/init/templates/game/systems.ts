/**
 * Template factory for `src/systems/` in the scaffolded project.
 *
 * Returns the source code for all four systems of the Starfield Shooter
 * landing game as a map of filename → content.
 */

/** All system file contents indexed by their relative path under `src/systems/`. */
export interface SystemTemplates {
  "movement.ts": string;
  "input.ts": string;
  "collision.ts": string;
  "spawn.ts": string;
  "render.ts": string;
}

/**
 * Returns the source code for every system in the landing game.
 *
 * @returns An object mapping `src/systems/<file>` → TypeScript source string.
 */
export function systemsTemplate(): SystemTemplates {
  return {
    "movement.ts": movementSystem(),
    "input.ts": inputSystem(),
    "collision.ts": collisionSystem(),
    "spawn.ts": spawnSystem(),
    "render.ts": renderSystem(),
  };
}

// ─── Movement system ──────────────────────────────────────────────────────────

function movementSystem(): string {
  return `/**
 * Movement system — advances all entities with Position + Velocity by dt.
 *
 * Bullets are destroyed when they leave the canvas.
 * Asteroids wrap around the left/right edges and are removed at the bottom.
 */
import { defineSystem, onUpdate, useQuery, useEngine } from '@gwenjs/core'
import type { EntityId } from '@gwenjs/core'
import { Position, Velocity, BulletTag, AsteroidTag } from '../components/game'

const CANVAS_W = 800
const CANVAS_H = 600

export const MovementSystem = defineSystem(function MovementSystem() {
  const engine = useEngine()
  const bullets = useQuery([Position, Velocity, BulletTag])
  const asteroids = useQuery([Position, Velocity, AsteroidTag])

  onUpdate((dt) => {
    const toDestroy: EntityId[] = []

    for (const e of bullets) {
      const pos = e.get(Position)
      const vel = e.get(Velocity)
      const tag = e.get(BulletTag)
      if (!pos || !vel || !tag) continue

      const ny = pos.y + vel.y * dt
      const remaining = tag.lifetime - dt

      if (ny < -20 || remaining <= 0) {
        toDestroy.push(e.id)
        continue
      }

      engine.addComponent(e.id, Position, { x: pos.x, y: ny })
      engine.addComponent(e.id, BulletTag, { lifetime: remaining })
    }

    for (const e of asteroids) {
      const pos = e.get(Position)
      const vel = e.get(Velocity)
      const tag = e.get(AsteroidTag)
      if (!pos || !vel || !tag) continue

      let nx = pos.x + vel.x * dt
      const ny = pos.y + vel.y * dt

      // Wrap horizontally
      if (nx < -tag.radius) nx = CANVAS_W + tag.radius
      else if (nx > CANVAS_W + tag.radius) nx = -tag.radius

      // Remove when below screen
      if (ny > CANVAS_H + tag.radius + 10) {
        toDestroy.push(e.id)
        continue
      }

      const newRot = (tag.rotation + tag.rotSpeed * dt) % (Math.PI * 2)
      engine.addComponent(e.id, Position, { x: nx, y: ny })
      engine.addComponent(e.id, AsteroidTag, {
        radius: tag.radius,
        rotation: newRot,
        rotSpeed: tag.rotSpeed,
      })
    }

    for (const id of toDestroy) {
      engine.destroyEntity(id)
    }
  })
})
`;
}

// ─── Input system ─────────────────────────────────────────────────────────────

function inputSystem(): string {
  return `/**
 * Input system — reads keyboard state to move the player ship and fire bullets.
 *
 * Controls:
 *   Arrow keys / WASD — move
 *   Space             — fire
 */
import { defineSystem, onUpdate, useQuery, useEngine } from '@gwenjs/core'
import type { GwenEngine } from '@gwenjs/core'
import { useKeyboard, Keys } from '@gwenjs/input'
import { Position, Velocity, Shooter, PlayerTag, BulletTag, Score, Size } from '../components/game'

const PLAYER_SPEED = 280
const CANVAS_W = 800
const CANVAS_H = 600

function spawnBullet(engine: GwenEngine, x: number, y: number): void {
  const id = engine.createEntity()
  engine.addComponent(id, Position, { x, y })
  engine.addComponent(id, Velocity, { x: 0, y: -500 })
  engine.addComponent(id, BulletTag, { lifetime: 2.5 })
  engine.addComponent(id, Size, { w: 4, h: 14 })
}

export const InputSystem = defineSystem(function InputSystem() {
  const engine = useEngine()
  const kb = useKeyboard()
  const players = useQuery([Position, Velocity, Shooter, PlayerTag, Score, Size])

  onUpdate((dt) => {
    for (const e of players) {
      const pos = e.get(Position)
      const shooter = e.get(Shooter)
      const score = e.get(Score)
      const size = e.get(Size)
      if (!pos || !shooter || !score || !size) continue

      // Movement direction
      let vx = 0
      let vy = 0
      if (kb.isPressed(Keys.ArrowLeft) || kb.isPressed(Keys.A)) vx = -PLAYER_SPEED
      if (kb.isPressed(Keys.ArrowRight) || kb.isPressed(Keys.D)) vx = PLAYER_SPEED
      if (kb.isPressed(Keys.ArrowUp) || kb.isPressed(Keys.W)) vy = -PLAYER_SPEED
      if (kb.isPressed(Keys.ArrowDown) || kb.isPressed(Keys.S)) vy = PLAYER_SPEED

      // Clamp to canvas
      const hw = size.w / 2
      const hh = size.h / 2
      const nx = Math.max(hw, Math.min(CANVAS_W - hw, pos.x + vx * dt))
      const ny = Math.max(hh, Math.min(CANVAS_H - hh, pos.y + vy * dt))

      engine.addComponent(e.id, Position, { x: nx, y: ny })
      engine.addComponent(e.id, Velocity, { x: vx, y: vy })

      // Weapon cooldown
      const newTimer = shooter.timer - dt
      const canFire = kb.isPressed(Keys.Space) && newTimer <= 0

      engine.addComponent(e.id, Shooter, {
        cooldown: shooter.cooldown,
        timer: canFire ? shooter.cooldown : Math.max(newTimer, -1),
      })

      // Invincibility countdown
      if (score.invincible > 0) {
        engine.addComponent(e.id, Score, {
          value: score.value,
          lives: score.lives,
          invincible: Math.max(0, score.invincible - dt),
        })
      }

      if (canFire) {
        spawnBullet(engine, nx, ny - hh - 6)
      }
    }
  })
})
`;
}

// ─── Collision system ─────────────────────────────────────────────────────────

function collisionSystem(): string {
  return `/**
 * Collision system — AABB bullet × asteroid hit detection.
 *
 * When a bullet hits an asteroid both are destroyed and the score increments.
 * When an asteroid reaches the player ship (and the player is not invincible)
 * a life is lost.
 */
import { defineSystem, onUpdate, useQuery, useEngine } from '@gwenjs/core'
import type { EntityId } from '@gwenjs/core'
import { Position, Size, BulletTag, AsteroidTag, PlayerTag, Score } from '../components/game'

function overlaps(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return (
    Math.abs(ax - bx) < (aw + bw) / 2 &&
    Math.abs(ay - by) < (ah + bh) / 2
  )
}

export const CollisionSystem = defineSystem(function CollisionSystem() {
  const engine = useEngine()
  const bullets = useQuery([Position, Size, BulletTag])
  const asteroids = useQuery([Position, AsteroidTag])
  const players = useQuery([Position, Size, PlayerTag, Score])

  onUpdate(() => {
    const destroyed = new Set<EntityId>()

    // Bullet × asteroid
    for (const b of bullets) {
      if (destroyed.has(b.id)) continue
      const bp = b.get(Position)
      const bs = b.get(Size)
      if (!bp || !bs) continue

      for (const a of asteroids) {
        if (destroyed.has(a.id)) continue
        const ap = a.get(Position)
        const at = a.get(AsteroidTag)
        if (!ap || !at) continue

        const diameter = at.radius * 2
        if (overlaps(bp.x, bp.y, bs.w, bs.h, ap.x, ap.y, diameter, diameter)) {
          destroyed.add(b.id)
          destroyed.add(a.id)

          // Award points to the player
          for (const p of players) {
            const score = p.get(Score)
            if (!score) continue
            engine.addComponent(p.id, Score, {
              value: score.value + 10,
              lives: score.lives,
              invincible: score.invincible,
            })
          }
          break
        }
      }
    }

    // Player × asteroid
    for (const p of players) {
      const pp = p.get(Position)
      const ps = p.get(Size)
      const score = p.get(Score)
      if (!pp || !ps || !score || score.invincible > 0) continue

      for (const a of asteroids) {
        if (destroyed.has(a.id)) continue
        const ap = a.get(Position)
        const at = a.get(AsteroidTag)
        if (!ap || !at) continue

        const diameter = at.radius * 2
        if (overlaps(pp.x, pp.y, ps.w, ps.h, ap.x, ap.y, diameter, diameter)) {
          destroyed.add(a.id)
          engine.addComponent(p.id, Score, {
            value: score.value,
            lives: Math.max(0, score.lives - 1),
            invincible: 2.5,
          })
          break
        }
      }
    }

    for (const id of destroyed) {
      engine.destroyEntity(id)
    }
  })
})
`;
}

// ─── Spawn system ─────────────────────────────────────────────────────────────

function spawnSystem(): string {
  return `/**
 * Spawn system — periodically creates asteroids at the top of the screen.
 *
 * Spawn rate scales gently with the player's score to increase difficulty
 * as the game progresses.
 */
import { defineSystem, onUpdate, useQuery, useEngine } from '@gwenjs/core'
import { Position, Velocity, AsteroidTag, PlayerTag, Score } from '../components/game'

const CANVAS_W = 800
const BASE_INTERVAL = 1.2   // seconds between spawns at score 0
const MIN_INTERVAL = 0.35   // hard floor regardless of score

export const SpawnSystem = defineSystem(function SpawnSystem() {
  const engine = useEngine()
  const players = useQuery([PlayerTag, Score])

  let timer = BASE_INTERVAL

  onUpdate((dt) => {
    // Derive current score for difficulty scaling
    let score = 0
    for (const p of players) {
      const s = p.get(Score)
      if (s) score = s.value
    }

    const interval = Math.max(MIN_INTERVAL, BASE_INTERVAL - score * 0.004)
    timer -= dt

    if (timer > 0) return
    timer = interval

    const radius = 16 + Math.random() * 22
    const x = radius + Math.random() * (CANVAS_W - radius * 2)
    const speedY = 60 + Math.random() * 80
    const speedX = (Math.random() - 0.5) * 60
    const rotSpeed = (Math.random() - 0.5) * 3

    const id = engine.createEntity()
    engine.addComponent(id, Position, { x, y: -radius })
    engine.addComponent(id, Velocity, { x: speedX, y: speedY })
    engine.addComponent(id, AsteroidTag, { radius, rotation: 0, rotSpeed })
  })
})
`;
}

// ─── Render system ────────────────────────────────────────────────────────────

function renderSystem(): string {
  return `/**
 * Render system — updates the DOM each frame to reflect entity positions.
 *
 * Uses a simple HTML/CSS approach: a fixed-size container div with absolutely
 * positioned child elements for each entity type.
 *
 * Render order (back to front):
 *   1. Bullets
 *   2. Asteroids
 *   3. Player ship
 *   4. HUD (score, lives)
 */
import { defineSystem, onRender, useQuery } from '@gwenjs/core'
import { Position, Velocity, BulletTag, AsteroidTag, PlayerTag, Score } from '../components/game'

const GAME_W = 800
const GAME_H = 600

// ─── DOM root ─────────────────────────────────────────────────────────────────

function getRoot(): HTMLElement {
  let root = document.getElementById('gwen-game-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'gwen-game-root'
    Object.assign(root.style, {
      position: 'relative',
      width: \`\${GAME_W}px\`,
      height: \`\${GAME_H}px\`,
      overflow: 'hidden',
      background: '#0a0a1a',
      margin: '0 auto',
      fontFamily: 'monospace',
    })
    document.body.appendChild(root)
  }
  return root
}

// ─── System ───────────────────────────────────────────────────────────────────

export const RenderSystem = defineSystem(function RenderSystem() {
  const playerEntities = useQuery([Position, Velocity, PlayerTag, Score])
  const bulletEntities = useQuery([Position, BulletTag])
  const asteroidEntities = useQuery([Position, AsteroidTag])

  onRender(() => {
    const root = getRoot()
    root.innerHTML = ''

    // Bullets
    for (const e of bulletEntities) {
      const pos = e.get(Position)
      if (!pos) continue
      const el = document.createElement('div')
      Object.assign(el.style, {
        position: 'absolute',
        left: \`\${pos.x - 2}px\`,
        top: \`\${pos.y - 9}px\`,
        width: '4px',
        height: '18px',
        background: '#ffe600',
        borderRadius: '2px',
        boxShadow: '0 0 6px #ffe600',
      })
      root.appendChild(el)
    }

    // Asteroids
    for (const e of asteroidEntities) {
      const pos = e.get(Position)
      const tag = e.get(AsteroidTag)
      if (!pos || !tag) continue
      const r = tag.radius
      const el = document.createElement('div')
      Object.assign(el.style, {
        position: 'absolute',
        left: \`\${pos.x - r}px\`,
        top: \`\${pos.y - r}px\`,
        width: \`\${r * 2}px\`,
        height: \`\${r * 2}px\`,
        background: '#8888aa',
        borderRadius: '40% 60% 55% 45%',
        boxShadow: '0 0 6px #aaaacc',
        transform: \`rotate(\${tag.rotation}rad)\`,
      })
      root.appendChild(el)
    }

    // Player + HUD
    for (const e of playerEntities) {
      const pos = e.get(Position)
      const score = e.get(Score)
      if (!pos || !score) continue

      const alpha = score.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0 ? 0.35 : 1
      const ship = document.createElement('div')
      Object.assign(ship.style, {
        position: 'absolute',
        left: \`\${pos.x - 13}px\`,
        top: \`\${pos.y - 18}px\`,
        width: '26px',
        height: '32px',
        background: '#4fffb0',
        clipPath: 'polygon(50% 0%, 0% 100%, 50% 75%, 100% 100%)',
        boxShadow: '0 0 16px #4fffb0',
        opacity: String(alpha),
      })
      root.appendChild(ship)

      const hud = document.createElement('div')
      Object.assign(hud.style, {
        position: 'absolute',
        top: '8px',
        left: '0',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0 12px',
        boxSizing: 'border-box',
        color: '#e0e0ff',
        fontSize: '18px',
        fontWeight: 'bold',
        pointerEvents: 'none',
      })
      hud.innerHTML = \`<span>SCORE  \${score.value}</span><span style="color:#ff6688">\${'♥ '.repeat(Math.max(0, score.lives)).trim()}</span>\`
      root.appendChild(hud)

      if (score.lives <= 0) {
        const overlay = document.createElement('div')
        Object.assign(overlay.style, {
          position: 'absolute',
          inset: '0',
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        })
        overlay.innerHTML = \`
          <div style="font-size:48px;font-weight:bold;color:#ff4444">GAME OVER</div>
          <div style="font-size:22px;color:#e0e0ff">Final Score: \${score.value}</div>
          <div style="font-size:15px;color:#aaaacc">Reload to play again</div>
        \`
        root.appendChild(overlay)
      }
    }
  })
})
`;
}
