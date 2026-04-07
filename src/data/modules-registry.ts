/**
 * Bundled fallback module registry.
 *
 * This data is used when the CLI cannot reach the remote registry
 * (gwenjs/modules). Update it on every CLI release to keep it in sync
 * with the live registry.
 */
export const fallbackRegistry = {
  version: "1",
  generatedAt: "2026-04-07T00:00:00.000Z",
  modules: [
    {
      name: "physics2d",
      displayName: "Physics 2D",
      description: "Rapier-based 2D physics engine",
      npm: "@gwenjs/physics2d",
      repo: "gwenjs/physics2d",
      website: "",
      category: "Physics",
      type: "official" as const,
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
      type: "official" as const,
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
      type: "official" as const,
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
      type: "official" as const,
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
      type: "official" as const,
      deprecated: false,
      compatibility: { gwen: ">=0.1.0" },
    },
  ],
} as const;
