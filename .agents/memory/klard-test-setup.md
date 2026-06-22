---
name: Klard frontend test setup
description: Non-obvious constraints when writing tests in the klard Vite app
---

# Klard frontend test setup

The klard frontend tests run on **vitest + @testing-library/react + jsdom**.

- The vitest config (`artifacts/klard/vitest.config.ts`) is STANDALONE and must NOT import/reuse the app `vite.config.ts`. **Why:** `vite.config.ts` throws at import time when `PORT`/`BASE_PATH` are unset (only the Replit workflow sets them), so reusing it crashes any test context. Re-declare just the `@`/`@assets` aliases there.
- Test files are EXCLUDED from the app `tsconfig`, so `pnpm typecheck` does NOT typecheck them — they are validated only by running `vitest`. **How to apply:** don't rely on `pnpm typecheck` to catch type errors in `*.test.*`; run the test suite instead.

## api-server tests importing real email.ts (.hbs/.sql text loader)

The esbuild build (`build.mjs`) registers `.hbs`/`.sql` as `text` loaders, but the standalone `artifacts/api-server/vitest.config.ts` must replicate that or any test importing the real `email.ts` (which `import`s `.hbs` templates) fails with "content contains invalid JS syntax". A small Vite `load` plugin returning `export default JSON.stringify(readFileSync(...))` for `.hbs`/`.sql` fixes it. **Why:** most existing route/scheduler tests dodge this by fully `vi.mock`ing `email`; only tests that exercise real email/log helpers (e.g. `purgeOldEmailLogs`, `wasEmailSent`) pull in the templates.
