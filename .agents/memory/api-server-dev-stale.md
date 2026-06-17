---
name: api-server dev server serves stale route code
description: After editing api-server route files, the running dev process can serve pre-edit code; restart the workflow before curl-smoke.
---

# api-server dev process can serve stale route code

After editing files under `artifacts/api-server/src/routes/`, the running
`artifacts/api-server: API Server` workflow may keep serving the **previous**
version (auth walls, old handlers) even though the file on disk is correct and
`pnpm run typecheck` passes.

**Why:** the dev process does not reliably hot-reload route modules. A guest
endpoint that was just de-authed kept returning `401 {"error":"Unauthorized"}`
until the workflow was restarted, after which it correctly returned 200 / 404.

**How to apply:** before curl/smoke-testing any api-server route change, run
`restart_workflow "artifacts/api-server: API Server"`. Do not conclude a
backend change is broken from a 401/old response until after a fresh restart.
