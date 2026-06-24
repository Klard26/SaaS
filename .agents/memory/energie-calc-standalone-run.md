---
name: Running lib/energie-calc numerically outside the app
description: Why ad-hoc node/tsx/esbuild runs of the TS-source energie-calc lib fail, and what to do instead.
---

# Numerically exercising `lib/energie-calc` (calcEnergie etc.)

The workspace libs are **TS source** packages (`exports: "./src/index.ts"`, no compiled JS dist of runnable `.js`). Their internal imports are **extensionless** (`import ... from "./constants"`). This makes one-off "run the calc and print numbers" harness attempts fail:

- `node`/`node --experimental-strip-types` on `src/calc.ts` → cannot resolve `./constants` (Node ESM needs explicit `.ts`).
- `pnpm exec tsx` / `pnpm exec esbuild` → binary not on PATH (`Command "tsx"/"esbuild" not found`); `require.resolve('esbuild')` from repo root also fails.
- code_execution sandbox `await import("@workspace/energie-calc")` → "Cannot find package"; importing the `.ts` directly → same extensionless-resolution failure.

**What to do instead** when you must verify magnitudes:
- Trust `pnpm run typecheck:libs` for type/shape correctness, and **hand-compute** from the constants (e.g. `calcHeizlast`: Φ=(H_T+H_V)·(θ_int−θ_e); W/m² = Φ/area).
- If you truly need execution, add a throwaway **vitest** spec inside an *artifact* (vitest resolves TS + extensionless imports), not in the lib itself (the lib has no vitest config and the root `test` script only runs `artifacts/**` + `scripts`).

**Why:** burned several attempts wiring a standalone runner; the repo deliberately ships libs as TS source consumed by Vite/esbuild *within* artifacts, so there is no PATH-level TS runner for ad-hoc lib execution.
