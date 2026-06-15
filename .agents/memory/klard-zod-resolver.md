---
name: Klard frontend zod resolver typecheck mismatch
description: Why `pnpm --filter @workspace/klard run typecheck` fails on every zodResolver page, and that it is pre-existing / not app-breaking.
---

`pnpm --filter @workspace/klard run typecheck` reports TS2345 on EVERY page that does `zodResolver(schema)` (ProviderProfile, ProviderOnboarding, ProviderServices, ImmobilienKundeOnboarding): the local zod v3 `ZodObject` is "not assignable to ZodType<…, $ZodTypeInternals<…>>".

**Why:** Two zod versions are installed — `zod@3.25.76` (catalog, used by pages via `import { z } from "zod"`) and `zod@4.3.6` (pulled transitively by `@anthropic-ai/sdk`). `@hookform/resolvers@3.10.0`'s `import { z } from 'zod'` resolves to the v4 types, so the resolver expects a v4 schema while pages produce v3 schemas. The `$ZodTypeInternals` / `toJSONSchema` symbols in the error are v4-only.

**How to apply:** This is PRE-EXISTING and unrelated to feature work — it fails on pages you never touched. Do NOT treat it as a regression you introduced, and do not attempt a broad dual-zod fix as part of an unrelated task. The app runs fine because Vite/esbuild does not typecheck. A real fix would be a pnpm override forcing the resolver to resolve zod@3, or upgrading @hookform/resolvers to a zod-v4-compatible major and migrating pages — both project-wide and risky. Verify backend with `pnpm --filter @workspace/api-server run typecheck` (clean) instead of relying on the frontend typecheck for green.
