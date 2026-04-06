# gwen doctor

Run a suite of project health checks and report the results. Useful for diagnosing environment or setup issues.

## Usage

```bash
gwen doctor
```

## Checks Performed

| Check | What it verifies |
|-------|-----------------|
| Node.js version | Node.js ≥ 18 is installed |
| `gwen.config.ts` exists | Config file is present in the current directory |
| `gwen.config.ts` parses | Config can be loaded without errors |
| WASM binary | `@gwenjs/core` WASM binary is present in `node_modules` |

## Example Output

```
✓ Node.js version: v22.0.0
✓ gwen.config.ts exists: /my-game/gwen.config.ts
✓ gwen.config.ts parses: /my-game/gwen.config.ts
✓ WASM binary: /my-game/node_modules/@gwenjs/core/dist/gwen.wasm

All checks passed ✓
```

## Notes

- Exits with code 1 if any check fails.
- If `gwen.config.ts` is not found, run `gwen init` to scaffold a new project.
- If the WASM binary is missing, run your package manager install (`npm install` / `pnpm install`).
