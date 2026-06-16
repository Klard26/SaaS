---
name: Klard frontend test setup
description: Non-obvious constraints when writing tests in the klard Vite app
---

# Klard frontend test setup

The klard frontend tests run on **vitest + @testing-library/react + jsdom**.

- The vitest config (`artifacts/klard/vitest.config.ts`) is STANDALONE and must NOT import/reuse the app `vite.config.ts`. **Why:** `vite.config.ts` throws at import time when `PORT`/`BASE_PATH` are unset (only the Replit workflow sets them), so reusing it crashes any test context. Re-declare just the `@`/`@assets` aliases there.
- Test files are EXCLUDED from the app `tsconfig`, so `pnpm typecheck` does NOT typecheck them — they are validated only by running `vitest`. **How to apply:** don't rely on `pnpm typecheck` to catch type errors in `*.test.*`; run the test suite instead.
