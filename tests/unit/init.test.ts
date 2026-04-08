/**
 * Tests for `gwen init` — verifies that the scaffolded project contains
 * all required files with the correct content.
 *
 * Two test layers:
 *   1. Unit tests for individual template factory functions.
 *   2. Integration tests that run the full `initCommand` in a tmp directory
 *      and assert the generated file tree.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// Template functions — imported from src so tests don't require a pre-build.
import { packageJsonTemplate } from "../../src/commands/init/templates/package-json.js";
import { tsconfigTemplate } from "../../src/commands/init/templates/tsconfig.js";
import { oxlintTemplate } from "../../src/commands/init/templates/oxlint.js";
import { oxfmtTemplate } from "../../src/commands/init/templates/oxfmt.js";
import { gwenConfigTemplate } from "../../src/commands/init/templates/gwen-config.js";
import { readmeTemplate } from "../../src/commands/init/templates/readme.js";
import { componentsTemplate } from "../../src/commands/init/templates/game/components.js";
import { systemsTemplate } from "../../src/commands/init/templates/game/systems.js";
import { sceneTemplate } from "../../src/commands/init/templates/game/scene.js";
import {
  bulletPrefabTemplate,
  playerPrefabTemplate,
} from "../../src/commands/init/templates/game/prefabs.js";
import { playerActorTemplate } from "../../src/commands/init/templates/game/actor.js";
import { routerTemplate } from "../../src/commands/init/templates/router.js";
import { initCommand } from "../../src/commands/init/index.js";

// ─── Module registry mock ─────────────────────────────────────────────────────

vi.mock("../../src/utils/module-registry.js", () => ({
  getModules: vi.fn().mockResolvedValue([
    {
      name: "physics2d",
      displayName: "Physics 2D",
      description: "Rapier-based 2D physics engine",
      npm: "@gwenjs/physics2d",
      repo: "gwenjs/physics2d",
      website: "",
      category: "Physics",
      type: "official",
      deprecated: false,
      compatibility: { gwen: ">=0.1.0" },
    },
    {
      name: "physics3d",
      displayName: "Physics 3D",
      description: "Rapier-based 3D physics engine",
      npm: "@gwenjs/physics3d",
      repo: "gwenjs/physics3d",
      website: "",
      category: "Physics",
      type: "official",
      deprecated: false,
      compatibility: { gwen: ">=0.1.0" },
    },
    {
      name: "audio",
      displayName: "Audio",
      description: "Web Audio API integration",
      npm: "@gwenjs/audio",
      repo: "gwenjs/audio",
      website: "",
      category: "Audio",
      type: "official",
      deprecated: false,
      compatibility: { gwen: ">=0.1.0" },
    },
    {
      name: "r3f",
      displayName: "React Three Fiber",
      description: "R3F renderer adapter",
      npm: "@gwenjs/r3f",
      repo: "gwenjs/r3f",
      website: "",
      category: "Rendering",
      type: "official",
      deprecated: false,
      compatibility: { gwen: ">=0.1.0" },
    },
    {
      name: "debug",
      displayName: "Debug overlay",
      description: "Performance HUD and inspector",
      npm: "@gwenjs/debug",
      repo: "gwenjs/debug",
      website: "",
      category: "Debug",
      type: "official",
      deprecated: false,
      compatibility: { gwen: ">=0.1.0" },
    },
  ]),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "gwen-init-test-"));
}

async function readJson(filePath: string): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

async function fileExists(filePath: string): Promise<boolean> {
  return fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
}

// ─── Template unit tests ──────────────────────────────────────────────────────

describe("packageJsonTemplate", () => {
  it("includes Vite 8 in devDependencies", () => {
    const content = packageJsonTemplate("my-game", "1.2.3");
    const pkg = JSON.parse(content) as Record<string, Record<string, string>>;
    expect(pkg.devDependencies?.vite).toMatch(/^\^8\./);
  });

  it("includes TypeScript 6 in devDependencies", () => {
    const content = packageJsonTemplate("my-game", "1.2.3");
    const pkg = JSON.parse(content) as Record<string, Record<string, string>>;
    expect(pkg.devDependencies?.typescript).toMatch(/^\^6\./);
  });

  it("includes oxlint and oxfmt in devDependencies", () => {
    const content = packageJsonTemplate("my-game", "1.2.3");
    const pkg = JSON.parse(content) as Record<string, Record<string, string>>;
    expect(pkg.devDependencies?.oxlint).toBeDefined();
    expect(pkg.devDependencies?.oxfmt).toBeDefined();
  });

  it("includes lint, format, and typecheck scripts", () => {
    const content = packageJsonTemplate("my-game", "1.2.3");
    const pkg = JSON.parse(content) as Record<string, Record<string, string>>;
    expect(pkg.scripts?.lint).toBe("oxlint src/");
    expect(pkg.scripts?.format).toBe("oxfmt src/");
    expect(pkg.scripts?.typecheck).toBe("tsc --noEmit");
    expect(pkg.scripts?.["lint:fix"]).toBeDefined();
    expect(pkg.scripts?.["format:check"]).toBeDefined();
  });

  it("includes input as default dependency", () => {
    const content = packageJsonTemplate("my-game", "1.2.3");
    const pkg = JSON.parse(content) as Record<string, Record<string, string>>;
    expect(pkg.dependencies?.["@gwenjs/renderer-canvas2d"]).toBeUndefined();
    expect(pkg.dependencies?.["@gwenjs/input"]).toBeDefined();
  });

  it("stamps extra modules into dependencies", () => {
    const content = packageJsonTemplate("my-game", "1.2.3", ["@gwenjs/physics2d"]);
    const pkg = JSON.parse(content) as Record<string, Record<string, string>>;
    expect(pkg.dependencies?.["@gwenjs/physics2d"]).toBe("^1.2.3");
  });

  it("uses the project name as the package name", () => {
    const content = packageJsonTemplate("awesome-game", "1.0.0");
    const pkg = JSON.parse(content) as { name: string };
    expect(pkg.name).toBe("awesome-game");
  });
});

describe("tsconfigTemplate", () => {
  it("uses moduleResolution: bundler", () => {
    const config = JSON.parse(tsconfigTemplate()) as {
      compilerOptions: Record<string, unknown>;
    };
    expect(config.compilerOptions.moduleResolution).toBe("bundler");
  });

  it("enables strict mode", () => {
    const config = JSON.parse(tsconfigTemplate()) as {
      compilerOptions: Record<string, unknown>;
    };
    expect(config.compilerOptions.strict).toBe(true);
  });

  it("sets noEmit: true", () => {
    const config = JSON.parse(tsconfigTemplate()) as {
      compilerOptions: Record<string, unknown>;
    };
    expect(config.compilerOptions.noEmit).toBe(true);
  });
});

describe("oxlintTemplate", () => {
  it("sets no-explicit-any to error", () => {
    const config = JSON.parse(oxlintTemplate()) as {
      rules: Record<string, unknown>;
    };
    expect(config.rules["no-explicit-any"]).toBe("error");
  });

  it("is valid JSON", () => {
    expect(() => JSON.parse(oxlintTemplate())).not.toThrow();
  });
});

describe("oxfmtTemplate", () => {
  it("is valid JSON", () => {
    expect(() => JSON.parse(oxfmtTemplate())).not.toThrow();
  });

  it("uses 2-space indentation", () => {
    const config = JSON.parse(oxfmtTemplate()) as { indentWidth: number };
    expect(config.indentWidth).toBe(2);
  });
});

describe("gwenConfigTemplate", () => {
  it("registers @gwenjs/input as a module but not Canvas2DRenderer", () => {
    const src = gwenConfigTemplate();
    expect(src).not.toContain("Canvas2DRenderer");
    expect(src).toContain("@gwenjs/input");
    expect(src).not.toContain("InputPlugin");
  });

  it("registers @gwenjs/core with the router option", () => {
    const src = gwenConfigTemplate();
    expect(src).toContain("@gwenjs/core");
    expect(src).toContain("router: AppRouter");
    expect(src).toContain("AppRouter");
  });

  it("includes extra modules in the output", () => {
    const src = gwenConfigTemplate(["@gwenjs/physics2d"]);
    expect(src).toContain("@gwenjs/physics2d");
  });

  it("generates valid TypeScript (no unmatched braces)", () => {
    const src = gwenConfigTemplate();
    const opens = (src.match(/\{/g) ?? []).length;
    const closes = (src.match(/\}/g) ?? []).length;
    expect(opens).toBe(closes);
  });
});

describe("bulletPrefabTemplate", () => {
  it("uses definePrefab from @gwenjs/core/actor", () => {
    const src = bulletPrefabTemplate();
    expect(src).toContain("definePrefab");
    expect(src).toContain("@gwenjs/core/actor");
    expect(src).toContain("BulletPrefab");
  });
});

describe("playerPrefabTemplate", () => {
  it("uses definePrefab from @gwenjs/core/actor", () => {
    const src = playerPrefabTemplate();
    expect(src).toContain("definePrefab");
    expect(src).toContain("PlayerPrefab");
  });
});

describe("playerActorTemplate", () => {
  it("uses defineActor from @gwenjs/core/actor", () => {
    const src = playerActorTemplate();
    expect(src).toContain("defineActor");
    expect(src).toContain("@gwenjs/core/actor");
    expect(src).toContain("PlayerActor");
  });
});

describe("routerTemplate", () => {
  it("uses defineSceneRouter from @gwenjs/core/scene", () => {
    const src = routerTemplate();
    expect(src).toContain("defineSceneRouter");
    expect(src).toContain("@gwenjs/core/scene");
    expect(src).toContain("AppRouter");
  });

  it("sets game as initial route", () => {
    const src = routerTemplate();
    expect(src).toContain("initial: 'game'");
    expect(src).toContain("GameScene");
  });
});

describe("readmeTemplate", () => {
  it("includes the project name as title", () => {
    const md = readmeTemplate("super-game");
    expect(md).toContain("# super-game");
  });

  it("documents pnpm dev command", () => {
    const md = readmeTemplate("game");
    expect(md).toContain("pnpm dev");
  });

  it("documents controls (arrow keys / WASD)", () => {
    const md = readmeTemplate("game");
    expect(md.toLowerCase()).toContain("arrow");
    expect(md.toLowerCase()).toContain("space");
  });
});

describe("componentsTemplate", () => {
  it("defines Position component", () => {
    expect(componentsTemplate()).toContain("Position");
  });

  it("defines all 7 required components", () => {
    const src = componentsTemplate();
    for (const name of [
      "Position",
      "Velocity",
      "Size",
      "PlayerTag",
      "Shooter",
      "AsteroidTag",
      "BulletTag",
      "Score",
    ]) {
      expect(src, `missing component: ${name}`).toContain(name);
    }
  });
});

describe("systemsTemplate", () => {
  it("returns all 5 system files", () => {
    const systems = systemsTemplate();
    expect(Object.keys(systems)).toEqual(
      expect.arrayContaining(["Movement.ts", "Input.ts", "Collision.ts", "Spawn.ts", "Render.ts"]),
    );
  });

  it("movement system moves entities by velocity", () => {
    const { "Movement.ts": src } = systemsTemplate();
    expect(src).toContain("MovementSystem");
    expect(src).toContain("vel.y * dt");
  });

  it("input system reads keyboard state", () => {
    const { "Input.ts": src } = systemsTemplate();
    expect(src).toContain("useKeyboard");
    expect(src).toContain("Keys.ArrowLeft");
    expect(src).toContain("Keys.Space");
  });

  it("render system uses DOM-based rendering", () => {
    const { "Render.ts": src } = systemsTemplate();
    expect(src).not.toContain("useCanvas2D");
    expect(src).toContain("onRender");
    expect(src).toContain("getElementById");
  });
});

describe("sceneTemplate", () => {
  it("exports GameScene", () => {
    expect(sceneTemplate()).toContain("GameScene");
  });

  it("includes all 5 systems", () => {
    const src = sceneTemplate();
    for (const name of [
      "MovementSystem",
      "InputSystem",
      "CollisionSystem",
      "SpawnSystem",
      "RenderSystem",
    ]) {
      expect(src, `missing system: ${name}`).toContain(name);
    }
  });

  it("spawns the player entity with required components", () => {
    const src = sceneTemplate();
    expect(src).toContain("Position");
    expect(src).toContain("Score");
    expect(src).toContain("PlayerTag");
  });
});

// ─── Integration tests — full scaffold ───────────────────────────────────────

describe("initCommand scaffold (integration)", () => {
  let tmpDir: string;
  let projectDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tmpDir = await makeTempDir();
    originalCwd = process.cwd();
    process.chdir(tmpDir);
    projectDir = path.join(tmpDir, "test-game");
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function scaffold(name = "test-game", modules = ""): Promise<void> {
    await initCommand.run({
      args: { name, modules },
      cmd: initCommand,
      rawArgs: [],
    });
  }

  it("creates package.json with Vite 8, TypeScript 6, oxlint, oxfmt", async () => {
    await scaffold();
    const pkg = await readJson(path.join(projectDir, "package.json"));
    const dev = pkg.devDependencies as Record<string, string>;
    expect(dev.vite).toMatch(/^\^8\./);
    expect(dev.typescript).toMatch(/^\^6\./);
    expect(dev.oxlint).toBeDefined();
    expect(dev.oxfmt).toBeDefined();
  });

  it("creates package.json with all required scripts", async () => {
    await scaffold();
    const pkg = await readJson(path.join(projectDir, "package.json"));
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.lint).toBeDefined();
    expect(scripts.format).toBeDefined();
    expect(scripts.typecheck).toBeDefined();
    expect(scripts["lint:fix"]).toBeDefined();
    expect(scripts["format:check"]).toBeDefined();
  });

  it("creates tsconfig.json with strict + bundler moduleResolution", async () => {
    await scaffold();
    const tsconfig = await readJson(path.join(projectDir, "tsconfig.json"));
    const opts = tsconfig.compilerOptions as Record<string, unknown>;
    expect(opts.strict).toBe(true);
    expect(opts.moduleResolution).toBe("bundler");
    expect(opts.noEmit).toBe(true);
  });

  it("creates oxlint.json with no-explicit-any error rule", async () => {
    await scaffold();
    const config = await readJson(path.join(projectDir, "oxlint.json"));
    const rules = config.rules as Record<string, unknown>;
    expect(rules["no-explicit-any"]).toBe("error");
  });

  it("creates .oxfmtrc.json", async () => {
    await scaffold();
    expect(await fileExists(path.join(projectDir, ".oxfmtrc.json"))).toBe(true);
    const config = await readJson(path.join(projectDir, ".oxfmtrc.json"));
    expect(config.indentWidth).toBe(2);
  });

  it("creates gwen.config.ts with @gwenjs/input as a module but not Canvas2DRenderer", async () => {
    await scaffold();
    const src = await fs.readFile(path.join(projectDir, "gwen.config.ts"), "utf8");
    expect(src).not.toContain("Canvas2DRenderer");
    expect(src).toContain("@gwenjs/input");
    expect(src).not.toContain("InputPlugin");
    expect(src).toContain("AppRouter");
    expect(src).toContain("router: AppRouter");
  });

  it("creates README.md with project name and controls", async () => {
    await scaffold();
    const md = await fs.readFile(path.join(projectDir, "README.md"), "utf8");
    expect(md).toContain("# test-game");
    expect(md).toContain("pnpm dev");
    expect(md.toLowerCase()).toContain("space");
  });

  it("creates src/components/Game.ts with all required components", async () => {
    await scaffold();
    const src = await fs.readFile(path.join(projectDir, "src", "components", "Game.ts"), "utf8");
    for (const name of ["Position", "Velocity", "PlayerTag", "AsteroidTag", "BulletTag", "Score"]) {
      expect(src, `missing: ${name}`).toContain(name);
    }
  });

  it("creates all 5 system files (PascalCase)", async () => {
    await scaffold();
    for (const f of ["Movement.ts", "Input.ts", "Collision.ts", "Spawn.ts", "Render.ts"]) {
      expect(
        await fileExists(path.join(projectDir, "src", "systems", f)),
        `missing: src/systems/${f}`,
      ).toBe(true);
    }
  });

  it("creates src/scenes/GameScene.ts with non-empty landing game", async () => {
    await scaffold();
    const src = await fs.readFile(path.join(projectDir, "src", "scenes", "GameScene.ts"), "utf8");
    expect(src).toContain("GameScene");
    expect(src.length).toBeGreaterThan(100);
  });

  it("creates src/router.ts with AppRouter", async () => {
    await scaffold();
    const src = await fs.readFile(path.join(projectDir, "src", "router.ts"), "utf8");
    expect(src).toContain("AppRouter");
    expect(src).toContain("defineSceneRouter");
  });

  it("creates src/actors/Player.ts with PlayerActor", async () => {
    await scaffold();
    const src = await fs.readFile(path.join(projectDir, "src", "actors", "Player.ts"), "utf8");
    expect(src).toContain("PlayerActor");
    expect(src).toContain("defineActor");
  });

  it("creates src/prefabs/Bullet.ts and src/prefabs/Player.ts", async () => {
    await scaffold();
    expect(await fileExists(path.join(projectDir, "src", "prefabs", "Bullet.ts"))).toBe(true);
    expect(await fileExists(path.join(projectDir, "src", "prefabs", "Player.ts"))).toBe(true);
  });

  it("creates placeholder directories (plugins, assets, utils)", async () => {
    await scaffold();
    for (const dir of ["plugins", "assets", "utils"]) {
      expect(
        await fileExists(path.join(projectDir, "src", dir, ".gitkeep")),
        `missing: src/${dir}/.gitkeep`,
      ).toBe(true);
    }
  });

  it("injects extra modules into gwen.config.ts", async () => {
    await scaffold("test-game", "@gwenjs/physics2d");
    const src = await fs.readFile(path.join(projectDir, "gwen.config.ts"), "utf8");
    expect(src).toContain("@gwenjs/physics2d");
  });

  it("handles empty modules string without crash", async () => {
    await expect(scaffold("test-game", "")).resolves.not.toThrow();
    expect(await fileExists(path.join(projectDir, "package.json"))).toBe(true);
  });
});
