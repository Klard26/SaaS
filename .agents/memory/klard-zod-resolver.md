---
name: Klard frontend zod / zodResolver single-version pin
description: Why the workspace pins a single zod v3 via pnpm override so @hookform/resolvers and the frontend forms agree on types.
---

The frontend form pages (`ProviderProfile`, `ProviderOnboarding`, `ProviderServices`, `ImmobilienKundeOnboarding`) build schemas with `import { z } from "zod"` (zod v3, the catalog pin) and pass them to `zodResolver`.

**The trap:** `@hookform/resolvers@3.10.0` declares NO zod dependency (only a `react-hook-form` peer). So its internal `import { z } from 'zod'` resolves *up the tree* to whatever zod is hoisted at the workspace root. `@anthropic-ai/sdk` pulls `zod@4` as a peer, and that v4 got hoisted — so the resolver expected v4 types (`$ZodTypeInternals`, `toJSONSchema`, etc.) while the pages produced v3 schemas → TS2345 on every `zodResolver(schema)` call.

**Fix (in place):** a single workspace-wide pnpm override in `pnpm-workspace.yaml`:
```
overrides:
  zod: "^3.25.76"
```
`@anthropic-ai/sdk`'s peer range is `^3.25.0 || ^4.0.0`, so pinning everything to v3 satisfies it AND makes the resolver resolve the same v3 the forms use. After this, `pnpm run typecheck` is fully green across all artifacts (klard included).

**How to apply:** keep zod on a single major across the workspace. If anything ever genuinely needs zod v4, prefer upgrading `@hookform/resolvers` to a v4-compatible major and migrating the form pages together — do NOT let two zod majors coexist, or the resolver type mismatch returns. A stale `zod@4.x` dir may linger in the pnpm store after the override; harmless as long as `pnpm why -r zod` shows nothing references it.
