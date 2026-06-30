---
name: Vitest integration test gotchas (api-server)
description: Two non-obvious hangs when integration-testing the Express api-server under Vitest, and how to avoid them.
---

# Integration-testing Express route handlers under Vitest

When writing DB-backed integration tests that import api-server route handlers
(`src/routes/*`) under Vitest, two separate issues cause silent hangs (no test
output, process killed by wall timeout — looks like a collection hang).

## 1. pino-pretty transport hangs the module import

`src/lib/logger.ts` configures a `pino-pretty` transport in non-production.
That transport spawns a worker thread (thread-stream) that never settles inside
a Vitest worker, so importing anything that transitively imports the logger
hangs forever.

**Fix applied:** skip the pretty transport when `process.env.VITEST` is set
(guard alongside the existing `isProduction` check). Leaves dev/prod unchanged.

**How to apply:** any test that imports `app.ts` or the logger needs this guard,
or must avoid importing the logger entirely.

## 2. Proxy-based module mocks hang dynamic import (thenable trap)

A "catch-all" mock like
`vi.mock("../lib/email", () => new Proxy({}, { get: () => async () => {} }))`
returns a function for **every** property access — including `then`. The mocked
module namespace then looks like a never-resolving thenable, so `await import()`
of it (and thus collection of the test) hangs forever with no error.

**Fix:** mock modules with an explicit object of the named exports actually
imported (no Proxy). If a Proxy is unavoidable, return `undefined` for `then`
and for symbol keys.

## Working approach

Rather than importing the full `app.ts` (drags in the whole route graph:
templates `.hbs`, pdfkit, @google-cloud/storage, AI, etc. — vite chokes on the
`.hbs` text imports), build a **minimal Express app in the test** that mounts
only the routers under test at `/api`, with a tiny middleware that sets a no-op
`req.log`. Mock `@clerk/express` (`getAuth`/`clerkClient`), `../lib/stripeClient`
(capture `checkout.sessions.create` args to assert the Connect split), and the
email/invoice side-effects. Everything else (queries, the booking transaction,
status transitions, authorization) runs for real against the dev Postgres.
Fixtures use a unique suffix and are cleaned up in `afterAll`.

## Running the suite in CI (or any fresh env)

The full `pnpm run test` needs exactly two things to go green: a real Postgres
with `DATABASE_URL` set (`@workspace/db` throws at import without it, and the
integration tests run real insert/select/delete), and the schema pushed first
(`pnpm --filter @workspace/db run push-force` → `drizzle-kit push --force`).

**Why:** verified the suite passes with ONLY `DATABASE_URL` (+ a placeholder
`SESSION_SECRET`) — it does NOT require any external-service secrets. Stripe,
Clerk, Resend, Anthropic, and object storage are either mocked in the tests or
degrade gracefully, so CI does not need those as repo secrets.
